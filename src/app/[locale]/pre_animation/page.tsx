'use client';

import { useEffect, useState } from 'react';
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
const ACCENT_COLOR = '#898887'; // акцентный оранжевый (как звезда курсора)
const BAND_WIDTH = 3; // сколько букв подряд подсвечено разом (без градиента внутри буквы)
const WAVE_STEP = 0.15; // на сколько букв сдвигается волна за тик
const WAVE_MS = 30;

// Размер текста анимации — правь тут
const FONT_SIZE_MOBILE = '20px';
const FONT_SIZE_DESKTOP = '20px';

export default function PreAnimationPage() {
    const [spinnerName, setSpinnerName] = useState<SpinnerName>(SPINNER_NAMES[0]);
    const [frameIndex, setFrameIndex] = useState(0);
    const [word, setWord] = useState(WORDS[0]);
    const [wavePos, setWavePos] = useState(-BAND_WIDTH);

    const { frames, interval: frameMs } = cliSpinners[spinnerName];

    // Рандомный выбор спиннера и слова один раз при загрузке страницы (после маунта, чтобы не словить hydration mismatch)
    useEffect(() => {
        setSpinnerName(SPINNER_NAMES[Math.floor(Math.random() * SPINNER_NAMES.length)]);
        setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }, []);

    useEffect(() => {
        setFrameIndex(0);
        const spin = setInterval(() => {
            setFrameIndex((i) => (i + 1) % frames.length);
        }, frameMs);
        return () => clearInterval(spin);
    }, [frames, frameMs]);

    // Волна градиента, бегущая по буквам слева направо, бесшовно зацикленная
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
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#ebebeb]">
            <style>{`
                .pre-anim-text {
                    font-size: ${FONT_SIZE_MOBILE};
                }
                @media (min-width: 768px) {
                    .pre-anim-text {
                        font-size: ${FONT_SIZE_DESKTOP};
                    }
                }
            `}</style>
            <div className="pre-anim-text flex items-center font-bold text-[#111]" style={{ gap: '1rem' }}>
                <span className="inline-block w-[0em] text-center font-mono whitespace-pre">{frames[frameIndex]}</span>
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
        </div>
    );
}
