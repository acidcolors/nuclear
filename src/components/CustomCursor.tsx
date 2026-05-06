'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const starRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname(); // Следим за сменой страницы

    // Эффект для сброса состояния курсора при переходе на другую страницу
    useEffect(() => {
        if (dotRef.current && starRef.current) {
            gsap.to(dotRef.current, {
                backgroundImage: `url('/cursors/arrow.svg')`,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto'
            });
            gsap.to(starRef.current, { 
                scale: 1, 
                rotate: 0, 
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }
    }, [pathname]);

    useEffect(() => {
        if (!dotRef.current || !starRef.current) return;

        const dot = dotRef.current;
        const star = starRef.current;

        // 1. Начальная настройка и принудительное включение GPU-ускорения
        gsap.set([dot, star], { 
            xPercent: -50, 
            yPercent: -50,
            force3D: true, 
            x: -100,
            y: -100
        });

        // Базовый вид точки
        gsap.set(dot, {
            backgroundImage: `url('/cursors/arrow.svg')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            width: 32,
            height: 32
        });

        // 2. Оптимизированные функции обновления для звезды
        const xStar = gsap.quickTo(star, "x", { duration: 0.9, ease: "power3.out" });
        const yStar = gsap.quickTo(star, "y", { duration: 0.9, ease: "power3.out" });

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            
            gsap.set(dot, {
                x: clientX + 5,
                y: clientY + 12
            });
            
            xStar(clientX + 45);
            yStar(clientY + 45);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const interactiveEl = target.closest('[data-cursor], a, button, .group, [role="button"], input, label, svg, path');

            if (interactiveEl) {
                const cursorType = interactiveEl.getAttribute('data-cursor') || 'pointer';

                gsap.to(dot, {
                    backgroundImage: `url('/cursors/${cursorType}.svg')`,
                    duration: 0.2,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to(star, { 
                    scale: 2.5, 
                    rotate: 45, 
                    duration: 0.3,
                    overwrite: 'auto'
                });
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const interactiveEl = target.closest('[data-cursor], a, button, .group, [role="button"], input, label, svg, path');

            if (interactiveEl) {
                gsap.to(dot, {
                    backgroundImage: `url('/cursors/arrow.svg')`,
                    duration: 0.2,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });

                gsap.to(star, { 
                    scale: 1, 
                    rotate: 0, 
                    duration: 0.3,
                    overwrite: 'auto'
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
        };
    }, []);

    return (
        <>
            {/* Главный курсор */}
            <div
                ref={dotRef}
                className="fixed top-0 left-0 z-[1000001] pointer-events-none hidden lg:block"
                style={{ willChange: 'transform' }}
            />

            {/* Звезда */}
            <div
                ref={starRef}
                className="fixed top-0 left-0 z-[1000000] pointer-events-none hidden lg:block"
                style={{ willChange: 'transform' }}
            >
                <span style={{ fontSize: '58px', color: '#ff5f24ff', lineHeight: 1 }}>✹</span>
            </div>
        </>
    );
}