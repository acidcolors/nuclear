import { NextResponse } from 'next/server';
import { normalizeContact, sendTelegramMessageViaProxy } from '@/lib/telegram';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customerInfo, message: userMessage, items, tgUser } = body;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = "-1003811463175";
        const threadId = 5; // Фиксированный топик "Поддержка"

        if (!botToken) {
            return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is missing' }, { status: 500 });
        }

        const contact = normalizeContact(customerInfo);
        const contactValue = tgUser?.username ? `@${tgUser.username}` : contact.value;

        let messageText = `— <b>новое сообщение из поддержки</b>\n\n`;
        messageText += `<b>Контакт:</b> ${contactValue}\n`;

        if (tgUser?.id) {
            messageText += `<b>ID:</b> <code>${tgUser.id}</code>\n`;
        } else {
            messageText += `<b>ID:</b> нет\n`;
        }

        if (userMessage) {
            messageText += `<b>Сообщение:</b> ${userMessage}\n`;
        }

        if (items && items.length > 0) {
            messageText += `\n<b>Интересующие товары:</b>\n`;
            messageText += items.map((item: any) => `— ${item.title}`).join('\n');
        }

        await sendTelegramMessageViaProxy({
            botToken,
            chatId,
            threadId,
            text: messageText.trim(),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Support API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
