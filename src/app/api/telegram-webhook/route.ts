import { NextResponse } from 'next/server';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * ЖЕСТКИЙ РЕФАКТОРИНГ: Мгновенный ответ + Изолированный прокси
 */
export async function POST(req: Request) {
    let update: any;
    
    try {
        // Максимально быстрый парсинг тела
        update = await req.json();
    } catch (e) {
        return NextResponse.json({ ok: true });
    }

    // Запускаем фоновую обработку БЕЗ await
    if (update && update.message) {
        processTelegramUpdate(update).catch(err => {
            console.error("CRITICAL: Webhook Background Panic:", err.message);
        });
    }

    // Возвращаем ответ Телеграму НЕМЕДЛЕННО
    return NextResponse.json({ ok: true });
}

/**
 * Изолированная логика обработки. 
 * Механизм прокси скопирован из рабочего /api/checkout.
 */
async function processTelegramUpdate(update: any) {
    const message = update.message;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminGroupId = "-1003811463175";
    const supportThreadId = 5;
    
    // Конфигурация прокси (идентична /api/checkout)
    const proxyUrl = process.env.PROXY_URL || 'http://103.75.126.30:8888';
    const agent = new HttpsProxyAgent(proxyUrl);
    const axiosConfig = { 
        httpsAgent: agent, 
        proxy: false as const,
        timeout: 10000 // Таймаут 10с для предотвращения утечек
    };

    if (!botToken) return;

    const chatId = message.chat?.id?.toString();
    const text = message.text || '';
    const from = message.from;

    if (!from) return;

    try {
        // Сценарий 1: Клиент -> Бот (Личное сообщение)
        if (message.chat?.type === 'private') {
            const username = from.username ? `@${from.username}` : 'нет юзернейма';
            const fullName = `${from.first_name || ''} ${from.last_name || ''}`.trim();
            const adminHeader = `📩 <b>Новое сообщение</b> от ${fullName} (${username}, ID: <code>${from.id}</code>):\n\n`;
            
            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: adminGroupId,
                message_thread_id: supportThreadId,
                text: `${adminHeader}${text || '[Медиа или пустое сообщение]'}`,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }, axiosConfig);
            
            console.log(`[Webhook Success] Forwarded message from ${from.id} to group topic ${supportThreadId}`);
        } 
        
        // Сценарий 2: Админ -> Клиент (Ответ на сообщение бота в группе)
        else if (chatId === adminGroupId && message.reply_to_message) {
            const replyToText = message.reply_to_message.text || '';
            const idMatch = replyToText.match(/ID: (\d+)/);
            
            if (idMatch && idMatch[1]) {
                const targetUserId = idMatch[1];
                
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    chat_id: targetUserId,
                    text: text,
                    parse_mode: 'HTML',
                }, axiosConfig);
                
                console.log(`[Webhook Success] Forwarded admin reply to user ${targetUserId}`);
            }
        }
    } catch (error: any) {
        // Глухой catch для предотвращения 500 ошибки
        const errorData = error.response?.data;
        console.error("Webhook Send Error Details:", errorData || error.message);
    }
}
