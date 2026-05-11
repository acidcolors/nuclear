import { NextResponse } from 'next/server';

async function sendTelegramMessage(items: any[], totalPrice: number, customerInfo: string, type?: string, userMessage?: string, baseUrl?: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        throw new Error('Telegram credentials not configured');
    }

    // Генерируем случайный 5-значный номер
    const orderNumber = Math.floor(10000 + Math.random() * 90000);

    const isSupport = type === 'support';
    const title = isSupport ? `Новое сообщение #${orderNumber}` : `Новый заказ #${orderNumber}`;

    let messageText = `— <b>${title}</b>\n\n`;
    messageText += `Контакт: ${customerInfo}\n`;

    if (!isSupport && totalPrice > 0) {
        messageText += `Итог: ${totalPrice} ₽\n`;
    }

    if (userMessage) {
        messageText += `Сообщение: ${userMessage}\n`;
    }

    if (items && items.length > 0) {
        messageText += `\n<b>Товары:</b>\n`;
        messageText += items.map((item: any) => {
            // Если мы на localhost, ссылки могут блокироваться Telegram
            let activeBaseUrl = baseUrl;
            if (baseUrl?.includes('localhost')) {
                activeBaseUrl = 'https://nucleargarden.ru'; 
            }

            const productLink = (activeBaseUrl && item.id) ? `${activeBaseUrl}/product/${item.id}` : null;
            
            const escapedTitle = item.title
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            const titleHtml = productLink ? `<a href="${productLink}">${escapedTitle}</a>` : escapedTitle;
            
            // Для поддержки не пишем количество (x1), так как там нет выбора количества
            if (isSupport) {
                return `— ${titleHtml}`;
            }
            return `— ${titleHtml} (x${item.quantity})`;
        }).join('\n');
    } else if (isSupport && !userMessage) {
        messageText += `\n<i>Общий запрос в поддержку</i>`;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: messageText.trim(),
            parse_mode: 'HTML',
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, totalPrice, customerInfo, type, message: userMessage } = body;

        // Собираем origin вручную из заголовков
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const origin = host ? `${protocol}://${host}` : undefined;

        // Отправляем только в Telegram
        await sendTelegramMessage(items, totalPrice || 0, customerInfo, type, userMessage, origin);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}