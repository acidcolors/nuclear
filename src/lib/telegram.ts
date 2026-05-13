import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Настройка прокси для Telegram API.
 */
const PROXY_URL = process.env.PROXY_URL || 'http://103.75.126.30:8888';
const agent = new HttpsProxyAgent(PROXY_URL);

const telegramAxios = axios.create({
    httpsAgent: agent,
    proxy: false as const,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

/**
 * Определяет тип контакта и нормализует его.
 * Логика: если есть '@' и '.', считаем Email. Иначе - Telegram.
 */
export function normalizeContact(contact: string): { type: 'email' | 'telegram'; value: string } {
    const clean = contact.trim();
    
    // Простая проверка на email
    const isEmail = clean.includes('@') && clean.includes('.');
    
    if (isEmail) {
        return { type: 'email', value: clean };
    } else {
        // Для Telegram добавляем @ в начало, если его нет
        const value = clean.startsWith('@') ? clean : `@${clean}`;
        return { type: 'telegram', value };
    }
}

interface SendMessageOptions {
    botToken: string;
    chatId: string;
    threadId?: number;
    text: string;
}

/**
 * Отправляет сообщение в Telegram через прокси.
 */
export async function sendTelegramRawMessage({ botToken, chatId, threadId, text }: SendMessageOptions) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
        const response = await telegramAxios.post(url, {
            chat_id: chatId,
            message_thread_id: threadId,
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });

        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data;
        console.error('Telegram sendMessage Error:', errorData || error.message);
        throw new Error(`Telegram API Error: ${errorData?.description || error.message}`);
    }
}
