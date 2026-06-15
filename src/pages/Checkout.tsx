import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../cartStore';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { CreditCard, Truck, ShieldCheck, ArrowRight, CheckCircle2, User, Briefcase, Camera, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Checkout() {
  const { items, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const navigate = useNavigate();
  const total = getTotal();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  const finalTotal = Math.max(0, total - couponDiscount);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    deliveryInstructions: '',
    customerRole: 'Customer',
    customRoleText: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setFormData(prev => ({ ...prev, email: session.user.email || '' }));
      }
    });

    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async () => {
    if (!user) {
      toast.error('Please login to apply a coupon.');
      return;
    }
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode !== 'WELCOME100') {
      toast.error('Invalid coupon code. Try WELCOME100 for your first order!');
      return;
    }

    setIsCheckingCoupon(true);
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      if (error) throw error;

      if (count && count > 0) {
        toast.error('The code WELCOME100 is only valid for your very first order.');
        setCouponDiscount(0);
        setAppliedCoupon(null);
      } else {
        // Flat ₹100 off for every product quantity in the cart
        const productCount = items.reduce((acc, item) => acc + item.quantity, 0);
        const discountAmount = productCount * 100;
        const finalDiscount = Math.min(discountAmount, total);

        setCouponDiscount(finalDiscount);
        setAppliedCoupon('WELCOME100');
        toast.success(`Coupon WELCOME100 applied! You saved ₹${finalDiscount}!`);
      }
    } catch (err: any) {
      console.error('Coupon verification error:', err);
      toast.error('Coupon validation failed. Please try again.');
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    toast.info('Coupon removed.');
  };

  const verifyPaymentAndComplete = async (response: any, orderData: any) => {
    try {
      setLoading(true);
      const res = await fetch('/api/verify-razorpay-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        orderData.status = 'Order Placed'; // Or 'Paid'
        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) throw error;

        setPlacedOrderId(orderData.order_id);
        setStep(3);
        clearCart();
        toast.success('Payment successful & Order placed!');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const dbOrderId = `PGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const roleToStore = formData.customerRole === 'Others' ? formData.customRoleText : formData.customerRole;
      const baseOrderData = {
        order_id: dbOrderId,
        customer_id: user.id,
        customer_name: formData.fullName,
        items,
        total: finalTotal,
        shipping_address: {
          ...formData,
          customer_role: roleToStore,
          applied_coupon: appliedCoupon || null,
          coupon_discount: couponDiscount || 0
        },
      };

      if (paymentMethod === 'cod') {
        const orderData = { ...baseOrderData, status: 'Order Placed' };
        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) throw error;
        
        setPlacedOrderId(dbOrderId);
        setStep(3);
        clearCart();
        toast.success('Order placed successfully!');
        setLoading(false);
      } else if (paymentMethod === 'online') {
        // Create Razorpay Order with final total
        const res = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal, receipt: dbOrderId })
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to initiate payment');
        }

        const options = {
          key: data.key, // Use Razorpay Key ID returned from backend
          amount: data.amount,
          currency: data.currency,
          name: "Photo Genic Studio",
          description: "Order Payment",
          order_id: data.orderId,
          handler: function (response: any) {
            verifyPaymentAndComplete(response, baseOrderData);
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#D4AF37", // Gold color
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
              toast.info('Payment window closed');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error(response.error.description || 'Payment Failed');
          setLoading(false);
        });
        rzp.open();
      }
    } catch (error: any) {
      toast.error(error.message);
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
              <div className="md:col-span-2 border-t border-b border-white/5 py-6 my-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-3">Order Placed As (Select Profile) *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'Customer', label: 'Customer', icon: <User className="w-4.5 h-4.5" /> },
                      { id: 'Business', label: 'Business', icon: <Briefcase className="w-4.5 h-4.5" /> },
                      { id: 'Photographer', label: 'Photographer', icon: <Camera className="w-4.5 h-4.5" /> },
                      { id: 'Others', label: 'Others (Type)', icon: <MoreHorizontal className="w-4.5 h-4.5" /> }
                    ].map((roleOpt) => {
                      const isSelected = formData.customerRole === roleOpt.id;
                      return (
                        <button
                          key={roleOpt.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, customerRole: roleOpt.id }))}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all gap-2 cursor-pointer",
                            isSelected 
                              ? "bg-gold/15 border-gold text-gold font-bold shadow-lg shadow-gold/5" 
                              : "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                          )}
                        >
                          {roleOpt.icon}
                          <span className="text-xs">{roleOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.customerRole === 'Others' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-1.5"
                  >
                    <label className="block text-[10px] font-bold text-gold uppercase tracking-wider">Please specify your profile/role *</label>
                    <input 
                      required
                      type="text" 
                      name="customRoleText" 
                      value={formData.customRoleText} 
                      onChange={handleInputChange} 
                      className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold text-sm text-white font-light" 
                      placeholder="e.g. Wedding Planner, Corporate Gifter, Designer" 
                    />
                  </motion.div>
                )}
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
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={cn("glass p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                    paymentMethod === 'cod' ? "border-gold" : "border-transparent border-border hover:border-gold/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold"><Truck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold">Cash on Delivery</p>
                      <p className="text-xs text-muted">Pay when your order arrives</p>
                    </div>
                  </div>
                  <div className={cn("w-6 h-6 rounded-full border-2", paymentMethod === 'cod' ? "border-[6px] border-gold bg-bg" : "border-border")}></div>
                </div>
                <div 
                  onClick={() => setPaymentMethod('online')}
                  className={cn("glass p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                    paymentMethod === 'online' ? "border-gold" : "border-transparent border-border hover:border-gold/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold">Online Payment (Razorpay)</p>
                      <p className="text-xs text-muted">UPI, Cards, NetBanking, Wallets</p>
                    </div>
                  </div>
                  <div className={cn("w-6 h-6 rounded-full border-2", paymentMethod === 'online' ? "border-[6px] border-gold bg-bg" : "border-border")}></div>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6">Order Total</h3>
                
                {/* Coupon Code Section */}
                <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Promo Code</span>
                    <span className="text-[9px] bg-gold/10 text-gold font-bold px-2 py-0.5 rounded border border-gold/15">WELCOME100 AVAILABLE</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-gold/10 border border-gold/25 p-2.5 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-gold">{appliedCoupon}</p>
                        <p className="text-[9px] text-white/50">₹100 flat discount applied per product quantity</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded cursor-pointer transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 bg-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-gold font-mono tracking-wider placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isCheckingCoupon || !couponCode.trim()}
                        className="px-4 py-2 bg-gold text-bg font-black rounded-xl text-xs hover:scale-[1.02] transition-transform disabled:opacity-50 cursor-pointer"
                      >
                        {isCheckingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-muted"><span>Subtotal</span><span>₹{total}</span></div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-gold text-sm font-semibold">
                      <span>Discount ({appliedCoupon})</span>
                      <span>- ₹{couponDiscount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-green-400">Free</span></div>
                  <div className="pt-4 border-t border-border flex justify-between text-2xl font-bold text-gold font-display">
                    <span>Total</span><span>₹{finalTotal}</span>
                  </div>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Processing...' : `Pay ₹${finalTotal}`}
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
            <p className="text-muted mb-6 max-w-md mx-auto">
              Your order has been placed successfully. We've sent a confirmation email to your inbox.
            </p>
            
            {placedOrderId && (
              <div className="glass p-6 rounded-2xl max-w-sm mx-auto mb-12 border-gold/20">
                <p className="text-xs text-muted uppercase font-bold mb-2">Your Order ID</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-xl font-mono font-bold text-white">{placedOrderId}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(placedOrderId);
                      toast.success('Order ID copied!');
                    }}
                    className="p-2 hover:text-gold transition-colors"
                    title="Copy Order ID"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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
