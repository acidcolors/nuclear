import { NextResponse } from 'next/server';

export async function GET() {
    // Берем токен твоего бота из .env
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // ID твоего канала, который мы только что достали
    const chatId = '-1003827923275';

    // ВАЖНО: Сюда нужно вставить HTTPS ссылку на твой сайт!
    const webAppUrl = 'https://t.me/NuclearOrdersBot/mag';

    if (!botToken) {
        return NextResponse.json({ error: 'Нет токена бота' }, { status: 500 });
    }

    const message = `
🎪 <b>Добро пожаловать в Ядерный Сад!</b>

В нашей мастерской рождаются самые разные форматы — от независимого самиздата до концептуального серебра. 

Теперь вы можете изучить наши проекты и оформить заказ прямо здесь, не покидая Telegram 👇
    `.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🛍 Открыть магазин",
                            url: webAppUrl
                        }
                    ]
                ]
            }
        }),
    });

    const data = await response.json();
    return NextResponse.json(data);
}