'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from './TransitionLink';
import gsap from 'gsap';
import lottie from 'lottie-web';
import Lottie from 'lottie-react';
import logoAnimationData from '@/data/logo_t.json';

// ==========================================================
// 1.5. КОМПОНЕНТ ЛОГОТИПА
// ==========================================================
const LogoAnimation = ({ color }: { color: string }) => {
    const lottieRef = useRef<any>(null);
    const [screenState, setScreenState] = useState({ isDesktop: false, isLarge: false });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setScreenState({ isDesktop: w >= 1024, isLarge: w >= 1441 });
        };
        check();
        window.addEventListener('resize', check);
        return () => {
            window.removeEventListener('resize', check);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Логика авто-проигрывания для < 1440px
    useEffect(() => {
        if (!screenState.isLarge && lottieRef.current) {
            // Запускаем первый раз
            lottieRef.current.play();
        } else if (lottieRef.current) {
            // Если экран стал большим, останавливаем цикл
            lottieRef.current.stop();
            if (timerRef.current) clearTimeout(timerRef.current);
        }
    }, [screenState.isLarge]);

    const handleComplete = () => {
        if (!screenState.isLarge) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                if (lottieRef.current) {
                    lottieRef.current.goToAndPlay(0);
                }
            }, 3000); // Ждем 3 секунды
        }
    };

    const width = screenState.isDesktop ? '200px' : '158px';
    const height = screenState.isDesktop ? '62px' : '48px';

    // Защита: если данных нет, показываем обычную картинку
    if (!logoAnimationData || !logoAnimationData.layers) {
        return (
            <div
                className="[-webkit-mask-position:right_center] lg:[-webkit-mask-position:left_center] [mask-position:right_center] lg:[mask-position:left_center]"
                style={{
                    width, height,
                    backgroundColor: color,
                    WebkitMaskImage: 'url(/logo_right.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat',
                    maskImage: 'url(/logo_right.svg)', maskSize: 'contain', maskRepeat: 'no-repeat',
                }}
            />
        );
    }

    return (
        <div 
            className="flex items-center justify-center cursor-pointer [&_path]:!fill-[var(--lottie-color)]"
            style={{ 
                width, height,
                '--lottie-color': color 
            } as React.CSSProperties}
            onMouseEnter={() => {
                if (lottieRef.current) {
                    lottieRef.current.setDirection(1);
                    lottieRef.current.play();
                    if (timerRef.current) clearTimeout(timerRef.current);
                }
            }}
            onMouseLeave={() => {
                if (lottieRef.current) {
                    lottieRef.current.setDirection(-1);
                    lottieRef.current.play();
                }
            }}
        >
            <Lottie 
                lottieRef={lottieRef}
                animationData={logoAnimationData} 
                loop={false}
                autoplay={false}
                className="w-full h-full"
                onComplete={handleComplete}
            />
        </div>
    );
};

// ==========================================================
// 1. КОМПОНЕНТ ПУНКТА МЕНЮ
// ==========================================================
const NavItem = ({ href, text, isActive, color }: { href: string; text: string; isActive?: boolean; color: string }) => {
    const star1Ref = useRef<HTMLSpanElement>(null);
    const star2Ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const targets = [star1Ref.current, star2Ref.current];
        if (isActive) {
            gsap.to(targets, {
                width: 14, marginLeft: 6, opacity: 1, scale: 1, rotate: 180,
                duration: 0.6, ease: "back.out(2.5)", transformOrigin: "center center"
            });
        } else {
            gsap.to(targets, {
                width: 0, marginLeft: 0, opacity: 0, scale: 0, rotate: 0,
                duration: 0.4, ease: "power2.inOut"
            });
        }
        return () => {
            gsap.killTweensOf(targets);
        };
    }, [isActive]);

    return (
        <TransitionLink href={href} className="group relative block no-underline outline-none cursor-pointer">
            <div className="py-[10px] px-[2vw] lg:py-[20px] lg:px-[15px]">
                <div className="overflow-hidden relative h-[20px] block flex-shrink-0">
                    <div className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2 flex flex-col">
                        <span className="text-[16px] lg:text-sm font-bold tracking-widest flex items-center whitespace-nowrap h-[20px]" style={{ color }}>
                            {text} <span ref={star1Ref} className="inline-flex items-center justify-center overflow-hidden" style={{ width: 0, opacity: 0 }}>✹</span>
                        </span>
                        <span className="text-[16px] lg:text-sm font-bold tracking-widest flex items-center whitespace-nowrap h-[20px]" style={{ color }}>
                            {text} <span ref={star2Ref} className="inline-flex items-center justify-center overflow-hidden" style={{ width: 0, opacity: 0 }}>✹</span>
                        </span>
                    </div>
                </div>
            </div>
        </TransitionLink>
    );
};

// ==========================================================
// 2. ОСНОВНОЙ HEADER
// ==========================================================
export const Header = () => {
    const pathname = usePathname();
    const isProjectActive = pathname === '/project' || pathname.startsWith('/product/');
    const isHomePage = pathname === '/';

    const isDarkTheme = isProjectActive;
    const themeColor = isDarkTheme ? '#1a1a1a' : '#ebebeb';

    const bigStarRef = useRef<HTMLDivElement>(null);
    const rotationTween = useRef<gsap.core.Tween | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const lottieContainerRef = useRef<HTMLDivElement>(null);
    const animationInstanceRef = useRef<any>(null);
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (lottieContainerRef.current && !animationInstanceRef.current) {
            animationInstanceRef.current = lottie.loadAnimation({
                container: lottieContainerRef.current,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                path: '/menu_close_button.json'
            });
        }
        return () => {
            if (animationInstanceRef.current) {
                animationInstanceRef.current.destroy();
                animationInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (animationInstanceRef.current) {
            if (isFirstMount.current) {
                animationInstanceRef.current.goToAndStop(0, true);
                isFirstMount.current = false;
                return;
            }
            if (isMenuOpen) {
                animationInstanceRef.current.playSegments([0, 35], true);
            } else {
                animationInstanceRef.current.playSegments([35, 70], true);
            }
        }
    }, [isMenuOpen]);

    useEffect(() => { setIsMenuOpen(false); }, [pathname]);

    // Анимация звезды с защитой от дерганья
    useEffect(() => {
        if (isHomePage && bigStarRef.current) {
            gsap.set(bigStarRef.current, { display: 'flex', opacity: 1, scale: 1 });
            
            if (!rotationTween.current) {
                rotationTween.current = gsap.to(bigStarRef.current, {
                    rotation: 360,
                    duration: 25,
                    ease: "none",
                    repeat: -1,
                    transformOrigin: "center center"
                });
            }
        } else if (bigStarRef.current) {
            gsap.set(bigStarRef.current, { display: 'none', opacity: 0 });
            if (rotationTween.current) {
                rotationTween.current.kill();
                rotationTween.current = null;
            }
        }
        
        return () => {
            if (rotationTween.current) {
                rotationTween.current.kill();
                rotationTween.current = null;
            }
        };
    }, [isHomePage]);

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-[100px] z-[90] pointer-events-none">
                <div className="absolute top-[10vh] right-[4vw] lg:top-[40px] lg:right-[40px] lg:left-auto min-[1441px]:left-[40px] min-[1441px]:right-auto flex items-center z-[50] pointer-events-none h-[44px]">
                    <div className="absolute top-[-55px] right-[-80px] md:right-[-160px] lg:right-[-80px] min-[1441px]:right-auto lg:left-auto min-[1441px]:left-[120px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                        <div
                            ref={bigStarRef}
                            className="w-full h-full will-change-transform flex items-center justify-center"
                            style={{ color: '#f5b3ffff' }}
                        >
                            <svg viewBox="0 0 100 100" className="w-[380px] h-[380px] fill-current">
                                <path d="M50 0L54.3 35.7L85.4 14.6L64.3 45.7L100 50L64.3 54.3L85.4 85.4L54.3 64.3L50 100L45.7 64.3L14.6 85.4L35.7 54.3L0 50L35.7 45.7L14.6 14.6L45.7 35.7Z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <header className={`fixed top-0 left-0 w-full h-[100px] z-[100] pointer-events-none ${isDarkTheme ? '' : 'blend-exclusion'}`}>
                <button
                    className="lg:hidden absolute top-[4vh] left-[6vw] w-[44px] h-[44px] border-none !border-0 outline-none pointer-events-auto z-[200] flex items-center justify-center bg-transparent"
                    style={{ border: 'none', background: 'transparent', transform: 'translateZ(0)' }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <div
                        ref={lottieContainerRef}
                        className="header-lottie-icon absolute w-[120px] h-[120px] scale-[1.3] flex items-center justify-center pointer-events-none [&_path]:!fill-[var(--lottie-color)] [&_path]:!stroke-[var(--lottie-color)]"
                        style={{
                            color: themeColor,
                            '--lottie-color': themeColor
                        } as React.CSSProperties}
                    />
                </button>

                <div className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
                    <div className="absolute top-[5vh] right-[4vw] lg:top-[40px] lg:right-[40px] lg:left-auto min-[1441px]:left-[40px] min-[1441px]:right-auto flex items-center z-[150] pointer-events-auto h-[44px] lg:h-[70px]">
                        <div className={`transition-all duration-300 flex items-center z-[10] origin-right min-[1441px]:origin-left lg:!delay-0
                            ${isMenuOpen ? 'opacity-0 scale-95 pointer-events-none delay-0' : 'opacity-100 scale-100 pointer-events-auto delay-[200ms]'}
                            lg:!opacity-100 lg:!scale-100 lg:!pointer-events-auto
                        `}>
                            <TransitionLink href="/">
                                <LogoAnimation color={themeColor} />
                            </TransitionLink>
                        </div>
                    </div>

                    <div className="absolute top-[4.2vh] right-[20vw] lg:top-[40px] lg:right-[220px] min-[1441px]:right-[40px] flex items-center justify-end z-[150] pointer-events-auto h-[44px]">
                        <nav className={`lg:hidden flex flex-row items-center transition-all ease-[cubic-bezier(0.76,0,0.24,1)] absolute right-[16vw] origin-right z-[10]
                            ${isMenuOpen ? 'duration-500 opacity-100 translate-x-0 pointer-events-auto' : 'duration-200 opacity-0 translate-x-8 pointer-events-none'}
                        `}>
                            <NavItem href="/project" text="Project" isActive={isProjectActive} color={themeColor} />
                            <NavItem href="/contact" text="Contact" isActive={pathname === '/contact'} color={themeColor} />
                        </nav>

                        <nav className="hidden lg:flex flex-row items-center z-[10] gap-1 pointer-events-auto">
                            <NavItem href="/project" text="Project" isActive={isProjectActive} color={themeColor} />
                            <NavItem href="/contact" text="Contact" isActive={pathname === '/contact'} color={themeColor} />
                        </nav>
                    </div>
                </div>
            </header>
        </>
    );
};