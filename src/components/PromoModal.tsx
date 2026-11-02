'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lottie from 'lottie-react';
import logoAnimationData from '@/data/logo_t.json';

// Фото товара наверху модалки — перебираем по кругу каждые 2 секунды
const TOP_PHOTOS = [
    '/product/prod_01/image1.jpg',
    '/product/prod_01/image2.jpg',
    '/product/prod_01/image3.jpg',
    '/product/prod_01/image4.jpg',
    '/product/prod_01/image5.jpg',
    '/product/prod_01/image6.jpg',
];

const imageCache = new Map<string, HTMLImageElement>();

const preloadImageSequence = (prefix: string, frames: number, suffix: string) => {
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < frames; i++) {
        const paddedFrame = String(i).padStart(4, '0');
        const src = `${prefix}${paddedFrame}${suffix}`;
        if (imageCache.has(src)) {
            images.push(imageCache.get(src)!);
        } else {
            const img = new Image();
            img.src = src;
            imageCache.set(src, img);
            images.push(img);
        }
    }
    return images;
};

const ScrollSequenceAnimation = ({ className }: { className?: string }) => {
    return (
        <div className={className}>
            <img
                src="/animation/Link02/SA02.webp"
                alt="Static Star Element"
                className="w-[2000px] max-w-[500vw] h-auto object-contain pointer-events-none -translate-y-[800px] -mb-[550px]"
            />
        </div>
    );
};

const Link03Animation = ({ className }: { className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    // GSAP дёргает onUpdate синхронно на каждый скролл-тик (scrub), и во время
    // быстрого флика их может быть больше одного за кадр — раньше на каждый такой
    // вызов сразу шёл ctx.drawImage, то есть отрисовка была завязана на скролл-поток,
    // а не на реальную частоту кадров экрана. Теперь onUpdate только запоминает
    // нужный кадр, а рисуем не чаще одного раза за requestAnimationFrame.
    const pendingFrameRef = useRef<number | null>(null);
    const lastDrawnFrameRef = useRef<number>(-1);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        imagesRef.current = preloadImageSequence('/animation/Link03/SA03_', 91, '_R.webp');

        if (!containerRef.current || !canvasRef.current) return;

        let ctxGSAP: gsap.Context;

        const drawFrame = (frameIndex: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d', { alpha: true, desynchronized: true });
            const img = imagesRef.current[frameIndex];

            if (canvas && ctx && img && img.complete && img.width > 0) {
                const scale = 0.5; // Уменьшаем разрешение рендера в 2 раза
                const renderWidth = Math.floor(img.width * scale);
                const renderHeight = Math.floor(img.height * scale);

                if (canvas.width !== renderWidth && renderWidth > 0) {
                    canvas.width = renderWidth;
                    canvas.height = renderHeight;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
        };

        const scheduleDraw = (frameIndex: number) => {
            pendingFrameRef.current = frameIndex;
            if (rafIdRef.current !== null) return; // на этот кадр уже запланировано
            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;
                const frame = pendingFrameRef.current;
                if (frame !== null && frame !== lastDrawnFrameRef.current) {
                    lastDrawnFrameRef.current = frame;
                    drawFrame(frame);
                }
            });
        };

        const initAnimation = () => {
            if (!canvasRef.current || !containerRef.current) return;

            const firstImg = imagesRef.current[0];
            if (firstImg && firstImg.complete && firstImg.width > 0) {
                const scale = 0.5;
                canvasRef.current.width = Math.floor(firstImg.width * scale);
                canvasRef.current.height = Math.floor(firstImg.height * scale);
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.drawImage(firstImg, 0, 0, canvasRef.current.width, canvasRef.current.height);
                lastDrawnFrameRef.current = 0;
            }

            ctxGSAP = gsap.context(() => {
                const obj = { frame: 0 };
                gsap.to(obj, {
                    frame: 90,
                    snap: "frame",
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        scroller: "#promo-scroll-container",
                        start: "82% bottom",
                        end: "60% top",
                        scrub: true,
                        markers: false, // Отключили маркеры
                    },
                    onUpdate: () => {
                        scheduleDraw(Math.round(obj.frame));
                    }
                });

                setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 550);
            });
        };

        const firstImg = imagesRef.current[0];
        if (firstImg.complete) {
            initAnimation();
        } else {
            firstImg.onload = initAnimation;
        }

        return () => {
            if (ctxGSAP) ctxGSAP.revert();
            if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
            imagesRef.current = [];
        };
    }, []);

    return (
        <div ref={containerRef} className={className}>
            <canvas ref={canvasRef} className="w-[1200px] max-w-none shrink-0 h-auto object-contain pointer-events-none transform-gpu will-change-transform" />
        </div>
    );
};

// Streamline "Pixel" — interface-essential-bookmark_1 (CC BY 4.0)
const BookmarkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
        <g fill="#a8a8a8">
            <path d="m19.81 10.67 0 -6.09 -1.52 0 0 25.9 1.52 0 0 -18.28 9.14 0 0 -9.15 -1.52 0 0 7.62 -7.62 0z" />
            <path d="M25.91 1.53h1.52v1.52h-1.52Z" />
            <path d="M19.81 3.05h1.52v1.53h-1.52Z" />
            <path d="M16.76 30.48h1.53V32h-1.53Z" />
            <path d="M15.24 28.96h1.52v1.52h-1.52Z" />
            <path d="M13.72 27.43h1.52v1.53h-1.52Z" />
            <path d="m15.24 9.15 -3.05 0 0 1.52 -1.52 0 0 -1.52 -3.05 0 0 1.52 -1.52 0 0 3.05 1.52 0 0 1.52 1.52 0 0 1.53 1.53 0 0 1.52 1.52 0 0 -1.52 1.53 0 0 -1.53 1.52 0 0 -1.52 1.52 0 0 -3.05 -1.52 0 0 -1.52z" />
            <path d="M12.19 25.91h1.53v1.52h-1.53Z" />
            <path d="M10.67 24.39h1.52v1.52h-1.52Z" />
            <path d="M9.14 25.91h1.53v1.52H9.14Z" />
            <path d="m7.62 1.53 13.71 0 0 1.52 1.53 0 0 -1.52 3.05 0 0 -1.53L7.62 0l0 1.53z" />
            <path d="M7.62 27.43h1.52v1.53H7.62Z" />
            <path d="M6.1 28.96h1.52v1.52H6.1Z" />
            <path d="M6.1 1.53h1.52v1.52H6.1Z" />
            <path d="M4.57 30.48H6.1V32H4.57Z" />
            <path d="M4.57 3.05H6.1v1.53H4.57Z" />
            <path d="M3.05 4.58h1.52v25.9H3.05Z" />
        </g>
    </svg>
);

const ModalLogoAnimation = () => {
    const lottieRef = useRef<any>(null);
    return (
        <div className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer [&_path]:!fill-[#e2fd6f]">
            <Lottie
                lottieRef={lottieRef}
                animationData={logoAnimationData}
                loop={false}
                autoplay={true}
                onComplete={() => {
                    setTimeout(() => {
                        if (lottieRef.current) {
                            lottieRef.current.stop();
                            lottieRef.current.play();
                        }
                    }, 500);
                }}
                className="w-[80%] h-auto"
            />
        </div>
    );
};

export const PromoModal = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const [topPhotoIndex, setTopPhotoIndex] = useState(0);
    const svgTextRef = useRef<SVGSVGElement>(null);
    const flyingTextRef = useRef<HTMLDivElement>(null);
    const textTargetRef = useRef<HTMLParagraphElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const star1Ref = useRef<HTMLImageElement>(null);
    const star2Ref = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!shouldRender || !svgTextRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(svgTextRef.current,
                { rotation: 0 },
                {
                    rotation: -360,
                    duration: 15,
                    ease: "none",
                    repeat: -1,
                    transformOrigin: "center center"
                }
            );

            // Animate flying text from the text block down to the logo
            if (flyingTextRef.current && textTargetRef.current) {
                gsap.registerPlugin(ScrollTrigger);

                // Animate position
                gsap.fromTo(flyingTextRef.current,
                    { y: -570 }, // Start position (centered on the text)
                    {
                        y: 0, // End position (centered on the logo)
                        ease: "none",
                        scrollTrigger: {
                            trigger: textTargetRef.current,
                            scroller: "#promo-scroll-container",
                            start: "center center",
                            end: "+=420",
                            scrub: 1,
                            markers: false
                        }
                    }
                );

                // Animate color
                const textEl = flyingTextRef.current.querySelector('text');
                if (textEl) {
                    gsap.fromTo(textEl,
                        { fill: "#e2fd6f" },
                        {
                            fill: "#000000",
                            ease: "none",
                            scrollTrigger: {
                                trigger: textTargetRef.current,
                                scroller: "#promo-scroll-container",
                                start: "center center",
                                end: "+=420",
                                scrub: 1,
                            }
                        }
                    );
                }
            }

            // Fade in/out animations for central block text
            const textElements = [titleRef.current, descRef.current];
            textElements.forEach((el) => {
                if (el) {
                    gsap.fromTo(el,
                        { opacity: 0, y: 30 }, // start slightly lower and invisible
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: el,
                                scroller: "#promo-scroll-container",
                                start: "top 90%",
                                end: "bottom 10%",
                                toggleActions: "play reverse play reverse",
                                markers: false
                            }
                        }
                    );
                }
            });

            // Fade in/out animations for stars (opacity only, to preserve Tailwind transforms)
            const starElements = [star1Ref.current, star2Ref.current];
            starElements.forEach((el) => {
                if (el) {
                    gsap.fromTo(el,
                        { opacity: 0 },
                        {
                            opacity: 1,
                            duration: 0.8,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: el,
                                scroller: "#promo-scroll-container",
                                start: "top 90%",
                                end: "bottom 10%",
                                toggleActions: "play reverse play reverse",
                                markers: false
                            }
                        }
                    );
                }
            });
        });

        return () => {
            ctx.revert();
        };
    }, [shouldRender, svgTextRef.current]);

    useEffect(() => {
        setIsMounted(true);
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openPromoModal', handleOpen);
        return () => window.removeEventListener('openPromoModal', handleOpen);
    }, []);

    // Фото товара наверху — меняется каждые 2 секунды, пока модалка открыта
    useEffect(() => {
        if (!shouldRender) return;
        const interval = setInterval(() => {
            setTopPhotoIndex((i) => (i + 1) % TOP_PHOTOS.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [shouldRender]);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.classList.add('promo-modal-open');
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            const timer = setTimeout(() => setAnimateIn(true), 50);
            return () => clearTimeout(timer);
        } else {
            setAnimateIn(false);
            window.dispatchEvent(new Event('forceHideScrollToTop'));
            document.body.classList.remove('promo-modal-open');
            const timer = setTimeout(() => {
                setShouldRender(false);
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted || !shouldRender) return null;

    const marqueeItems = Array(12).fill('→ ДРОП → СВЕЖИЙ → МОКРЫЙ');

    return (
        <div
            className={`fixed inset-0 z-[1000] h-[100dvh] w-full bg-[#222222] overflow-hidden transition-transform duration-500 ease-in-out ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
        >
            {/* Close Button — текст в шрифте/размере меню (Header NavItem: 14px/text-sm, normal) */}
            <button
                onClick={() => setIsOpen(false)}
                onMouseEnter={(e) => gsap.to(e.currentTarget.querySelector('.close-x-icon'), { rotate: 90, scale: 1.2, opacity: 1, duration: 0.5, ease: "back.out(1.5)" })}
                onMouseLeave={(e) => gsap.to(e.currentTarget.querySelector('.close-x-icon'), { rotate: 0, scale: 1, opacity: 0.8, duration: 0.4, ease: "power3.out" })}
                className="absolute top-[10px] right-[15px] md:top-[20px] md:right-[30px] z-[5000] outline-none border border-[#a8a8a8]/50 rounded-none bg-transparent flex items-center gap-[8px] cursor-pointer px-[14px] py-[10px]"
            >
                <span className="text-[14px] lg:text-sm font-normal tracking-normal text-[#a8a8a8]" style={{ fontFamily: 'Inter, sans-serif' }}>свернуть</span>
                <span className="close-x-icon block text-[16px] font-normal text-[#a8a8a8] opacity-80">✕</span>
            </button>

            {/* Scrolling Container */}
            <div
                id="promo-scroll-container"
                className="w-full h-full overflow-y-auto overflow-x-hidden relative overscroll-none"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'transform'
                }}
            >
                <main
                    className="w-full min-h-[100dvh]"
                    style={{
                        background: '#222222',
                        /* background: 'linear-gradient(180deg, #fbbcb6 0%, #000000ff 20%, #FF0000 35%, #000000ff 45%, #4a0000 75%, #000000 85%)' */
                    }}
                >
                    {/* Top Photo — h-[100dvh] минус высота бегущей строки ниже (56px), чтобы
                        строка была видна сразу на первом экране, без скролла. dvh сама
                        подстраивается под реальную видимую высоту экрана (в т.ч. с учётом
                        скрывающейся адресной строки на мобильных) — без JS-замеров. */}
                    <div className="w-full h-[calc(100dvh-56px)] min-h-[300px] relative">
                        <img src={TOP_PHOTOS[topPhotoIndex]} alt="Cards" className="w-full h-full object-cover" />
                        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] flex flex-col items-center justify-center z-10 pointer-events-none">
                            <svg viewBox="0 0 1305.63 913.63" className="absolute inset-0 w-full h-full -rotate-[125deg] scale-[2.3] pointer-events-none">
                                <path
                                    d="M1305.63,94.14c-509.51,283.07-550.91,374.44-188.61,416.24-362.31-41.81-432.31,26.79-318.91,312.51-113.4-285.72-202.73-265.8-406.93,90.74,204.2-356.54,118.33-377.2-391.18-94.14,509.51-283.07,550.91-374.44,188.61-416.24,362.31,41.81,432.31-26.79,318.91-312.51C620.92,376.46,710.24,356.54,914.45,0c-204.2,356.54-118.33,377.2,391.18,94.14Z"
                                    fill="transparent"
                                    stroke="#e2fd6f"
                                    strokeWidth="15"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Бегущая строка — обычный блок в потоке (не fixed/sticky): изначально
                        стоит прямо под фото, как футер первого экрана, а при скролле уезжает
                        вверх вместе с остальным контентом, никуда не прилипая. */}
                    <div className="w-full h-[56px] bg-[#222222] overflow-hidden flex items-center">
                        <div className="flex whitespace-nowrap animate-marquee gap-x-[14px]" style={{ animationDuration: '300s' }}>
                            {marqueeItems.map((text, idx) => (
                                <span key={idx} className="text-[22px] font-normal uppercase tracking-wide" style={{ color: '#a8a8a8' }}>
                                    {text}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Central Block (Capsule) */}
                    <div className="relative w-full px-6 mt-[80px] flex flex-col items-center">
                        <div className="relative w-[90vw] max-w-[400px] lg:w-[95vw] lg:max-w-[1700px]">
                            <div className="w-full bg-transparent flex flex-col pt-[-20px] pb-16 z-10 relative min-h-[300px]">
                                <div className="lg:mx-auto lg:w-full lg:max-w-[900px]">
                                    <h2 ref={titleRef} className="text-[#a8a8a8] font-bold text-[20px] lg:text-[28px] leading-[1.3] text-left relative z-10 mx-[20px] lg:mx-0 lg:w-full">
                                        Набор открыток
                                    </h2>
                                    <p ref={descRef} className="mt-[50px] text-[#a8a8a8] text-[20px] lg:text-[28px] leading-[1.3] font-normal text-left relative z-10 mx-[20px] lg:mx-0 lg:max-w-[720px]">
                                        Коллекция открыток «Горит сарай — гори и хата». В наборе 10 штук формата 7 х 10.5 см. Всё уже упаковано и ready to gift: можно подарить весь сет целиком или раздарить поштучно.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Стрелка-разделитель в пустом пространстве между описанием и фото ниже —
                        выровнена по левому краю текста (тот же контейнер, что у заголовка/описания) */}
                    <div className="w-full px-6 flex justify-center">
                        <div className="w-[90vw] max-w-[400px] lg:w-[95vw] lg:max-w-[1700px]">
                            <div className="lg:mx-auto lg:w-full lg:max-w-[900px]">
                                <BookmarkIcon className="w-[60px] h-auto ml-[20px] lg:ml-[220px]" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Block */}
                    <div className="w-full mt-[-60px] lg:mt-[-20px] px-6 flex flex-col items-center pb-16">
                        <ScrollSequenceAnimation className="relative z-50 w-full flex justify-center -mt-[200px] -mb-[320px]" />
                        <p ref={textTargetRef} className="text-[#a8a8a8] font-normal text-center text-[18px] leading-[1.2] max-w-[280px] mb-24 relative z-20">
                            Lorem ipsum<br />dolor sit amet,<br />consectetuer<br />adipiscing elit, sed<br />diam nonummy nibh<br />euismod tincidunt ut<br />laoreet dolore<br />magna aliquam<br />erat volutpat.<br />Ut wisi
                        </p>

                        <div className="relative w-[360px] h-[360px] flex items-center justify-center mt-[180px]">
                            {/* Blurred glow circle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-[#e2fd6f] rounded-full blur-[70px] opacity-30 z-0 pointer-events-none"></div>

                            <img src="/ST_01.svg" alt="Star 3" className="absolute inset-0 w-full h-full scale-[2.5] z-10 pointer-events-none" />
                            <div className="absolute inset-0 z-10 flex items-center justify-center mix-blend-exclusion pointer-events-none">
                                <div className="relative w-[180px] h-[180px] flex items-center justify-center pointer-events-auto">
                                    <ModalLogoAnimation />
                                </div>
                            </div>
                            <div className="absolute w-[240px] h-[240px] rounded-full pointer-events-none z-20" style={{ border: '4px solid #e2fd6f', boxShadow: '0 0 20px 2px #e2fd6f, inset 0 0 20px 2px #e2fd6f' }}></div>
                            <div ref={flyingTextRef} className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                                <svg ref={svgTextRef} viewBox="0 0 360 360" className="w-full h-full overflow-visible pointer-events-none">
                                    <defs>
                                        <path id="full-circle-path" d="M 55 180 A 125 125 0 0 1 305 180 A 125 125 0 0 1 55 180" fill="transparent" />
                                    </defs>
                                    <text className="font-normal text-[15.4px] uppercase tracking-widest">
                                        <textPath href="#full-circle-path" startOffset="0%" textAnchor="start">
                                            Welome to other world  ✧  Welome to other world  ✧  Welome to other world  ✧
                                        </textPath>
                                    </text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Content below the photo (Fixing the ghost tails) */}
                    <div className="w-full flex flex-col items-center justify-center z-20 relative pb-[150px] -mt-[70px]">
                        <Link03Animation className="w-full flex justify-center mb-0" />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setTimeout(() => router.push('/product/prj_01'), 500);
                            }}
                            className="-mt-[130px] flex items-center justify-center gap-[10px] w-max px-[22px] h-[55px] font-mono text-[14px] lg:text-[15px] text-[#a8a8a8] bg-transparent border-none outline-none cursor-pointer transition-opacity duration-300 hover:opacity-70 no-underline pointer-events-auto relative z-[150]"
                        >
                            <span>→</span>
                            <span>Подробнее</span>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};
