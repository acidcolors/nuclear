'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import gsap from 'gsap';
// Импортируем нашу обновленную базу и хелперы
import { getProductById, getGalleryImagePaths } from '@/data/products';
import { TransitionLink } from '@/components/TransitionLink';
import { Lightbox } from '@/components/ui/Lightbox';
import { ShareModal } from '@/components/ui/ShareModal';
import { getNotionProducts, getNotionArchiveProducts } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';
import { useCart } from '@/app/store/useCart';
import { useSupport } from '@/app/store/useSupport';
import { ShoppingBag, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/Spinner';

const BackAnimation = () => (
    <span className="flex items-center gap-[10px] font-mono text-[14px] lg:text-[15px] text-[#111]">
        <span>←</span>
        <span>Назад</span>
    </span>
);

export default function ProductPage() {
    const t = useTranslations('Product');
    const params = useParams<{ id: string }>();

    const productId = params.id ? params.id.toLowerCase() : 'prj_01';

    const [notionData, setNotionData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [preloaderDone, setPreloaderDone] = useState(false);
    const mountTimeRef = useRef(Date.now());
    const [hoveredBtnIndex, setHoveredBtnIndex] = useState<number | null>(null);
    const { addItem, setIsOpen, items } = useCart();
    const { items: supportItems, addItem: addSupportItem, removeItem: removeSupportItem, setIsOpen: setIsSupportOpen } = useSupport();
    
    // Button states
    const [isAddedRecently, setIsAddedRecently] = useState(false);
    const [isSupportAddedRecently, setIsSupportAddedRecently] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isArchiveProduct, setIsArchiveProduct] = useState(false);

    useEffect(() => {
        if (!CMS_CONFIG.USE_NOTION) {
            setIsLoading(false);
            setIsArchiveProduct(false);
            if (typeof window !== 'undefined') {
                (window as any).__productArchiveCache = (window as any).__productArchiveCache || {};
                (window as any).__productArchiveCache[productId] = false;
                window.dispatchEvent(new CustomEvent('productOriginDetected', { detail: { isArchive: false } }));
            }
            return;
        }
        async function fetchData() {
            try {
                const [allNotion, allArchive] = await Promise.all([
                    getNotionProducts(),
                    getNotionArchiveProducts()
                ]);
                const current = allNotion.find((p: any) => p.id === productId);
                let isArchived = false;
                if (current) {
                    setNotionData(current);
                    setIsArchiveProduct(false);
                } else {
                    const archiveCurrent = allArchive.find((p: any) => p.id === productId);
                    if (archiveCurrent) {
                        setNotionData(archiveCurrent);
                        setIsArchiveProduct(true);
                        isArchived = true;
                    }
                }
                if (typeof window !== 'undefined') {
                    (window as any).__productArchiveCache = (window as any).__productArchiveCache || {};
                    (window as any).__productArchiveCache[productId] = isArchived;
                    window.dispatchEvent(new CustomEvent('productOriginDetected', { detail: { isArchive: isArchived } }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [productId]);

    // Прелоадер (спиннер) для товаров из Notion: своего тайминга раньше не было
    // (просто ждали isLoading), поэтому используем схему по умолчанию — как на архиве:
    // страховка 2000мс + минимум 1500мс показа.
    useEffect(() => {
        if (!CMS_CONFIG.USE_NOTION) {
            setPreloaderDone(true);
        }
    }, []);

    useEffect(() => {
        if (!CMS_CONFIG.USE_NOTION || !isLoading) return;
        const safetyTimer = setTimeout(() => {
            setPreloaderDone(true);
        }, 2000);
        return () => clearTimeout(safetyTimer);
    }, [isLoading]);

    useEffect(() => {
        if (!CMS_CONFIG.USE_NOTION || isLoading) return;
        const timeElapsed = Date.now() - mountTimeRef.current;
        const remainingTime = Math.max(0, 1500 - timeElapsed);
        const t = setTimeout(() => {
            setPreloaderDone(true);
        }, remainingTime);
        return () => clearTimeout(t);
    }, [isLoading]);

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

    const isSoldOut = useMemo(() => {
        if (!product) return false;
        return product.price === 'SOLD' || product.price === 'Распродано' || product.price === 'SOON' || product.price === 'Скоро';
    }, [product]);

    const isInCart = items.some(item => item.id === product?.id);
    const isInSupport = supportItems.some(item => item.id === product?.id);

    // GSAP Animation for Button State
    useEffect(() => {
        if (!buttonRef.current) return;
        
        let bgColor = 'transparent';
        let textColor = '#111111';
        let borderColor = '#111111';

        if (isSoldOut) {
            if (isSupportAddedRecently) {
                bgColor = 'transparent';
                textColor = '#111111';
                borderColor = '#111111';
            } else if (isInSupport) {
                bgColor = 'transparent';
                textColor = '#166534';
                borderColor = '#166534';
            }
        } else {
            if (isAddedRecently) {
                bgColor = 'transparent';
                textColor = '#111111';
                borderColor = '#111111';
            } else if (isInCart) {
                bgColor = '#111111';
                textColor = '#ebebeb';
                borderColor = '#111111';
            }
        }

        gsap.to(buttonRef.current, {
            backgroundColor: bgColor,
            color: textColor,
            borderColor: borderColor,
            duration: 0.3,
            ease: "power2.inOut"
        });
    }, [isAddedRecently, isInCart, isSupportAddedRecently, isInSupport, isSoldOut]);

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

    // Прелоадер: показываем, пока не пройдёт минимальное время + не придут данные из Notion.
    // Проверяем ДО "!product", иначе товар из Notion всегда попадал бы в return null ниже,
    // ни разу не долетев до этого экрана (product становится доступен только после загрузки).
    if (CMS_CONFIG.USE_NOTION && !preloaderDone) {
        return (
            <div className="fixed top-0 left-0 w-full h-[100dvh] bg-[#efefef] z-[100] flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    // Предотвращаем рендер, если продукт почему-то не найден
    if (!product) return null;

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

                        <h2 className="text-[28px] md:text-[26px] lg:text-[2.275vw] font-bold tracking-tight leading-[1.05] mb-[12px] lg:mb-[20px] text-[#111]">
                            {product.title}
                        </h2>

                        <div className="mb-[36px] lg:mb-[52px]">
                            {product.price && (
                                <h3 className="inline-block bg-[#f4f4f4] px-[12px] py-[5px] md:px-[10.4px] md:py-[3.9px] rounded-[8px] text-[#111] font-normal text-[15px] md:text-[14.3px] self-start shadow-sm mr-[10px]">
                                    {!isNaN(Number(product.price.toString().replace(/\s/g, ''))) ? `${product.price} ₽` : product.price}
                                </h3>
                            )}
                            {product.edition && (
                                <h3 className="inline-block bg-[#f4f4f4] px-[12px] py-[5px] md:px-[10.4px] md:py-[3.9px] rounded-[8px] text-[#111] font-normal text-[15px] md:text-[14.3px] self-start shadow-sm">
                                    {t('edition')} {product.edition}
                                </h3>
                            )}
                        </div>

                        <p className="text-[16px] lg:text-[1vw] font-medium leading-[1.35] lg:leading-[1.5] opacity-90 mb-[25px] lg:mb-[40px] text-[#111]">
                            {product.description}
                        </p>

                        <div className="flex flex-col gap-0.5 mb-[25px] lg:mb-[40px]">
                            <span className="text-[10px] font-normal tracking-widest opacity-40 uppercase text-[#111]">{t('details')}</span>
                            {product.size && <span className="text-[13px] font-normal opacity-80 mt-1.5 text-[#111]">{t('size')} {product.size}</span>}
                            {product.material && <span className="text-[13px] font-normal opacity-80 text-[#111]">{t('material')} {product.material}</span>}
                            {product.year && <span className="text-[13px] font-normal opacity-80 text-[#111]">{t('year')} {product.year}</span>}
                            {product.role && <span className="text-[13px] font-normal opacity-80 text-[#111]">Разработка: {product.role}</span>}
                            {product.edition && <span className="text-[13px] font-normal opacity-80 text-[#111]">{t('edition')} {product.edition}</span>}
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
                                    onClick={() => {
                                        if (isSoldOut) {
                                            if (isInSupport) {
                                                removeSupportItem(product.id);
                                            } else {
                                                addSupportItem({
                                                    id: product.id,
                                                    title: product.title,
                                                    price: product.price,
                                                    image: galleryPhotos[0],
                                                    quantity: 1
                                                });
                                                setIsSupportAddedRecently(true);
                                                setTimeout(() => setIsSupportAddedRecently(false), 1500);
                                                setIsSupportOpen(true);
                                            }
                                            return;
                                        }

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
                                    className="relative flex items-center justify-center w-full h-[42px] text-[14px] font-medium transition-all duration-300 outline-none border cursor-pointer no-underline whitespace-nowrap active:scale-[0.95] overflow-hidden"
                                >
                                    {isSoldOut ? (
                                        <>
                                            {/* Layer 1: Default SOLD */}
                                            <div 
                                                className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                                    ${!isInSupport && !isSupportAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
                                                `}
                                            >
                                                <img src="/edit_chat.svg" alt="Уведомить" className="w-4 h-4" />
                                                <span style={{ transform: 'translateY(1px)' }}>Уведомить</span>
                                            </div>

                                            {/* Layer 2: Added Recently SOLD */}
                                            <div 
                                                className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                                    ${isSupportAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                                                `}
                                            >
                                                <Check size={16} />
                                                <span style={{ transform: 'translateY(1px)' }}>Добавлено</span>
                                            </div>

                                            {/* Layer 3: In Support List SOLD */}
                                            <div 
                                                className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                                    ${isInSupport && !isSupportAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
                                                `}
                                            >
                                                <img src="/chat_support.svg" alt="В списке" className="w-4 h-4" />
                                                <span style={{ transform: 'translateY(1px)' }}>В списке</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Layer 1: Default */}
                                            <div 
                                                className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                                    ${!isInCart && !isAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
                                                `}
                                            >
                                                <ShoppingBag size={16} />
                                                <span style={{ transform: 'translateY(1px)' }}>{t('addToCart')}</span>
                                            </div>

                                            {/* Layer 2: Added Recently (Transparent state) */}
                                            <div 
                                                className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                                    ${isAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                                                `}
                                            >
                                                <Check size={16} />
                                                <span style={{ transform: 'translateY(1px)' }}>Добавлено</span>
                                            </div>

                                            {/* Layer 3: In Cart (dark state) */}
                                            <div 
                                                className={`absolute inset-0 flex items-center justify-center gap-[10px] transition-all duration-300 ease-in-out
                                                    ${isInCart && !isAddedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
                                                `}
                                            >
                                                <ShoppingBag size={16} />
                                                <span style={{ transform: 'translateY(1px)' }}>{t('inCart')}</span>
                                            </div>
                                        </>
                                    )}
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
                                    className="flex items-center justify-center gap-[8px] w-full px-[10px] h-[42px] text-[14px] font-medium transition-opacity duration-300 outline-none border border-[#111] cursor-pointer bg-transparent text-[#111] hover:opacity-60 whitespace-nowrap active:scale-[0.95]"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    <span style={{ transform: 'translateY(1px)' }}>{t('share')}</span>
                                </button>
                            </div>
                        </div>

                        <TransitionLink
                            href={isArchiveProduct ? '/archive' : '/project'}
                            className="hidden lg:block opacity-90 hover:opacity-50 transition-opacity outline-none border-none bg-transparent self-start mt-[50px] z-10"
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

                        {/* Кнопка Back для мобилок и айпадов (появляется ПОСЛЕ фото).
                            mb — vh, а не px, чтобы совпадать с bottom-[14vh]/[3vh] у GlobalScrollToTop
                            (кнопка "наверх"): при упоре страницы вниз обе кнопки на одной высоте. */}
                        <TransitionLink
                            href={isArchiveProduct ? '/archive' : '/project'}
                            className="block lg:hidden opacity-90 hover:opacity-50 transition-opacity outline-none border-none bg-transparent self-start mt-[40px] mb-[8vh] md:-mb-[3vh] z-[10]"
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