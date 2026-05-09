'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/app/store/useCart';
import Image from 'next/image';

export const CartDrawer = () => {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [customerInfo, setCustomerInfo] = useState('');
    const successRef = useRef<HTMLDivElement>(null);
    const emptyCartRef = useRef<HTMLDivElement>(null);

    // Анимация удаления товара
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
            // Entry animation
            gsap.fromTo(successRef.current, 
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }
            );
        }
    }, [orderStatus]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            gsap.to(overlayRef.current, { opacity: 1, duration: 0.5, pointerEvents: 'auto', ease: 'power2.out' });
            gsap.to(drawerRef.current, { x: 0, duration: 0.6, ease: 'expo.out' });
        } else {
            document.body.style.overflow = '';
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, pointerEvents: 'none', ease: 'power2.in' });
            gsap.to(drawerRef.current, { x: '100%', duration: 0.6, ease: 'expo.in' });
        }
    }, [isOpen]);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        if (!customerInfo.trim()) {
            alert('Пожалуйста, укажите контактные данные (Telegram или телефон)');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    total: totalPrice(),
                    customerInfo
                }),
            });

            if (response.ok) {
                setOrderStatus('success');
                // Start closing after 1.5s
                setTimeout(() => {
                    setIsOpen(false);
                    // Reset state only after drawer is fully closed (500ms transition)
                    setTimeout(() => {
                        clearCart();
                        setOrderStatus('idle');
                        setCustomerInfo('');
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

    return (
        <>
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] opacity-0 pointer-events-none transition-opacity duration-500"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className="fixed top-0 right-0 h-screen w-full md:w-[460px] lg:w-full bg-[#f2f2f2] z-[999] shadow-2xl translate-x-full flex flex-col rounded-l-[20px] lg:rounded-none"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-[8vw] md:px-[40px] lg:px-[400px] pt-[10px] pb-1 min-h-[60px]">
                    {orderStatus !== 'success' && (
                        <>
                            <h2 className="text-[32px] font-bold tracking-tight text-[#111]">
                                Корзина
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:opacity-60 transition-opacity border-none outline-none bg-transparent"
                            >
                                <X size={28} strokeWidth={2} className="text-[#111]" />
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-[8vw] md:px-[40px] lg:px-[400px] pt-0 pb-8">
                    {orderStatus === 'success' ? (
                        <div 
                            ref={successRef}
                            className="h-full flex flex-col items-center justify-center text-center px-10"
                            style={{ marginTop: '-60px' }}
                        >
                            <h3 className="text-2xl font-black tracking-tighter text-[#111] uppercase mb-2">Заказ принят!</h3>
                            <p className="text-sm font-medium text-[#111] opacity-60">Мы скоро свяжемся с вами для подтверждения.</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div 
                            ref={emptyCartRef}
                            className="h-full flex flex-col items-center justify-center text-center text-[#111] opacity-20"
                            style={{ marginTop: '-60px' }}
                        >
                            <ShoppingBag size={80} strokeWidth={1} className="mb-6" />
                            <p className="text-[20px] font-medium mb-2">Корзина пуста</p>
                            <p className="text-[16px]">Время что-нибудь добавить</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 pb-10">
                            {items.map((item) => (
                                <div 
                                    key={item.id} 
                                    id={`cart-item-${item.id}`}
                                    className="flex items-center gap-4 group"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-[80px] h-[80px] bg-[#f5f5f5] rounded-[18px] overflow-hidden shrink-0 shadow-sm transition-transform duration-500">
                                        {item.image && (
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 pl-[10px]">
                                        <p
                                            className="text-[18px] font-bold text-[#111] leading-tight tracking-tight"
                                            style={{ margin: 0, marginBottom: '4px' }}
                                        >
                                            {item.title}
                                        </p>
                                        <div className="bg-[#f2f2f2] px-3.5 py-1.5 rounded-[12px] inline-block font-bold text-[14px] text-[#111]">
                                            {typeof item.price === 'number' ? formatPrice(item.price) : item.price} ₽
                                        </div>
                                    </div>

                                    {/* Controls Group */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="flex items-center gap-3 pr-[10px]">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 flex items-center justify-center text-[#111] opacity-30 hover:opacity-100 transition-opacity bg-transparent border-none outline-none p-0 cursor-pointer"
                                            >
                                                <Minus size={16} strokeWidth={2.5} />
                                            </button>
                                            <span className="min-w-[1rem] text-center font-bold text-[18px] tabular-nums text-[#111]">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 flex items-center justify-center text-[#111] opacity-30 hover:opacity-100 transition-opacity bg-transparent border-none outline-none p-0 cursor-pointer"
                                            >
                                                <Plus size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-[#111] opacity-20 hover:text-red-500 hover:opacity-100 transition-all ml-1 bg-transparent border-none outline-none p-0 cursor-pointer"
                                        >
                                            <Trash2 size={18} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div id="cart-footer-controls">
                                {/* Total Section */}
                                <div
                                    className="flex flex-col items-end gap-1.5"
                                    style={{ marginTop: '40px', marginBottom: '40px' }}
                                >
                                    <span className="text-[13px] font-medium text-[#111] opacity-30 pr-4">
                                        Итог
                                    </span>
                                    <div 
                                        className="bg-[#e5e5e5] px-[20px] py-[10px] rounded-[10px] text-[22px] font-bold text-[#111] shadow-sm tabular-nums"
                                        style={{ marginTop: '10px' }}
                                    >
                                        {formatPrice(totalPrice())} ₽
                                    </div>
                                </div>

                                {/* Footer Controls inside scrollable */}
                                <div className="pb-12 pt-0 flex flex-col gap-10">
                                    <input
                                        type="text"
                                        value={customerInfo}
                                        onChange={(e) => setCustomerInfo(e.target.value)}
                                        placeholder="@telegram или телефон"
                                        className="w-[90%] h-[50px] bg-white border-none rounded-[10px] pr-8 text-[18px] italic focus:outline-none placeholder:text-[#111] placeholder:opacity-20 placeholder:italic shadow-sm self-start"
                                        style={{ paddingLeft: '30px' }}
                                    />

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isSubmitting || !customerInfo.trim()}
                                        className="flex items-center justify-center gap-[8px] w-[55%] h-[55px] rounded-[16px] text-[16px] md:text-[18px] font-medium transition-all duration-300 outline-none border-none cursor-pointer bg-[#dddddd] text-[#111] hover:bg-[#ffffff] hover:text-black whitespace-nowrap active:scale-[0.95] shadow-sm disabled:opacity-50 self-start group"
                                        style={{ marginTop: '20px' }}
                                    >
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        <span style={{ transform: 'translateY(1px)' }}>Оформить</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
