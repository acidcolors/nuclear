'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import Lottie from 'lottie-react';
import upAnimationData from '@/data/up.json';

export const GlobalScrollToTop = () => {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const btnRef = useRef<HTMLDivElement>(null);
    const activeContainerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleScroll = (e: Event) => {
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

    // Сбрасываем состояние при смене страницы
    useEffect(() => {
        setIsVisible(false);
        activeContainerRef.current = null;
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

    const lottieRef = useRef<any>(null);

    // Защита: если данных нет, показываем обычную картинку
    if (!upAnimationData || !upAnimationData.layers) {
        return (
            <div
                ref={btnRef}
                onClick={handleBackToTop}
                className="fixed bottom-[14vh] md:bottom-[3vh] right-[4vw] lg:bottom-[40px] lg:right-[40px] z-[200] cursor-pointer opacity-0 translate-y-[30px] hidden"
                style={{ pointerEvents: 'none' }}
            >
                <div className="relative group transition-transform duration-300 hover:scale-110 active:scale-95">
                    <img
                        src="/label_up.svg"
                        alt="Back to top"
                        className="w-[100px] md:w-[120px] lg:w-[150px] h-auto drop-shadow-md"
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            ref={btnRef}
            onClick={handleBackToTop}
            className="fixed bottom-[14vh] md:bottom-[3vh] right-[4vw] lg:bottom-[40px] lg:right-[40px] z-[200] cursor-pointer opacity-0 translate-y-[30px] hidden"
            style={{ pointerEvents: 'none' }}
            onMouseEnter={() => {
                if (lottieRef.current) {
                    lottieRef.current.setDirection(1);
                    lottieRef.current.play();
                }
            }}
            onMouseLeave={() => {
                if (lottieRef.current) {
                    lottieRef.current.setDirection(-1);
                    lottieRef.current.play();
                }
            }}
        >
            <div className="relative group transition-transform duration-300 hover:scale-110 active:scale-95">
                <div className="w-[100px] md:w-[120px] lg:w-[150px] h-auto">
                    <Lottie 
                        lottieRef={lottieRef}
                        animationData={upAnimationData} 
                        loop={false}
                        autoplay={false}
                    />
                </div>
            </div>
        </div>
    );
};
