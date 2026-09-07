'use client';

import { useEffect, useRef, useState } from 'react';
import cliSpinners, { type SpinnerName } from 'cli-spinners';

const WORDS = ['Готовлю', 'Колдую', 'Загружаю', 'Рисую', 'Считаю'];

// Список спиннеров для рандомного выбора — правь тут (имена из пакета cli-spinners)
const SPINNER_NAMES: SpinnerName[] = [
    'flip',
    'dots',
    'line',
    'bounce',
];

const BASE_COLOR = '#111';
const ACCENT_COLOR = '#898887'; // акцентный серый
const BAND_WIDTH = 3; // сколько букв подряд подсвечено разом (без градиента внутри буквы)
const WAVE_STEP = 0.15; // на сколько букв сдвигается волна за тик
const WAVE_MS = 30;

// Размер текста анимации — правь тут
const FONT_SIZE_MOBILE = '15px';
const FONT_SIZE_DESKTOP = '15px';

export function Spinner() {
    const [ready, setReady] = useState(false);
    const [spinnerName, setSpinnerName] = useState<SpinnerName>(SPINNER_NAMES[0]);
    const [frameIndex, setFrameIndex] = useState(0);
    const [word, setWord] = useState(WORDS[0]);
    const [wavePos, setWavePos] = useState(-BAND_WIDTH);
    const pickedRef = useRef(false);

    const { frames, interval: frameMs } = cliSpinners[spinnerName];

    // Рандомный выбор спиннера и слова один раз при загрузке (после маунта, чтобы не словить hydration mismatch).
    // Все три setState батчатся в одном рендере, поэтому дефолтные значения ни разу не попадают на экран —
    // видимость (ready) открывается сразу с финальными случайными значениями, без "скачка" текста.
    // pickedRef защищает от повторного выбора при двойном вызове эффекта в React Strict Mode (dev) —
    // без него в деве было видно, как слово/спиннер меняются на другой случайный вариант через мгновение.
    useEffect(() => {
        if (pickedRef.current) return;
        pickedRef.current = true;
        setSpinnerName(SPINNER_NAMES[Math.floor(Math.random() * SPINNER_NAMES.length)]);
        setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
        setReady(true);
    }, []);

    useEffect(() => {
        setFrameIndex(0);
        const spin = setInterval(() => {
            setFrameIndex((i) => (i + 1) % frames.length);
        }, frameMs);
        return () => clearInterval(spin);
    }, [frames, frameMs]);

    // Волна подсветки, бегущая по буквам слева направо, бесшовно зацикленная
    useEffect(() => {
        const letterCount = Array.from(word).length;
        const wave = setInterval(() => {
            setWavePos((pos) => {
                const next = pos + WAVE_STEP;
                return next > letterCount + BAND_WIDTH ? -BAND_WIDTH : next;
            });
        }, WAVE_MS);
        return () => clearInterval(wave);
    }, [word]);

    const letters = Array.from(word);

    return (
        <>
            <style>{`
                .spinner-text {
                    font-size: ${FONT_SIZE_MOBILE};
                }
                @media (min-width: 768px) {
                    .spinner-text {
                        font-size: ${FONT_SIZE_DESKTOP};
                    }
                }
            `}</style>
            <div
                className="spinner-text flex items-center font-normal text-[#111]"
                style={{ gap: '1rem', visibility: ready ? 'visible' : 'hidden' }}
            >
                <span className="inline-block w-[0em] text-center font-mono whitespace-pre">
                    {frames[frameIndex]}
                </span>
                <span>
                    {letters.map((ch, i) => {
                        const center = Math.round(wavePos);
                        const isLit = Math.abs(i - center) <= (BAND_WIDTH - 1) / 2;
                        return (
                            <span key={i} style={{ color: isLit ? ACCENT_COLOR : BASE_COLOR }}>
                                {ch}
                            </span>
                        );
                    })}
                    …
                </span>
            </div>
        </>
    );
}
