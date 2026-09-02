/**
 * Next.js Instrumentation — запускается один раз при старте сервера.
 * Настраивает глобальный прокси для Node.js fetch (undici),
 * чтобы запросы к внешним API (Notion и др.) шли через локальный прокси/VPN.
 *
 * Используется ProxyAgent (явный прокси), а не EnvHttpProxyAgent —
 * последний помечен undici как experimental и на проде подвешивал
 * TLS-хендшейк к api.notion.com (таймаут через ~5с без ответа).
 * ProxyAgent воспроизводимо работает надёжно. Проверено 2026-09-02.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

        if (proxyUrl) {
            const { ProxyAgent, setGlobalDispatcher } = await import('undici');
            setGlobalDispatcher(new ProxyAgent(proxyUrl));
            console.log(`[Instrumentation] Global proxy set: ${proxyUrl}`);
        }
    }
}
