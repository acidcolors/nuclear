'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lottie from 'lottie-react';
import logoAnimationData from '@/data/logo_t.json';
import upAnimationData from '@/data/up.json';

const unbounded = localFont({
    src: '../../public/fonts/Unbounded-Variable.woff2',
    variable: '--font-unbounded',
});
const playfair = localFont({
    src: [
        { path: '../../public/fonts/PlayfairDisplay-Variable.woff2', style: 'normal' },
        { path: '../../public/fonts/PlayfairDisplay-Italic-Variable.woff2', style: 'italic' },
    ],
    variable: '--font-playfair',
});

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
    const lottieArrowRef = useRef<any>(null);
    const arrowDirectionRef = useRef<number>(1);

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

    const marqueeItems = Array(12).fill('✸ ДРОП ✸ СВЕЖИЙ ✸ МОКРЫЙ ');

    return (
        <div
            className={`fixed inset-0 z-[1000] h-[100dvh] w-full bg-[#a8a8a8] overflow-hidden transition-transform duration-500 ease-in-out ${animateIn ? 'translate-y-0' : 'translate-y-full'} ${unbounded.className}`}
        >
            {/* Close Button */}
            <button
                onClick={() => setIsOpen(false)}
                onMouseEnter={(e) => gsap.to(e.currentTarget.firstChild, { rotate: 90, scale: 1.2, opacity: 1, duration: 0.5, ease: "back.out(1.5)" })}
                onMouseLeave={(e) => gsap.to(e.currentTarget.firstChild, { rotate: 0, scale: 1, opacity: 0.8, duration: 0.4, ease: "power3.out" })}
                className="absolute top-[45px] right-[15px] md:top-[60px] md:right-[30px] z-[5000] outline-none border-none bg-transparent flex items-center justify-center cursor-pointer p-[15px]"
            >
                <span className="block text-[36px] font-black text-[#e2fd6f] opacity-80" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>✕</span>
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
                        background: '#a8a8a8',
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
                        <div className="flex whitespace-nowrap animate-marquee">
                            {marqueeItems.map((text, idx) => (
                                <span key={idx} className={`text-[22px] italic font-normal uppercase tracking-wide ${playfair.className}`} style={{ color: '#a8a8a8' }}>
                                    {text}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Central Block (Capsule) */}
                    <div className="relative w-full px-6 mt-[80px] flex flex-col items-center">
                        <div className="relative w-[90vw] max-w-[400px] lg:w-[95vw] lg:max-w-[1700px]">
                            <div className="w-full bg-transparent flex flex-col pt-[-20px] pb-16 z-10 relative min-h-[300px] lg:min-h-[750px]">
                                <h2 ref={titleRef} className="text-[#222222] font-bold text-[20px] lg:text-[28px] leading-[1.3] text-left relative z-10 mx-[20px] lg:mx-0 lg:w-full">
                                    Набор открыток
                                </h2>
                                <p ref={descRef} className="mt-[50px] text-[#222222] text-[20px] lg:text-[28px] leading-[1.3] font-normal text-left relative z-10 mx-[20px] lg:mx-0 lg:max-w-[720px]">
                                    Коллекция открыток «Горит сарай — гори и хата». В наборе 10 штук формата 7 х 10.5 см. Всё уже упаковано и ready to gift: можно подарить весь сет целиком или раздарить поштучно.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Block */}
                    <div className="w-full mt-8 lg:mt-32 px-6 flex flex-col items-center pb-16">
                        <ScrollSequenceAnimation className="relative z-50 w-full flex justify-center -mt-[200px] -mb-[320px]" />
                        <p ref={textTargetRef} className="text-[#222222] font-normal text-center text-[18px] leading-[1.2] max-w-[280px] mb-24 relative z-20">
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
                            className={`-mt-[50px] flex items-center justify-center gap-[10px] w-max px-[22px] h-[55px] rounded-[15px] text-[17px] font-normal transition-all duration-300 outline-none border-none cursor-pointer bg-[#d9d9d9] text-[#111] hover:text-black hover:bg-[#ffffff] no-underline pointer-events-auto relative z-[150] ${unbounded.className}`}
                        >
                            <span style={{ transform: 'translateY(1px)' }}>Подробнее</span>
                        </button>

                        {/* Scroll to top button (Custom Lottie) */}
                        <button
                            onClick={() => {
                                const container = document.getElementById('promo-scroll-container');
                                if (container) {
                                    container.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className="mt-[90px] flex items-center justify-center w-[100px] md:w-[120px] lg:w-[150px] cursor-pointer z-[150] transition-transform duration-300 hover:scale-110 active:scale-95 outline-none border-none bg-transparent"
                            aria-label="Наверх"
                        >
                            <div className="w-full h-auto [&_path]:!fill-[#e2fd6f] [&_path]:!stroke-[#e2fd6f]">
                                <Lottie
                                    lottieRef={lottieArrowRef}
                                    animationData={upAnimationData}
                                    loop={false}
                                    autoplay={true}
                                    onComplete={() => {
                                        setTimeout(() => {
                                            if (lottieArrowRef.current) {
                                                arrowDirectionRef.current = arrowDirectionRef.current === 1 ? -1 : 1;
                                                lottieArrowRef.current.setDirection(arrowDirectionRef.current);
                                                lottieArrowRef.current.play();
                                            }
                                        }, 500);
                                    }}
                                />
                            </div>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};
