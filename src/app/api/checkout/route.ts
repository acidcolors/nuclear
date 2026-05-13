import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import { normalizeContact } from '@/lib/telegram';

// 1. Инициализация Notion
const notion = new Client({ auth: process.env.NOTION_SECRET });

// 3. Функция для создания заказа в Notion
async function createNotionOrder(
    orderNumber: number,
    items: any[],
    totalPrice: number,
    customerInfo: string,
    tgUser?: any
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
            .map((item: any) => `${item.title} (x${item.quantity})`)
            .join('\n');

        const telegramId = tgUser?.id ? String(tgUser.id) : "Нет ID";

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Title": {
                    title: [
                        {
                            text: {
                                content: `Заказ #${orderNumber}`,
                            },
                        },
                    ],
                },
                "Person": {
                    rich_text: [
                        {
                            text: {
                                content: personText,
                            },
                        },
                    ],
                },
                "Price": {
                    number: Number(totalPrice),
                },
                "items": {
                    rich_text: [
                        {
                            text: {
                                content: itemsText,
                            },
                        },
                    ],
                },
                "Telegram ID": {
                    rich_text: [
                        {
                            text: {
                                content: telegramId,
                            },
                        },
                    ],
                },
            },
        });
    } catch (error) {
        // Ошибка в Notion не должна прерывать выполнение основного роута
        console.error('Notion order creation error:', error);
    }
}

async function sendTelegramMessage(
    orderNumber: number,
    items: any[],
    totalPrice: number,
    customerInfo: string,
    type?: string,
    userMessage?: string,
    baseUrl?: string,
    tgUser?: any,
    source: 'website' | 'app' = 'website'
) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || "-1003811463175";
    const ordersThreadId = process.env.TELEGRAM_ORDERS_THREAD_ID ? Number(process.env.TELEGRAM_ORDERS_THREAD_ID) : undefined;

    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN is missing');
        throw new Error('Telegram credentials not configured');
    }

    const contact = normalizeContact(customerInfo);
    // Теперь все заказы идут в фиксированный топик
    const targetThreadId = ordersThreadId;

    const isSupport = type === 'support';
    const title = isSupport ? `новое сообщение #${orderNumber}` : `новый заказ #${orderNumber}`;

    let messageText = `— <b>${title}</b>\n\n`;

    if (tgUser) {
        const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim();
        const username = tgUser.username ? `@${tgUser.username}` : 'нет юзернейма';
        messageText += `<b>Контакт:</b> <a href="tg://user?id=${tgUser.id}">${fullName}</a> (${username}, ID: <code>${tgUser.id}</code>)\n`;
    } else {
        messageText += `<b>Контакт:</b> ${customerInfo}\n`;
    }

    if (userMessage) {
        messageText += `<b>Сообщение:</b> ${userMessage}\n`;
    }

    if (!isSupport && totalPrice > 0) {
        messageText += `<b>Итог:</b> ${totalPrice} ₽\n`;
    }

    if (items && items.length > 0) {
        messageText += `\n<b>Товары:</b>\n`;
        messageText += items.map((item: any) => {
            let activeBaseUrl = baseUrl;
            if (baseUrl?.includes('localhost')) {
                activeBaseUrl = 'https://nucleargarden.ru';
            }

            const productLink = (activeBaseUrl && item.id) ? `${activeBaseUrl}/product/${item.id}` : null;
            const escapedTitle = item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const titleHtml = productLink ? `<a href="${productLink}">${escapedTitle}</a>` : escapedTitle;

            if (isSupport) return `— ${titleHtml}`;
            return `— ${titleHtml} (x${item.quantity})`;
        }).join('\n');
    }

    const agent = new HttpsProxyAgent(process.env.PROXY_URL || 'http://103.75.126.30:8888');
    const axiosConfig = { httpsAgent: agent, proxy: false as const };

    try {
        // 1. Отправка уведомления АДМИНУ (в топик)
        console.log(`Sending message to Telegram chat ${chatId}, topic ${targetThreadId} via proxy...`);
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            message_thread_id: targetThreadId,
            text: messageText.trim(),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }, axiosConfig);

        // 2. Отправка подтверждения КЛИЕНТУ
        if (tgUser?.id && type !== 'support') {
            const customerMessage = `<b>Спасибо за заказ! 🎉</b>\nВаш заказ <b>#${orderNumber}</b> успешно оформлен.\n\nИтого: <b>${totalPrice} ₽</b>\nМы свяжемся с вами в ближайшее время для уточнения деталей.`;
            
            try {
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    chat_id: tgUser.id,
                    text: customerMessage,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }, axiosConfig);
            } catch (clientErr: any) {
                console.warn('Не удалось отправить сообщение клиенту:', clientErr.response?.data || clientErr.message);
            }
        }
    } catch (error: any) {
        const errorData = error.response?.data;
        console.error('Telegram API error:', errorData || error.message);
        throw new Error(`Telegram API Error: ${errorData?.description || error.message}`);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Incoming checkout request:', body);
        const { items, totalPrice, customerInfo, type, message: userMessage, tgUser, source = 'website' } = body;

        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const origin = host ? `${protocol}://${host}` : undefined;

        // 2. Генерация единого номера заказа
        const orderNumber = Math.floor(10000 + Math.random() * 90000);

        // 5. Параллельное сохранение в Notion (только для заказов, не для саппорта)
        if (type !== 'support') {
            await createNotionOrder(orderNumber, items, totalPrice || 0, customerInfo, tgUser);
        }

        // Отправка уведомления в Telegram
        await sendTelegramMessage(orderNumber, items, totalPrice || 0, customerInfo, type, userMessage, origin, tgUser, source);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}