'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

export const GlobalScrollToTop = () => {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const btnRef = useRef<HTMLDivElement>(null);
    const activeContainerRef = useRef<HTMLElement | null>(null);
    const ignoreScrollRef = useRef(false);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (ignoreScrollRef.current) return;

            const target = e.target;

            // Игнорируем мелкие элементы, ищем только те, что могут быть основными контейнерами
            // Обычно это либо document, либо дивы с overflow
            let scrollTop = 0;
            if (target === document || target === window) {
                scrollTop = window.scrollY || document.documentElement.scrollTop;
                activeContainerRef.current = document.documentElement;
            } else if (target instanceof HTMLElement) {
                scrollTop = target.scrollTop;
                // Запоминаем последний скроллившийся элемент
                activeContainerRef.current = target;
            }

            if (document.body.classList.contains('promo-modal-open')) {
                setIsVisible(false);
                return;
            }

            if (scrollTop > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Используем capture: true, чтобы ловить события скролла, которые не всплывают (на дивах)
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    // Сбрасываем состояние при смене страницы или по требованию (например, закрытие модалки)
    useEffect(() => {
        const resetState = () => {
            setIsVisible(false);
            activeContainerRef.current = null;
            
            // Игнорируем случайные события скролла, которые могут возникнуть при закрытии модалки (восстановление скроллбара и т.д.)
            ignoreScrollRef.current = true;
            setTimeout(() => {
                ignoreScrollRef.current = false;
            }, 1000);
        };
        
        resetState(); // Вызываем при смене pathname
        
        window.addEventListener('forceHideScrollToTop', resetState);
        return () => window.removeEventListener('forceHideScrollToTop', resetState);
    }, [pathname]);

    useEffect(() => {
        if (isVisible) {
            gsap.to(btnRef.current, {
                opacity: 1,
                y: 0,
                pointerEvents: 'auto',
                duration: 0.6,
                ease: 'power3.out',
                display: 'block'
            });
        } else {
            gsap.to(btnRef.current, {
                opacity: 0,
                y: 30,
                pointerEvents: 'none',
                duration: 0.5,
                ease: 'power3.in',
                onComplete: () => {
                    if (btnRef.current) btnRef.current.style.display = 'none';
                }
            });
        }
    }, [isVisible]);

    const handleBackToTop = () => {
        // 1. Прокручиваем окно (стандартный скролл)
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 2. Прокручиваем все возможные контейнеры, если они были активны
        if (activeContainerRef.current) {
            activeContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // На всякий случай ищем наши специфичные треки из проекта
        const projectTrack = document.getElementById('project-scroll-track');
        const productTrack = document.getElementById('product-scroll-track');
        const projectMain = document.getElementById('project-main-container');
        const productMain = document.getElementById('product-main-container');

        [projectTrack, productTrack, projectMain, productMain].forEach(el => {
            if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    return (
        <div
            id="global-scroll-to-top"
            ref={btnRef}
            onClick={handleBackToTop}
            className="fixed bottom-[14vh] md:bottom-[3vh] right-[4vw] lg:bottom-[40px] lg:right-[40px] z-[9999] cursor-pointer opacity-0 translate-y-[30px] hidden"
            style={{ pointerEvents: 'none' }}
        >
            <div className="flex items-center gap-[10px] font-mono text-[14px] lg:text-[15px] text-[#111] transition-opacity duration-300 hover:opacity-70">
                <span>↑</span>
                <span>Наверх</span>
            </div>
        </div>
    );
};
