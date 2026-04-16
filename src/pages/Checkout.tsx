import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../cartStore';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { CreditCard, Truck, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Checkout() {
  const { items, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const total = getTotal();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    deliveryInstructions: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setFormData(prev => ({ ...prev, email: session.user.email || '' }));
      }
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const orderId = `PGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const orderData = {
        order_id: orderId,
        customer_id: user.id,
        customer_name: formData.fullName,
        items,
        total,
        status: 'Order Placed',
        shipping_address: formData,
      };

      const { error } = await supabase.from('orders').insert([orderData]);
      if (error) throw error;
      
      setStep(3);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-16 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step >= s ? "bg-gold text-bg" : "bg-surface text-muted border border-border"
              )}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              {s < 3 && <div className={cn("w-12 h-1 border-t-2", step > s ? "border-gold" : "border-border")} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-display font-bold text-gold mb-8 flex items-center gap-3">
              <Truck className="w-8 h-8" /> Shipping Details
            </h2>
            <div className="glass p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted uppercase mb-2">Full Name</label>
                <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Phone Number</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" placeholder="+91 00000 00000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Email Address</label>
                <input name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" placeholder="john@example.com" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted uppercase mb-2">Full Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold resize-none" placeholder="House No, Street, Landmark..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">City</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" placeholder="Muzaffarpur" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">PIN Code</label>
                <input name="pinCode" value={formData.pinCode} onChange={handleInputChange} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" placeholder="842001" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted uppercase mb-2">Additional Delivery Instructions</label>
                <textarea name="deliveryInstructions" value={formData.deliveryInstructions} onChange={handleInputChange} rows={2} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold resize-none" placeholder="E.g., Leave at the front door, Call before delivery..." />
              </div>
              <button 
                onClick={() => setStep(2)}
                className="md:col-span-2 mt-4 py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                Continue to Payment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-display font-bold text-gold mb-8 flex items-center gap-3">
              <CreditCard className="w-8 h-8" /> Payment Method
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-6 rounded-2xl border-2 border-gold flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold"><Truck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold">Cash on Delivery</p>
                      <p className="text-xs text-muted">Pay when your order arrives</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full border-4 border-gold bg-bg"></div>
                </div>
                <div className="glass p-6 rounded-2xl border border-border opacity-50 cursor-not-allowed flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-muted"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold">Online Payment</p>
                      <p className="text-xs text-muted">Coming soon</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-border"></div>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6">Order Total</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-muted"><span>Subtotal</span><span>₹{total}</span></div>
                  <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-green-400">Free</span></div>
                  <div className="pt-4 border-t border-border flex justify-between text-2xl font-bold text-gold">
                    <span>Total</span><span>₹{total}</span>
                  </div>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay ₹${total}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-green-400/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-display font-bold text-gold mb-4">Order Confirmed!</h2>
            <p className="text-muted mb-12 max-w-md mx-auto">
              Your order has been placed successfully. We've sent a confirmation email to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/track" className="px-8 py-4 gold-gradient text-bg font-bold rounded-full hover:scale-105 transition-transform">
                Track My Order
              </Link>
              <Link to="/" className="px-8 py-4 border border-border text-white font-bold rounded-full hover:bg-white/5 transition-all">
                Back to Home
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
