import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
    orderNumber: number, // 2. Передаем номер заказа аргументом
    items: any[],
    totalPrice: number,
    customerInfo: string,
    type?: string,
    userMessage?: string,
    baseUrl?: string,
    tgUser?: any
) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        throw new Error('Telegram credentials not configured');
    }

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

    const agent = new HttpsProxyAgent('http://103.75.126.30:8888');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: messageText.trim(),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }),
        agent: agent,
    } as any);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, totalPrice, customerInfo, type, message: userMessage, tgUser } = body;

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
        await sendTelegramMessage(orderNumber, items, totalPrice || 0, customerInfo, type, userMessage, origin, tgUser);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}