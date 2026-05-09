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
                setTimeout(() => {
                    clearCart();
                    setIsOpen(false);
                    setOrderStatus('idle');
                    setCustomerInfo('');
                }, 3000);
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
                className="fixed top-0 right-0 h-screen w-full md:w-[460px] bg-[#f2f2f2] z-[999] shadow-2xl translate-x-full flex flex-col rounded-l-[20px]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 md:px-10 pt-[40px] pb-4">
                    <h2 className="text-[44px] font-black tracking-tighter text-[#111] uppercase">
                        Корзина
                    </h2>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:opacity-60 transition-opacity border-none outline-none bg-transparent"
                    >
                        <X size={32} strokeWidth={2.5} className="text-[#111]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 md:px-10 py-6">
                    {orderStatus === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 animate-bounce">
                                <Plus size={40} className="rotate-45" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tighter text-[#111] uppercase mb-2">Заказ принят!</h3>
                            <p className="text-sm font-medium text-[#111] opacity-60">Мы скоро свяжемся с вами для подтверждения.</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="opacity-[0.05] mb-8">
                                <ShoppingBag size={120} strokeWidth={1} />
                            </div>
                            <p className="text-2xl font-bold tracking-tight text-[#111] opacity-20 uppercase">Корзина пуста</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center gap-6 group">
                                    {/* Thumbnail */}
                                    <div className="relative w-[110px] h-[110px] bg-[#e5e5e5] rounded-[28px] overflow-hidden shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
                                        {item.image && (
                                            <Image 
                                                src={item.image} 
                                                alt={item.title} 
                                                fill 
                                                className="object-cover"
                                                sizes="110px"
                                            />
                                        )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[24px] font-black text-[#111] mb-2 leading-tight tracking-tighter uppercase">
                                            {item.title}
                                        </p>
                                        <div className="bg-[#e5e5e5] px-5 py-2 rounded-[16px] inline-block font-extrabold text-[16px] text-[#111]">
                                            {typeof item.price === 'number' ? formatPrice(item.price) : item.price} ₽
                                        </div>
                                    </div>

                                    {/* Controls Group */}
                                    <div className="flex items-center gap-5 shrink-0">
                                        <div className="flex items-center gap-4 bg-[#e5e5e5]/30 p-1.5 rounded-[18px]">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center text-[#111] opacity-30 hover:opacity-100 transition-opacity"
                                            >
                                                <Minus size={18} strokeWidth={3} />
                                            </button>
                                            <span className="min-w-[1.5rem] text-center font-black text-[22px] tabular-nums text-[#111]">
                                                {item.quantity}
                                            </span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center text-[#111] opacity-30 hover:opacity-100 transition-opacity"
                                            >
                                                <Plus size={18} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="text-[#111] opacity-20 hover:text-red-500 hover:opacity-100 transition-all ml-1"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Total Section */}
                             <div className="pt-6 flex flex-col items-end gap-3">
                                <span className="text-[14px] font-black text-[#111] opacity-40 pr-8 uppercase tracking-[0.2em]">
                                    Итог
                                </span>
                                <div className="bg-[#e5e5e5] px-12 py-6 rounded-[35px] text-[38px] font-black text-[#111] shadow-sm tabular-nums tracking-tighter leading-none">
                                    {formatPrice(totalPrice())} ₽
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-8 md:px-10 pb-12 pt-8 flex flex-col gap-6">
                    {items.length > 0 && orderStatus !== 'success' && (
                        <>
                            <input 
                                type="text"
                                value={customerInfo}
                                onChange={(e) => setCustomerInfo(e.target.value)}
                                placeholder="@telegram"
                                className="w-full h-[70px] bg-white rounded-[24px] px-8 text-[18px] font-medium outline-none transition-all border-none shadow-sm focus:ring-2 focus:ring-black/5"
                            />
                            <button 
                                onClick={handleCheckout}
                                disabled={isSubmitting || !customerInfo.trim()}
                                className="w-full h-[80px] bg-[#e5e5e5] hover:bg-black hover:text-white text-[#111] rounded-[30px] flex items-center justify-center gap-5 transition-all group active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-2" />
                                <span className="text-[24px] font-black uppercase tracking-tight">Оформить</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Circular N Logo */}
                <div className="absolute bottom-8 left-8">
                    <div className="w-14 h-14 bg-[#333] rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        N
                    </div>
                </div>
            </div>
        </>
    );
};
