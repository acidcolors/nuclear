'use client';

import React from 'react';

interface MarqueeProps {
    text: string;
    link?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ text, link }) => {
    // Теперь мы не добавляем пробелы в коде, а используем gap для отступов
    const formattedText = text;
    
    // Дублируем текст 12 раз (6+6) для заполнения и бесшовности
    const items = Array(12).fill(formattedText);

    const content = (
        <div 
            className="flex whitespace-nowrap animate-marquee py-2"
            style={{ gap: 'var(--marquee-gap, 40px)' }}
        >
            {items.map((item, idx) => (
                <span 
                    key={idx} 
                    className="text-[24px] font-sans italic font-bold uppercase"
                    style={{ whiteSpace: 'pre' }}
                >
                    {item}
                </span>
            ))}
        </div>
    );

    return (
        <div 
            className="fixed bottom-0 left-0 w-full overflow-hidden bg-black text-white flex items-center"
            style={{ 
                zIndex: 99999, 
                height: 'var(--marquee-height, 50px)',
                backgroundColor: 'var(--marquee-bg)',
                color: 'var(--marquee-text-color)',
                bottom: 'var(--marquee-bottom, 0px)',
                visibility: 'visible',
                display: 'flex'
            }}
        >
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="no-underline hover:opacity-80 transition-opacity" style={{ color: 'inherit' }}>
                    {content}
                </a>
            ) : (
                content
            )}
        </div>
    );
};
