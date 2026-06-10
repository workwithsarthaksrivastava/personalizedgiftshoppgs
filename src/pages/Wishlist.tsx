
import React from 'react';
import { useWishlistStore } from '../wishlistStore';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Trash2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../cartStore';
import { toast } from 'sonner';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  const handleAddToCart = (item: any) => {
    addItem({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: 1,
      image: item.image,
      config: item.config
    });
    toast.success('Added to cart');
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-gold mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-muted">Your wishlist is empty.</p>
            <Link to="/products" className="text-gold underline mt-4 block">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div key={JSON.stringify(item)} className="glass p-6 rounded-2xl flex items-center gap-6">
                <img src={item.image} className="w-20 h-20 rounded-lg object-cover" alt={item.productName} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.productName}</h3>
                  <p className="text-gold font-bold">₹{item.price}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="p-2 bg-gold/20 text-gold rounded-full hover:bg-gold/30"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => removeFromWishlist(item.productId, JSON.stringify(item.config))}
                    className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
