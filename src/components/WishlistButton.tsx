
import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../wishlistStore';
import { CartItem } from '../types';
import { cn } from '../lib/utils';

interface WishlistButtonProps {
  item: CartItem;
  className?: string;
}

export function WishlistButton({ item, className }: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const configJson = JSON.stringify(item.config);
  const isFavorited = isInWishlist(item.productId, configJson);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorited) {
      removeFromWishlist(item.productId, configJson);
    } else {
      addToWishlist(item);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      className={cn(
        "p-2 rounded-full transition-all duration-200",
        isFavorited ? "bg-red-500/10 text-red-500" : "bg-white/5 text-white hover:bg-white/10",
        className
      )}
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
    </button>
  );
}
