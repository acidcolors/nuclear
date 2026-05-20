'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import React, { ReactNode } from 'react';
import gsap from 'gsap';

interface TransitionLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
    style?: React.CSSProperties;
}

export const TransitionLink = ({ href, children, className, onClick, style }: TransitionLinkProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

    // Динамически подставляем локаль в href, если это внутренний путь и в нем еще нет префикса локали
    const isInternal = href.startsWith('/');
    const localizedHref = (isInternal && !href.startsWith('/en') && !href.startsWith('/ru'))
        ? `/${locale}${href === '/' ? '' : href}`
        : href;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (onClick) {
            onClick(e);
        }
        e.preventDefault();

        if (pathname === localizedHref) return;

        // 1. Ищем контейнер контента, а не весь body!
        const wrapper = document.querySelector('.page-transition-wrapper');

        if (wrapper) {
            // 2. Плавно скрываем текущий контент
            gsap.to(wrapper, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    // 3. Переходим на новую страницу ТОЛЬКО после затухания
                    router.push(localizedHref);
                }
            });
        } else {
            // Фоллбэк на случай непредвиденных обстоятельств
            router.push(localizedHref);
        }
    };

    return (
        <a href={localizedHref} onClick={handleClick} className={className} style={style}>
            {children}
        </a>
    );
};