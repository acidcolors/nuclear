'use client';

import { useEffect, useState } from 'react';
import cliSpinners from 'cli-spinners';

const NETWORK_SPINNER = cliSpinners.dots3;

// Футер-статусбар — тонкая линия сверху, затем строка текста двумя блоками:
// слева — качество соединения (реальный пинг до своего сервера),
// справа — доступность Telegram API через прокси (реальная проверка).

const PRIMARY_COLOR = '#111';
const MUTED_COLOR = '#898887';
const LINE_COLOR = 'rgba(17, 17, 17, 0.15)';

const COLOR_STABLE = '#2563eb';
const COLOR_MEDIUM = '#ec4899';
const COLOR_POOR = '#ef4444';

const COLOR_API_ACTIVE = '#22c55e';
const COLOR_API_INACTIVE = '#ef4444';

// Пороги пинга (мс) — правь тут
const PING_STABLE_MAX = 200;
const PING_MEDIUM_MAX = 600;

type Quality = 'stable' | 'medium' | 'poor' | null;

const QUALITY_LABEL: Record<Exclude<Quality, null>, string> = {
    stable: 'good',
    medium: 'fair',
    poor: 'poor',
};

const QUALITY_COLOR: Record<Exclude<Quality, null>, string> = {
    stable: COLOR_STABLE,
    medium: COLOR_MEDIUM,
    poor: COLOR_POOR,
};

export const Footer = () => {
    const [quality, setQuality] = useState<Quality>(null);
    const [telegramActive, setTelegramActive] = useState<boolean | null>(null);
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        const spin = setInterval(() => {
            setFrameIndex((i) => (i + 1) % NETWORK_SPINNER.frames.length);
        }, NETWORK_SPINNER.interval);
        return () => clearInterval(spin);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            const start = performance.now();
            try {
                const res = await fetch('/api/status', { cache: 'no-store' });
                const elapsed = performance.now() - start;
                const data = await res.json().catch(() => null);

                if (cancelled) return;

                setTelegramActive(Boolean(data?.telegramActive));
                setQuality(
                    elapsed < PING_STABLE_MAX ? 'stable' : elapsed < PING_MEDIUM_MAX ? 'medium' : 'poor'
                );
            } catch {
                if (cancelled) return;
                setTelegramActive(false);
                setQuality('poor');
            }
        };

        check();
        const interval = setInterval(check, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const qualityColor = quality ? QUALITY_COLOR[quality] : MUTED_COLOR;
    const qualityLabel = quality ? QUALITY_LABEL[quality] : '...';

    return (
        <footer
            className="fixed bottom-0 left-0 w-full z-[200] pointer-events-none"
            style={{
                borderTop: `1px solid ${LINE_COLOR}`
            }}
        >
            <div
                className="flex items-center justify-between font-mono px-[4vw] lg:px-[40px]"
                style={{ height: '36px' }}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span
                        className="text-[11px] lg:text-[12px] leading-none shrink-0 inline-block w-[1ch] text-center font-mono"
                        style={{ color: PRIMARY_COLOR }}
                    >
                        {NETWORK_SPINNER.frames[frameIndex]}
                    </span>
                    <span
                        className="text-[11px] lg:text-[12px] font-bold tracking-wide whitespace-nowrap transition-colors duration-500"
                        style={{ color: qualityColor }}
                    >
                        Network
                    </span>
                    <span
                        className="text-[11px] lg:text-[12px] tracking-wide whitespace-nowrap"
                        style={{ color: MUTED_COLOR }}
                    >
                        · ({qualityLabel})
                    </span>
                </div>

                <div className="flex items-center gap-2 overflow-hidden">
                    <span
                        className="text-[11px] lg:text-[12px] font-bold tracking-wide whitespace-nowrap transition-colors duration-500"
                        style={{ color: telegramActive === null ? MUTED_COLOR : telegramActive ? COLOR_API_ACTIVE : COLOR_API_INACTIVE }}
                    >
                        /api {telegramActive === null ? '...' : telegramActive ? 'active' : 'inactive'}
                    </span>
                </div>
            </div>
        </footer>
    );
};
