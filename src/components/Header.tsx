'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

    const width = screenState.isDesktop
        ? 'var(--logo-desktop-width, 200px)'
        : 'var(--logo-mobile-width, 158px)';
    const height = screenState.isDesktop
        ? 'var(--logo-desktop-height, 62px)'
        : 'var(--logo-mobile-height, 48px)';

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
    const t = useTranslations('Header');
    const rawPathname = usePathname();
    // Отрезаем префикс локали (/ru или /en), чтобы восстановить старую логику путей
    const pathname = rawPathname.replace(/^\/(ru|en)(\/|$)/, '/').replace(/\/$/, '') || '/';
    const currentLocale = rawPathname.startsWith('/en') ? 'en' : 'ru';

    const getLocalizedPath = (targetLocale: 'ru' | 'en') => {
        const hasPrefix = rawPathname.startsWith('/en') || rawPathname.startsWith('/ru');
        if (hasPrefix) {
            return rawPathname.replace(/^\/(en|ru)/, `/${targetLocale}`);
        }
        return `/${targetLocale}${rawPathname}`;
    };

    const { totalItems, setIsOpen } = useCart();
    const { setIsOpen: setIsSupportOpen } = useSupport();
    const isProjectActive = pathname === '/project' || pathname.startsWith('/product/');
    const isHomePage = pathname === '/';
    const isRightSideLogo = !['/', '/contact', '/space'].includes(pathname);

    {/* const isDarkTheme = isProjectActive; */ }
    {/* const themeColor = isDarkTheme ? '#1a1a1a' : '#ebebeb'; */ }

    const themeColor = '#ebebeb';
    const leftStarRef = useRef<HTMLDivElement>(null);
    const rightStarRef = useRef<HTMLDivElement>(null);
    const mobileStarRef = useRef<HTMLDivElement>(null);

    const rotationTweens = useRef<{ [key: string]: gsap.core.Tween | null }>({
        left: null,
        right: null,
        mobile: null
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isDropdownHovered, setIsDropdownHovered] = useState(false);
    const mobileHeaderButtonRef = useRef<HTMLDivElement>(null);
    const burgerMenuButtonRef = useRef<HTMLDivElement>(null);
    const desktopButtonRef = useRef<HTMLDivElement>(null);
    const isMenuVisible = isLangOpen || isDropdownHovered;
    const lottieContainerRef = useRef<HTMLDivElement>(null);
    const animationInstanceRef = useRef<any>(null);
    const isFirstMount = useRef(true);
    const [mounted, setMounted] = useState(false);
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const forceLogoRight = screenSize.width >= 1024 && screenSize.width <= 1440;
    const displayLogoRight = isRightSideLogo || forceLogoRight;

    useEffect(() => {
        setMounted(true);
        setScreenSize({ width: window.innerWidth, height: window.innerHeight });

        const handleResize = () => {
            setScreenSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isTelegram, setIsTelegram] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkTg = () => {
            const hash = window.location.hash.toLowerCase() || '';
            const search = window.location.search.toLowerCase() || '';
            const ua = navigator.userAgent.toLowerCase();
            const tgObj = (window as any).Telegram?.WebApp;

            // 1. Самый надежный маркер: Telegram ВСЕГДА инжектит параметры в URL (hash или search)
            if (hash.includes('tgwebappdata') || search.includes('tgwebappdata')) return true;
            if (hash.includes('tgwebappplatform') || search.includes('tgwebappplatform')) return true;

            // 2. Фолбэк на объект (если скрипт успел загрузиться)
            if (tgObj && Object.keys(tgObj).length > 0) return true;

            // 3. Фолбэк на User Agent
            if (ua.includes('telegram')) return true;

            return false;
        };

        // Мгновенная проверка
        if (checkTg()) {
            setIsTelegram(true);
        } else {
            // Поллинг на случай медленной инициализации скрипта (2 секунды)
            let attempts = 0;
            const tgInterval = setInterval(() => {
                attempts++;
                if (checkTg()) {
                    setIsTelegram(true);
                    clearInterval(tgInterval);
                }
                if (attempts > 20) clearInterval(tgInterval);
            }, 100);
            return () => clearInterval(tgInterval);
        }
    }, []);

    const [isPreloaderDone, setIsPreloaderDone] = useState(pathname !== '/');

    useEffect(() => {
        if (pathname !== '/') {
            setIsPreloaderDone(true);
            return;
        }
        const handler = () => setIsPreloaderDone(true);
        window.addEventListener('preloaderFinished', handler);
        return () => window.removeEventListener('preloaderFinished', handler);
    }, [pathname]);


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

        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            tg.ready();
            tg.expand();

            // ДЕТЕКТОР ПЛАТФОРМЫ
            // Если открыли с компа - вешаем класс на body
            if (tg.platform === 'tdesktop' || tg.platform === 'macos') {
                document.body.classList.add('is-tg-desktop');
            }
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
                            width: 0,
                            marginLeft: 0
                        },
                        {
                            scale: 1,
                            opacity: 1,
                            width: 22,
                            marginLeft: isDesktopBadge ? 8 : 7,
                            duration: 0.6,
                            ease: "power2.out",
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
                    width: 0,
                    marginLeft: 0,
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

    // Анимация появления самого хедера (ждет прелоадер на главной)
    useEffect(() => {
        if (mounted && isPreloaderDone) {
            gsap.to(".header-main-container", {
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            });
        }
    }, [mounted, isPreloaderDone]);

    // ЛОГИКА ЗВЕЗДЫ: Появление (теперь ждет сигнала от прелоадера)
    useEffect(() => {
        if (!mounted) return;

        if (isHomePage) {
            if (isPreloaderDone) {
                // Если мы на главной и прелоадер закончил - плавно появляемся
                gsap.to(".header-star-element", {
                    opacity: 1,
                    duration: 1.5,
                    ease: "power2.out",
                    overwrite: true
                });
            }
        } else {
            // Если уходим с главной - плавно гаснем
            gsap.to(".header-star-element", {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                overwrite: true
            });
        }
    }, [isHomePage, mounted, isPreloaderDone]);

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

    // Управление вращением всех звезд
    useEffect(() => {
        const setupRotation = () => {
            if (typeof window === 'undefined') return;
            const isMobile = window.innerWidth < 1024;
            const isLarge = window.innerWidth >= 1441;

            const rotate = (ref: React.RefObject<HTMLDivElement | null>, key: 'left' | 'right' | 'mobile', shouldRotate: boolean) => {
                if (shouldRotate && ref.current) {
                    if (!rotationTweens.current[key]) {
                        rotationTweens.current[key] = gsap.to(ref.current, {
                            rotation: 360,
                            duration: 25,
                            ease: "none",
                            repeat: -1,
                            transformOrigin: "center center"
                        });
                    }
                } else {
                    if (rotationTweens.current[key]) {
                        rotationTweens.current[key]?.kill();
                        rotationTweens.current[key] = null;
                    }
                }
            };

            // Мобильная звезда
            rotate(mobileStarRef, 'mobile', isHomePage && isMobile);
            // Левая звезда: десктоп, большой экран, логотип слева
            rotate(leftStarRef, 'left', isHomePage && !isMobile && isLarge && !isRightSideLogo);
            // Правая звезда: десктоп, (логотип справа ИЛИ экран <= 1440)
            rotate(rightStarRef, 'right', isHomePage && !isMobile && (isRightSideLogo || !isLarge));
        };

        if (mounted && isPreloaderDone) {
            setupRotation();
            window.addEventListener('resize', setupRotation);
        }

        return () => {
            window.removeEventListener('resize', setupRotation);
            Object.values(rotationTweens.current).forEach(t => t?.kill());
            rotationTweens.current = { left: null, right: null, mobile: null };
        };
    }, [isHomePage, isRightSideLogo, mounted, isPreloaderDone]);

    // Определяем режим отображения иконки переключения языков
    const getLanguageSwitcherMode = (): 'desktop' | 'tablet' | 'mobile' | 'app' => {
        if (!mounted || screenSize.width === 0) return 'desktop';
        if (screenSize.width >= 1024) return 'desktop';
        if (screenSize.width >= 768) return 'tablet';

        // Мобилки (ширина < 768px) -> всегда внутри меню
        return 'mobile';
    };

    const switcherMode = getLanguageSwitcherMode();

    const isOverlayVisible =
        switcherMode === 'mobile'
            ? (isMenuOpen && !isMenuVisible)
            : (!isMenuOpen && !isMenuVisible);

    const renderLanguageSwitcher = (refToUse: React.RefObject<HTMLDivElement | null>) => {
        const isHeaderMobile = refToUse === mobileHeaderButtonRef;
        let marginLeft = '20px';
        let marginRight = '0px';
        let transform = 'translateY(0.3vh)';

        if (switcherMode === 'desktop') {
            marginLeft = '10px';
            marginRight = '5px';
            transform = 'none';
        } else if (switcherMode === 'tablet') {
            marginLeft = '20px';
            marginRight = '0px';
            transform = 'translateY(0.3vh)';
        } else if (switcherMode === 'app') {
            // Стиль для Telegram Mini App (можете настраивать отдельно!)
            marginLeft = '20px';
            marginRight = '0px';
            transform = 'translateY(0.3vh)';
        } else if (switcherMode === 'mobile') {
            // Стиль для обычной мобилки в браузере (можете настраивать отдельно!)
            marginLeft = '20px';
            marginRight = '0px';
            transform = 'translateY(0.3vh)';
        }

        return (
            <div
                ref={refToUse}
                className={`relative flex items-center justify-center transition-all duration-300 pointer-events-auto ${isHeaderMobile
                    ? (isMenuOpen ? 'opacity-0 scale-95 pointer-events-none delay-0' : 'opacity-100 scale-100 pointer-events-auto delay-[300ms]')
                    : ''
                    }`}
                style={{
                    marginLeft,
                    marginRight,
                    transform
                }}
                onMouseEnter={() => setIsLangOpen(true)}
                onMouseLeave={() => {
                    setTimeout(() => {
                        setIsLangOpen(false);
                    }, 100);
                }}
            >
                {/* Нативная белая подложка под иконкой (находится внутри структуры!) */}
                <div
                    className={`absolute inset-0 bg-[#ffffff] rounded-[10px] shadow-sm pointer-events-none transition-all duration-500 ease-out ${isOverlayVisible
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-90'
                        }`}
                    style={{
                        width: '36px',
                        height: '36px',
                        zIndex: -1
                    }}
                />

                <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="relative flex items-center justify-center bg-transparent border-none rounded-[10px] cursor-pointer outline-none transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ width: '36px', height: '36px' }}
                >
                    {/* Globe Icon */}
                    <img
                        src="/Internet.svg"
                        alt="Language"
                        className={`absolute w-[20px] h-[20px] brightness-0 transition-all duration-300 ease-out ${isMenuVisible
                            ? 'opacity-90 scale-100'
                            : 'opacity-0 scale-75 pointer-events-none'
                            }`}
                    />

                    {/* Current Locale Text */}
                    <span
                        className={`absolute text-[13px] font-bold tracking-tight uppercase transition-all duration-300 ease-out ${isMenuVisible
                            ? 'opacity-0 scale-75 pointer-events-none'
                            : 'opacity-100 scale-100'
                            }`}
                        style={{ color: '#000000', transform: 'translateY(0.5px)' }}
                    >
                        {currentLocale}
                    </span>
                </button>

                {/* Нативное выпадающее меню языков (EN/RU) */}
                <div
                    className={`absolute bg-[#ffffff] rounded-[16px] flex flex-col shadow-xl z-[9999] transition-all duration-300 ease-out pointer-events-auto ${isMenuVisible
                        ? 'opacity-100 translate-y-0 visible'
                        : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                        }`}
                    onMouseEnter={() => setIsDropdownHovered(true)}
                    onMouseLeave={() => setIsDropdownHovered(false)}
                    style={{
                        top: '44px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '53px',
                        padding: '15px 0px',
                        gap: '14px',
                        alignItems: 'center'
                    }}
                >
                    <TransitionLink
                        href={getLocalizedPath('en')}
                        className="text-[18px] font-bold transition-opacity no-underline leading-none"
                        style={{ color: currentLocale === 'en' ? '#888888' : '#000000' }}
                        onClick={() => setIsLangOpen(false)}
                    >
                        EN
                    </TransitionLink>
                    <TransitionLink
                        href={getLocalizedPath('ru')}
                        className="text-[18px] font-bold transition-opacity no-underline leading-none"
                        style={{ color: currentLocale === 'ru' ? '#888888' : '#000000' }}
                        onClick={() => setIsLangOpen(false)}
                    >
                        RU
                    </TransitionLink>
                </div>
            </div>
        );
    };



    return (
        <>
            <div className="fixed top-0 left-0 w-full h-[100px] z-[50] pointer-events-none">
                {/* BIG PINK STAR - MOBILE */}
                <div className={`lg:hidden absolute top-[10vh] right-[4vw] flex items-center z-[50] pointer-events-none h-[44px] header-star-element opacity-0 scale-170
                `}>
                    <div className="absolute top-[-55px] right-[-80px] md:right-[-160px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                        <div
                            ref={mobileStarRef}
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
                {screenSize.width >= 1441 && (
                    <div
                        className={`hidden lg:flex absolute top-[40px] left-[40px] items-center z-[50] pointer-events-none h-[44px] header-star-element opacity-0 scale-200
                            ${isHomePage && !isRightSideLogo ? '' : '!hidden'}
                        `}
                    >
                        <div className="absolute top-[-55px] left-[-80px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                            <div
                                ref={leftStarRef}
                                className="w-full h-full will-change-transform flex items-center justify-center"
                                style={{ color: '#f5b3ffff' }}
                            >
                                <svg viewBox="0 0 100 100" className="w-[380px] h-[380px] fill-current">
                                    <path d="M50 0L54.3 35.7L85.4 14.6L64.3 45.7L100 50L64.3 54.3L85.4 85.4L54.3 64.3L50 100L45.7 64.3L14.6 85.4L35.7 54.3L0 50L35.7 45.7L14.6 14.6L45.7 35.7Z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* BIG PINK STAR - DESKTOP RIGHT */}
                {screenSize.width > 0 && screenSize.width <= 1440 && (
                    <div
                        className={`hidden lg:flex absolute top-[28px] right-[40px] items-center z-[50] pointer-events-none h-[44px] header-star-element opacity-0 scale-200
                            ${isHomePage ? '' : '!hidden'}
                        `}
                    >
                        <div className="absolute top-[-55px] right-[-80px] w-[280px] h-[280px] pointer-events-none flex items-center justify-center">
                            <div
                                ref={rightStarRef}
                                className="w-full h-full will-change-transform flex items-center justify-center"
                                style={{ color: '#f5b3ffff' }}
                            >
                                <svg viewBox="0 0 100 100" className="w-[380px] h-[380px] fill-current">
                                    <path d="M50 0L54.3 35.7L85.4 14.6L64.3 45.7L100 50L64.3 54.3L85.4 85.4L54.3 64.3L50 100L45.7 64.3L14.6 85.4L35.7 54.3L0 50L35.7 45.7L14.6 14.6L45.7 35.7Z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <header className="fixed top-0 left-0 w-full h-[100px] z-[999] pointer-events-none mix-blend-exclusion opacity-0 header-main-container">
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

                    {/* Просто невидимая распорка в основном хедере */}
                    <div style={{ display: (switcherMode === 'app' || switcherMode === 'tablet') ? 'block' : 'none', width: '36px', height: '36px' }} />
                </div>

                <div className="absolute inset-0 w-full h-full pointer-events-none z-[60]">
                    {/* MOBILE LOGO - ALWAYS STABLE */}
                    <div
                        className="lg:hidden absolute flex items-center z-[150] pointer-events-none"
                        style={{
                            top: 'var(--logo-mobile-top, 5vh)',
                            right: 'var(--logo-mobile-right, 2vw)',
                            left: 'var(--logo-mobile-left, auto)',
                            height: 'var(--logo-mobile-container-height, 44px)'
                        }}
                    >
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
                        ${!displayLogoRight ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}
                    `}>
                        <div className="flex items-center z-[10] origin-left pointer-events-auto">
                            <TransitionLink href="/" className="pointer-events-auto">
                                <LogoAnimation color={themeColor} isRightSide={false} />
                            </TransitionLink>
                        </div>
                    </div>

                    {/* DESKTOP LOGO - RIGHT */}
                    <div className={`hidden lg:flex absolute top-[40px] right-[40px] items-center z-[150] pointer-events-none h-[70px] transition-all duration-500
                        ${displayLogoRight ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}
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
                            <NavItem href="/project" text={t('project')} isActive={isProjectActive} color={themeColor} />
                            <NavItem href="/contact" text={t('contact')} isActive={pathname === '/contact'} color={themeColor} />
                            {/* Невидимая распорка в основном меню */}
                            <div style={{ display: switcherMode === 'mobile' ? 'block' : 'none', width: '36px', height: '36px' }} />
                        </nav>
                    </div>

                    {/* Desktop Nav Container */}
                    <nav className={`hidden lg:flex absolute top-[40px] flex-row items-center z-[150] gap-1 pointer-events-auto transition-all duration-500
    ${displayLogoRight ? 'right-[240px]' : 'right-[80px]'}
`}>
                        <NavItem href="/project" text={t('project')} isActive={isProjectActive} color={themeColor} />
                        <NavItem href="/contact" text={t('contact')} isActive={pathname === '/contact'} color={themeColor} />
                        <NavItem
                            text={t('cart')}
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
                        {/* Невидимая распорка в десктопном меню с отступом 28px */}
                        <div style={{ display: switcherMode === 'desktop' ? 'block' : 'none', width: '36px', height: '36px', marginLeft: '28px' }} />
                    </nav>
                </div>
            </header>

            {/* ==========================================================
                СИБЛИНГ-ХЕДЕР (Z-[1000]) БЕЗ MIX-BLEND-EXCLUSION
                ========================================================== */}
            <div className="fixed top-0 left-0 w-full h-[100px] z-[999] pointer-events-none opacity-0 header-main-container">
                {/* 1. Планшетный/App переключатель */}
                <div className="lg:hidden absolute top-[4vh] left-[10vw] flex items-center gap-6 z-[200] pointer-events-none">
                    {/* Динамические распорки для 100% идеального позиционирования */}
                    <div className="w-[44px] h-[44px] opacity-0" /> {/* Burger spacer */}

                    {/* Cart spacer с динамическим бейджем */}
                    <div
                        className="relative flex items-center gap-2 bg-transparent border-none outline-none translate-y-[2px] opacity-0"
                        style={{ marginLeft: '25px' }}
                    >
                        <ShoppingBag size={24} />
                        <span
                            className="flex items-center justify-center text-[12px] font-bold border-2 border-current rounded-full shrink-0"
                            style={{
                                width: cartCount > 0 ? '22px' : '0px',
                                height: cartCount > 0 ? '22px' : '0px',
                                marginLeft: cartCount > 0 ? '7px' : '0px',
                            }}
                        />
                    </div>

                    {/* Support spacer */}
                    <div
                        className="relative flex items-center justify-center bg-transparent border-none outline-none translate-y-[2px] opacity-0"
                        style={{ marginLeft: '20px' }}
                    >
                        <div className="w-[30px] h-[30px]" />
                    </div>

                    <div style={{ display: (switcherMode === 'app' || switcherMode === 'tablet') ? 'block' : 'none' }} className="pointer-events-auto">
                        {renderLanguageSwitcher(mobileHeaderButtonRef)}
                    </div>
                </div>

                {/* 2. Мобильный бургер-переключатель */}
                <div className="absolute top-[4.1vh] left-[28vw] lg:hidden flex items-center justify-start z-[150] pointer-events-none h-[44px]">
                    <nav className={`flex flex-row items-center transition-all ease-[cubic-bezier(0.76,0,0.24,1)] relative z-[200]
                        ${isMenuOpen ? 'duration-500 opacity-100 translate-x-0 pointer-events-none visible' : 'duration-200 opacity-0 translate-x-8 pointer-events-none invisible'}
                    `}>
                        {/* Распорки-тексты с идентичным размером и отступами для пиксельного совпадения */}
                        <div className="opacity-0 pointer-events-none" style={{ padding: '15px 2vw' }}>
                            <span className="text-[16px] font-bold tracking-widest">{t('project')}</span>
                        </div>
                        <div className="opacity-0 pointer-events-none" style={{ padding: '15px 2vw' }}>
                            <span className="text-[16px] font-bold tracking-widest">{t('contact')}</span>
                        </div>

                        <div style={{ display: switcherMode === 'mobile' ? 'block' : 'none' }} className="pointer-events-auto">
                            {renderLanguageSwitcher(burgerMenuButtonRef)}
                        </div>
                    </nav>
                </div>

                {/* 3. Десктопный переключатель */}
                <nav className={`hidden lg:flex absolute top-[40px] flex-row items-center z-[150] gap-1 pointer-events-none transition-all duration-500
                    ${displayLogoRight ? 'right-[240px]' : 'right-[80px]'}
                `}>
                    {/* Распорки-тексты для пиксельного совпадения с основным меню */}
                    <div className="opacity-0 pointer-events-none" style={{ padding: '20px 15px' }}>
                        <span className="text-sm font-bold tracking-widest">{t('project')}</span>
                    </div>
                    <div className="opacity-0 pointer-events-none" style={{ padding: '20px 15px' }}>
                        <span className="text-sm font-bold tracking-widest">{t('contact')}</span>
                    </div>
                    <div className="opacity-0 pointer-events-none flex items-center" style={{ padding: '20px 15px' }}>
                        <span className="text-sm font-bold tracking-widest">{t('cart')}</span>
                        <span
                            className="flex items-center justify-center border-2 border-current rounded-full"
                            style={{
                                width: cartCount > 0 ? '22px' : '0px',
                                height: cartCount > 0 ? '22px' : '0px',
                                marginLeft: cartCount > 0 ? '8px' : '0px',
                            }}
                        />
                    </div>
                    <div style={{ width: '60px' }} /> {/* Support button spacer */}

                    <div style={{ display: switcherMode === 'desktop' ? 'block' : 'none', marginLeft: '28px' }} className="pointer-events-auto">
                        {renderLanguageSwitcher(desktopButtonRef)}
                    </div>
                </nav>
            </div>

        </>
    );
};