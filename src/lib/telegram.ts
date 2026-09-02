import https from 'node:https';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
    chatId: string | number;
    threadId?: number;
    text: string;
    parseMode?: 'HTML' | 'MarkdownV2';
}

/**
 * Отправляет сообщение в Telegram через прокси.
 *
 * ВАЖНО: используется "сырой" https.request, а не axios — axios ломает
 * CONNECT-туннель через HttpsProxyAgent (получает 400 Bad Request от
 * постороннего nginx вместо ответа Telegram), тогда как node:https
 * с тем же самым агентом отрабатывает корректно. Воспроизведено и
 * проверено на проде 2026-09-02.
 */
export function sendTelegramMessageViaProxy({ botToken, chatId, threadId, text, parseMode = 'HTML' }: SendMessageOptions): Promise<any> {
    const proxyUrl = process.env.PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://38.180.132.49:8888';
    const agent = process.env.NODE_ENV === 'production' ? new HttpsProxyAgent(proxyUrl) : undefined;

    const bodyStr = JSON.stringify({
        chat_id: chatId,
        message_thread_id: threadId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
    });

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            agent,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
            },
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let parsed: any;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = null;
                }

                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && parsed?.ok) {
                    resolve(parsed.result);
                } else {
                    console.error('Telegram sendMessage Error:', parsed || data.slice(0, 300));
                    reject(new Error(`Telegram API Error: ${parsed?.description || `HTTP ${res.statusCode}`}`));
                }
            });
        });

        request.on('error', (err) => {
            console.error('Telegram sendMessage Error:', err.message);
            reject(new Error(`Telegram API Error: ${err.message}`));
        });
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Telegram API Error: request timed out'));
        });

        request.write(bodyStr);
        request.end();
    });
}
