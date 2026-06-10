
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './types';

interface WishlistState {
  wishlist: CartItem[];
  addToWishlist: (item: CartItem) => void;
  removeFromWishlist: (productId: string, configJson?: string) => void;
  isInWishlist: (productId: string, configJson?: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      addToWishlist: (newItem) => {
        const wishlist = get().wishlist;
        const exists = wishlist.some(
          (item) => 
            item.productId === newItem.productId && 
            JSON.stringify(item.config) === JSON.stringify(newItem.config)
        );

        if (!exists) {
          set({ wishlist: [...wishlist, newItem] });
        }
      },
      removeFromWishlist: (productId, configJson) => {
        set({
          wishlist: get().wishlist.filter(
            (item) => 
              !(item.productId === productId && JSON.stringify(item.config) === configJson)
          ),
        });
      },
      isInWishlist: (productId, configJson) => {
        return get().wishlist.some(
          (item) => 
            item.productId === productId && JSON.stringify(item.config) === configJson
        );
      }
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
