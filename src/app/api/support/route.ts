import { NextResponse } from 'next/server';
import { normalizeContact, createTelegramTopic, sendTelegramRawMessage } from '@/lib/telegram';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            customerInfo, 
            message, 
            subject, 
            items = [], 
            source = 'website', 
            tgUser 
        } = body;
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = "-1003811463175";

        if (!botToken) {
            console.error('TELEGRAM_BOT_TOKEN is missing');
            return NextResponse.json({ error: 'Telegram credentials not configured' }, { status: 500 });
        }

        // 1. Нормализация контакта
        const contact = normalizeContact(customerInfo);
        let targetThreadId: number | undefined;

        // 2. Логика маршрутизации
        // Сценарий А: Сайт + Телефон -> Топик 5
        if (source === 'website' && contact.type === 'phone') {
            targetThreadId = 5;
        } else {
            // Сценарии Б и В: Сайт + TG-ник ИЛИ Приложение -> Создаем новый топик
            const sourceLabel = source === 'app' ? 'App' : 'Web';
            const topicName = `Поддержка - ${sourceLabel} - ${contact.value}`;
            
            try {
                targetThreadId = await createTelegramTopic(botToken, chatId, topicName);
            } catch (err) {
                console.error('Failed to create topic, falling back to topic 5:', err);
                targetThreadId = 5;
            }
        }

        // 3. Формирование сообщения
        const title = "новое обращение в поддержку";
        let messageText = `— <b>${title}</b>\n\n`;

        if (tgUser) {
            const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim();
            const username = tgUser.username ? `@${tgUser.username}` : 'нет юзернейма';
            messageText += `<b>Контакт:</b> <a href="tg://user?id=${tgUser.id}">${fullName}</a> (${username}, ID: <code>${tgUser.id}</code>)\n`;
        } else {
            messageText += `<b>Контакт:</b> ${contact.value}\n`;
        }

        if (subject) {
            messageText += `<b>Тема:</b> ${subject}\n`;
        }

        if (message) {
            messageText += `<b>Сообщение:</b> ${message}\n`;
        }

        if (items && items.length > 0) {
            messageText += `\n<b>Связанные товары:</b>\n`;
            messageText += items.map((item: any) => `— ${item.title} (x${item.quantity})`).join('\n');
        }

        // 4. Отправка в Telegram
        await sendTelegramRawMessage({
            botToken,
            chatId,
            threadId: targetThreadId,
            text: messageText.trim()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Support API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
