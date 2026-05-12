'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useCart } from '@/app/store/useCart';
import { CartDrawerMobile } from './cart/CartDrawerMobile';
import { CartDrawerDesktop } from './cart/CartDrawerDesktop';

export const CartDrawer = () => {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);
    const emptyCartRef = useRef<HTMLDivElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [customerInfo, setCustomerInfo] = useState('');
    const [message, setMessage] = useState('');
    const [isDesktop, setIsDesktop] = useState(false);
    const [showContactError, setShowContactError] = useState(false);
    const [isPlaceholderFading, setIsPlaceholderFading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const handleRemoveItem = (id: string) => {
        const element = document.getElementById(`cart-item-${id}`);
        const isLastItem = items.length === 1;
        const footer = document.getElementById('cart-footer-controls');

        if (element) {
            const tl = gsap.timeline({
                onComplete: () => removeItem(id)
            });

            tl.to(element, {
                opacity: 0,
                x: 30,
                duration: 0.4,
                ease: 'power2.inOut'
            });

            if (isLastItem && footer) {
                tl.to(footer, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    ease: 'power2.in'
                }, 0);
            }
        } else {
            removeItem(id);
        }
    };

    useEffect(() => {
        if (items.length === 0 && emptyCartRef.current) {
            gsap.fromTo(emptyCartRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }
            );
        }
    }, [items.length]);

    useEffect(() => {
        if (orderStatus === 'success' && successRef.current) {
            gsap.fromTo(successRef.current,
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }
            );
        }
    }, [orderStatus]);

    useEffect(() => {
        if (isMounted && drawerRef.current && !isOpen) {
            gsap.set(drawerRef.current, { x: '100%' });
        }
    }, [isMounted, isDesktop]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            gsap.to(overlayRef.current, { opacity: 1, duration: 0.5, pointerEvents: 'auto', ease: 'power2.out' });
            gsap.to(drawerRef.current, { x: '0%', duration: 0.6, ease: 'expo.out' });
        } else {
            document.body.style.overflow = '';
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, pointerEvents: 'none', ease: 'power2.in' });
            gsap.to(drawerRef.current, { x: '100%', duration: 0.6, ease: 'expo.in' });
        }
    }, [isOpen]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        // Safe Telegram WebApp user data extraction
        let tgUser = null;
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
            tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
        }

        if (!customerInfo.trim() && !tgUser) {
            setIsPlaceholderFading(true);
            setTimeout(() => {
                setShowContactError(true);
                setIsPlaceholderFading(false);
            }, 200);

            setTimeout(() => {
                setIsPlaceholderFading(true);
                setTimeout(() => {
                    setShowContactError(false);
                    setIsPlaceholderFading(false);
                }, 200);
            }, 2000);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    totalPrice: totalPrice(),
                    customerInfo,
                    message,
                    type: 'order',
                    ...(tgUser && { tgUser })
                }),
            });

            if (response.ok) {
                setOrderStatus('success');
                setTimeout(() => {
                    setIsOpen(false);
                    setTimeout(() => {
                        clearCart();
                        setOrderStatus('idle');
                        setCustomerInfo('');
                        setMessage('');
                    }, 1000);
                }, 1500);
            } else {
                setOrderStatus('error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
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
        totalPrice,
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
        emptyCartRef,
        showContactError,
        isPlaceholderFading,
    };

    return isDesktop ? (
        <CartDrawerDesktop {...commonProps} />
    ) : (
        <CartDrawerMobile {...commonProps} />
    );
};