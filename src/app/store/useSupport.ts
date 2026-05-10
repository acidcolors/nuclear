import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SupportItem {
    id: string;
    title: string;
    price: number | string;
    quantity: number;
    image?: string;
}

interface SupportStore {
    items: SupportItem[];
    isOpen: boolean;
    addItem: (item: SupportItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearSupport: () => void;
    setIsOpen: (isOpen: boolean) => void;
    toggleDrawer: () => void;
}

export const useSupport = create<SupportStore>()(
    persist(
        (set) => ({
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
            clearSupport: () => set({ items: [] }),
            setIsOpen: (isOpen) => set({ isOpen }),
            toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
        }),
        { 
            name: 'support-storage',
            partialize: (state) => ({ items: state.items })
        }
    )
);
