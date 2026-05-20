'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import InteractiveRelax from '@/components/ui/InteractiveRelax';
import { TransitionLink } from '@/components/TransitionLink';
import { getNotionContactData, getNotionFriendsData } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';
import { useTranslations } from 'next-intl';

// --- УНИФИЦИРОВАННЫЙ МАГНИТНЫЙ КОМПОНЕНТ ---
const UnifiedSocials = ({ items, showFriends }: { items: any[], showFriends: boolean }) => {
    const t = useTranslations('Contact');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Собираем все элементы в один массив
    const allItems = useMemo(() => {
        const socials = items.map(it => ({ ...it, type: 'social' }));
        if (showFriends) {
            return [...socials, { id: 'friends', type: 'button', title: t('friends'), url: '/friends' }];
        }
        return socials;
    }, [items, showFriends, t]);

    if (allItems.length === 0) return null;

    return (
        <div
            className="flex flex-row items-center gap-[10px] md:gap-[20px] lg:gap-[30px] xl:gap-[15px] z-10 w-full flex-wrap pl-0 -ml-[10px]"
            style={{ marginTop: 'var(--contact-socials-mt)' }}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {allItems.map((item, index) => {
                let xOffset = 0;
                let scale = 1;
                let opacity = 0.6;

                if (hoveredIndex !== null) {
                    if (index === hoveredIndex) {
                        scale = 1.1;
                        opacity = 1;
                    } else if (index < hoveredIndex) {
                        xOffset = -15;
                        scale = 0.95;
                        opacity = 0.3;
                    } else if (index > hoveredIndex) {
                        xOffset = 15;
                        scale = 0.95;
                        opacity = 0.3;
                    }
                }

                const commonStyle = {
                    transform: `translateX(${xOffset}px) scale(${scale})`,
                    opacity: opacity,
                    transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                };

                if (item.type === 'button') {
                    return (
                        <div
                            key={item.id}
                            className="xl:hidden animate-stagger opacity-0 translate-y-5 z-[100] relative mr-[10px]"
                            onMouseEnter={() => setHoveredIndex(index)}
                        >
                            <div style={commonStyle}>
                                <TransitionLink
                                    href="/friends"
                                    className="flex items-center justify-center gap-[10px] w-max px-[22px] h-[55px] rounded-[15px] text-[17px] font-bold transition-all duration-300 outline-none border-none cursor-pointer bg-[#d9d9d9] text-[#111] hover:text-white hover:bg-[#ffffff] no-underline pointer-events-auto"
                                >
                                    <img src="/icons/Fire.svg" alt="fire" className="w-[18px] h-auto pointer-events-none" />
                                    <span className="pointer-events-none" style={{ transform: 'translateY(1px)' }}>{item.title}</span>
                                </TransitionLink>
                            </div>
                        </div>
                    );
                }

                // Логика иконок
                const lowerName = item.title.toLowerCase();
                let currentIcon = '/icons/telegram.svg';
                let iconColor = '/icons/telegram_color.svg';
                if (lowerName.includes('instagram')) {
                    currentIcon = '/icons/instagram.svg';
                    iconColor = '/icons/instagram_color.svg';
                }
                const isTelegram = lowerName.includes('telegram') || (!lowerName.includes('instagram'));

                if (hoveredIndex === index && !isTelegram) {
                    currentIcon = iconColor;
                }

                const iconStyle = (hoveredIndex === index && isTelegram)
                    ? { filter: 'invert(58%) sepia(82%) saturate(541%) hue-rotate(159deg) brightness(91%) contrast(92%)' }
                    : {};

                return (
                    <div
                        key={item.id}
                        className={`animate-stagger opacity-0 translate-y-5 ${isTelegram ? 'contact-tg-link' : ''}`}
                        onMouseEnter={() => setHoveredIndex(index)}
                    >
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={commonStyle}
                            className="outline-none cursor-pointer block shrink-0 p-[10px] will-change-[opacity,transform]"
                        >
                            <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] lg:w-[48px] lg:h-[48px] xl:w-[32px] xl:h-[32px]">
                                <img
                                    src={currentIcon}
                                    alt={item.title}
                                    className="w-full h-full object-contain pointer-events-none transition-all duration-300"
                                    style={iconStyle}
                                />
                            </div>
                        </a>
                    </div>
                );
            })}
        </div>
    );
};

export default function ContactPage() {
    const t = useTranslations('Contact');
    const [loading, setLoading] = useState(true);
    const [animations, setAnimations] = useState<{ girl: any, cube: any, triangle: any } | null>(null);
    const [contactData, setContactData] = useState<any[]>([]);
    const [friendsData, setFriendsData] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadTimerRef = useRef<NodeJS.Timeout | null>(null);
    const animatedRef = useRef(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // 1. Грузим только быстрые локальные файлы — ждем их для старта
                Promise.all([
                    fetch('/relax_girl.json').then(res => res.json()),
                    fetch('/relax_cube.json').then(res => res.json()),
                    fetch('/relax_triangle.json').then(res => res.json())
                ]).then(([girlData, cubeData, triangleData]) => {
                    setAnimations({ girl: girlData, cube: cubeData, triangle: triangleData });

                    loadTimerRef.current = setTimeout(() => {
                        setLoading(false); // Снимаем блокировку, страница появляется сразу!
                    }, 50);
                });

                // 2. Медленные данные из Notion грузим параллельно, "в фоне"
                if (CMS_CONFIG.USE_NOTION) {
                    getNotionContactData()
                        .then(data => setContactData(data))
                        .catch(err => console.error("Ошибка Notion Contacts:", err));

                    getNotionFriendsData()
                        .then(data => setFriendsData(data))
                        .catch(err => console.error("Ошибка Notion Friends:", err));
                }

            } catch (error) {
                console.error('Ошибка загрузки:', error);
                setLoading(false);
            }
        };

        fetchAll();

        return () => {
            if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
        };
    }, []);

    const description = useMemo(() => {
        if (CMS_CONFIG.USE_NOTION && contactData.length > 0) {
            const row = contactData.find(c =>
                c.description && 
                (!c.url || c.url.trim() === '') && 
                !(c.title && c.title.toLowerCase().includes('friend'))
            );
            if (row) return row.description;
        }
        return t('defaultDesc');
    }, [contactData, t]);

    const socials = useMemo(() => {
        let items: any[] = [];
        if (CMS_CONFIG.USE_NOTION && contactData.length > 0) {
            // Берем всё, у чего есть url, кроме ссылок для "Друзей"
            items = contactData.filter(c => c.url && !(c.title && c.title.toLowerCase().includes('friend')));
        }
        if (items.length > 0) return items;
        return [
            { id: 'ig', title: 'Instagram', url: 'https://www.instagram.com/gardennuclear/' },
            { id: 'tg', title: 'Telegram', url: 'https://t.me/mynuclear' }
        ];
    }, [contactData]);

    // Анимация появления контента
    useEffect(() => {
        // Ждем пока загрузятся хотя бы быстрые JSON-данные
        if (loading || !containerRef.current) return;

        requestAnimationFrame(() => {
            // Собираем все элементы с классом анимации
            const allTargets = Array.from(containerRef.current!.querySelectorAll(".animate-stagger"));

            // ФИЛЬТРАЦИЯ: Берем только те элементы, которые GSAP еще не анимировал.
            // После анимации GSAP оставляет inline-стиль (opacity: 1). 
            // Если его нет — значит это свежая карточка, только что пришедшая из Notion.
            const newTargets = allTargets.filter(el => {
                const htmlEl = el as HTMLElement;
                return !htmlEl.style.opacity;
            });

            if (newTargets.length === 0) return;

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

        // ВАЖНО: добавили contactData и friendsData в зависимости. 
        // Теперь хук сработает снова, когда Notion отдаст данные.
    }, [loading, contactData, friendsData]);

    return (
        <main ref={containerRef} className="fixed top-0 left-0 w-full h-[100dvh] bg-[#efefef] text-[#111] overflow-hidden z-[60]">
            <div className="absolute top-0 left-0 w-full h-[100dvh] pointer-events-none z-30 flex flex-col lg:flex-row">
                <div
                    className="pointer-events-auto w-full h-full lg:w-[45%] flex flex-col px-[6vw] lg:pl-[4vw] lg:pr-0 box-border"
                    style={{ paddingTop: 'var(--contact-padding-top)' }}
                >
                    <div className="w-full">
                        <div className="contact-relax-wrap">
                            {animations && (
                                <InteractiveRelax
                                    dataGirl={animations.girl}
                                    dataCube={animations.cube}
                                    dataTriangle={animations.triangle}
                                />
                            )}
                        </div>

                        <p className="animate-stagger opacity-0 translate-y-5 font-medium leading-[1.6] text-[#111]/90 mb-10 md:mb-16 lg:mb-12 max-w-[500px]" style={{ fontSize: 'var(--contact-desc-size)', marginTop: 'var(--contact-desc-top)' }}>
                            {description}
                        </p>

                        <UnifiedSocials items={socials} showFriends={true} />
                    </div>
                </div>

                <div className="hidden xl:flex xl:w-[55%] h-full flex-col justify-center pl-[4vw]">
                    <div className="w-full max-w-[650px]">
                        <h2 className="animate-stagger opacity-0 translate-y-5 text-[1.8vw] font-bold mb-6 text-[#111]/60">{t('friends')}</h2>
                        <div className="grid grid-cols-3 w-full gap-6">
                            {(() => {
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
                                                    <div className="w-full h-full bg-[#d9d9d9] rounded-lg flex items-center justify-center text-[10px] font-bold opacity-40 uppercase text-center p-2">NO IMG<br/>{friend.name}</div>
                                                )}
                                            </div>
                                        );

                                        return href ? (
                                            <a href={href} target="_blank" rel="noopener noreferrer" key={friend.id} className="animate-stagger opacity-0 translate-y-5 aspect-square flex flex-col items-center justify-center p-[10%] transition-all duration-300 hover:scale-105 group block outline-none">
                                                {content}
                                            </a>
                                        ) : (
                                            <div key={friend.id} className="animate-stagger opacity-0 translate-y-5 aspect-square flex flex-col items-center justify-center p-[10%] transition-all duration-300 hover:scale-105 group">
                                                {content}
                                            </div>
                                        );
                                    })
                                ) : (
                                    [
                                        { src: '/logos/books.svg', alt: 'Books' },
                                        { src: '/logos/gutenberg.svg', alt: 'Gutenberg' }
                                    ].map((logo, i) => (
                                        <div key={i} className="animate-stagger opacity-0 translate-y-5 aspect-square flex items-center justify-center p-[15%] transition-all duration-300 hover:scale-105">
                                            <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" style={{ filter: 'grayscale(1) brightness(0.2)' }} />
                                        </div>
                                    ))
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
