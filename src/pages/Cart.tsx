import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../cartStore';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-muted" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted mb-8">Looks like you haven't added any memories to your cart yet.</p>
        <Link to="/products" className="px-8 py-3 gold-gradient text-bg font-bold rounded-full hover:scale-105 transition-transform">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gold mb-12">Your Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={`${item.productId}-${JSON.stringify(item.config)}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6"
                >
                  <img 
                    src={item.image} 
                    alt={item.productName} 
                    className="w-24 h-24 object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-lg font-bold">{item.productName}</h3>
                    {item.config && (
                      <p className="text-xs text-muted mt-1">Custom Configuration Applied</p>
                    )}
                    <p className="text-gold font-bold mt-2">₹{item.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-bg rounded-lg border border-border">
                      <button 
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), JSON.stringify(item.config))}
                        className="p-2 hover:text-gold transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, JSON.stringify(item.config))}
                        className="p-2 hover:text-gold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.productId, JSON.stringify(item.config))}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-3xl sticky top-32">
              <h3 className="text-2xl font-display font-bold text-gold mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-gold">₹{total}</span>
                </div>
              </div>
              
              <Link 
                to="/checkout"
                className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </Link>
              
              <p className="text-[10px] text-muted text-center mt-6 uppercase tracking-widest">
                Secure Checkout Powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
