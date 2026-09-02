import { getProxyDispatcher } from '@/lib/proxyDispatcher';

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
 * ВАЖНО: используется fetch() с явным `dispatcher` (тот же ProxyAgent,
 * что и для Notion в src/lib/proxyDispatcher.ts), а не axios и не
 * отдельный https.request+HttpsProxyAgent — при сосуществовании двух
 * разных туннельных механизмов к одному прокси в одном процессе
 * второй начинал получать 400 Bad Request от постороннего nginx
 * вместо ответа Telegram. Один общий механизм работает надёжно.
 * Воспроизведено и проверено на проде 2026-09-02.
 */
export async function sendTelegramMessageViaProxy({ botToken, chatId, threadId, text, parseMode = 'HTML' }: SendMessageOptions): Promise<any> {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_thread_id: threadId,
            text,
            parse_mode: parseMode,
            disable_web_page_preview: true,
        }),
        dispatcher: getProxyDispatcher(),
        signal: AbortSignal.timeout(10000),
    } as any);

    const data = await response.json().catch(() => null);

    if (response.ok && data?.ok) {
        return data.result;
    }

    console.error('Telegram sendMessage Error:', data || `HTTP ${response.status}`);
    throw new Error(`Telegram API Error: ${data?.description || `HTTP ${response.status}`}`);
}
