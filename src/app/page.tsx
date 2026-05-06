'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { Preloader } from '@/components/Preloader';
import { Typewriter } from '@/components/ui/Typewriter';
import { TextPressure } from '@/components/ui/TextPressure';
import InteractivePhysicsBackground from '@/components/InteractivePhysicsBackground';
import { getNotionHomePageMain, getNotionHomePageLinks } from '@/lib/notion';
import { CMS_CONFIG } from '@/config/cmsSwitch';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [viewMode, setViewMode] = useState<'mobile' | 'adaptive' | 'desktop'>('mobile');
  
  const [homeMain, setHomeMain] = useState<{ title: string; description: string } | null>(null);
  const [homeLinks, setHomeLinks] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. ЗАГРУЗКА ДАННЫХ И ТИП УСТРОЙСТВА
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) setViewMode('mobile');
      else if (width <= 1440) setViewMode('adaptive');
      else setViewMode('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Загрузка данных из Notion в фоне
    if (CMS_CONFIG.USE_NOTION) {
      Promise.all([
        getNotionHomePageMain(),
        getNotionHomePageLinks()
      ]).then(([mainData, linksData]) => {
        if (mainData) setHomeMain(mainData);
        setHomeLinks(linksData);
        setIsFetchingData(false);
      }).catch(err => {
        console.error("Ошибка Notion Home:", err);
        setIsFetchingData(false);
      });
    } else {
      setIsFetchingData(false);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. АНИМАЦИЯ ПОЯВЛЕНИЯ (GSAP)
  useEffect(() => {
    // Ждем окончания прелоадера И загрузки данных из Notion
    if (loading || isFetchingData || !containerRef.current) return;

    requestAnimationFrame(() => {
      const selectors = [".custom-home-btn", ".custom-nav", ".animate-up", ".custom-insta", ".custom-tg", ".custom-behance", ".custom-thank-you"];
      const allTargets = Array.from(containerRef.current!.querySelectorAll(selectors.join(',')));
      
      const newTargets = allTargets.filter(el => {
        const htmlEl = el as HTMLElement;
        return !htmlEl.style.opacity;
      });

      if (newTargets.length === 0) return;

      gsap.context(() => {
        gsap.to(newTargets, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.1,
          ease: "power4.out",
          delay: 0.2,
          overwrite: true
        });
      }, containerRef);
    });
  }, [loading, isFetchingData]);

  // 3. УМНОЕ ФОРМАТИРОВАНИЕ ЗАГОЛОВКОВ
  const titles = useMemo(() => {
    const raw = homeMain?.title || "Ядерный Сад";
    const isStandard = raw.toLowerCase().includes('ядерный сад');
    
    return {
      bg: isStandard ? "Ядер\nный\nСад" : raw,
      fg: isStandard ? "Ядерный\nСад" : raw
    };
  }, [homeMain]);

  const displayDescription = homeMain?.description || "В нашей мастерской рождаются самые разные форматы — от независимого самиздата до концептуального серебра. Мы ценим уникальность, поэтому каждый релиз выпускается строгим лимитом или вовсе в одном экземпляре. Загляните в меню проектов: там собраны наши актуальные коллекции, включая открытки, арт-игрушки, зины и серебряные предметы";

  return (
    <main ref={containerRef} className="relative w-screen h-screen bg-[#ebebeb] overflow-hidden">

      <Preloader
        variant="home"
        isLoading={loading}
        onComplete={() => setLoading(false)}
      />

      {viewMode === 'mobile' && <InteractivePhysicsBackground />}

      <div className="absolute inset-0 w-full h-full overflow-hidden">

        {/* 1. ФОНОВЫЙ ЗАГОЛОВОК (Отцентрирован по вашим правкам) */}
        {viewMode !== 'mobile' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
            <div className="w-[150vw] opacity-[0.02] text-center">
              <TextPressure
                text={titles.bg}
                className="text-[24vw] leading-[0.8] tracking-tighter text-[#000] uppercase font-black"
                maxDist={500}
                skewActive={35}
                animateMode={viewMode === 'desktop' ? 'none' : 'v-cursor'}
              />
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-full z-[95] pointer-events-none blend-exclusion">

          {/* Приветственный текст */}
          <div className="animate-up opacity-0 translate-y-5 hidden lg:block absolute top-[40px] left-[22.2vw]">
            <span className="text-sm font-bold tracking-widest text-[#ebebeb]">
              Welcome <br /> to other world.
            </span>
          </div>

          {/* Заголовок основной */}
          <div
            className={`animate-up opacity-0 translate-y-5 absolute transition-all duration-700
                ${viewMode === 'mobile'
                ? 'w-[90vw] top-[14vh] left-[6vw]'
                : 'w-[50vw] top-[20vh] left-[22.2vw]'}`}
          >
            <TextPressure
              text={titles.fg}
              className="text-[length:var(--title-size)] leading-[0.95] lg:leading-[0.9] tracking-tighter text-[#ebebeb]"
              animateMode="random"
            />
          </div>

          {/* Описание */}
          <div
            className={`animate-up opacity-0 translate-y-5 absolute transition-all duration-700 z-10
              ${viewMode === 'mobile'
                ? 'w-[88vw] top-[37vh] left-[6vw]'
                : viewMode === 'adaptive'
                  ? 'w-[40vw] top-[50vh] -translate-y-1/2 left-[30vw]'
                  : 'w-[40vw] top-[50vh] left-[30vw]'}`}
          >
            <p className="text-[length:var(--desc-size)] font-medium leading-[1.45] lg:leading-[1.4] text-[#ebebeb]">
              <Typewriter
                text={displayDescription}
                speed={25}
                delay={loading ? 3500 : 500}
              />
            </p>
          </div>

          {/* Футер-текст слева */}
          <div className="custom-thank-you animate-up opacity-0 translate-y-5 absolute bottom-[26vh] left-[6vw] lg:bottom-auto lg:top-[50vh] lg:left-[40px] lg:-translate-y-1/2 lg:w-[12vw]">
            <p className="text-[14px] md:text-[11px] lg:text-[16px] font-bold tracking-widest leading-tight text-[#ebebeb]">
              Thank you <br /> for visiting this site.
            </p>
          </div>

          {/* СОЦИАЛЬНЫЕ СЕТИ (Динамические) */}
          <div className="flex flex-col lg:block">
            {homeLinks.length > 0 ? (
               homeLinks.map((link) => {
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
  );
}