import { createHmac, timingSafeEqual } from 'crypto';

/** Экранирование для Telegram parse_mode=HTML и HTML-писем. */
export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Строка заданной длины или null, если тип/длина не подходят. */
export function cleanString(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed.length > maxLength) return null;
    return trimmed;
}

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
export const isValidEmail = (value: string) => EMAIL_RE.test(value) && value.length <= 200;

// ─── Rate limit (в памяти процесса; PM2 у нас один процесс) ──────────────────

const hits = new Map<string, number[]>();

/** true — запрос разрешён; false — лимит превышен. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
    }

    recent.push(now);
    hits.set(key, recent);

    if (hits.size > 5000) {
        for (const [k, times] of hits) {
            if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        }
    }
    return true;
}

/** IP клиента. Сайт за Cloudflare + nginx, поэтому сначала их заголовки. */
export function clientIp(req: Request): string {
    const cf = req.headers.get('cf-connecting-ip');
    if (cf) return cf;
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',').pop()!.trim();
    return 'unknown';
}

// ─── Проверка подписи Telegram Mini App ──────────────────────────────────────

export interface VerifiedTgUser {
    id: number;
    username?: string;
    first_name?: string;
}

/**
 * Проверяет подпись initData (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
 * и возвращает пользователя только если подпись верна и данные свежие.
 * Подделать tgUser без токена бота нельзя.
 */
export function verifyTelegramInitData(initData: unknown, botToken: string, maxAgeSec = 86400): VerifiedTgUser | null {
    if (typeof initData !== 'string' || initData.length === 0 || initData.length > 4096) return null;

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join('\n');

    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expected = createHmac('sha256', secret).update(dataCheckString).digest();

    let received: Buffer;
    try {
        received = Buffer.from(hash, 'hex');
    } catch {
        return null;
    }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

    const authDate = Number(params.get('auth_date'));
    if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;

    try {
        const user = JSON.parse(params.get('user') ?? '');
        if (typeof user?.id !== 'number') return null;
        return {
            id: user.id,
            username: typeof user.username === 'string' ? user.username : undefined,
            first_name: typeof user.first_name === 'string' ? user.first_name : undefined,
        };
    } catch {
        return null;
    }
}
