import { getProxyDispatcher } from '@/lib/proxyDispatcher';

// Лёгкая проверка доступности Telegram API через тот же прокси-механизм,
// что используется для реальных уведомлений (src/lib/telegram.ts).
// Не дёргает конкретного бота (не нужен токен) — просто проверяет,
// что api.telegram.org отвечает по текущему сетевому пути.
export async function GET() {
    let telegramActive = false;

    try {
        const res = await fetch('https://api.telegram.org', {
            method: 'GET',
            dispatcher: getProxyDispatcher(),
            signal: AbortSignal.timeout(5000),
        } as any);
        telegramActive = res.status < 500;
    } catch {
        telegramActive = false;
    }

    return Response.json({ telegramActive });
}
