'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Preloader } from '@/components/Preloader';
import { Typewriter } from '@/components/ui/Typewriter';
import { TextPressure } from '@/components/ui/TextPressure';
import { Marquee } from '@/components/ui/Marquee';

interface HomeClientProps {
  initialMain?: { title: string; description: string } | null;
  initialLinks?: any[];
  // ВАЖНО: Добавили проп, который агент забыл
  forcedLoading?: boolean;
  marqueeData?: { isActive: boolean; text: string; link?: string } | null;
}

export default function HomeClient({ initialMain, initialLinks, forcedLoading = false, marqueeData }: HomeClientProps) {
  useEffect(() => {
    console.log('[Marquee Debug] Data from Notion:', marqueeData);
  }, [marqueeData]);

  const [viewMode, setViewMode] = useState<'mobile' | 'adaptive' | 'desktop'>('mobile');
  const [startPressure, setStartPressure] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Состояние "Шторка открыта": когда данные пришли И анимация доиграла
  const isLocked = (forcedLoading || isLoading || !isAnimationComplete);

  // Функция завершения прелоадера (анимация Lottie доиграла до конца)
  const handlePreloaderComplete = () => {
    if (!forcedLoading) {
      setIsAnimationComplete(true);
      // Отправляем сигнал Хедеру, что анимация Lottie физически завершилась
      window.dispatchEvent(new CustomEvent('preloaderFinished'));
    }
  };

  // Поскольку данные в HomeClient приходят через пропсы, они "загружены" сразу
  useEffect(() => {
    setMounted(true);
    if (!forcedLoading) {
      setIsLoading(false);
    }
  }, [forcedLoading]);

  // 1. ТИП УСТРОЙСТВА
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) setViewMode('mobile');
      else if (width <= 1440) setViewMode('adaptive');
      else setViewMode('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. ЗАДЕРЖКА ДЛЯ ТЯЖЕЛЫХ АНИМАЦИЙ
  useEffect(() => {
    if (!isLocked) {
      const timer = setTimeout(() => {
        setStartPressure(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  // 3. АНИМАЦИЯ ПОЯВЛЕНИЯ (GSAP)
  useEffect(() => {
    // Жестко блокируем GSAP, пока крутится прелоадер или висит заглушка
    if (isLocked || !containerRef.current) return;

    requestAnimationFrame(() => {
      const selectors = [
        ".custom-home-btn",
        ".custom-nav",
        ".animate-up",
        ".custom-insta",
        ".custom-tg",
        ".custom-behance",
        ".custom-thank-you"
      ];
      const allTargets = Array.from(containerRef.current!.querySelectorAll(selectors.join(',')));

      const newTargets = allTargets.filter(el => {
        const htmlEl = el as HTMLElement;
        return !htmlEl.style.opacity || htmlEl.style.opacity === '0';
      });

      if (newTargets.length === 0) return;

      gsap.context(() => {
        gsap.fromTo(newTargets,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: "power4.out",
            delay: 0.2,
            overwrite: true
          }
        );
      }, containerRef);
    });
  }, [isLocked]);

  // 4. УМНОЕ ФОРМАТИРОВАНИЕ ЗАГОЛОВКОВ
  const titles = useMemo(() => {
    const raw = initialMain?.title || "Ядерный Сад";
    const isStandard = raw.toLowerCase().includes('ядерный сад');

    return {
      bg: isStandard ? "Ядер\nный\nСад" : raw,
      fg: isStandard ? "Ядерный\nСад" : raw
    };
  }, [initialMain]);

  const displayDescription = initialMain?.description || "В нашей мастерской рождаются самые разные форматы — от независимого самиздата до концептуального серебра. Мы ценим уникальность, поэтому каждый релиз выпускается строгим лимитом или вовсе в одном экземпляре. Загляните в меню проектов: там собраны наши актуальные коллекции, включая открытки, арт-игрушки, зины и серебряные предметы";

  const homeLinks = initialLinks || [];

  return (
    <>
      <main ref={containerRef} className="relative w-screen h-screen bg-[#ebebeb] overflow-hidden">
      <Preloader
        variant="home"
        isLoading={isLocked}
        onComplete={handlePreloaderComplete}
      />

      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* ВЕСЬ ТВОЙ ОСТАЛЬНОЙ JSX (Заголовки, кнопки и т.д.) ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ */}
        <div className="absolute top-0 left-0 w-full h-full z-[95] pointer-events-none blend-exclusion">
          {/* Приветственный текст */}
          <div className="animate-up opacity-0 translate-y-5 hidden lg:block absolute top-[55px] left-[22.2vw]">
            <span className="text-sm font-bold tracking-widest text-[#ebebeb]">
              Welcome <br /> to other world.
            </span>
          </div>

          {/* Заголовок основной */}
          <div
            className={`home-title animate-up opacity-0 translate-y-5 absolute transition-all duration-700
                ${viewMode === 'mobile'
                ? 'w-[90vw] top-[var(--home-title-top)] left-[6vw]'
                : 'w-[50vw] top-[var(--home-title-top)] left-[22.2vw]'}`}
          >
            <TextPressure
              text={titles.fg}
              className="text-[length:var(--title-size)] leading-[0.95] lg:leading-[0.9] tracking-tighter text-[#ebebeb]"
              animateMode={startPressure ? 'random' : 'none'}
            />
          </div>

          {/* Описание */}
          <div
            className={`home-desc animate-up opacity-0 translate-y-5 absolute transition-all duration-700 z-10
              ${viewMode === 'mobile'
                ? 'w-[88vw] top-[var(--home-desc-top)] left-[6vw]'
                : viewMode === 'adaptive'
                  ? 'w-[40vw] top-[var(--home-desc-top)] -translate-y-1/2 left-[30vw]'
                  : 'w-[40vw] top-[var(--home-desc-top)] left-[30vw]'}`}
          >
            <p className="text-[length:var(--desc-size)] font-medium leading-[1.45] lg:leading-[1.4] text-[#ebebeb]">
              <Typewriter
                text={displayDescription}
                speed={25}
                delay={isLocked ? 3500 : 500}
              />
            </p>
          </div>

          {/* Футер-текст слева */}
          <div className="custom-thank-you animate-up opacity-0 translate-y-5 absolute bottom-[var(--home-thank-you-bottom)] left-[6vw] lg:bottom-auto lg:top-[50vh] lg:left-[40px] lg:-translate-y-1/2 lg:w-[12vw]">
            <p className="text-[14px] max-h-[650px]:!text-[11px] md:text-[11px] lg:text-[16px] font-bold tracking-widest leading-tight text-[#ebebeb]">
              Thank you <br /> for visiting this site.
            </p>
          </div>

          {/* СОЦИАЛЬНЫЕ СЕТИ */}
          <div className="flex flex-col lg:block">
            {homeLinks.length > 0 ? (
              homeLinks.map((link: any) => {
                const name = link.name.toLowerCase();
                let posClass = "relative mt-4 ml-[6vw] lg:hidden";
                if (name.includes('insta')) posClass = "custom-insta";
                else if (name.includes('tg') || name.includes('telegr')) posClass = "custom-tg";
                else if (name.includes('behan')) posClass = "custom-behance";

                return (
                  <div key={link.id} className={`${posClass} pointer-events-auto animate-up opacity-0 translate-y-5`}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="group inline-block p-[15px] -m-[15px] no-underline outline-none cursor-pointer">
                      <div className="overflow-hidden" style={{ position: 'relative', height: '20px', display: 'block' }}>
                        <div className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2 flex flex-col">
                          <span className="text-[15px] lg:text-sm font-bold tracking-widest text-[#ebebeb] flex items-center" style={{ height: '20px', whiteSpace: 'nowrap' }}>{link.name}</span>
                          <span className="text-[15px] lg:text-sm font-bold tracking-widest text-[#ebebeb] flex items-center" style={{ height: '20px', whiteSpace: 'nowrap' }}>{link.name}</span>
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })
            ) : (
              <>
                <div className="custom-insta pointer-events-auto animate-up opacity-0 translate-y-5">
                  <a href="https://www.instagram.com/gardennuclear/" target="_blank" rel="noopener noreferrer" className="group inline-block p-[15px] -m-[15px] no-underline outline-none cursor-pointer">
                    <div className="overflow-hidden" style={{ position: 'relative', height: '20px', display: 'block' }}>
                      <div className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2 flex flex-col">
                        <span className="text-[15px] lg:text-sm font-bold tracking-widest text-[#ebebeb] flex items-center" style={{ height: '20px', whiteSpace: 'nowrap' }}>instagram</span>
                        <span className="text-[15px] lg:text-sm font-bold tracking-widest text-[#ebebeb] flex items-center" style={{ height: '20px', whiteSpace: 'nowrap' }}>instagram</span>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="custom-tg pointer-events-auto animate-up opacity-0 translate-y-5">
                  <a href="https://t.me/mynuclear" target="_blank" rel="noopener noreferrer" className="group inline-block p-[15px] -m-[15px] no-underline outline-none cursor-pointer">
                    <div className="overflow-hidden" style={{ position: 'relative', height: '20px', display: 'block' }}>
                      <div className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2 flex flex-col">
                        <span className="text-[15px] lg:text-sm font-bold tracking-widest text-[#ebebeb] flex items-center" style={{ height: '20px', whiteSpace: 'nowrap' }}>telegram</span>
                        <span className="text-[15px] lg:text-sm font-bold tracking-widest text-[#ebebeb] flex items-center" style={{ height: '20px', whiteSpace: 'nowrap' }}>telegram</span>
                      </div>
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
    {marqueeData?.isActive && marqueeData.text && mounted && (
        <Marquee text={marqueeData.text} link={marqueeData.link} />
    )}
    </>
  );
}
