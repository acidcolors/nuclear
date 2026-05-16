'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  weightInactive?: number;
  weightActive?: number;
  skewActive?: number;
  maxDist?: number;
  interactive?: boolean;
}

export function Typewriter({ 
  text, 
  speed = 30, 
  delay = 1000,
  weightInactive = 500, // Базовая толщина для обычного текста
  weightActive = 900,   // Надувается при наведении
  skewActive = 15,      // Наклон поменьше для читаемости
  maxDist = 120,
  interactive = false
}: TypewriterProps) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);

    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    setDisplayedCount(0);

    timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i++;
        setDisplayedCount(i);
        if (i >= text.length) {
          clearInterval(interval);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, delay]);

  // Логика интерактивности (Text Pressure)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mounted || !interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const spans = container.querySelectorAll('.pressure-char');
      spans.forEach((span) => {
        const rect = span.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;
        const distX = e.clientX - charCenterX;
        const distY = e.clientY - charCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        const influence = Math.max(0, 1 - distance / maxDist);
        const weight = weightInactive + (weightActive - weightInactive) * influence;
        
        const skewDirection = distX > 0 ? 1 : -1;
        const skew = (skewActive * influence) * skewDirection;

        gsap.to(span, {
          fontVariationSettings: `"wght" ${weight}`,
          skewX: skew,
          duration: 0.4,
          ease: 'power2.out',
        });
      });
    };

    const handleMouseLeave = () => {
      const spans = container.querySelectorAll('.pressure-char');
      gsap.to(spans, {
        fontVariationSettings: `"wght" ${weightInactive}`,
        skewX: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mounted, weightInactive, weightActive, skewActive, maxDist, displayedCount]);

  if (!mounted) {
    return <span className="text-[inherit]">_</span>;
  }

  const chars = text.split('');

  return (
    <span 
      ref={containerRef} 
      className="relative text-[inherit]" 
      style={{ whiteSpace: 'pre-wrap' }}
    >
      <style>{`
        @keyframes custom-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink {
          animation: custom-blink 1s step-end infinite;
        }
      `}</style>

      {/* Разбиваем текст на слова, сохраняя пробелы */}
      {text.split(/(\s+)/).map((word, wordIdx, wordArr) => {
        // Вычисляем глобальный индекс начала этого слова
        const wordStartIdx = wordArr.slice(0, wordIdx).join('').length;

        return (
          <span key={wordIdx} className="inline-block">
            {word.split('').map((char, charIdx) => {
              const globalIdx = wordStartIdx + charIdx;
              return (
                <React.Fragment key={globalIdx}>
                  <span
                    className="pressure-char inline-block"
                    style={{ 
                      fontVariationSettings: `"wght" ${weightInactive}, "slnt" 0`,
                      opacity: globalIdx >= displayedCount ? 0 : 1,
                      pointerEvents: globalIdx >= displayedCount ? 'none' : 'auto'
                    }}
                  >
                    {char}
                  </span>
                  {/* Курсор бежит за буквами */}
                  {globalIdx === displayedCount - 1 && globalIdx < text.length - 1 && (
                    <span className="cursor-blink inline-block ml-[1px] font-bold">_</span>
                  )}
                </React.Fragment>
              );
            })}
          </span>
        );
      })}

      {/* Курсор в самом начале или в самом конце */}
      {(displayedCount === 0 || displayedCount === text.length) && (
        <span className="cursor-blink inline-block ml-[1px] font-bold">_</span>
      )}
    </span>
  );
}