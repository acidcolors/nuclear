import { NextResponse } from 'next/server';
import { sendTelegramRawMessage } from '@/lib/telegram';

/**
 * Webhook обработчик для Telegram.
 * Важно: Всегда возвращает 200 OK максимально быстро.
 */
export async function POST(req: Request) {
    try {
        const update = await req.json();

        // Запускаем обработку в фоновом режиме, не дожидаясь завершения
        // Это предотвращает таймауты со стороны Telegram
        handleUpdate(update).catch(err => {
            console.error('Background Webhook Processing Error:', err.message);
        });

        // Немедленно подтверждаем получение
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Webhook Request Parsing Error:', error.message);
        return NextResponse.json({ ok: true });
    }
}

/**
 * Изолированная логика обработки обновлений.
 * Использует прокси через хелперы из @/lib/telegram.
 */
async function handleUpdate(update: any) {
    const message = update.message;
    if (!message) return;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminGroupId = "-1003811463175";
    const supportThreadId = 5;

    if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN missing');
    }

    const chatId = message.chat.id.toString();
    const text = message.text;
    const from = message.from;

    // --- Сценарий 1: Клиент пишет боту (Private -> Group) ---
    if (message.chat.type === 'private') {
        const username = from.username ? `@${from.username}` : 'нет юзернейма';
        const fullName = `${from.first_name || ''} ${from.last_name || ''}`.trim();
        
        const adminMessage = `📩 <b>Новое сообщение</b> от ${fullName} (${username}, ID: <code>${from.id}</code>):\n\n${text || '[Медиа или пустое сообщение]'}`;

        await sendTelegramRawMessage({
            botToken,
            chatId: adminGroupId,
            threadId: supportThreadId,
            text: adminMessage,
        });
    }

    // --- Сценарий 2: Админ отвечает клиенту (Group -> Private) ---
    else if (chatId === adminGroupId && message.reply_to_message) {
        const replyToText = message.reply_to_message.text || '';
        
        // Ищем паттерн ID: (\d+) в сообщении, на которое отвечаем
        const idMatch = replyToText.match(/ID: (\d+)/);
        
        if (idMatch && idMatch[1]) {
            const targetUserId = idMatch[1];
            
            await sendTelegramRawMessage({
                botToken,
                chatId: targetUserId,
                text: text || '', 
            });
            console.log(`Successfully forwarded admin reply to user ${targetUserId}`);
        }
    }
}
