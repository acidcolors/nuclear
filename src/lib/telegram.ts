
/**
 * Нормализует контактные данные (телефон или ник Telegram).
 */
export function normalizeContact(contact: string): { type: 'phone' | 'telegram'; value: string } {
    const clean = contact.trim();
    // Проверка на наличие букв (латиница или кириллица)
    const hasLetters = /[a-zA-Zа-яА-Я]/.test(clean);
    
    if (hasLetters) {
        // Считаем это Telegram-ником
        const value = clean.startsWith('@') ? clean : `@${clean}`;
        return { type: 'telegram', value };
    } else {
        // Считаем это номером телефона (цифры, пробелы, тире, скобки, плюс)
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
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, name }),
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.result?.message_thread_id) {
            console.error('Telegram createForumTopic Error:', data);
            throw new Error(`Failed to create topic: ${data.description || 'Unknown error'}`);
        }
        
        return data.result.message_thread_id;
    } catch (error) {
        console.error('Error in createTelegramTopic:', error);
        throw error;
    }
}

interface SendMessageOptions {
    botToken: string;
    chatId: string;
    threadId?: number;
    text: string;
}

/**
 * Отправляет сообщение в Telegram.
 */
export async function sendTelegramRawMessage({ botToken, chatId, threadId, text }: SendMessageOptions) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_thread_id: threadId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('Telegram sendMessage Error:', data);
        throw new Error(`Telegram API Error: ${data.description || response.statusText}`);
    }
    return data;
}
