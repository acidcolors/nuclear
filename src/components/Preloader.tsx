'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Spinner } from '@/components/Spinner';

interface PreloaderProps {
    variant: 'home' | 'space';
    isLoading: boolean;
    onComplete: () => void;
}

export const Preloader = ({ variant, isLoading, onComplete }: PreloaderProps) => {
    const [mounted, setMounted] = useState(false);
    const completedRef = useRef(false);

    // Убеждаемся, что мы в браузере (для работы document.body)
    useEffect(() => {
        setMounted(true);
    }, []);

    // HOME: раньше закрытие было завязано на onComplete Lottie-анимации (своего тайминга не было).
    // Спиннер бесконечный, поэтому держим минимум 1500мс показа сами — важно: видимость НЕ должна
    // зависеть напрямую от пропа isLoading (он резолвится почти мгновенно, т.к. данные приходят
    // через пропсы), иначе прелоадер схлопнется раньше, чем истечёт минимальное время.
    const [homeMinElapsed, setHomeMinElapsed] = useState(false);

    useEffect(() => {
        if (variant !== 'home') return;
        const t = setTimeout(() => setHomeMinElapsed(true), 1500);
        return () => clearTimeout(t);
    }, [variant]);

    const homeVisible = isLoading || !homeMinElapsed;

    useEffect(() => {
        if (variant !== 'home') return;
        if (!homeVisible && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    }, [variant, homeVisible, onComplete]);

    // SPACE: сохраняем прежнюю прописанную логику — страховка 3.5с и подхват window.load
    useEffect(() => {
        if (variant !== 'space' || !isLoading) return;

        const backupTimer = setTimeout(() => {
            console.log("Space-прелоадер закрыт по таймеру (3.5с)");
            onComplete();
        }, 3500);

        const handleWindowLoad = () => {
            onComplete();
        };

        if (document.readyState !== 'complete') {
            window.addEventListener('load', handleWindowLoad);
        }

        return () => {
            clearTimeout(backupTimer);
            window.removeEventListener('load', handleWindowLoad);
        };
    }, [variant, isLoading, onComplete]);

    const visible = variant === 'home' ? homeVisible : isLoading;

    // Если не загрузка - ничего не рендерим
    if (!visible) return null;

    // Контент прелоадера — единый спиннер для всех вариантов
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
            <Spinner />
        </div>
    );

    // Заглушка для SSR / Hydration Gap
    // Пока компонент не вмонтирован, рендерим глухую серую подложку
    if (!mounted) {
        return <div className="fixed inset-0 z-[999999] w-screen h-screen bg-[#ebebeb] pointer-events-none"></div>;
    }

    // В браузере используем портал для гарантии перекрытия всего документа
    return createPortal(preloaderContent, document.body);
};
