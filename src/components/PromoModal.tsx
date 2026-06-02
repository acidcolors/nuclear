'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Unbounded, Playfair_Display } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lottie from 'lottie-react';
import logoAnimationData from '@/data/logo_t.json';

const unbounded = Unbounded({ subsets: ['cyrillic', 'latin'], weight: ['400', '500', '700', '900'] });
const playfair = Playfair_Display({ subsets: ['cyrillic', 'latin'], weight: ['400', '700'], style: ['normal', 'italic'] });

// Global cache to prevent React StrictMode (Dev Mode) from loading images twice,
// and to keep images in memory instantly available when the modal opens.
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
            // Removed img.decode() because firing 200+ decodes synchronously freezes mobile Safari/Chrome.
            // Let the canvas decode them lazily upon first draw.
            imageCache.set(src, img);
            images.push(img);
        }
    }
    return images;
};

const BoxAnimation = ({ className }: { className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);

    useEffect(() => {
        const frames = 181;
        imagesRef.current = preloadImageSequence('/animation/Link01/SA01_', frames, '_R.webp');

        let frame = 0;
        let animationId: number;
        let lastTime = performance.now();
        const fps = 30;
        const interval = 1000 / fps;
        
        let isVisible = true;
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        });
        if (canvasRef.current) observer.observe(canvasRef.current);

        const loop = (time: number) => {
            animationId = requestAnimationFrame(loop);
            
            if (!isVisible) return; // ПРОПУСКАЕМ ОТРИСОВКУ, ЕСЛИ НЕ В КАДРЕ
            
            const delta = time - lastTime;
            if (delta > interval) {
                lastTime = time - (delta % interval);
                
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                const img = imagesRef.current[frame];
                
                if (canvas && ctx && img && img.complete) {
                    if (canvas.width !== img.width && img.width > 0) {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                frame = (frame + 1) % frames;
            }
        };
        animationId = requestAnimationFrame(loop);
        
        return () => {
            cancelAnimationFrame(animationId);
            if (canvasRef.current) observer.unobserve(canvasRef.current);
            observer.disconnect();
            imagesRef.current = []; // Free memory to avoid leaks
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ objectFit: 'contain' }}
        />
    );
};

const ScrollSequenceAnimation = ({ className }: { className?: string }) => {
    return (
        <div className={className}>
            <img
                src="/animation/Link02/SA02.webp"
                alt="Static Star Element"
                className="w-[1050px] max-w-[250vw] h-auto object-contain pointer-events-none -translate-y-[50px]"
            />
        </div>
    );
};

const Link03Animation = ({ className }: { className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        imagesRef.current = preloadImageSequence('/animation/Link03/SA03_', 91, '_R.webp');

        if (!containerRef.current || !canvasRef.current) return;

        const obj = { frame: 0 };

        const tween = gsap.to(obj, {
            frame: 90,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                scroller: "#promo-scroll-container",
                start: "top 95%",
                end: "bottom 100%",
                scrub: true,
            },
            onUpdate: () => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                const img = imagesRef.current[Math.round(obj.frame)];

                if (canvas && ctx && img && img.complete) {
                    if (canvas.width !== img.width && img.width > 0) {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
            }
        });

        // Refresh triggers after the modal slide-up transition finishes (500ms + buffer)
        const timeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 550);

        return () => {
            clearTimeout(timeout);
            if (tween.scrollTrigger) tween.scrollTrigger.kill();
            tween.kill();
            imagesRef.current = [];
        };
    }, []);

    return (
        <div ref={containerRef} className={className}>
            <canvas
                ref={canvasRef}
                className="w-[875px] max-w-[200vw] h-auto object-contain pointer-events-none"
            />
        </div>
    );
};

const ModalLogoAnimation = () => {
    const lottieRef = useRef<any>(null);

    return (
        <div
            className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer [&_path]:!fill-[#e2fd6f]"
        >
            <Lottie
                lottieRef={lottieRef}
                animationData={logoAnimationData}
                loop={true}
                autoplay={true}
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
    const svgTextRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (shouldRender && svgTextRef.current) {
            const spinTween = gsap.fromTo(svgTextRef.current,
                { rotation: 0 },
                {
                    rotation: 360,
                    duration: 15,
                    ease: "none",
                    repeat: -1,
                    transformOrigin: "center center"
                }
            );
            return () => {
                spinTween.kill();
            };
        }
    }, [shouldRender]);

    useEffect(() => {
        setIsMounted(true);
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openPromoModal', handleOpen);
        return () => window.removeEventListener('openPromoModal', handleOpen);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';

            // Wait for the component to render before triggering the slide-up transition
            const timer = setTimeout(() => setAnimateIn(true), 50);
            return () => clearTimeout(timer);
        } else {
            setAnimateIn(false);
            window.dispatchEvent(new Event('forceHideScrollToTop'));
            const timer = setTimeout(() => {
                setShouldRender(false);
                document.body.style.overflow = '';
            }, 500); // Wait for transition
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted || !shouldRender) return null;

    const marqueeItems = Array(12).fill('✸ ДРОП ✸ СВЕЖИЙ ✸ МОКРЫЙ ');

    return (
        <div
            className={`fixed inset-0 z-[1000] h-[100dvh] w-full bg-black overflow-hidden transition-transform duration-500 ease-in-out ${animateIn ? 'translate-y-0' : 'translate-y-full'} ${unbounded.className}`}
        >
            {/* Close Button */}
            <button
                onClick={() => setIsOpen(false)}
                onMouseEnter={(e) => gsap.to(e.currentTarget.firstChild, { rotate: 90, scale: 1.2, opacity: 1, duration: 0.5, ease: "back.out(1.5)" })}
                onMouseLeave={(e) => gsap.to(e.currentTarget.firstChild, { rotate: 0, scale: 1, opacity: 0.8, duration: 0.4, ease: "power3.out" })}
                className="absolute top-[15px] right-[15px] md:top-[30px] md:right-[30px] z-[5000] outline-none border-none bg-transparent flex items-center justify-center cursor-pointer p-[15px]"
            >
                <span className="block text-[36px] font-black text-[#e2fd6f] opacity-80" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>✕</span>
            </button>

            {/* Scrolling Container isolated from Transform */}
            <div
                id="promo-scroll-container"
                className="w-full h-full overflow-y-auto relative"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'transform'
                }}
            >
                <main
                    className="w-full min-h-[100dvh] overflow-x-hidden"
                    style={{
                        background: 'linear-gradient(180deg, #fbbcb6 0%, #000000ff 20%, #FF0000 35%, #000000ff 45%, #4a0000 75%, #000000 85%)'
                    }}
                >
                    {/* Top Photo */}
                    <div className="w-full h-[80dvh] min-h-[300px] relative">
                        <img
                            src="/product/prod_01/image5.jpg"
                            alt="Cards"
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay Star with Text */}
                        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] flex flex-col items-center justify-center z-10 pointer-events-none">
                            <svg
                                viewBox="0 0 1305.63 913.63"
                                className="absolute inset-0 w-full h-full -rotate-[125deg] scale-[2.3] pointer-events-none"
                            >
                                <path
                                    d="M1305.63,94.14c-509.51,283.07-550.91,374.44-188.61,416.24-362.31-41.81-432.31,26.79-318.91,312.51-113.4-285.72-202.73-265.8-406.93,90.74,204.2-356.54,118.33-377.2-391.18-94.14,509.51-283.07,550.91-374.44,188.61-416.24,362.31,41.81,432.31-26.79,318.91-312.51C620.92,376.46,710.24,356.54,914.45,0c-204.2,356.54-118.33,377.2,391.18,94.14Z"
                                    fill="transparent"
                                    stroke="#e2fd6f"
                                    strokeWidth="15"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Sticky Wrapper for Marquee */}
                    <div
                        className="w-full z-[500] self-stretch"
                        style={{ position: 'sticky', top: '0px', WebkitPosition: '-webkit-sticky' } as any}
                    >
                        <div className="w-full bg-[#D9FF00] overflow-hidden py-3 border-y border-black flex items-center">
                            <div className="flex whitespace-nowrap animate-marquee">
                                {marqueeItems.map((text, idx) => (
                                    <span
                                        key={idx}
                                        className={`text-black text-[22px] italic font-bold px-2 uppercase tracking-wide ${playfair.className}`}
                                        style={{ color: 'black' }}
                                    >
                                        {text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Central Block (Capsule) */}
                    <div className="relative w-full px-6 mt-[110px] flex flex-col items-center">

                        {/* Capsule Container with Relative Positioning for Stars */}
                        <div className="relative w-[90vw] max-w-[400px]">

                            {/* The Border (Capsule Shape) separated from text, now as a sibling */}
                            <div className="absolute inset-0 w-full h-full rounded-[220px] border border-[#D9FF00] pointer-events-none z-0" />

                            {/* Animated Dark Box Above Capsule */}
                            <BoxAnimation className="-rotate-[15deg] w-[400px] max-w-none object-contain absolute -top-[220px] left-1/2 -translate-x-1/2 z-20 pointer-events-none" />

                            {/* Container without border */}
                            <div className="w-full bg-transparent flex flex-col pt-[200px] pb-16 z-10 relative min-h-[750px]">
                                <h2 className="text-[#D9FF00] text-[28px] font-black leading-[1.1] text-left relative z-10 mx-[20px]">
                                    Горит Сарай<br />Гори и Хата
                                </h2>

                                <p className="mt-[150px] text-[#D9FF00] text-[20px] leading-[1.3] font-bold text-left relative z-10 mx-[20px]">
                                    Коллекция открыток «Горит сарай — гори и хата». В наборе 10 штук формата 7 х 10.5 см. Всё уже упаковано и ready to gift: можно подарить весь сет целиком или раздарить поштучно.
                                </p>
                            </div>

                            {/* Star 1 - Absolute right, overlapping capsule edge */}
                            <img
                                src="/ST_03.svg"
                                alt="Star 1"
                                className="absolute top-[35%] -translate-y-1/2 -right-[280px] w-[550px] h-[550px] z-20 pointer-events-none"
                            />

                            {/* Star 2 - Absolute bottom, overlapping capsule border */}
                            <img
                                src="/ST_02.svg"
                                alt="Star 2"
                                className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-48 h-48 z-20 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* Bottom Block */}
                    <div className="w-full mt-32 px-6 flex flex-col items-center pb-16">

                        <ScrollSequenceAnimation className="relative z-50 w-full flex justify-center -mt-[100px] -mb-[20px]" />

                        <p className="text-white font-black text-center text-[18px] leading-[1.2] max-w-[280px] mb-24">
                            Lorem ipsum<br />dolor sit amet,<br />consectetuer<br />adipiscing elit, sed<br />diam nonummy nibh<br />euismod tincidunt ut<br />laoreet dolore<br />magna aliquam<br />erat volutpat.<br />Ut wisi
                        </p>

                        <div className="relative w-[360px] h-[360px] flex items-center justify-center mt-[100px]">
                            {/* Giant background star */}
                            <img
                                src="/ST_01.svg"
                                alt="Star 3"
                                className="absolute inset-0 w-full h-full scale-[2.5] z-0 pointer-events-none"
                            />

                            {/* Animated Logo */}
                            <div className="absolute inset-0 z-10 flex items-center justify-center mix-blend-exclusion pointer-events-none">
                                <div className="w-[200px] h-[200px] flex items-center justify-center pointer-events-auto">
                                    <ModalLogoAnimation />
                                </div>
                            </div>

                            {/* Neon Glow Ring (top layer) */}
                            <div
                                className="absolute w-[240px] h-[240px] rounded-full pointer-events-none z-20"
                                style={{
                                    border: '4px solid #e2fd6f',
                                    boxShadow: '0 0 20px 2px #e2fd6f, inset 0 0 20px 2px #e2fd6f'
                                }}
                            ></div>

                            {/* Curved SVG Text along the bottom */}
                            <svg ref={svgTextRef} viewBox="0 0 360 360" className="absolute inset-0 w-full h-full z-20 overflow-visible pointer-events-none">
                                <defs>
                                    {/* Circle Center at 180,180. Radius 135. Sweep 0 draws counter-clockwise (bottom arc from left to right). */}
                                    <path
                                        id="bottom-curve"
                                        d="M 45 180 A 135 135 0 0 0 315 180"
                                        fill="transparent"
                                    />
                                </defs>
                                <text className="fill-black font-black text-[16px] uppercase tracking-widest">
                                    <textPath href="#bottom-curve" startOffset="50%" textAnchor="middle">
                                        Lorem ipsum dolor sit amet
                                    </textPath>
                                </text>
                            </svg>
                        </div>

                        {/* Button styled like contact page */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setTimeout(() => {
                                    router.push('/product/prj_01');
                                }, 500);
                            }}
                            className={`mt-[100px] flex items-center justify-center gap-[10px] w-max px-[22px] h-[55px] rounded-[15px] text-[17px] font-bold transition-all duration-300 outline-none border-none cursor-pointer bg-[#d9d9d9] text-[#111] hover:text-black hover:bg-[#ffffff] no-underline pointer-events-auto relative z-[150] ${unbounded.className}`}
                        >
                            <span style={{ transform: 'translateY(1px)' }}>Подробнее</span>
                        </button>

                        <Link03Animation className="w-full flex justify-center mt-[150px]" />
                    </div>
                </main>
            </div>
        </div>
    );
};
