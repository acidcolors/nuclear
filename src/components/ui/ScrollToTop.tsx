'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface ScrollToTopProps {
    scrollContainerId?: string;
    isDesktop?: boolean;
}

export const ScrollToTop = ({ scrollContainerId, isDesktop }: ScrollToTopProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const btnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerId ? document.getElementById(scrollContainerId) : null;
        
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            const scrollTop = target.scrollTop;
            
            if (scrollTop > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) container.removeEventListener('scroll', handleScroll);
        };
    }, [scrollContainerId, isDesktop]);

    // Дополнительный слушатель для мобильной версии (если контейнер другой)
    useEffect(() => {
        if (isDesktop) return;

        // На мобилках контейнером может быть основной враппер страницы
        const mobileContainer = document.getElementById(scrollContainerId?.replace('scroll-track', 'main-container') || '');
        
        const handleMobileScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            const scrollTop = target.scrollTop;
            if (scrollTop > 300) setIsVisible(true);
            else setIsVisible(false);
        };

        if (mobileContainer) {
            mobileContainer.addEventListener('scroll', handleMobileScroll);
        }

        return () => {
            if (mobileContainer) mobileContainer.removeEventListener('scroll', handleMobileScroll);
        };
    }, [isDesktop, scrollContainerId]);

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
        const desktopContainer = document.getElementById(scrollContainerId || '');
        const mobileContainer = document.getElementById(scrollContainerId?.replace('scroll-track', 'main-container') || '');
        
        if (isDesktop && desktopContainer) {
            desktopContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (mobileContainer) {
            mobileContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div 
            ref={btnRef}
            onClick={handleBackToTop}
            className="fixed bottom-[14vh] md:bottom-[3vh] right-[4vw] lg:bottom-[40px] lg:right-[40px] z-[150] cursor-pointer opacity-0 translate-y-[30px] hidden"
            style={{ pointerEvents: 'none' }}
        >
            <div className="relative group transition-transform duration-300 hover:scale-110 active:scale-95">
                <img 
                    src="/label_up.svg" 
                    alt="Back to top" 
                    className="w-[100px] md:w-[120px] lg:w-[150px] h-auto drop-shadow-md"
                    style={{ transform: 'rotate(0deg)' }}
                />
            </div>
        </div>
    );
};
