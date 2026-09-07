'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import gsap from 'gsap';

interface InteractiveRelaxProps {
    dataGirl: any;
    dataCube: any;
    dataTriangle: any;
}

export default function InteractiveRelax({ dataGirl, dataCube, dataTriangle }: InteractiveRelaxProps) {
    const router = useRouter();

    // Реф нужен только для куба, чтобы перекинуть его на 24 кадр
    const cubeRef = useRef<LottieRefCurrentProps>(null);

    const handleTriangleClick = () => {
        const wrapper = document.querySelector('.page-transition-wrapper');
        if (wrapper) {
            gsap.to(wrapper, { opacity: 0, duration: 0.5, ease: "power2.inOut", onComplete: () => router.push('/space') });
        } else {
            router.push('/space');
        }
    };

    return (
        <div className="animate-stagger opacity-0 w-[250px] md:w-[350px] lg:w-[450px] mb-6 md:mb-10 lg:-mt-[22px] lg:mb-0 translate-x-[-15px] origin-left scale-[1.4] lg:scale-[0.9] relative">

            {/* БЛОК С АНИМАЦИЯМИ */}
            <div className="relative w-full h-full pointer-events-none">
                {/* 1. ФОН: ДЕВОЧКА */}
                <div className="relative z-0 w-full h-full">
                    <Lottie animationData={dataGirl} loop={true} />
                </div>

                {/* 2. КУБ (Левая картина) */}
                <div className="absolute top-[12px] left-[-15px] w-full h-full z-10">
                    <Lottie
                        lottieRef={cubeRef}
                        animationData={dataCube}
                        autoplay={false}
                        loop={true}
                        // Безопасный запуск с 24 кадра после полной загрузки компонента
                        onDOMLoaded={() => {
                            cubeRef.current?.goToAndPlay(24, true);
                        }}
                    />
                </div>

                {/* 3. ТРЕУГОЛЬНИК (Правая картина) */}
                <div className="absolute top-[7px] left-0 w-full h-full z-20">
                    {/* Крутится бесконечно с первого кадра */}
                    <Lottie animationData={dataTriangle} autoplay={true} loop={true} />
                </div>
            </div>

            {/* ======================================================== */}
            {/* ЧИСТЫЕ И ПРОЗРАЧНЫЕ ХИТБОКСЫ                             */}
            {/* ======================================================== */}

            {/* Зона для Куба (Левая картина) - пустышка, просто чтобы закрыть от случайных кликов */}
            <div
                className="absolute z-30 rounded-sm pointer-events-auto"
                style={{
                    width: '6%',
                    height: '6%',
                    top: '28%',
                    left: '6%'
                }}
            />

            {/* Зона для Треугольника (Правая картина) - клик и смена курсора */}
            <div
                className="absolute z-30 rounded-sm pointer-events-auto"
                data-cursor="pointer"
                style={{
                    width: '22%',
                    height: '15%',
                    top: '22%',
                    left: '22%'
                }}
                onClick={(e) => { e.stopPropagation(); handleTriangleClick(); }}
            />
        </div>
    );
}