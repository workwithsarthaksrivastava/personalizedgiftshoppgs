import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, configJson?: string) => void;
  updateQuantity: (productId: string, quantity: number, configJson?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) => 
            item.productId === newItem.productId && 
            JSON.stringify(item.config) === JSON.stringify(newItem.config)
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...items, newItem] });
        }
      },
      removeItem: (productId, configJson) => {
        set({
          items: get().items.filter(
            (item) => 
              !(item.productId === productId && JSON.stringify(item.config) === configJson)
          ),
        });
      },
      updateQuantity: (productId, quantity, configJson) => {
        const updatedItems = get().items.map((item) => {
          if (item.productId === productId && JSON.stringify(item.config) === configJson) {
            return { ...item, quantity };
          }
          return item;
        });
        set({ items: updatedItems });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
