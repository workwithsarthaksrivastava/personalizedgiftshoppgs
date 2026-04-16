import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchOrders(session.user.id);
      } else {
        navigate('/login');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login');
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchOrders = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gold mb-2">My Orders</h1>
            <p className="text-muted">Welcome back, {user?.displayName || user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 border border-border rounded-full text-sm hover:bg-white/5 transition-all"
          >
            Logout
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted" />
            </div>
            <h3 className="text-2xl font-bold mb-4">No orders yet</h3>
            <p className="text-muted mb-8">Start creating memories with our personalized gifts.</p>
            <Link to="/products" className="px-8 py-3 gold-gradient text-bg font-bold rounded-full hover:scale-105 transition-transform">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 md:p-8 rounded-3xl hover:border-gold/30 transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{order.orderId}</h4>
                      <p className="text-xs text-muted mb-3">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          order.status === 'Delivered' ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
                        )}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end justify-between gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted mb-1">Total Amount</p>
                      <p className="text-xl font-bold text-gold">₹{order.total}</p>
                    </div>
                    <Link 
                      to={`/track?order=${order.orderId}`}
                      className="flex items-center gap-2 text-sm font-bold text-white hover:text-gold transition-colors"
                    >
                      Track Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
