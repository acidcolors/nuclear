import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import { normalizeContact } from '@/lib/telegram';

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

        // Умный прокси: только в продакшене
        const agent = process.env.NODE_ENV === 'production' 
            ? new HttpsProxyAgent(process.env.PROXY_URL || 'http://103.75.126.30:8888') 
            : undefined;

        const axiosConfig = { 
            httpsAgent: agent, 
            proxy: false as const, 
            timeout: 10000 
        };

        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            message_thread_id: threadId,
            text: messageText.trim(),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }, axiosConfig);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Support API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
