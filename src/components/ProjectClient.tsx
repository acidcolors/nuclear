'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { products as localProducts } from '@/data/products';
import { TransitionLink } from '@/components/TransitionLink';
import Image from 'next/image';

interface ProjectClientProps {
    initialProducts?: any[];
}

export default function ProjectClient({ initialProducts }: ProjectClientProps) {
    const [products, setProducts] = useState<any[]>(initialProducts || []);
    const [selectedTag, setSelectedTag] = useState('ALL');
    const [isLoading, setIsLoading] = useState(!initialProducts);
    const containerRef = useRef<HTMLDivElement>(null);

    // Если данные не пришли пропсом, берем локальные (или ждем, если isLoading)
    const displayProducts = useMemo(() => {
        const base = products.length > 0 ? products : localProducts;
        if (selectedTag === 'ALL') return base;
        return base.filter((p: any) => p.tags?.includes(selectedTag));
    }, [products, selectedTag]);

    const tags = useMemo(() => {
        const base = products.length > 0 ? products : localProducts;
        const allTags = base.flatMap((p: any) => p.tags || []);
        return ['ALL', ...Array.from(new Set(allTags))];
    }, [products]);

    // GSAP Анимация при смене тега или загрузке
    useEffect(() => {
        if (!containerRef.current) return;
        
        const cards = containerRef.current.querySelectorAll('.product-card');
        gsap.fromTo(cards, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', overwrite: true }
        );
    }, [displayProducts]);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#efefef] text-[#111] pt-[120px] pb-[100px] px-[6vw] md:px-[60px]">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row gap-[60px]">
                    
                    {/* Левая панель: Теги */}
                    <div className="lg:w-[250px] shrink-0">
                        <h1 className="text-[32px] md:text-[40px] font-bold tracking-tighter mb-8">Projects</h1>
                        <div className="flex flex-wrap lg:flex-col gap-3">
                            {tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`text-left text-[14px] font-bold tracking-widest uppercase transition-all duration-300 outline-none border-none bg-transparent cursor-pointer
                                        ${selectedTag === tag ? 'opacity-100' : 'opacity-30 hover:opacity-60'}
                                    `}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Сетка товаров */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-[30px] gap-y-[50px]">
                            {displayProducts.map((product) => (
                                <TransitionLink 
                                    key={product.id} 
                                    href={`/product/${product.id}`}
                                    className="product-card group block no-underline text-[#111]"
                                >
                                    <div className="relative aspect-[4/5] bg-[#e3e3e3] overflow-hidden mb-4 shadow-sm">
                                        <Image 
                                            src={product.notionImages?.[0] || `/projects/${product.id}/main.jpg`} 
                                            alt={product.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        {product.price === 'SOLD' && (
                                            <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                                Sold Out
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-[18px] font-bold tracking-tight mb-1">{product.title}</h3>
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-[12px] font-bold uppercase tracking-widest">{product.tags?.[0]}</span>
                                        <span className="text-[14px] font-medium">{product.price}{!isNaN(Number(product.price)) && ' ₽'}</span>
                                    </div>
                                </TransitionLink>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
