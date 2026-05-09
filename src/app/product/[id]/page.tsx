'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import gsap from 'gsap';
import Lottie from 'lottie-react';
import backAnimationData from '@/data/back.json';
// Импортируем нашу обновленную базу и хелперы
import { products, getProductById, getGalleryImagePaths } from '@/data/products';
import { TransitionLink } from '@/components/TransitionLink';
import { Lightbox } from '@/components/ui/Lightbox';
import { ShareModal } from '@/components/ui/ShareModal';
import { getNotionProducts } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';
import { useCart } from '@/app/store/useCart';
import { ShoppingBag, Check } from 'lucide-react';

const BackAnimation = () => {
    const lottieRef = useRef<any>(null);

    // Защита: если данных нет, показываем обычную картинку
    if (!backAnimationData || !backAnimationData.layers) {
        return <img src="/label_03.svg" alt="Back" className="w-[180px] h-auto" />;
    }

    return (
        <div 
            className="w-[180px] h-auto cursor-pointer"
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
            <Lottie 
                lottieRef={lottieRef}
                animationData={backAnimationData} 
                loop={false}
                autoplay={false}
            />
        </div>
    );
};

export default function ProductPage() {
    const params = useParams<{ id: string }>();

    const productId = params.id ? params.id.toLowerCase() : 'prj_01';

    const [notionData, setNotionData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredBtnIndex, setHoveredBtnIndex] = useState<number | null>(null);
    const { addItem, setIsOpen, items } = useCart();
    
    // Button states
    const [isAddedRecently, setIsAddedRecently] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!CMS_CONFIG.USE_NOTION) {
            setIsLoading(false);
            return;
        }
        async function fetchData() {
            try {
                const allNotion = await getNotionProducts();
                const current = allNotion.find((p: any) => p.id === productId);
                if (current) setNotionData(current);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [productId]);

    const baseProduct = getProductById(productId);

    // В режиме Notion мы доверяем ТОЛЬКО данным из таблицы.
    // В статичном режиме — только локальному файлу.
    const product = useMemo(() => {
        return CMS_CONFIG.USE_NOTION ? (notionData ? {
            ...notionData,
            // Если в Notion не указан folderId, используем заглушку
            folderId: notionData.folderId || 'notion_fallback'
        } : undefined) : baseProduct;
    }, [notionData, baseProduct]);

    const isInCart = items.some(item => item.id === product?.id);

    // GSAP Animation for Button State
    useEffect(() => {
        if (!buttonRef.current) return;
        
        let bgColor = '#dddddd';
        let textColor = '#111111';

        if (isAddedRecently) {
            bgColor = 'transparent'; 
            textColor = '#111111';
        } else if (isInCart) {
            bgColor = '#dcfce7'; // Светло-зеленый (green-100)
            textColor = '#166534'; // Темно-зеленый текст для контраста
        }

        gsap.to(buttonRef.current, {
            backgroundColor: bgColor,
            color: textColor,
            duration: 0.3,
            ease: "power2.inOut"
        });
    }, [isAddedRecently, isInCart]);

    // Генерируем массив путей к картинкам
    const galleryPhotos = useMemo(() => {
        if (!product) return [];
        if (CMS_CONFIG.USE_NOTION && notionData && notionData.notionImages && notionData.notionImages.length > 0) {
            return notionData.notionImages;
        }
        return getGalleryImagePaths(product.folderId, product.galleryImagesCount);
    }, [product, notionData]);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);

    const contentHeightRef = useRef<HTMLDivElement>(null);

    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightContentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollState = useRef({ target: 0, current: 0 });
    const cursorPos = useRef({ x: 0, y: 0 });
    const isDesktopRef = useRef(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const hasAnimatedRef = useRef(false);

    // Порог для кастомного скролла (>1440px)
    useEffect(() => {
        const check = () => {
            const d = window.innerWidth > 1440;
            setIsDesktop(d);
            isDesktopRef.current = d;
        };
        check();
        window.addEventListener('resize', check);

        // Отключаем бленд-мод на мобилках для этой страницы, чтобы не блокировать клики
        document.documentElement.classList.add('disable-blend-on-mobile');

        return () => {
            window.removeEventListener('resize', check);
            document.documentElement.classList.remove('disable-blend-on-mobile');
        };
    }, []);

    // На <=1440px: сбрасываем GSAP-трансформы
    useEffect(() => {
        if (!isDesktop) {
            if (leftPanelRef.current) gsap.set(leftPanelRef.current, { clearProps: 'all' });
            if (rightContentRef.current) gsap.set(rightContentRef.current, { clearProps: 'all' });
        }
    }, [isDesktop]);

    useEffect(() => {
        let renderTick: () => void;

        let ctx = gsap.context(() => {
            if (!hasAnimatedRef.current) {
                const staggerEls = document.querySelectorAll('.animate-stagger');
                if (staggerEls.length > 0) {
                    gsap.fromTo(
                        Array.from(staggerEls),
                        { y: 15, opacity: 0 },
                        { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }
                    );
                    hasAnimatedRef.current = true;
                }
            }

            renderTick = () => {
                // На <=1440px — пропускаем кастомный скролл
                if (!isDesktopRef.current) return;

                scrollState.current.current += (scrollState.current.target - scrollState.current.current) * 0.08;
                const currentScrollRaw = scrollState.current.current;

                if (rightContentRef.current) gsap.set(rightContentRef.current, { y: -currentScrollRaw });

                if (leftPanelRef.current) {
                    const isFixed = window.getComputedStyle(leftPanelRef.current).position === 'fixed';
                    if (!isFixed) {
                        gsap.set(leftPanelRef.current, { y: -currentScrollRaw });
                    } else {
                        gsap.set(leftPanelRef.current, { y: 0 });
                    }
                }
            };

            gsap.ticker.add(renderTick);
        }, containerRef);

        const handleMouseMove = (e: MouseEvent) => {
            cursorPos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        const resizeObserver = new ResizeObserver(() => {
            let h = 0;
            if (rightContentRef.current) h += rightContentRef.current.offsetHeight;
            if (leftPanelRef.current) {
                const isFixed = window.getComputedStyle(leftPanelRef.current).position === 'fixed';
                if (!isFixed) h += leftPanelRef.current.offsetHeight;
            }
            if (contentHeightRef.current) {
                contentHeightRef.current.style.height = `${h + 200}px`;
            }
        });

        if (rightContentRef.current) resizeObserver.observe(rightContentRef.current);
        if (leftPanelRef.current) resizeObserver.observe(leftPanelRef.current);

        return () => {
            ctx.revert();
            if (renderTick) gsap.ticker.remove(renderTick);
            window.removeEventListener('mousemove', handleMouseMove);
            resizeObserver.disconnect();
        };
    }, [product, isDesktop]);

    // Предотвращаем рендер, если продукт почему-то не найден
    if (!product) return null;

    // Заглушка загрузки для динамических товаров (которых нет в статике)
    const isStaticProduct = products.some(p => p.id === productId);
    if (CMS_CONFIG.USE_NOTION && !isStaticProduct && isLoading) {
        return (
            <div className="fixed top-0 left-0 w-full h-[100dvh] bg-[#efefef] z-[100] flex items-center justify-center">
                <span className="text-[12px] font-bold tracking-widest text-[#111] opacity-40 animate-pulse">
                    Loading
                </span>
            </div>
        );
    }

    return (
        <div id="product-main-container" ref={containerRef} className={`fixed top-0 left-0 w-full h-[100dvh] bg-[#efefef] text-[#111] z-[60] ${isDesktop ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>

            {isDesktop && (
                <div
                    id="product-scroll-track"
                    className="absolute top-0 left-0 w-full h-full overflow-y-auto custom-scrollbar z-20 pointer-events-auto"
                    onScroll={(e) => { scrollState.current.target = e.currentTarget.scrollTop; }}
                >
                    <div ref={contentHeightRef} className="w-px pointer-events-none opacity-0" />
                </div>
            )}

            <div
                className={`${isDesktop ? 'absolute h-full pointer-events-none' : 'relative h-auto pointer-events-auto'} top-0 left-0 w-full overflow-visible z-30 flex flex-col lg:block`}
                onWheel={isDesktop ? (e) => {
                    const scrollDiv = document.getElementById('product-scroll-track');
                    if (scrollDiv) scrollDiv.scrollTop += e.deltaY;
                } : undefined}
            >
                <div
                    ref={leftPanelRef}
                    className="product-left-panel flex flex-col justify-start lg:justify-center pointer-events-auto z-40 shrink-0 relative w-full h-auto pt-[12vh] pb-[8vh] px-[6vw] md:pt-[20vh] md:pb-[10vh] md:px-[60px] lg:fixed lg:top-0 lg:left-0 lg:w-[35%] lg:h-[100dvh] lg:py-[6vh] lg:px-[4vw] box-border"
                >
                    <div className="animate-stagger flex flex-col w-full max-w-[100%] lg:max-w-[90%] my-auto lg:m-auto">

                        <h2 className="text-[32px] md:text-[40px] lg:text-[3.5vw] font-bold tracking-tighter leading-none mb-[20px] text-[#111]">
                            {product.title}
                        </h2>

                        <h3 className="inline-block bg-[#f4f4f4] px-[18px] py-[8px] rounded-[8px] text-[#111] font-bold text-[22px] mb-[30px] self-start shadow-sm">
                            {product.price && !isNaN(Number(product.price.toString().replace(/\s/g, ''))) ? `${product.price} ₽` : product.price}
                        </h3>

                        <p className="text-[20px] md:text-lg lg:text-[1.2vw] font-medium leading-[1.6] opacity-90 mb-[50px] text-[#111]">
                            {product.description}
                        </p>

                        <div className="flex flex-col gap-1 mb-[50px]">
                            <span className="text-[11px] font-bold tracking-widest opacity-40 uppercase text-[#111]">Детали проекта</span>
                            {product.size && <span className="text-[14px] font-bold opacity-80 mt-2 text-[#111]">Размер: {product.size}</span>}
                            {product.material && <span className="text-[14px] font-bold opacity-80 text-[#111]">Материал: {product.material}</span>}
                            {product.year && <span className="text-[14px] font-bold opacity-80 text-[#111]">Год: {product.year}</span>}
                            {product.role && <span className="text-[14px] font-bold opacity-80 text-[#111]">Разработка: {product.role}</span>}
                        </div>

                        <div
                            className="flex items-center gap-[15px] w-full"
                            onMouseLeave={() => setHoveredBtnIndex(null)}
                        >
                            {/* Кнопка "В корзину" (вместо "Написать") */}
                            <div
                                className="flex-1"
                                style={{
                                    opacity: hoveredBtnIndex === 1 ? 0.6 : 1,
                                    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
                                }}
                                onMouseEnter={() => setHoveredBtnIndex(0)}
                                onMouseLeave={() => setHoveredBtnIndex(null)}
                            >
                                <button
                                    ref={buttonRef}
                                    style={{ 
                                        backgroundColor: isAddedRecently ? 'transparent' : (isInCart ? '#dcfce7' : '#dddddd'),
                                        color: (isInCart && !isAddedRecently) ? '#166534' : '#111111'
                                    }}
                                    onClick={() => {
                                        if (!isInCart) {
                                            addItem({
                                                id: product.id,
                                                title: product.title,
                                                price: product.price,
                                                quantity: 1,
                                                image: galleryPhotos[0]
                                            });
                                            setIsAddedRecently(true);
                                            setTimeout(() => setIsAddedRecently(false), 1500);
                                        } else {
                                            setIsOpen(true);
                                        }
                                    }}
                                    className="relative flex items-center justify-center w-full h-[55px] rounded-[16px] text-[16px] md:text-[18px] font-medium transition-all duration-300 outline-none border-none cursor-pointer no-underline whitespace-nowrap shadow-sm active:scale-[0.95] overflow-hidden"
                                >
                                    {/* Layer 1: Default */}
                                    <div 
                                        className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                            ${!isInCart && !isAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
                                        `}
                                    >
                                        <ShoppingBag size={18} />
                                        <span style={{ transform: 'translateY(1px)' }}>В корзину</span>
                                    </div>

                                    {/* Layer 2: Added Recently (Transparent state) */}
                                    <div 
                                        className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                            ${isAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                                        `}
                                    >
                                        <Check size={18} />
                                        <span style={{ transform: 'translateY(1px)' }}>Добавлено</span>
                                    </div>

                                    {/* Layer 3: In Cart (Green state) */}
                                    <div 
                                        className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                            ${isInCart && !isAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
                                        `}
                                    >
                                        <ShoppingBag size={18} />
                                        <span style={{ transform: 'translateY(1px)' }}>В корзине</span>
                                    </div>
                                </button>
                            </div>

                            {/* Ваша оригинальная кнопка "Поделиться" */}
                            <div
                                className="flex-1"
                                style={{
                                    opacity: hoveredBtnIndex === 0 ? 0.6 : 1,
                                    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
                                }}
                                onMouseEnter={() => setHoveredBtnIndex(1)}
                                onMouseLeave={() => setHoveredBtnIndex(null)}
                            >
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="flex items-center justify-center gap-[8px] w-full px-[10px] h-[55px] rounded-[16px] text-[16px] md:text-[18px] font-medium transition-all duration-300 outline-none border-none cursor-pointer bg-[#dddddd] text-[#111] hover:text-white hover:bg-[#ffffff] whitespace-nowrap active:scale-[0.95]"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    <span style={{ transform: 'translateY(1px)' }}>Поделиться</span>
                                </button>
                            </div>
                        </div>

                        <TransitionLink
                            href="/project"
                            className="hidden lg:block opacity-90 hover:opacity-50 transition-opacity outline-none border-none bg-transparent self-start mt-[10px] z-10"
                        >
                            <BackAnimation />
                        </TransitionLink>

                    </div>
                </div>

                <div
                    ref={rightContentRef}
                    className="pointer-events-auto shrink-0 relative w-full h-auto px-[6vw] md:px-[60px] pb-[6vh] lg:absolute lg:top-[150px] lg:left-[35%] lg:w-[65%] lg:p-[4vw] lg:pt-0 box-border"
                >
                    <div className="max-w-[1200px] mx-auto w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px] lg:gap-[20px] w-full">
                            {/* Рендерим галерею, используя новый сгенерированный массив galleryPhotos */}
                            {galleryPhotos.map((src: string, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => setFullscreenIdx(index)}
                                    className="cursor-pointer group relative bg-[#e3e3e3] aspect-square overflow-hidden shadow-sm w-full"
                                >
                                    <div className="w-full h-full flex items-center justify-center transition-transform duration-700 ease group-hover:scale-[1.05]">
                                        <Image src={src} alt={`${product.title} photo ${index + 1}`} width={800} height={800} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Кнопка Back для мобилок и айпадов (появляется ПОСЛЕ фото) */}
                        <TransitionLink
                            href="/project"
                            className="block lg:hidden opacity-90 hover:opacity-50 transition-opacity outline-none border-none bg-transparent self-start mt-[10px] mb-[60px] z-[10]"
                        >
                            <BackAnimation />
                        </TransitionLink>
                    </div>
                </div>
            </div>

            <Lightbox
                photos={galleryPhotos}
                currentIndex={fullscreenIdx}
                setCurrentIndex={setFullscreenIdx}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
            />
        </div>
    );
}