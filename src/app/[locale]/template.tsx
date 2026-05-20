'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Мы убрали fromTo. Теперь GSAP берет элемент, который УЖЕ невидимый (из-за CSS),
        // и просто плавно включает ему opacity: 1.
        gsap.to(
            containerRef.current,
            {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out',
                delay: 0.1 // Минимальная задержка, чтобы браузер успел отрисовать шрифты
            }
        );
        return () => {
            gsap.killTweensOf(containerRef.current);
        };
    }, [pathname]);

    return (
        // КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: добавили класс opacity-0
        <div ref={containerRef} className="page-transition-wrapper w-full h-full opacity-0">
            {children}
        </div>
    );
}