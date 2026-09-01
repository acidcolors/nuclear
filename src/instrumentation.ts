/**
 * Next.js Instrumentation — запускается один раз при старте сервера.
 * Настраивает глобальный прокси для Node.js fetch (undici),
 * чтобы запросы к внешним API (Notion и др.) шли через локальный прокси/VPN.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

        if (proxyUrl) {
            const { EnvHttpProxyAgent, setGlobalDispatcher } = await import('undici');
            setGlobalDispatcher(new EnvHttpProxyAgent());
            console.log(`[Instrumentation] Global proxy set: ${proxyUrl}`);
        }
    }
}
