import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Настройка прокси для Telegram API.
 * Используется французский прокси-сервер для обхода блокировок на сервере.
 */
const PROXY_URL = process.env.PROXY_URL || 'http://103.75.126.30:8888';
const agent = new HttpsProxyAgent(PROXY_URL);

const telegramAxios = axios.create({
    httpsAgent: agent,
    proxy: false, // Отключаем встроенный прокси axios, используем наш агент
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Нормализует контактные данные (телефон или ник Telegram).
 */
export function normalizeContact(contact: string): { type: 'phone' | 'telegram'; value: string } {
    const clean = contact.trim();
    const hasLetters = /[a-zA-Zа-яА-Я]/.test(clean);
    
    if (hasLetters) {
        const value = clean.startsWith('@') ? clean : `@${clean}`;
        return { type: 'telegram', value };
    } else {
        return { type: 'phone', value: clean };
    }
}

/**
 * Создает новый топик в группе-форуме Telegram.
 * Возвращает message_thread_id созданного топика.
 */
export async function createTelegramTopic(botToken: string, chatId: string, name: string): Promise<number> {
    const url = `https://api.telegram.org/bot${botToken}/createForumTopic`;
    
    try {
        const response = await telegramAxios.post(url, {
            chat_id: chatId,
            name: name,
        });
        
        const data = response.data;
        
        if (!data.ok || !data.result?.message_thread_id) {
            console.error('Telegram createForumTopic Error:', data);
            throw new Error(`Failed to create topic: ${data.description || 'Unknown error'}`);
        }
        
        return data.result.message_thread_id;
    } catch (error: any) {
        const errorData = error.response?.data;
        console.error('Error in createTelegramTopic:', errorData || error.message);
        throw new Error(errorData?.description || error.message);
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
