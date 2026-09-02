/**
 * Next.js Instrumentation — запускается один раз при старте сервера.
 *
 * Раньше здесь устанавливался ГЛОБАЛЬНЫЙ undici-диспетчер (setGlobalDispatcher)
 * для проксирования всех fetch() через NL-прокси. Убрано: глобальный dispatcher
 * (что EnvHttpProxyAgent, что обычный ProxyAgent) конфликтует с ручным
 * HttpsProxyAgent-туннелем, который использует Telegram-код через node:https —
 * один из двух механизмов начинает получать 400 Bad Request от постороннего
 * nginx вместо реального ответа. Прокси для Notion теперь передаётся явно
 * через `dispatcher` в самих fetch()-вызовах — см. src/lib/proxyDispatcher.ts.
 * Проверено на проде 2026-09-02.
 */
export async function register() {}
