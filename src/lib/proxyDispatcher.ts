import { ProxyAgent } from 'undici';

let dispatcher: ProxyAgent | undefined;

/**
 * Явный undici-диспетчер для проксирования fetch() к внешним API
 * (Notion и т.п.), которые нужно тащить через NL-прокси.
 *
 * ВАЖНО: не устанавливается как ГЛОБАЛЬНЫЙ дispatcher (setGlobalDispatcher) —
 * это конфликтует с ручным HttpsProxyAgent-туннелем, который используется
 * для Telegram (src/lib/telegram.ts) через node:https, ломая его запросы
 * (400 Bad Request от постороннего nginx). Передавать явно как
 * `dispatcher` в опции fetch(). Проверено на проде 2026-09-02.
 */
export function getProxyDispatcher(): ProxyAgent | undefined {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (!proxyUrl) return undefined;

    if (!dispatcher) {
        dispatcher = new ProxyAgent(proxyUrl);
    }
    return dispatcher;
}
