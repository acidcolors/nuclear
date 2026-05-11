'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useSupport } from '@/app/store/useSupport';
import { SupportDrawerMobile } from './support/SupportDrawerMobile';
import { SupportDrawerDesktop } from './support/SupportDrawerDesktop';

export const SupportDrawer = () => {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearSupport } = useSupport();
    const drawerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [customerInfo, setCustomerInfo] = useState('');
    const [message, setMessage] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const handleRemoveItem = (id: string) => {
        const element = document.getElementById(`support-item-${id}`);
        if (element) {
            gsap.to(element, {
                opacity: 0,
                x: 30,
                duration: 0.4,
                ease: 'power2.inOut',
                onComplete: () => removeItem(id)
            });
        } else {
            removeItem(id);
        }
    };

    useEffect(() => {
        if (orderStatus === 'success' && successRef.current) {
            gsap.fromTo(successRef.current,
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }
            );
        }
    }, [orderStatus]);

    useEffect(() => {
        if (isMounted && drawerRef.current) {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
                gsap.to(overlayRef.current, { opacity: 1, duration: 0.5, pointerEvents: 'auto', ease: 'power2.out' });
                gsap.to(drawerRef.current, { x: '0%', duration: 0.6, ease: 'expo.out' });
            } else {
                document.body.style.overflow = '';
                gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, pointerEvents: 'none', ease: 'power2.in' });
                gsap.to(drawerRef.current, { x: '100%', duration: 0.6, ease: 'expo.in' });
            }
        }
    }, [isOpen, isMounted, isDesktop]);

    const handleCheckout = async () => {
        if (!customerInfo.trim()) {
            alert('Пожалуйста, укажите контактные данные (Telegram или телефон)');
            return;
        }

        setIsSubmitting(true);
        try {
            const subject = items.length > 0 
                ? `Запрос на уведомление: ${items.map(i => `${i.title} (${i.quantity})`).join(', ')}`
                : 'Общий запрос в поддержку';

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerInfo,
                    message,
                    type: 'support',
                    subject,
                    items
                }),
            });

            if (response.ok) {
                setOrderStatus('success');
                setTimeout(() => {
                    setIsOpen(false);
                    setTimeout(() => {
                        clearSupport();
                        setOrderStatus('idle');
                        setCustomerInfo('');
                        setMessage('');
                    }, 1000);
                }, 1500);
            } else {
                setOrderStatus('error');
            }
        } catch (error) {
            console.error('Support checkout error:', error);
            setOrderStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('ru-RU').replace(',', ' ');
    };

    if (!isMounted) return null;

    const commonProps = {
        items,
        isOpen,
        setIsOpen,
        handleRemoveItem,
        updateQuantity,
        formatPrice,
        handleCheckout,
        isSubmitting,
        orderStatus,
        customerInfo,
        setCustomerInfo,
        message,
        setMessage,
        drawerRef,
        overlayRef,
        successRef,
    };

    return isDesktop ? (
        <SupportDrawerDesktop {...commonProps} />
    ) : (
        <SupportDrawerMobile {...commonProps} />
    );
};
