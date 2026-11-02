import { NextResponse } from 'next/server';
import { normalizeContact, sendTelegramMessageViaProxy } from '@/lib/telegram';
import { TELEGRAM_CHAT_ID, TELEGRAM_THREADS } from '@/config/telegram';
import { cleanString, clientIp, escapeHtml, rateLimit, verifyTelegramInitData } from '@/lib/apiGuard';

export async function POST(req: Request) {
    // 5 обращений за 10 минут с одного IP
    if (!rateLimit(`support:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            console.error('Support API: TELEGRAM_BOT_TOKEN is missing');
            return NextResponse.json({ error: 'Internal error' }, { status: 500 });
        }

        const customerInfo = body?.customerInfo == null ? '' : cleanString(body.customerInfo, 200);
        const userMessage = body?.message == null ? '' : cleanString(body.message, 2000);

        if (customerInfo === null || userMessage === null) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Список товаров: не больше 50 названий, каждое до 200 символов
        const rawItems: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
        const itemTitles = rawItems
            .map((item: any) => cleanString(item?.title, 200))
            .filter((title): title is string => Boolean(title));

        // Telegram-пользователь принимается только с валидной подписью initData
        const tgUser = verifyTelegramInitData(body?.tgInitData, botToken);

        if (!customerInfo && !tgUser) {
            return NextResponse.json({ error: 'Contact is required' }, { status: 400 });
        }

        const contactValue = tgUser?.username
            ? `@${tgUser.username}`
            : normalizeContact(customerInfo).value;

        let messageText = `— <b>новое сообщение из поддержки</b>\n\n`;
        messageText += `<b>Контакт:</b> ${escapeHtml(contactValue)}\n`;

        if (tgUser?.id) {
            messageText += `<b>ID:</b> <code>${tgUser.id}</code>\n`;
        } else {
            messageText += `<b>ID:</b> нет\n`;
        }

        if (userMessage) {
            messageText += `<b>Сообщение:</b> ${escapeHtml(userMessage)}\n`;
        }

        if (itemTitles.length > 0) {
            messageText += `\n<b>Интересующие товары:</b>\n`;
            messageText += itemTitles.map((title) => `— ${escapeHtml(title)}`).join('\n');
        }

        await sendTelegramMessageViaProxy({
            botToken,
            chatId: TELEGRAM_CHAT_ID,
            threadId: TELEGRAM_THREADS.support,
            text: messageText.trim(),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Support API Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
