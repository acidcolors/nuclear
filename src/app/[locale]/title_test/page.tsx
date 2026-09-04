'use client';

import { useEffect, useState } from 'react';
import { titleTestFonts } from './fonts';

const TEXT = 'ЯДЕРНЫЙ САД';
const TICK_MS = 1000 / 4; // 16 кадров/сек
const SWAP_CHANCE = 0.25;

const letters = Array.from(TEXT);

export default function TitleTestPage() {
    const [fontIndices, setFontIndices] = useState<number[]>(() => letters.map(() => 0));

    useEffect(() => {
        const interval = setInterval(() => {
            setFontIndices((prev) =>
                prev.map((idx, i) => {
                    if (letters[i] === ' ') return idx;
                    if (Math.random() >= SWAP_CHANCE) return idx;

                    if (titleTestFonts.length <= 1) return idx;
                    let next = Math.floor(Math.random() * titleTestFonts.length);
                    while (next === idx) {
                        next = Math.floor(Math.random() * titleTestFonts.length);
                    }
                    return next;
                })
            );
        }, TICK_MS);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#ebebeb] overflow-hidden">
            <h1 className="flex flex-wrap justify-center px-[5vw] text-[13vw] leading-none tracking-tight text-[#111]">
                {letters.map((ch, i) => (
                    <span
                        key={i}
                        style={{
                            fontFamily: ch === ' ' ? undefined : titleTestFonts[fontIndices[i]].style.fontFamily,
                            display: 'inline-block',
                            whiteSpace: 'pre',
                        }}
                    >
                        {ch}
                    </span>
                ))}
            </h1>
        </div>
    );
}
