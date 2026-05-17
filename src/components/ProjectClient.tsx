'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '@/app/store/useCart';
import { useSupport } from '@/app/store/useSupport';
import { TransitionLink } from '@/components/TransitionLink';

interface ProjectClientProps {
    initialProducts?: any[];
}

export default function ProjectClient({ initialProducts }: ProjectClientProps) {
    const products = initialProducts || [];
    const [activeFilter, setActiveFilter] = useState('Все');
    const [hoveredTagIndex, setHoveredTagIndex] = useState<number | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    
    const { addItem: addCartItem, removeItem: removeCartItem, items: cartItems, setIsOpen: setIsCartOpen } = useCart();
    const { addItem: addSupportItem, removeItem: removeSupportItem, items: supportItems, setIsOpen: setIsSupportOpen } = useSupport();

    const [addedStatus, setAddedStatus] = useState<Record<string, 'added' | 'removed' | null>>({});
    const [supportStatus, setSupportStatus] = useState<Record<string, 'added' | 'removed' | null>>({});

    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightContentRef = useRef<HTMLDivElement>(null);
    const scrollState = useRef({ target: 0, current: 0 });

    const headerTitle = "Продукты";
    const headerDescription = "Здесь собраны все наши проекты: актуальные вещи в наличии и архивные работы. По любым вопросам — пишите в директ.";

    // Фильтры (теги)
    const filters = useMemo(() => {
        const allTags = products.flatMap((p: any) => p.tags || []);
        const uniqueTags = Array.from(new Set(allTags));
        // Переводим теги на русский если нужно, но пока берем как есть
        const translatedTags = uniqueTags.map(t => t === 'Postcards' ? 'Открытки' : t);
        return ['Все', ...translatedTags];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (activeFilter === 'Все') return products;
        return products.filter((p: any) => {
            const translatedTags = (p.tags || []).map((t: string) => t === 'Postcards' ? 'Открытки' : t);
            return translatedTags.includes(activeFilter);
        });
    }, [products, activeFilter]);

    // Анимация при загрузке и смене фильтров
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(".animate-stagger", { 
                opacity: 1, 
                y: 0, 
                duration: 0.8, 
                ease: "power2.out" 
            });

            if (filteredProducts.length > 0) {
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
            }
        });

        return () => {
            gsap.killTweensOf(".animate-stagger");
            gsap.killTweensOf(".product-card-wrapper");
            ctx.revert();
        };
    }, [activeFilter, filteredProducts.length]);

    // Проверка устройства
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

    // GSAP Custom Scroll
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
            return () => gsap.ticker.remove(renderTick);
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
                    className="flex flex-col justify-start lg:justify-center pointer-events-auto z-40 shrink-0 relative w-full h-auto pt-[12vh] pb-[8vh] px-[6vw] md:pt-[20vh] md:pb-[10vh] md:px-[60px] lg:fixed lg:top-0 lg:left-0 lg:w-[35%] lg:h-[100dvh] lg:py-[6vh] lg:px-[4vw] box-border"
                >
                    <div className="animate-stagger opacity-0 translate-y-5 flex flex-col w-full max-w-[100%] lg:max-w-[90%] my-auto lg:m-auto">
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
                            {filters.map((tag, index) => (
                                <button
                                    key={tag}
                                    onClick={() => setActiveFilter(tag)}
                                    onMouseEnter={() => setHoveredTagIndex(index)}
                                    className="relative px-[15px] py-[8px] bg-transparent border-none cursor-pointer outline-none group/tag overflow-hidden"
                                    style={{
                                        opacity: (hoveredTagIndex !== null && hoveredTagIndex !== index) ? 0.4 : 1,
                                        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
                                    }}
                                >
                                    <div className="relative overflow-hidden h-[18px]">
                                        <div className={`transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${activeFilter === tag ? '-translate-y-1/2' : 'group-hover/tag:-translate-y-1/2'}`}>
                                            <span className="text-[14px] font-bold tracking-widest uppercase text-[#111] block h-[18px]">
                                                {tag}
                                            </span>
                                            <span className="text-[14px] font-bold tracking-widest uppercase text-[#111] block h-[18px]">
                                                {tag}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`absolute bottom-0 left-[15px] right-[15px] h-[2px] bg-[#111] transition-transform duration-500 origin-left ${activeFilter === tag ? 'scale-x-100' : 'scale-x-0 group-hover/tag:scale-x-100'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    ref={rightContentRef}
                    className="pointer-events-none shrink-0 relative w-full h-auto px-[6vw] md:px-[60px] pb-[6vh] lg:absolute lg:top-[120px] lg:left-[35%] lg:w-[65%] lg:p-[4vw] lg:pt-0 box-border"
                >
                    <div className="max-w-[1200px] mx-auto w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px] lg:gap-[1.5vw] w-full">
                            {filteredProducts.map((product: any) => {
                                const previewImage = product.notionImages?.[0] || `/projects/${product.id}/main.jpg`;
                                const isSoldOut = product.price === 'SOLD' || product.price === 'Распродано';
                                const isInCart = cartItems.some(item => item.id === product.id);
                                const isInSupport = supportItems.some(item => item.id === product.id);
                                const currentTag = (product.tags?.[0] === 'Postcards' ? 'Открытки' : product.tags?.[0]) || 'Прочее';

                                return (
                                    <div key={product.id} className="product-card-wrapper opacity-0 translate-y-8">
                                        <TransitionLink
                                            href={`/product/${product.id}`}
                                            className="product-card group relative block aspect-[4/5] bg-[#e3e3e3] overflow-hidden shadow-sm pointer-events-auto"
                                        >
                                            {/* Labels (Absolute overlays) */}
                                            <div className="absolute top-[15px] left-[15px] right-[15px] z-20 flex justify-between items-start pointer-events-none">
                                                <div className="flex flex-col gap-1 lg:gap-1.5 items-start">
                                                    <div className="bg-[#f4f4f4] px-3 py-1 lg:px-4 lg:py-1.5 rounded-[8px] shadow-sm backdrop-blur-sm">
                                                        <span className="text-[10px] lg:text-[11px] font-bold tracking-widest uppercase text-[#111] opacity-70 whitespace-nowrap">
                                                            {currentTag}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[#f4f4f4] px-3 py-1.5 lg:px-4 lg:py-2 rounded-[10px] shadow-sm">
                                                        <span className="text-[13px] lg:text-[15px] font-bold tracking-tight text-[#111] whitespace-nowrap">
                                                            {product.price}{!isNaN(Number(product.price)) && ' ₽'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Cart Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (isSoldOut) {
                                                            if (isInSupport) {
                                                                removeSupportItem(product.id);
                                                                setSupportStatus(prev => ({ ...prev, [product.id]: 'removed' }));
                                                            } else {
                                                                addSupportItem({ id: product.id, title: product.title, price: product.price, image: previewImage, quantity: 1 });
                                                                setSupportStatus(prev => ({ ...prev, [product.id]: 'added' }));
                                                                setIsSupportOpen(true);
                                                            }
                                                            setTimeout(() => setSupportStatus(prev => ({ ...prev, [product.id]: null })), 2000);
                                                        } else {
                                                            if (isInCart) {
                                                                removeCartItem(product.id);
                                                                setAddedStatus(prev => ({ ...prev, [product.id]: 'removed' }));
                                                            } else {
                                                                addCartItem({ id: product.id, title: product.title, price: product.price, image: previewImage, quantity: 1 });
                                                                setAddedStatus(prev => ({ ...prev, [product.id]: 'added' }));
                                                                setIsCartOpen(true);
                                                            }
                                                            setTimeout(() => setAddedStatus(prev => ({ ...prev, [product.id]: null })), 2000);
                                                        }
                                                    }}
                                                    className={`h-[40px] w-[40px] rounded-[8px] flex items-center justify-center text-[#111] shadow-sm transition-all duration-500 pointer-events-auto border-none cursor-pointer group/cart active:scale-95 relative overflow-hidden ${
                                                        isSoldOut 
                                                        ? (supportStatus[product.id] === 'added' || (isInSupport && supportStatus[product.id] !== 'removed') ? 'bg-[#4ade80]' : 'bg-[#f4f4f4] hover:bg-[#ffffff]')
                                                        : (!isSoldOut && (addedStatus[product.id] === 'added' || (isInCart && addedStatus[product.id] !== 'removed')) ? 'bg-[#4ade80]' : 'bg-[#f4f4f4] hover:bg-[#ffffff]')
                                                    }`}
                                                >
                                                    <div className="relative w-5 h-5 flex items-center justify-center">
                                                        {isSoldOut ? (
                                                            <>
                                                                <Plus size={20} className={`absolute transition-all duration-500 ${supportStatus[product.id] === 'added' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                                <Minus size={20} className={`absolute transition-all duration-500 ${supportStatus[product.id] === 'removed' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                                <img src="/edit_chat.svg" alt="Support" className={`w-5 h-5 absolute transition-all duration-500 ${supportStatus[product.id] ? 'opacity-0 scale-50' : 'opacity-100 scale-100 group-hover/cart:scale-110'}`} />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus size={20} className={`absolute transition-all duration-500 ${addedStatus[product.id] === 'added' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                                <Minus size={20} className={`absolute transition-all duration-500 ${addedStatus[product.id] === 'removed' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                                <ShoppingBag size={20} className={`absolute transition-all duration-500 ${addedStatus[product.id] ? 'opacity-0 scale-50' : 'opacity-100 scale-100 group-hover/cart:scale-110'}`} />
                                                            </>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="relative w-full h-full overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-[1.1]">
                                                <Image
                                                    src={previewImage}
                                                    alt={product.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 400px"
                                                    className="object-cover drop-shadow-lg"
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
