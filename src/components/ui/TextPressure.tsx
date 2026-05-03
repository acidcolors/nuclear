'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface TextPressureProps {
    text: string;
    className?: string;
    weightInactive?: number;
    weightActive?: number;
    skewActive?: number;
    maxDist?: number;
    animateMode?: 'none' | 'random' | 'v-cursor'; // Новый параметр
}

export function TextPressure({
    text,
    className = '',
    weightInactive = 1300,
    weightActive = 100,
    skewActive = 18,
    maxDist = 100,
    animateMode = 'none'
}: TextPressureProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const charDataRef = useRef<{ x: number; y: number }[]>([]);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const spans = container.querySelectorAll('.pressure-char');
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1441;

        // Кэшируем позиции один раз, чтобы не вызывать getBoundingClientRect в циклах
        const updateCache = () => {
            charDataRef.current = Array.from(spans).map((span) => {
                const rect = span.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };
            });
        };

        // Небольшая задержка, чтобы шрифты успели отрендериться
        const timer = setTimeout(updateCache, 100);
        window.addEventListener('resize', updateCache);

        // --- ЛОГИКА ДЛЯ МЫШКИ (Десктоп) ---
        const handleMouseMove = (e: MouseEvent) => {
            if (isMobile && animateMode !== 'none') return; // На мобилках используем авто-анимацию

            spans.forEach((span, i) => {
                const data = charDataRef.current[i];
                if (!data) return;

                const charCenterX = data.x;
                const charCenterY = data.y;
                const distX = e.clientX - charCenterX;
                const distY = e.clientY - charCenterY;
                const distance = Math.sqrt(distX * distX + distY * distY);

                const influence = Math.max(0, 1 - distance / maxDist);
                const weight = weightInactive + (weightActive - weightInactive) * influence;
                
                const skewDirection = distX > 0 ? 1 : -1;
                const skew = (skewActive * influence) * skewDirection;

                gsap.to(span, {
                    fontVariationSettings: `"wght" ${weight}`,
                    skewX: skew,
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });
        };

        const handleMouseLeave = () => {
            gsap.to(spans, {
                fontVariationSettings: `"wght" ${weightInactive}`,
                skewX: 0,
                duration: 0.6,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        };

        // --- АВТОМАТИЧЕСКАЯ АНИМАЦИЯ (Любые экраны, если включен режим) ---
        let vCursorTween: gsap.core.Tween | null = null;

        if (animateMode !== 'none') {
            if (animateMode === 'random') {
                // ВАРИАНТ 1: Случайные вспышки с затуханием (волна)
                const triggerRandom = () => {
                    const centerIndex = Math.floor(Math.random() * spans.length);
                    const radius = 3; 
                    const randomDirection = Math.random() > 0.5 ? 1 : -1;

                    for (let i = centerIndex - radius; i <= centerIndex + radius; i++) {
                        if (i >= 0 && i < spans.length) {
                            const target = spans[i];
                            const distance = Math.abs(i - centerIndex);
                            const intensity = 1 - (distance / (radius + 1)); 

                            const currentWeight = weightInactive + (weightActive - weightInactive) * intensity;
                            const currentSkew = (skewActive * intensity) * randomDirection;

                            gsap.to(target, {
                                fontVariationSettings: `"wght" ${currentWeight}`,
                                skewX: currentSkew,
                                duration: 2.5,
                                yoyo: true,
                                repeat: 1,
                                ease: "power2.inOut",
                                overwrite: 'auto'
                            });
                        }
                    }

                    const nextTimeout = setTimeout(triggerRandom, Math.random() * 2000 + 1000);
                    timeoutsRef.current.push(nextTimeout);
                };

                const t1 = setTimeout(triggerRandom, 500);
                const t2 = setTimeout(triggerRandom, 1500);
                timeoutsRef.current.push(t1, t2);

            } else if (animateMode === 'v-cursor' && isMobile) {
                // ВАРИАНТ 3: Виртуальный курсор (только для мобилок/планшетов)
                const vCursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

                const updateByVCursor = () => {
                    spans.forEach((span, i) => {
                        const data = charDataRef.current[i];
                        if (!data) return;

                        const charCenterX = data.x;
                        const charCenterY = data.y;
                        const distX = vCursor.x - charCenterX;
                        const distY = vCursor.y - charCenterY;
                        const distance = Math.sqrt(distX * distX + distY * distY);

                        const influence = Math.max(0, 1 - distance / maxDist);
                        const weight = weightInactive + (weightActive - weightInactive) * influence;
                        
                        const skewDirection = distX > 0 ? 1 : -1;
                        const skew = (skewActive * influence) * skewDirection;

                        gsap.to(span, {
                            fontVariationSettings: `"wght" ${weight}`,
                            skewX: skew,
                            duration: 0.5,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    });
                };

                const moveCursor = () => {
                    vCursorTween = gsap.to(vCursor, {
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        duration: Math.random() * 2 + 2,
                        ease: "sine.inOut",
                        onUpdate: updateByVCursor,
                        onComplete: moveCursor
                    });
                };
                moveCursor();
            }
        }

        // Мышку слушаем только если НЕ мобилка И режим анимации 'none'
        if (!isMobile && animateMode === 'none') {
            window.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            clearTimeout(timer);
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
            window.removeEventListener('resize', updateCache);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (vCursorTween) vCursorTween.kill();
            gsap.killTweensOf(Array.from(spans));
        };
    }, [weightInactive, weightActive, skewActive, maxDist, animateMode]);

    const lines = text.split('\n');

    return (
        <h1 ref={containerRef} className={className}>
            {lines.map((line, lineIndex) => (
                <span key={lineIndex} className="block whitespace-nowrap">
                    {line.split('').map((char, charIndex) => (
                        <span
                            key={charIndex}
                            className="pressure-char inline-block text-[inherit]"
                            style={{ 
                                fontVariationSettings: `"wght" ${weightInactive}, "slnt" 0`,
                                willChange: 'font-variation-settings'
                            }}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </span>
            ))}
        </h1>
    );
}
