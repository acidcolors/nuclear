'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from './TransitionLink';
import gsap from 'gsap';
import lottie from 'lottie-web';
import Lottie from 'lottie-react';
import logoAnimationData from '@/data/logo_t.json';
import { useCart } from '@/app/store/useCart';
import { useSupport } from '@/app/store/useSupport';
import { ShoppingBag } from 'lucide-react';

// ==========================================================
// 1.5. КОМПОНЕНТ ЛОГОТИПА
// ==========================================================
// Добавляем проп isRightSide для правильного позиционирования маски
const LogoAnimation = ({ color, isRightSide = false }: { color: string; isRightSide?: boolean }) => {
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
                className={`${isRightSide ? '[mask-position:right_center] [-webkit-mask-position:right_center]' : '[mask-position:left_center] [-webkit-mask-position:left_center]'}`}
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
const NavItem = ({ href, text, isActive, color, onClick, badge }: { href?: string; text: string; isActive?: boolean; color: string; onClick?: () => void; badge?: React.ReactNode }) => {
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

    const content = (
        <div className="py-[15px] px-[2vw] lg:py-[20px] lg:px-[15px] lg:h-full lg:flex lg:items-center">
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
            {badge && <div className="flex items-center justify-center lg:flex h-[20px]">{badge}</div>}
        </div>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className="group relative block no-underline outline-none cursor-pointer bg-transparent border-none p-0">
                {content}
            </button>
        );
    }

    return (
        <TransitionLink href={href || '/'} className="group relative block no-underline outline-none cursor-pointer">
            {content}
        </TransitionLink>
    );
};

// ==========================================================
// 2. ОСНОВНОЙ HEADER
// ==========================================================
export const Header = () => {
    const pathname = usePathname();
    const { totalItems, setIsOpen } = useCart();
    const { setIsOpen: setIsSupportOpen } = useSupport();
    const isProjectActive = pathname === '/project' || pathname.startsWith('/product/');
    const isHomePage = pathname === '/';
    const isRightSideLogo = !['/', '/contact', '/space'].includes(pathname);

    {/* const isDarkTheme = isProjectActive; */ }
    {/* const themeColor = isDarkTheme ? '#1a1a1a' : '#ebebeb'; */ }

    const themeColor = '#ebebeb';
    const bigStarRef = useRef<HTMLDivElement>(null);
    const rotationTween = useRef<gsap.core.Tween | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const lottieContainerRef = useRef<HTMLDivElement>(null);
    const animationInstanceRef = useRef<any>(null);
    const isFirstMount = useRef(true);
    const [mounted, setMounted] = useState(false);

    // Состояние для бленд-мода с задержкой (чтобы звезда успела исчезнуть)
    {/* const [delayedBlend, setDelayedBlend] = useState(!isDarkTheme);

    useEffect(() => {
        if (!isDarkTheme) {
            setDelayedBlend(true);
        } else {
            const timer = setTimeout(() => setDelayedBlend(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isDarkTheme]); */}

    const cartCount = totalItems();
    const mobileCartBadgeRef = useRef<HTMLSpanElement>(null);
    const desktopCartBadgeRef = useRef<HTMLSpanElement>(null);
    const prevCount = useRef(0);

    useEffect(() => {
        setMounted(true);

        // Инициализация Telegram Mini App
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;

            // Сообщаем, что приложение готово (убирает фризы при старте)
            tg.ready();

            // Принудительно растягиваем на максимальную высоту
            tg.expand();
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const animateBadge = (ref: React.RefObject<HTMLSpanElement | null>, isDesktopBadge: boolean) => {
            if (!ref.current) return;
            if (cartCount > 0) {
                if (prevCount.current === 0) {
                    gsap.fromTo(ref.current,
                        {
                            scale: 0,
                            opacity: 0,
                            width: isDesktopBadge ? 0 : 22,
                            marginLeft: isDesktopBadge ? 0 : 7
                        },
                        {
                            scale: 1,
                            opacity: 1,
                            width: 22,
                            marginLeft: isDesktopBadge ? 8 : 7,
                            duration: 0.6,
                            ease: "back.out(1.5)",
                            display: 'flex',
                            transformOrigin: "center center"
                        }
                    );
                }
                else if (cartCount !== prevCount.current) {
                    gsap.fromTo(ref.current,
                        { scale: 1 },
                        {
                            scale: 1.3,
                            duration: 0.2,
                            yoyo: true,
                            repeat: 1,
                            ease: "power2.out",
                            transformOrigin: "center center"
                        }
                    );
                }
            } else {
                gsap.to(ref.current, {
                    scale: 0,
                    opacity: 0,
                    width: isDesktopBadge ? 0 : 22,
                    marginLeft: isDesktopBadge ? 0 : 7,
                    duration: 0.4,
                    ease: "power2.in",
                    transformOrigin: "center center",
                    onComplete: () => {
                        if (ref.current) gsap.set(ref.current, { display: 'none' });
                    }
                });
            }
        };

        animateBadge(mobileCartBadgeRef, false);
        animateBadge(desktopCartBadgeRef, true);
        prevCount.current = cartCount;
    }, [cartCount, mounted]);

    // Значение счетчика с защитой от гидратации
    const displayCount = mounted ? cartCount : 0;

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

    const supportIcon = '/edit_chat.svg';

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
            <div className="fixed top-0 left-0 w-full h-[100px] z-[50] pointer-events-none">
                {/* BIG PINK STAR - MOBILE */}
                <div className={`lg:hidden absolute top-[10vh] right-[4vw] flex items-center z-[50] pointer-events-none h-[44px] transition-all duration-500
                    ${isHomePage ? 'opacity-100' : 'opacity-0'} scale-100
                `}>
                    <div className="absolute top-[-55px] right-[-80px] md:right-[-160px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                        <div
                            ref={isHomePage && typeof window !== 'undefined' && window.innerWidth < 1024 ? bigStarRef : null}
                            className="w-full h-full will-change-transform flex items-center justify-center"
                            style={{ color: '#f5b3ffff' }}
                        >
                            <svg viewBox="0 0 100 100" className="w-[380px] h-[380px] fill-current">
                                <path d="M50 0L54.3 35.7L85.4 14.6L64.3 45.7L100 50L64.3 54.3L85.4 85.4L54.3 64.3L50 100L45.7 64.3L14.6 85.4L35.7 54.3L0 50L35.7 45.7L14.6 14.6L45.7 35.7Z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* BIG PINK STAR - DESKTOP LEFT */}
                <div className={`hidden lg:flex absolute top-[40px] left-[40px] items-center z-[50] pointer-events-none h-[44px] transition-all duration-500
                    ${isHomePage && !isRightSideLogo ? 'opacity-100' : 'opacity-0'} scale-100
                `}>
                    <div className="absolute top-[-55px] left-[-80px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                        <div
                            ref={isHomePage && !isRightSideLogo && typeof window !== 'undefined' && window.innerWidth >= 1024 ? bigStarRef : null}
                            className="w-full h-full will-change-transform flex items-center justify-center"
                            style={{ color: '#f5b3ffff' }}
                        >
                            <svg viewBox="0 0 100 100" className="w-[380px] h-[380px] fill-current">
                                <path d="M50 0L54.3 35.7L85.4 14.6L64.3 45.7L100 50L64.3 54.3L85.4 85.4L54.3 64.3L50 100L45.7 64.3L14.6 85.4L35.7 54.3L0 50L35.7 45.7L14.6 14.6L45.7 35.7Z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* BIG PINK STAR - DESKTOP RIGHT */}
                <div className={`hidden lg:flex absolute top-[28px] right-[40px] items-center z-[50] pointer-events-none h-[44px] transition-all duration-500
                    ${isHomePage && isRightSideLogo ? 'opacity-100' : 'opacity-0'} scale-100
                `}>
                    <div className="absolute top-[-55px] right-[-80px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                        <div
                            ref={isHomePage && isRightSideLogo && typeof window !== 'undefined' && window.innerWidth >= 1024 ? bigStarRef : null}
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

            <header className="fixed top-0 left-0 w-full h-[100px] z-[999] pointer-events-none mix-blend-exclusion">
                {/* Burger & Cart Icon Group */}
                <div className="lg:hidden absolute top-[4vh] left-[6vw] flex items-center gap-6 z-[200] pointer-events-none">
                    <button
                        className="w-[44px] h-[44px] border-none !border-0 outline-none flex items-center justify-center bg-transparent pointer-events-auto"
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

                    <button
                        onClick={() => setIsOpen(true)}
                        className={`relative flex items-center gap-2 bg-transparent border-none outline-none translate-y-[2px] transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-95 pointer-events-none delay-0' : 'opacity-100 scale-100 pointer-events-auto delay-[200ms]'}`}
                        style={{ color: themeColor, marginLeft: '25px' }}
                    >
                        <ShoppingBag size={24} />
                        <span
                            ref={mobileCartBadgeRef}
                            className="flex items-center justify-center text-[12px] font-bold border-2 border-current rounded-full shrink-0"
                            style={{
                                width: '22px',
                                height: '22px',
                                marginLeft: '7px',
                                display: 'none'
                            }}
                        >
                            <span key={displayCount} className="animate-in fade-in zoom-in duration-300">
                                {displayCount}
                            </span>
                        </span>
                    </button>

                    <button
                        onClick={() => setIsSupportOpen(true)}
                        className={`relative flex items-center justify-center bg-transparent border-none outline-none translate-y-[2px] transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-95 pointer-events-none delay-0' : 'opacity-100 scale-100 pointer-events-auto delay-[250ms]'}`}
                        style={{ color: themeColor, marginLeft: '20px' }}
                    >
                        <img
                            src={supportIcon}
                            alt="Support"
                            className="w-[30px] h-[30px] brightness-0 invert"
                            style={{ opacity: 0.9 }}
                        />
                    </button>
                </div>

                <div className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
                    {/* MOBILE LOGO - ALWAYS STABLE */}
                    <div className="lg:hidden absolute top-[5vh] right-[2vw] flex items-center z-[150] pointer-events-none h-[44px]">
                        <div className={`transition-all duration-300 flex items-center z-[10] origin-right pointer-events-auto
                            ${isMenuOpen ? 'opacity-0 scale-95 pointer-events-none delay-0' : 'opacity-100 scale-100 pointer-events-auto delay-[200ms]'}
                        `}>
                            <TransitionLink href="/" className="pointer-events-auto">
                                <LogoAnimation color={themeColor} isRightSide={true} />
                            </TransitionLink>
                        </div>
                    </div>

                    {/* DESKTOP LOGO - LEFT */}
                    <div className={`hidden lg:flex absolute top-[40px] left-[40px] items-center z-[150] pointer-events-none h-[70px] transition-all duration-500
                        ${!isRightSideLogo ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}
                    `}>
                        <div className="flex items-center z-[10] origin-left pointer-events-auto">
                            <TransitionLink href="/" className="pointer-events-auto">
                                <LogoAnimation color={themeColor} isRightSide={false} />
                            </TransitionLink>
                        </div>
                    </div>

                    {/* DESKTOP LOGO - RIGHT */}
                    <div className={`hidden lg:flex absolute top-[28px] right-[40px] items-center z-[150] pointer-events-none h-[70px] transition-all duration-500
                        ${isRightSideLogo ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}
                    `}>
                        <div className="flex items-center z-[10] origin-right pointer-events-auto">
                            <TransitionLink href="/" className="pointer-events-auto">
                                <LogoAnimation color={themeColor} isRightSide={true} />
                            </TransitionLink>
                        </div>
                    </div>

                    {/* Mobile Nav Container */}
                    <div className="absolute top-[4.2vh] left-[24vw] lg:hidden flex items-center justify-start z-[150] pointer-events-none h-[44px]">
                        <nav className={`flex flex-row items-center transition-all ease-[cubic-bezier(0.76,0,0.24,1)] relative z-[200]
    ${isMenuOpen ? 'duration-500 opacity-100 translate-x-0 pointer-events-auto visible' : 'duration-200 opacity-0 translate-x-8 pointer-events-none invisible'}
`}>
                            <NavItem href="/project" text="Project" isActive={isProjectActive} color={themeColor} />
                            <NavItem href="/contact" text="Contact" isActive={pathname === '/contact'} color={themeColor} />
                        </nav>
                    </div>

                    {/* Desktop Nav Container */}
                    <nav className={`hidden lg:flex absolute top-[40px] flex-row items-center z-[150] gap-1 pointer-events-auto transition-all duration-500
    ${isRightSideLogo ? 'right-[240px]' : 'right-[80px]'}
`}>
                        <NavItem href="/project" text="Project" isActive={isProjectActive} color={themeColor} />
                        <NavItem href="/contact" text="Contact" isActive={pathname === '/contact'} color={themeColor} />
                        <NavItem
                            text="Корзина"
                            color={themeColor}
                            onClick={() => setIsOpen(true)}
                            badge={
                                <span
                                    ref={desktopCartBadgeRef}
                                    className="flex items-center justify-center text-[12px] font-bold border-2 border-current rounded-full overflow-hidden"
                                    style={{
                                        color: themeColor,
                                        width: '22px',
                                        height: '22px',
                                        marginLeft: '8px',
                                        display: 'none',
                                        position: 'relative'
                                    }}
                                >
                                    <span key={displayCount} className="animate-in fade-in zoom-in duration-300">
                                        {displayCount}
                                    </span>
                                </span>
                            }
                        />
                        <button
                            onClick={() => setIsSupportOpen(true)}
                            className="p-[15px] hover:scale-110 active:scale-95 transition-all duration-300 outline-none border-none bg-transparent cursor-pointer flex items-center justify-center"
                        >
                            <div
                                className="w-[30px] h-[30px]"
                                style={{
                                    backgroundColor: themeColor,
                                    WebkitMaskImage: `url(${supportIcon})`,
                                    WebkitMaskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskImage: `url(${supportIcon})`,
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat'
                                }}
                            />
                        </button>
                    </nav>
                </div>
            </header>
        </>
    );
};