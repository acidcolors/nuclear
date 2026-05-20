'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { products as localProducts } from '@/data/products';
import { TransitionLink } from '@/components/TransitionLink';
import { useCart } from '@/app/store/useCart';
import { useSupport } from '@/app/store/useSupport';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { getNotionProducts, getNotionMainPageData } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';
import { useTranslations } from 'next-intl';

interface ProjectPageClientProps {
    initialProducts?: any[] | null;
    initialHeader?: any | null;
    forcedLoading?: boolean;
}

const getPreviewImagePath = (folderId: string) => {
    return `/product/${folderId}/main_${folderId}.jpg`;
};

export default function ProjectPageClient({ initialProducts, initialHeader, forcedLoading = false }: ProjectPageClientProps) {
    const t = useTranslations('Projects');
    const tProduct = useTranslations('Product');
    const rightContentRef = useRef<HTMLDivElement>(null);
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const scrollState = useRef({ current: 0, target: 0 });
    const [contentHeight, setContentHeight] = useState(0);
    const [isDesktop, setIsDesktop] = useState(false);
    const { items, addItem, removeItem, setIsOpen: setIsCartOpen } = useCart();
    const { items: supportItems, addItem: addSupportItem, removeItem: removeSupportItem, setIsOpen: setIsSupportOpen } = useSupport();
    const [supportStatus, setSupportStatus] = useState<Record<string, 'added' | 'removed' | null>>({});

    const [activeFilter, setActiveFilter] = useState('All');
    const [hoveredTagIndex, setHoveredTagIndex] = useState<number | null>(null);

    // СОСТОЯНИЯ ЗАГРУЗКИ (Двойной замок)
    const [notionData, setNotionData] = useState<any[] | null>(initialProducts || null);
    const [headerData, setHeaderData] = useState<any | null>(initialHeader || null);
    const [isDataLoaded, setIsDataLoaded] = useState(!!initialProducts);
    const [isPreloaderFinished, setIsPreloaderFinished] = useState(true); // Для текстовой заглушки не ждем анимацию
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

    const [addedStatus, setAddedStatus] = useState<Record<string, 'added' | 'removed' | null>>({});

    // Общий флаг загрузки: ждем данные И хотя бы часть картинок
    const itemsToWaitFor = 2; // Ждем первые 2 картинки для быстрого старта
    const imagesLoadedCount = Object.values(loadedImages).filter(Boolean).length;
    
    // Определяем, когда можно открывать страницу
    const isReadyToShow = isDataLoaded && (
        !notionData || notionData.length === 0 || imagesLoadedCount >= Math.min(notionData.length, itemsToWaitFor)
    );

    // Основной стейт, который видит UI
    const [isLoading, setIsLoading] = useState(true);
    const mountTimeRef = useRef(Date.now());

    // 1. СТРАХОВКА: Принудительное скрытие через 2 секунды (если что-то пошло не так)
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            console.log("Loading hidden by safety timer (2s fallback)");
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(safetyTimer);
    }, []);

    // 2. Обычное скрытие по готовности + МИНИМУМ 1500мс
    useEffect(() => {
        if (isReadyToShow) {
            const timeElapsed = Date.now() - mountTimeRef.current;
            const remainingTime = Math.max(0, 1500 - timeElapsed);

            const t = setTimeout(() => {
                setIsLoading(false);
            }, remainingTime);

            return () => clearTimeout(t);
        }
    }, [isReadyToShow]);

    useEffect(() => {
        let isMounted = true;

        if (initialProducts) {
            setIsDataLoaded(true);
            return;
        }

        if (!CMS_CONFIG.USE_NOTION) {
            setIsDataLoaded(true);
            return;
        }

        async function fetchData() {
            try {
                const [productsData, mainPageData] = await Promise.all([
                    getNotionProducts(),
                    getNotionMainPageData()
                ]);

                if (isMounted) {
                    setNotionData(productsData);
                    setHeaderData(mainPageData);
                    setIsDataLoaded(true);
                }
            } catch (err) {
                console.error("Notion Fetch Error:", err);
                if (isMounted) setIsDataLoaded(true); // Все равно пускаем дальше с локальными данными
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [initialProducts]);

    const allProducts = useMemo(() => {
        let items: any[] = CMS_CONFIG.USE_NOTION ? [] : [...localProducts];
        if (CMS_CONFIG.USE_NOTION && notionData) {
            notionData.forEach(notionItem => {
                items.push({
                    ...notionItem,
                    folderId: notionItem.folderId || 'notion_fallback'
                });
            });
        }
        const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
        return uniqueItems;
    }, [notionData]);

    const filters = useMemo(() => {
        const rawTags: string[] = [];
        allProducts.forEach(product => {
            if (product.tags && Array.isArray(product.tags)) {
                rawTags.push(...product.tags);
            }
        });
        const uniqueTags = Array.from(new Set(rawTags.filter(t => t && t !== 'All' && t !== 'Все')));
        uniqueTags.sort((a, b) => a.localeCompare(b));
        return ['All', ...uniqueTags];
    }, [allProducts]);

    const rawTitle = (CMS_CONFIG.USE_NOTION && headerData?.title) ? headerData.title : '';
    const headerTitle = (rawTitle && rawTitle !== 'Продукты') ? rawTitle : t('title');
    const headerDescription = (CMS_CONFIG.USE_NOTION && headerData?.description) ? headerData.description : "Здесь собраны все наши проекты: актуальные вещи в наличии и архивные работы. По любым вопросам — пишите в директ.";

    const filteredProducts = useMemo(() => {
        if (activeFilter === 'All') return allProducts;
        return allProducts.filter((p: any) => p.tags && p.tags.some((tag: string) => tag === activeFilter));
    }, [allProducts, activeFilter]);

    useEffect(() => {
        if (!isLoading) {
            requestAnimationFrame(() => {
                gsap.fromTo(".animate-stagger", 
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: "power2.out"
                    }
                );
            });
        }
        return () => {
            gsap.killTweensOf(".animate-stagger");
        };
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading && filteredProducts.length > 0) {
            requestAnimationFrame(() => {
                gsap.fromTo(".product-card-wrapper",
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: "power2.out",
                        overwrite: true
                    }
                );
            });
        }
        return () => {
            gsap.killTweensOf(".product-card-wrapper");
        };
    }, [isLoading, activeFilter, filteredProducts.length]);

    useEffect(() => {
        const checkDesktop = () => {
            const d = window.innerWidth > 1440;
            setIsDesktop(d);
            if (!d) {
                if (rightContentRef.current) gsap.set(rightContentRef.current, { clearProps: 'all' });
                if (leftPanelRef.current) gsap.set(leftPanelRef.current, { clearProps: 'all' });
                scrollState.current.current = 0;
                scrollState.current.target = 0;
            }
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    useEffect(() => {
        if (!isDesktop) return;
        const ctx = gsap.context(() => {
            let rightContentBaseY = 0;
            const renderTick = () => {
                scrollState.current.current = gsap.utils.interpolate(
                    scrollState.current.current,
                    scrollState.current.target,
                    0.08
                );
                const currentScrollRaw = scrollState.current.current;
                if (rightContentRef.current) {
                    rightContentBaseY = rightContentRef.current.offsetTop;
                    gsap.set(rightContentRef.current, { y: -currentScrollRaw });
                }
                if (leftPanelRef.current) {
                    const isFixed = window.getComputedStyle(leftPanelRef.current).position === 'fixed';
                    if (!isFixed) {
                        gsap.set(leftPanelRef.current, { y: -currentScrollRaw });
                    } else {
                        gsap.set(leftPanelRef.current, { y: 0 });
                    }
                }
                if (rightContentRef.current) {
                    const viewportH = window.innerHeight;
                    const cards = rightContentRef.current.querySelectorAll('.product-card');
                    cards.forEach((cardEl) => {
                        const card = cardEl as HTMLElement;
                        const screenY = rightContentBaseY + card.offsetTop - currentScrollRaw;
                        const cardH = card.offsetHeight;
                        const triggerEnter = viewportH - (cardH * 0.15);
                        const triggerLeave = -(cardH * 0.25);
                        if (screenY < triggerEnter && screenY > triggerLeave) {
                            if (!card.classList.contains('in-view')) {
                                card.classList.add('in-view');
                                gsap.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
                            }
                        } else {
                            if (card.classList.contains('in-view')) {
                                card.classList.remove('in-view');
                                gsap.to(card, { opacity: 0, y: 60, scale: 0.95, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
                            }
                        }
                    });
                }
            };
            gsap.ticker.add(renderTick);
            return () => { gsap.ticker.remove(renderTick); };
        });
        const resizeObserver = new ResizeObserver(() => {
            let h = 0;
            if (rightContentRef.current) h += rightContentRef.current.offsetHeight;
            if (leftPanelRef.current) {
                const isFixed = window.getComputedStyle(leftPanelRef.current).position === 'fixed';
                if (!isFixed) h += leftPanelRef.current.offsetHeight;
            }
            setContentHeight(h + 100);
        });
        if (rightContentRef.current) resizeObserver.observe(rightContentRef.current);
        if (leftPanelRef.current) resizeObserver.observe(leftPanelRef.current);
        return () => {
            ctx.revert();
            resizeObserver.disconnect();
        };
    }, [isDesktop]);

    return (
        <main id="project-main-container" className={`fixed top-0 left-0 w-full h-[100dvh] bg-[#efefef] text-[#111] z-[60] ${isDesktop ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>

            {isLoading && (
                <div className="fixed top-0 left-0 w-full h-[100dvh] z-[100] flex items-center justify-center bg-[#efefef]">
                    <span className="text-[12px] font-bold tracking-widest text-[#111] opacity-40 animate-pulse">
                        loading.
                    </span>
                </div>
            )}

            {isDesktop && (
                <div
                    id="project-scroll-track"
                    className="absolute top-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar z-20 pointer-events-auto w-full lg:left-[35%] lg:w-[65%]"
                    onScroll={(e) => { scrollState.current.target = e.currentTarget.scrollTop; }}
                >
                    <div style={{ height: contentHeight }} className="w-[1px] pointer-events-none opacity-0" />
                </div>
            )}

            <div
                className={`${isDesktop ? 'absolute h-full pointer-events-none' : 'relative h-auto pointer-events-auto'} top-0 left-0 w-full overflow-visible z-30 flex flex-col lg:block`}
                onWheel={isDesktop ? (e) => {
                    const scrollDiv = document.getElementById('project-scroll-track');
                    if (scrollDiv) scrollDiv.scrollTop += e.deltaY;
                } : undefined}
            >
                <div
                    ref={leftPanelRef}
                    className="flex flex-col justify-start lg:justify-center pointer-events-auto z-40 shrink-0 relative w-full h-auto pt-[12vh] pb-[8vh] px-[6vw] md:pt-[20vh] md:pb-[10vh] md:px-[60px] lg:fixed lg:top-0 lg:left-0 lg:w-[35%] lg:h-[100dvh] lg:py-[6vh] lg:px-[4vw] box-border opacity-0 animate-stagger"
                >
                    <div className="flex flex-col w-full max-w-[100%] lg:max-w-[90%] my-auto lg:m-auto">
                        <h2 className="text-[32px] md:text-[40px] lg:text-[3.5vw] font-bold tracking-tighter leading-none mb-6 text-[#111]">
                            {headerTitle}
                        </h2>

                        <p className="text-[20px] md:text-lg lg:text-[1.2vw] font-medium leading-[1.6] text-[#111] opacity-90 mb-12">
                            {headerDescription}
                        </p>

                        <div
                            className="flex flex-wrap items-center gap-[10px] mt-[30px] -ml-[10px] pl-[10px] py-[10px]"
                            onMouseLeave={() => setHoveredTagIndex(null)}
                        >
                            {filters.map((tag, index) => {
                                const isActive = activeFilter === tag;
                                const label = tag === 'All' ? t('all') : tag;
                                let bgTextClass = isActive ? 'bg-[#d1d1d1] text-[#111]' : 'bg-[#f4f4f4] text-[#111]';
                                let opacityClass = isActive ? 'opacity-100' : 'opacity-80';
                                let transformClass = 'translate-x-0 scale-100 z-0';

                                if (hoveredTagIndex !== null) {
                                    if (index === hoveredTagIndex) {
                                        transformClass = 'scale-[1.1] z-10';
                                        opacityClass = 'opacity-100';
                                    } else if (index < hoveredTagIndex) {
                                        transformClass = '-translate-x-[15px] scale-95 z-0';
                                        opacityClass = 'opacity-40';
                                    } else if (index > hoveredTagIndex) {
                                        transformClass = 'translate-x-[15px] scale-95 z-0';
                                        opacityClass = 'opacity-40';
                                    }
                                }

                                return (
                                    <a
                                        key={tag}
                                        onMouseEnter={() => setHoveredTagIndex(index)}
                                        onClick={() => {
                                            setActiveFilter(tag);
                                            const scrollDiv = document.getElementById('project-scroll-track');
                                            if (scrollDiv) scrollDiv.scrollTop = 0;
                                        }}
                                        className={`p-[15px] rounded-[6px] text-[14px] md:text-[24px] font-extrabold tracking-tight shadow-sm flex items-center justify-center leading-none m-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer select-none block shrink-0 ${bgTextClass} ${opacityClass} ${transformClass}`}
                                    >
                                        {label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div
                    ref={rightContentRef}
                    className="pointer-events-auto shrink-0 relative w-full h-auto px-[6vw] md:px-[60px] pb-[6vh] lg:absolute lg:top-[150px] lg:left-[35%] lg:w-[65%] lg:p-[4vw] lg:pt-0 box-border overflow-hidden lg:overflow-visible"
                >
                    <div className="max-w-[1200px] mx-auto w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-[25px] lg:gap-[20px] w-full">

                            {filteredProducts.map((product: any) => {
                                const previewImage = (product.notionImages && product.notionImages.length > 0)
                                    ? product.notionImages[0]
                                    : getPreviewImagePath(product.folderId);
                                return (
                                    <div key={product.id} className="product-card-wrapper opacity-0 translate-y-[30px]">
                                        <TransitionLink
                                            href={`/product/${product.id}`}
                                            className="product-card cursor-pointer group relative bg-[#e3e3e3] aspect-square overflow-hidden shadow-sm w-full block"
                                        >
                                            <div className="absolute top-[0px] md:top-[20px] left-[20px] z-10 flex flex-wrap items-center pointer-events-none pr-[20px]" style={{ columnGap: '10px', rowGap: '2px' }}>
                                                {product.title && (
                                                    <h3 className="bg-[#f4f4f4] h-[34px] md:h-[40px] px-[10px] md:px-[14px] rounded-[8px] text-[13px] md:text-[24px] font-extrabold tracking-tight text-[#111] shadow-sm flex items-center justify-center leading-none m-0 whitespace-nowrap">
                                                        {product.title}
                                                    </h3>
                                                )}

                                                {product.price && (
                                                    <h3 className="bg-[#f4f4f4] h-[34px] md:h-[40px] px-[12px] md:px-[18px] rounded-[8px] text-[13px] md:text-[24px] font-extrabold tracking-tight text-[#111] shadow-sm flex items-center justify-center leading-none m-0 whitespace-nowrap">
                                                        {!isNaN(Number(product.price.toString().replace(/\s/g, ''))) ? `${product.price} ₽` : product.price}
                                                    </h3>
                                                )}

                                                {(() => {
                                                    const isSoldOut = product.price === 'SOLD' || product.price === 'Распродано';
                                                    const isInCart = items.some(item => item.id === product.id);
                                                    const isInSupport = supportItems.some(item => item.id === product.id);

                                                    return (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();

                                                                if (isSoldOut) {
                                                                    if (isInSupport) {
                                                                        removeSupportItem(product.id);
                                                                        setSupportStatus(prev => ({ ...prev, [product.id]: 'removed' }));
                                                                    } else {
                                                                        addSupportItem({
                                                                            id: product.id,
                                                                            title: product.title,
                                                                            price: product.price,
                                                                            image: previewImage,
                                                                            quantity: 1
                                                                        });
                                                                        setSupportStatus(prev => ({ ...prev, [product.id]: 'added' }));
                                                                        setIsSupportOpen(true);
                                                                    }

                                                                    setTimeout(() => {
                                                                        setSupportStatus(prev => ({ ...prev, [product.id]: null }));
                                                                    }, 2000);
                                                                    return;
                                                                }

                                                                if (isInCart) {
                                                                    removeItem(product.id);
                                                                    setAddedStatus(prev => ({ ...prev, [product.id]: 'removed' }));
                                                                } else {
                                                                    addItem({
                                                                        id: product.id,
                                                                        title: product.title,
                                                                        price: typeof product.price === 'string' ? parseInt(product.price.replace(/\s/g, '')) : product.price,
                                                                        image: previewImage,
                                                                        quantity: 1
                                                                    });
                                                                    setAddedStatus(prev => ({ ...prev, [product.id]: 'added' }));
                                                                }

                                                                setTimeout(() => {
                                                                    setAddedStatus(prev => ({ ...prev, [product.id]: null }));
                                                                }, 2000);
                                                            }}
                                                            className={`h-[34px] w-[34px] md:h-[40px] md:w-[40px] rounded-[8px] flex items-center justify-center text-[#111] shadow-sm transition-all duration-500 pointer-events-auto border-none cursor-pointer group/cart active:scale-95 relative overflow-hidden ${isSoldOut
                                                                    ? (supportStatus[product.id] === 'added' || (isInSupport && supportStatus[product.id] !== 'removed') ? 'bg-[#4ade80]' : 'bg-[#f4f4f4] hover:bg-[#ffffff]')
                                                                    : (!isSoldOut && (addedStatus[product.id] === 'added' || (isInCart && addedStatus[product.id] !== 'removed')) ? 'bg-[#4ade80]' : 'bg-[#f4f4f4] hover:bg-[#ffffff]')
                                                                }`}
                                                        >
                                                            <div className="relative w-5 h-5 flex items-center justify-center">
                                                                {isSoldOut ? (
                                                                    <>
                                                                        <Plus
                                                                            size={20}
                                                                            className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${supportStatus[product.id] === 'added'
                                                                                    ? 'opacity-100 scale-100 rotate-0'
                                                                                    : 'opacity-0 scale-50 rotate-90'
                                                                                }`}
                                                                        />
                                                                        <Minus
                                                                            size={20}
                                                                            className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${supportStatus[product.id] === 'removed'
                                                                                    ? 'opacity-100 scale-100 rotate-0'
                                                                                    : 'opacity-0 scale-50 rotate-90'
                                                                                }`}
                                                                        />
                                                                        <img
                                                                            src="/edit_chat.svg"
                                                                            alt="Уведомить"
                                                                            className={`w-5 h-5 absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${supportStatus[product.id]
                                                                                    ? 'opacity-0 scale-50'
                                                                                    : 'opacity-100 scale-100 group-hover/cart:scale-110'
                                                                                }`}
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus
                                                                            size={20}
                                                                            className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${addedStatus[product.id] === 'added'
                                                                                    ? 'opacity-100 scale-100 rotate-0'
                                                                                    : 'opacity-0 scale-50 rotate-90'
                                                                                }`}
                                                                        />
                                                                        <Minus
                                                                            size={20}
                                                                            className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${addedStatus[product.id] === 'removed'
                                                                                    ? 'opacity-100 scale-100 rotate-0'
                                                                                    : 'opacity-0 scale-50 rotate-90'
                                                                                }`}
                                                                        />
                                                                        <ShoppingBag
                                                                            size={20}
                                                                            className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${addedStatus[product.id]
                                                                                    ? 'opacity-0 scale-50'
                                                                                    : 'opacity-100 scale-100 group-hover/cart:scale-110'
                                                                                }`}
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })()}
                                            </div>

                                            {product.edition && (
                                                <div className="absolute bottom-[0px] left-[20px] z-10 pointer-events-none">
                                                    <h3 className="bg-[#f4f4f4] h-[34px] md:h-[40px] px-[11px] md:px-[16px] rounded-[8px] text-[13px] md:text-[24px] font-extrabold tracking-tight text-[#111] shadow-sm flex items-center justify-center leading-none m-0 whitespace-nowrap">
                                                        {tProduct('edition')} {product.edition}
                                                    </h3>
                                                </div>
                                            )}

                                            <div className="relative w-full h-full overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-[1.1]">
                                                <Image
                                                    src={previewImage}
                                                    alt={product.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 400px"
                                                    className="object-cover drop-shadow-lg"
                                                    onLoad={() => {
                                                        setLoadedImages(prev => ({ ...prev, [product.id]: true }));
                                                    }}
                                                />
                                            </div>
                                        </TransitionLink>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
