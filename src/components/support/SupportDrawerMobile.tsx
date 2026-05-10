import React from 'react';
import { X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { SupportItem } from '@/app/store/useSupport';

interface SupportDrawerProps {
    items: SupportItem[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    handleRemoveItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    formatPrice: (price: number) => string;
    handleCheckout: () => Promise<void>;
    isSubmitting: boolean;
    orderStatus: 'idle' | 'success' | 'error';
    customerInfo: string;
    setCustomerInfo: (info: string) => void;
    drawerRef: React.RefObject<HTMLDivElement | null>;
    overlayRef: React.RefObject<HTMLDivElement | null>;
    successRef: React.RefObject<HTMLDivElement | null>;
}

export const SupportDrawerMobile = ({
    items,
    setIsOpen,
    handleRemoveItem,
    updateQuantity,
    formatPrice,
    handleCheckout,
    isSubmitting,
    orderStatus,
    customerInfo,
    setCustomerInfo,
    drawerRef,
    overlayRef,
    successRef,
}: SupportDrawerProps) => {
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
                className="fixed top-0 right-0 h-screen w-full bg-[#f2f2f2] z-[999] shadow-2xl flex flex-col rounded-l-[20px]"
                style={{ transform: 'translateX(100%)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-[8vw] pt-[10px] pb-1 min-h-[60px]">
                    {orderStatus !== 'success' && (
                        <>
                            <h2 className="text-[32px] font-bold tracking-tight text-[#111]">
                                Поддержка
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
                <div className="flex-1 overflow-y-auto custom-scrollbar px-[8vw] pt-0 pb-8">
                    {orderStatus === 'success' ? (
                        <div
                            ref={successRef}
                            className="h-full flex flex-col items-center justify-center text-center px-10"
                            style={{ marginTop: '-60px' }}
                        >
                            <h3 className="text-2xl font-black tracking-tighter text-[#111] uppercase mb-2">Запрос отправлен!</h3>
                            <p className="text-sm font-medium text-[#111] opacity-60">Мы скоро свяжемся с вами для подтверждения.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col !gap-8 pb-10">
                            {/* Product List - EXACTLY AS IN CART */}
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    id={`support-item-${item.id}`}
                                    className="flex items-center gap-4 group my-[10px]"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-[80px] h-[80px] bg-[#f5f5f5] rounded-[18px] overflow-hidden shrink-0 shadow-sm transition-transform duration-500">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                <Image src="/edit_chat.svg" alt="Support" width={32} height={32} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 pl-[10px]">
                                        <div className="bg-[#111] px-2 py-0.5 rounded-[6px] inline-block font-black text-[9px] text-white uppercase tracking-wider mb-1">
                                            SOLD
                                        </div>
                                        <p
                                            className="text-[18px] font-bold text-[#111] leading-tight tracking-tight"
                                            style={{ margin: 0, marginBottom: '4px' }}
                                        >
                                            {item.title}
                                        </p>
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

                            <div className="pt-4 flex flex-col gap-10">
                                <p className="text-[16px] font-medium text-[#111] opacity-30 leading-relaxed pr-[10%]">
                                    {items.length > 0 
                                        ? "Вы выбрали товары для уведомления. Мы сообщим вам о пополнении."
                                        : "Есть вопрос или предложение? Оставьте свои контакты, и мы свяжемся с вами."
                                    }
                                </p>

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
                                    style={{ marginTop: '10px' }}
                                >
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    <span style={{ transform: 'translateY(1px)' }}>Отправить запрос</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
