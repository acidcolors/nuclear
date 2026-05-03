'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import gsap from 'gsap';
// Импортируем нашу обновленную базу и хелперы
import { products, getProductById, getGalleryImagePaths } from '../../../data/products';
import { TransitionLink } from '../../../components/TransitionLink';
import { Lightbox } from '../../../components/ui/Lightbox';
import { ShareModal } from '../../../components/ui/ShareModal';
import { getNotionProducts } from '../../../lib/notion';
import { CMS_CONFIG } from '../../../config/cmsSwitch';

export default function ProductPage() {
    const params = useParams<{ id: string }>();

    const productId = params.id ? params.id.toLowerCase() : 'prj_01';

    const [notionData, setNotionData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    const product = CMS_CONFIG.USE_NOTION ? (notionData ? {
        ...notionData,
        // Если в Notion не указан folderId, используем заглушку
        folderId: notionData.folderId || 'notion_fallback'
    } : undefined) : baseProduct;

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
            const staggerEls = document.querySelectorAll('.animate-stagger');
            if (staggerEls.length > 0) {
                gsap.fromTo(
                    Array.from(staggerEls),
                    { y: 15, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }
                );
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
    }, []);

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

                        <div className="flex items-center gap-[15px] w-full">
                            {/* Новая кнопка "Написать" */}
                            <a
                                href="https://t.me/ВАША_ГРУППА" // <-- Вставьте сюда ссылку на вашу группу
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-[10px] w-auto px-[24px] h-[55px] rounded-[16px] text-[18px] font-medium transition-all duration-300 outline-none border-none cursor-pointer bg-[#dddddd] text-[#111] hover:text-white hover:bg-[#ff6d6d] no-underline"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                                <span style={{ transform: 'translateY(1px)' }}>Написать</span>
                            </a>

                            {/* Ваша оригинальная кнопка "Поделиться" */}
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="flex items-center justify-center gap-[10px] w-auto px-[24px] h-[55px] rounded-[16px] text-[18px] font-medium transition-all duration-300 outline-none border-none cursor-pointer bg-[#dddddd] text-[#111] hover:text-white hover:bg-[#ff6d6d]"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span style={{ transform: 'translateY(1px)' }}>Поделиться</span>
                            </button>
                        </div>

                        <TransitionLink
                            href="/project"
                            className="hidden lg:block opacity-90 hover:opacity-50 transition-opacity outline-none border-none bg-transparent self-start mt-[60px] z-10"
                        >
                            <img
                                src="/label_03.svg"
                                alt="Back to projects"
                                className="block w-[180px] h-auto object-contain"
                            />
                        </TransitionLink>

                    </div>
                </div>

                <div
                    ref={rightContentRef}
                    className="pointer-events-auto shrink-0 relative w-full h-auto px-[6vw] md:px-[60px] pb-[10vh] lg:absolute lg:top-[150px] lg:left-[35%] lg:w-[65%] lg:p-[4vw] lg:pt-0 box-border"
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
                            className="block lg:hidden opacity-90 hover:opacity-50 transition-opacity outline-none border-none bg-transparent self-start mt-[60px] mb-[60px] z-[10]"
                        >
                            <img
                                src="/label_03.svg"
                                alt="Back to projects"
                                className="block w-[180px] h-auto object-contain"
                            />
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