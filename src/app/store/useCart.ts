import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    title: string;
    price: number | string;
    quantity: number;
    image?: string;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    totalPrice: () => number;
    totalItems: () => number;
    setIsOpen: (isOpen: boolean) => void;
    toggleDrawer: () => void;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            addItem: (newItem) => set((state) => {
                const existing = state.items.find(i => i.id === newItem.id);
                if (existing) {
                    return {
                        items: state.items.map(i =>
                            i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
                        )
                    };
                }
                return { 
                    items: [...state.items, { ...newItem, quantity: 1 }]
                };
            }),
            removeItem: (id) => set((state) => ({
                items: state.items.filter(i => i.id !== id)
            })),
            updateQuantity: (id, quantity) => set((state) => ({
                items: state.items.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
            })),
            clearCart: () => set({ items: [] }),
            totalPrice: () => {
                return get().items.reduce((acc, item) => {
                    const price = typeof item.price === 'string' 
                        ? parseFloat(item.price.replace(/\s/g, '')) 
                        : item.price;
                    return acc + (isNaN(price) ? 0 : price * item.quantity);
                }, 0);
            },
            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            setIsOpen: (isOpen) => set({ isOpen }),
            toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
        }),
        { 
            name: 'cart-storage',
            partialize: (state) => ({ items: state.items }) // Only persist items, not isOpen state
        }
    )
);