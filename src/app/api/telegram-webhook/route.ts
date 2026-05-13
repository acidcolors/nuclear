import { NextResponse } from 'next/server';
import { sendTelegramRawMessage } from '@/lib/telegram';

export async function POST(req: Request) {
    try {
        const update = await req.json();
        
        // Извлекаем сообщение (если оно есть)
        const message = update.message;
        if (!message) {
            return NextResponse.json({ ok: true });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const adminGroupId = "-1003811463175";
        const supportThreadId = 5;

        if (!botToken) {
            console.error('TELEGRAM_BOT_TOKEN missing in webhook');
            return NextResponse.json({ error: 'Config error' }, { status: 500 });
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

            return NextResponse.json({ ok: true });
        }

        // --- Сценарий 2: Админ отвечает клиенту (Group -> Private) ---
        // Проверяем, что сообщение из нашей группы и это ответ
        if (chatId === adminGroupId && message.reply_to_message) {
            const replyToText = message.reply_to_message.text || '';
            
            // Ищем паттерн ID: (\d+) в сообщении, на которое отвечаем
            const idMatch = replyToText.match(/ID: (\d+)/);
            
            if (idMatch && idMatch[1]) {
                const targetUserId = idMatch[1];
                
                await sendTelegramRawMessage({
                    botToken,
                    chatId: targetUserId,
                    text: text, // Текст ответа админа
                });

                console.log(`Forwarded admin reply to user ${targetUserId}`);
            } else {
                console.log('User ID not found in reply_to_message text');
            }
            
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Telegram Webhook Error:', error.message);
        // Возвращаем 200, чтобы Telegram не спамил повторами при наших внутренних ошибках, 
        // но логируем для отладки.
        return NextResponse.json({ ok: true });
    }
}
