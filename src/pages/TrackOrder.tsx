import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();
      
      if (data) {
        setOrder(data);
      } else {
        toast.error('Order not found. Please check the Order ID.');
        setOrder(null);
      }
      if (error && error.code !== 'PGRST116') throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { status: 'Order Placed', icon: <Clock className="w-6 h-6" /> },
    { status: 'Design Under Review', icon: <AlertCircle className="w-6 h-6" /> },
    { status: 'Printing in Progress', icon: <Package className="w-6 h-6" /> },
    { status: 'Packed & Ready', icon: <Package className="w-6 h-6" /> },
    { status: 'Out for Delivery', icon: <Truck className="w-6 h-6" /> },
    { status: 'Delivered', icon: <CheckCircle2 className="w-6 h-6" /> },
  ];

  const currentStepIndex = order ? steps.findIndex(s => s.status === order.status) : -1;

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gold mb-4">Track Your Order</h1>
          <p className="text-muted">Enter your Order ID to see the real-time status of your memories.</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-4 mb-16">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input 
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g. PGS-2025...)"
              className="w-full bg-surface border border-border rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-gold transition-colors"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-4 gold-gradient text-bg font-bold rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {order && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 md:p-12 rounded-3xl"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border pb-8">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest mb-1">Order ID</p>
                <h3 className="text-xl font-bold text-gold">{order.orderId}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted uppercase tracking-widest mb-1">Estimated Delivery</p>
                <h3 className="text-xl font-bold">3-5 Business Days</h3>
              </div>
            </div>

            <div className="relative space-y-12">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-border z-0" />
              
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={idx} className="relative z-10 flex items-center gap-8">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                      isCompleted ? "bg-gold border-gold text-bg" : "bg-bg border-border text-muted"
                    )}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-bold transition-colors",
                        isCompleted ? "text-white" : "text-muted"
                      )}>
                        {step.status}
                      </h4>
                      {isCurrent && (
                        <p className="text-xs text-gold mt-1 animate-pulse font-medium">Currently at this stage</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 p-6 bg-white/5 rounded-2xl border border-border/50">
              <h4 className="font-bold mb-4">Order Items</h4>
              <div className="space-y-4">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{item.productName} x {item.quantity}</span>
                    <span className="font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-border flex justify-between font-bold text-gold">
                  <span>Total Paid</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
