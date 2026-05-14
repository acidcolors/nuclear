'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Lottie from 'lottie-react';
import homeAnimationData from '@/data/sample_animation_01.json';
import spaceAnimationData from '@/data/loading_bar.json';

interface PreloaderProps {
    variant: 'home' | 'space';
    isLoading: boolean;
    onComplete: () => void;
}

export const Preloader = ({ variant, isLoading, onComplete }: PreloaderProps) => {
    const [mounted, setMounted] = useState(false);

    // Убеждаемся, что мы в браузере (для работы document.body)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Логика таймера для Space (БОЛЬШЕ НЕ НУЖНА, ТАК КАК ЖДЕМ onComplete)
    /*
    useEffect(() => {
        if (variant !== 'space' || !isLoading) return;
        const timer = setTimeout(() => {
            onComplete();
        }, 3500);
        return () => clearTimeout(timer);
    }, [variant, isLoading, onComplete]);
    */

    // Защитный таймер (страховка), чтобы сайт не вис вечно
    useEffect(() => {
        if (!isLoading) return;

        // 1. Принудительное закрытие по таймеру (страховка)
        const backupTimer = setTimeout(() => {
            console.log("Прелоадер закрыт по таймеру (страховка)");
            onComplete();
        }, variant === 'home' ? 8000 : 5000); 

        // 2. Принудительное закрытие после полной загрузки окна браузера
        const handleWindowLoad = () => {
            console.log("Окно загружено, закрываем прелоадер");
            onComplete();
        };

        if (document.readyState === 'complete') {
            // Если уже загружено, не закрываем сразу, даем анимации проиграться
            // Но вешаем слушатель на случай если что-то пойдет не так
        } else {
            window.addEventListener('load', handleWindowLoad);
        }

        return () => {
            clearTimeout(backupTimer);
            window.removeEventListener('load', handleWindowLoad);
        };
    }, [variant, isLoading, onComplete]);

    // Если не загрузка - ничего не рендерим
    if (!isLoading) return null;

    // Контент прелоадера
    const preloaderContent = (
        <div
            id="global-preloader"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#ebebeb', // Твой серый фон
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999999
            }}
        >
            {/* РЕЖИМ 1: HOME */}
            {variant === 'home' && (
                <div className="w-80 h-80 md:w-[450px] md:h-[450px]">
                    <Lottie animationData={homeAnimationData} loop={false} onComplete={onComplete} />
                </div>
            )}

            {/* РЕЖИМ 2: SPACE (Полоска загрузки) */}
            {variant === 'space' && (
                <div className="flex items-center justify-center w-[30vw] md:w-[250px]">
                    <Lottie animationData={spaceAnimationData} loop={false} onComplete={onComplete} />
                </div>
            )}
        </div>
    );

    // Если компонент еще не вмонтирован (SSR), возвращаем обычный div
    // Это предотвращает мерцание (FOUC) до загрузки JS.
    if (!mounted) return preloaderContent;

    // В браузере используем портал для гарантии перекрытия всего документа
    return createPortal(preloaderContent, document.body);
};