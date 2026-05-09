import { NextResponse } from 'next/server';

async function sendTelegramMessage(items: any[], totalPrice: number, customerInfo: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        throw new Error('Telegram credentials not configured');
    }

    const message = `
🚨 <b>Новый заказ!</b>

👤 Контакт: ${customerInfo}
💰 Итог: ${totalPrice} ₽

🛒 <b>Товары:</b>
${items.map((item: any) => `— ${item.title} (x${item.quantity})`).join('\n')}
    `.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
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
        const { items, totalPrice, customerInfo } = await req.json();

        // Отправляем только в Telegram
        await sendTelegramMessage(items, totalPrice, customerInfo);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
