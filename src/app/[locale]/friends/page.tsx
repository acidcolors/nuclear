'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TransitionLink } from '@/components/TransitionLink';
import gsap from 'gsap';
import { getNotionFriendsData } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';
import { useTranslations } from 'next-intl';

export default function FriendsPage() {
    const t = useTranslations('Contact');
    const containerRef = useRef<HTMLDivElement>(null);
    const starLeftRef = useRef<HTMLDivElement>(null);
    const crossRef = useRef<HTMLSpanElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    const [friendsData, setFriendsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [friendsDescData, setFriendsDescData] = useState<string | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        setTimeout(() => {
            setLoading(false);
        }, 50);

        if (CMS_CONFIG.USE_NOTION) {
            Promise.all([
                getNotionFriendsData(),
                import('@/lib/notion').then(m => m.getNotionContactData()) // Загружаем и Контакты тоже, т.к. текст может быть там
            ])
                .then(([friends, contacts]) => {
                    setFriendsData(friends);
                    // Ищем строку с названием "Discription" или "Friends" в Контактах
                    const contactDesc = contacts.find((c: any) => c.title && (c.title.toLowerCase().includes('discription') || c.title.toLowerCase().includes('description') || c.title.toLowerCase().includes('friend')));
                    if (contactDesc && contactDesc.description) {
                        // Если нашли, сохраняем в отдельный стейт
                        setFriendsDescData(contactDesc.description);
                    }
                })
                .catch(err => console.error("Ошибка Notion Friends/Contacts:", err))
                .finally(() => setIsFetchingData(false));
        } else {
            setIsFetchingData(false);
        }

        let ctx = gsap.context(() => {
            // Вращение убрано по просьбе
        }, containerRef);

        return () => {
            ctx.revert();
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        // ИЗМЕНЕНИЕ: Теперь мы строго ждем, пока isFetchingData не станет false.
        // Элементы остаются прозрачными (opacity-0), пока Notion не отдаст данные.
        if (loading || isFetchingData || !containerRef.current) return;

        requestAnimationFrame(() => {
            const allTargets = Array.from(containerRef.current!.querySelectorAll(".animate-stagger"));
            const newTargets = allTargets.filter(el => {
                const htmlEl = el as HTMLElement;
                return !htmlEl.style.opacity;
            });

            if (newTargets.length === 0) return;

            // Как только данные получены, сетка уже построена на экране (но она прозрачная).
            // GSAP берет ВСЕ элементы (лого, текст, крестик) и красиво выводит их каскадом.
            gsap.context(() => {
                gsap.to(newTargets, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.1,
                    ease: "power4.out",
                    overwrite: true
                });
            }, containerRef);
        });
    }, [loading, isFetchingData]);

    const handleMouseEnter = () => {
        if (crossRef.current) {
            gsap.to(crossRef.current, { rotate: 90, scale: 1.2, opacity: 1, duration: 0.5, ease: "back.out(1.5)" });
        }
    };

    const handleMouseLeave = () => {
        if (crossRef.current) {
            gsap.to(crossRef.current, { rotate: 0, scale: 1, opacity: 0.4, duration: 0.4, ease: "power3.out" });
        }
    };

    const starConfig = isMobile ? {
        width: '300vw',
        height: '300vw',
        top: '-50vw',
        left: '-30vw'
    } : {
        width: '1600px',
        height: '1600px',
        top: '-300px',
        left: '-300px'
    };

    const StarSVG = () => (
        <svg viewBox="0 0 1305.63 913.63" className="w-full h-full -rotate-[125deg]">
            <path
                d="M1305.63,94.14c-509.51,283.07-550.91,374.44-188.61,416.24-362.31-41.81-432.31,26.79-318.91,312.51-113.4-285.72-202.73-265.8-406.93,90.74,204.2-356.54,118.33-377.2-391.18-94.14,509.51-283.07,550.91-374.44,188.61-416.24,362.31,41.81,432.31-26.79,318.91-312.51C620.92,376.46,710.24,356.54,914.45,0c-204.2,356.54-118.33,377.2,391.18,94.14Z"
                fill="transparent"
                stroke="#ddff12"
                strokeWidth="15"
            />
        </svg>
    );

    return (
        <main ref={containerRef} className="fixed inset-0 w-full h-[100dvh] bg-[#efefef] text-[#111] overflow-hidden z-[60]">

            <div className="fixed inset-0 pointer-events-none z-[61] overflow-visible">
                <div
                    ref={starLeftRef}
                    className="absolute select-none flex items-center justify-center"
                    style={{
                        color: '#f5b3ff',
                        width: starConfig.width,
                        height: starConfig.height,
                        top: starConfig.top,
                        left: starConfig.left
                    }}
                >
                    <StarSVG />
                </div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center z-[62]">
                <div className="w-[84vw] max-w-[500px] flex flex-col items-center text-center">

                    <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-4 pb-10 pt-2 px-2">
                        {isFetchingData ? null : (() => {
                            const descriptionText = friendsData.find(f => f.text && f.text.trim() !== '')?.text
                                || t('friendsDesc');

                            const logosData = friendsData.filter(f => f.image || (f.name && f.name.toLowerCase() !== 'discription' && f.name.toLowerCase() !== 'description' && f.name.trim() !== ''));

                            return logosData.length > 0 ? (
                                logosData.map((friend) => {
                                    const lowerName = friend.name.toLowerCase();
                                    let imageSrc = friend.image;

                                    if (!imageSrc) {
                                        if (lowerName.includes('books')) imageSrc = '/logos/books.svg';
                                        else if (lowerName.includes('gutenberg')) imageSrc = '/logos/gutenberg.svg';
                                    }

                                    let href = friend.url;
                                    if (href && !href.startsWith('http')) href = `https://${href}`;

                                    const content = (
                                        <div className="w-full h-full relative">
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt={friend.name}
                                                    className="w-full h-full object-contain transition-all duration-300 grayscale brightness-[0.2] group-hover:brightness-[0.5]"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#d9d9d9] rounded-lg flex items-center justify-center text-[10px] font-bold opacity-40 uppercase text-center p-2">NO IMG<br />{friend.name}</div>
                                            )}
                                        </div>
                                    );

                                    return href ? (
                                        <a href={href} target="_blank" rel="noopener noreferrer" key={friend.id} className="animate-stagger opacity-0 translate-y-5 aspect-square flex flex-col items-center justify-center p-[10%] lg:p-[20%] transition-all duration-300 hover:scale-110 group block outline-none">
                                            {content}
                                        </a>
                                    ) : (
                                        <div key={friend.id} className="animate-stagger opacity-0 translate-y-5 aspect-square flex flex-col items-center justify-center p-[10%] lg:p-[20%] transition-all duration-300 hover:scale-110 group">
                                            {content}
                                        </div>
                                    );
                                })
                            ) : (
                                [
                                    { src: '/logos/books.svg', alt: 'Books' },
                                    { src: '/logos/gutenberg.svg', alt: 'Gutenberg' }
                                ].map((logo, i) => (
                                    <div key={i} className="animate-stagger opacity-0 translate-y-5 aspect-square flex items-center justify-center p-[15%] lg:p-[25%] transition-all duration-300 hover:scale-105">
                                        <img
                                            src={logo.src}
                                            alt={logo.alt}
                                            className="w-full h-full object-contain"
                                            style={{ filter: 'grayscale(1) brightness(0.2)' }}
                                        />
                                    </div>
                                ))
                            );
                        })()}
                    </div>

                    <div className="animate-stagger opacity-0 translate-y-5 w-full max-w-[400px]">
                        <p className="text-[17px] md:text-[20px] font-medium leading-[1.3] text-[#111] opacity-90 mb-12">
                            {friendsDescData || friendsData.find(f => f.text && f.text.trim() !== '')?.text || t('friendsDesc')}
                        </p>
                    </div>

                    <div className="animate-stagger opacity-0 translate-y-5">
                        <div
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <TransitionLink
                                href="/contact"
                                className="outline-none border-none bg-transparent flex items-center justify-center cursor-pointer p-[20px] no-underline"
                            >
                                <span ref={crossRef} className="block text-[32px] font-light text-[#111] opacity-40 select-none">✕</span>
                            </TransitionLink>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}