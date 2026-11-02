import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { Client } from '@notionhq/client';
import { Resend } from 'resend';
import { normalizeContact, sendTelegramMessageViaProxy } from '@/lib/telegram';
import { TELEGRAM_CHAT_ID, TELEGRAM_THREADS } from '@/config/telegram';
import {
    cleanString,
    clientIp,
    escapeHtml,
    isValidEmail,
    rateLimit,
    verifyTelegramInitData,
    type VerifiedTgUser,
} from '@/lib/apiGuard';

// 1. Инициализация Notion
const notion = new Client({ auth: process.env.NOTION_SECRET });

interface OrderItem {
    id: string;
    title: string;
    quantity: number;
    price: number | null;
}

const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;

/** Приводит items из тела запроса к безопасному виду или возвращает null. */
function parseItems(raw: unknown): OrderItem[] | null {
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null;

    const items: OrderItem[] = [];
    for (const entry of raw) {
        const id = cleanString(entry?.id, 120);
        const title = cleanString(entry?.title, 200);
        const quantity = Number(entry?.quantity);
        if (!id || !title || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;

        const price = Number(entry?.price);
        items.push({ id, title, quantity, price: Number.isFinite(price) && price >= 0 ? price : null });
    }
    return items;
}

// 3. Функция для создания заказа в Notion
async function createNotionOrder(
    orderNumber: number,
    items: OrderItem[],
    totalPrice: number,
    customerInfo: string,
    tgUser: VerifiedTgUser | null
) {
    const databaseId = process.env.NOTION_ORDERS_DB_ID;

    if (!databaseId) {
        console.warn('NOTION_ORDERS_DB_ID is not configured');
        return;
    }

    try {
        const personText = tgUser?.username
            ? `${customerInfo} (@${tgUser.username})`
            : customerInfo;

        const itemsText = items
            .map((item) => `${item.title} (x${item.quantity})`)
            .join('\n');

        const telegramId = tgUser?.id ? String(tgUser.id) : "Нет ID";

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Title": { title: [{ text: { content: `Заказ #${orderNumber}` } }] },
                "Person": { rich_text: [{ text: { content: personText } }] },
                "Price": { number: Number(totalPrice) },
                "items": { rich_text: [{ text: { content: itemsText.slice(0, 1900) } }] },
                "Telegram ID": { rich_text: [{ text: { content: telegramId } }] },
            },
        });
    } catch (error) {
        // Ошибка в Notion не должна прерывать выполнение основного роута
        console.error('[Notion] order creation error:', error);
    }
}

// 4. Функция для отправки Email подтверждения через Resend
async function sendEmailConfirmation(
    orderNumber: number,
    items: OrderItem[],
    totalPrice: number,
    email: string
) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[Resend] RESEND_API_KEY is not configured');
            return;
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const itemsHtml = items
            .map(item => `<li>${escapeHtml(item.title)} (x${item.quantity})</li>`)
            .join('');

        const { data, error } = await resend.emails.send({
            from: 'Nuclear Garden <info@nucleargarden.ru>',
            to: email,
            subject: `Заказ #${orderNumber} принят! | Nuclear Garden`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; border: 1px solid #eee;">
                    <h2 style="text-transform: uppercase; letter-spacing: -1px; color: #111; margin-bottom: 20px;">Заказ #${orderNumber} принят!</h2>
                    <p style="margin-bottom: 20px;">Спасибо за заказ! Ваша заявка успешно принята.</p>

                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <p style="margin: 0 0 10px 0;"><strong>Номер заказа:</strong> #${orderNumber}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Товары:</strong></p>
                        <ul style="margin: 0; padding-left: 20px; color: #333;">
                            ${itemsHtml}
                        </ul>
                        <p style="margin: 15px 0 0 0; font-size: 18px;"><strong>Итоговая сумма:</strong> ${totalPrice} ₽</p>
                    </div>

                    <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; pt: 20px; margin-top: 20px;">
                        Вы можете написать нам в <a href="https://t.me/mynuclear" style="color: #111; font-weight: bold; text-decoration: underline;">Telegram-группу</a> для уточнения деталей и узнать статус заказа.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('[Resend] API Error:', error);
        } else {
            console.log(`[Resend] Confirmation sent to ${email}. ID: ${data?.id}`);
        }
    } catch (err) {
        console.error('[Resend] Unexpected Error:', err);
    }
}

async function sendTelegramMessage(
    orderNumber: number,
    items: OrderItem[],
    totalPrice: number,
    contactValue: string,
    contactType: 'email' | 'telegram',
    userMessage: string,
    tgUser: VerifiedTgUser | null
) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN is missing');
        throw new Error('Telegram credentials not configured');
    }

    // Формируем текст сообщения в едином стиле. Всё, что пришло от клиента, экранируем.
    let messageText = `— <b>новый заказ #${orderNumber}</b>\n\n`;

    messageText += `<b>Контакт:</b> ${escapeHtml(tgUser?.username ? `@${tgUser.username}` : contactValue)}\n`;

    if (tgUser?.id) {
        messageText += `<b>ID:</b> <code>${tgUser.id}</code>\n`;
    } else {
        messageText += `<b>ID:</b> нет\n`;
    }

    if (totalPrice > 0) {
        messageText += `<b>Итог:</b> ${totalPrice} ₽\n`;
    }

    if (userMessage) {
        messageText += `\n<b>Сообщение:</b> ${escapeHtml(userMessage)}\n`;
    }

    messageText += `\n<b>Товары:</b>\n`;
    messageText += items.map((item) => `— ${escapeHtml(item.title)} (x${item.quantity})`).join('\n');

    try {
        console.log(`[Telegram] Sending admin notification. Mode: ${process.env.NODE_ENV}`);
        await sendTelegramMessageViaProxy({
            botToken,
            chatId: TELEGRAM_CHAT_ID,
            threadId: TELEGRAM_THREADS.orders,
            text: messageText.trim(),
        });

        // Подтверждение пользователю в личку: только если Telegram-пользователь подтверждён подписью
        if (contactType === 'telegram' && tgUser?.id) {
            const customerMessage = `Спасибо, мы получили информацию о вашем заказе!\nНомер вашего заказа: #${orderNumber}\nИтого: ${totalPrice} ₽\n\nНапишите нам в <a href="https://t.me/mynuclear">группу</a> для уточнения деталей и узнать статус заказа.`;

            console.log(`[Telegram] Sending private message to user ${tgUser.id}`);
            try {
                await sendTelegramMessageViaProxy({
                    botToken,
                    chatId: tgUser.id,
                    text: customerMessage,
                });
            } catch (userErr: any) {
                console.warn('[Telegram] Could not send private message to user:', userErr.message);
            }
        }
    } catch (error: any) {
        console.error('[Telegram] API error:', error.message);
        throw new Error(`Telegram API Error: ${error.message}`);
    }
}

export async function POST(req: Request) {
    // 5 заказов за 10 минут с одного IP
    if (!rateLimit(`checkout:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const items = parseItems(body?.items);
        const customerInfo = body?.customerInfo == null ? '' : cleanString(body.customerInfo, 200);
        const userMessage = body?.message == null ? '' : cleanString(body.message, 2000);

        if (!items || customerInfo === null || userMessage === null) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Telegram-пользователь принимается только с валидной подписью initData
        const tgUser = verifyTelegramInitData(body?.tgInitData, process.env.TELEGRAM_BOT_TOKEN ?? '');

        if (!customerInfo && !tgUser) {
            return NextResponse.json({ error: 'Contact is required' }, { status: 400 });
        }

        const contact = customerInfo ? normalizeContact(customerInfo) : null;
        const contactType = contact?.type ?? 'telegram';

        if (contact?.type === 'email' && !isValidEmail(contact.value)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Сумма: считаем по ценам позиций, если они есть; иначе берём клиентскую с ограничением
        const hasAllPrices = items.every((i) => i.price !== null);
        const clientTotal = Number(body?.totalPrice);
        const totalPrice = hasAllPrices
            ? items.reduce((sum, i) => sum + (i.price as number) * i.quantity, 0)
            : Number.isFinite(clientTotal) ? Math.min(Math.max(clientTotal, 0), 10_000_000) : 0;

        const orderNumber = randomInt(10000, 100000);
        console.log(`[Checkout] New order #${orderNumber}. Contact type: ${contactType}`);

        // 1. Сохранение в Notion
        await createNotionOrder(orderNumber, items, totalPrice, contact?.value ?? '', tgUser);

        // 2. Отправка уведомлений в Telegram (админу и клиенту, если TG)
        await sendTelegramMessage(orderNumber, items, totalPrice, contact?.value ?? '', contactType, userMessage, tgUser);

        // 3. Отправка Email-подтверждения (если Email)
        if (contact?.type === 'email') {
            // Обернуто в try/catch внутри функции, не блокирует основной поток
            await sendEmailConfirmation(orderNumber, items, totalPrice, contact.value);
        }

        return NextResponse.json({ success: true, orderNumber });
    } catch (error: any) {
        console.error('[Checkout] Fatal Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
