import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, ChevronRight, Clock, AlertTriangle, RefreshCw, X, Check, ShieldAlert, ArrowLeftRight, HelpCircle, BarChart3, TrendingUp, Coins, CreditCard, Download, User, Mail, Phone, MapPin, Truck } from 'lucide-react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'stats'>('orders');

  // Return and Exchange states
  const [activeReturnOrder, setActiveReturnOrder] = useState<any>(null);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [selectedReason, setSelectedReason] = useState('Damage in transit / Broken glass or wood frame');
  const [notes, setNotes] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [exchangeDetails, setExchangeDetails] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Cancellation states
  const [activeCancelOrder, setActiveCancelOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Change of mind / Found alternative gift choice');
  const [cancelNotes, setCancelNotes] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Selected Order Detail Modal state
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);

  // Calculate active orders and dynamic stats
  const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Cancellation Requested' && o.status !== 'Canceled');
  const totalSpend = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalSpend / activeOrders.length) : 0;
  const totalItems = activeOrders.reduce((sum, o) => sum + (o.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 1), 0) || 0), 0);

  // Tooltip component custom styled
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121214]/95 border border-white/10 p-3.5 rounded-xl shadow-2xl text-[12px] font-sans">
          <p className="text-white/50 font-medium mb-1">{label}</p>
          <p className="text-gold font-bold text-sm">
            Spend: <span className="font-mono">₹{payload[0].value.toLocaleString('en-IN')}</span>
          </p>
          {payload[0].payload.orderCount > 0 && (
            <p className="text-white/30 text-[10px] mt-0.5">
              {payload[0].payload.orderCount} order{payload[0].payload.orderCount > 1 ? 's' : ''} placed
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate dynamic spending trends over the last 6 months
  const getSpendingTrends = () => {
    const months = [];
    const now = new Date();
    
    // Generate last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      months.push({
        key: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${monthLabel} ${year}`,
        Spend: 0,
        orderCount: 0
      });
    }

    // Accumulate total order spending per month
    activeOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth() + 1;
      const orderKey = `${orderYear}-${String(orderMonth).padStart(2, '0')}`;
      
      const matchingMonth = months.find(m => m.key === orderKey);
      if (matchingMonth) {
        matchingMonth.Spend += Number(order.total) || 0;
        matchingMonth.orderCount += 1;
      }
    });

    return months;
  };

  const chartData = getSpendingTrends();

  const cancellationReasons = [
    'Change of mind / Found alternative gift choice',
    'Incorrect dimensions specified in custom configuration',
    'Incorrect or blurry photo uploaded / Need to re-upload customized orders',
    'Delivery window is too long for my gifting timeline/event',
    'Decided to change frame materials/colors',
    'Duplicate transaction / Ordered twice by mistake',
    'Others (Type custom reason in comments)'
  ];

  const reasons = [
    'Damage in transit / Broken glass or wood frame',
    'Severe color deviation or print quality issues',
    'Incorrect items or specs received',
    'Product differs from my configuration preview',
    'Product missing packaging elements/base stand',
    'Others (Type manual reasons in Description notes)'
  ];

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
      
      // Patch state from local storage where RLS blocks db updates 
      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      const patchedData = (data || []).map(order => {
        if (localCancellations[order.order_id]) {
          return {
            ...order,
            status: localCancellations[order.order_id].status,
            shipping_address: {
              ...(order.shipping_address || {}),
              cancellation_request: localCancellations[order.order_id].cancellation_request,
              return_request: localCancellations[order.order_id].return_request || order.shipping_address?.return_request
            }
          };
        }
        return order;
      });

      setOrders(patchedData);
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

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturnOrder) return;

    setSubmittingReturn(true);
    toast.loading('Registering your return/exchange request...', { id: 'return-req' });

    try {
      const parentOrderId = activeReturnOrder.order_id || activeReturnOrder.orderId;
      const bankDetailsPayload = returnType === 'return' ? {
        bankName,
        accountNumber: bankAcc,
        ifscCode: bankIfsc,
        holderName: bankHolder
      } : null;

      const dbStatus = returnType === 'return' ? 'Return Requested' : 'Exchange Requested';
      const returnPayload = {
        type: returnType,
        reason: selectedReason,
        notes: notes,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
        adminNotes: '',
        bankDetails: bankDetailsPayload,
        exchangeDetails: returnType === 'exchange' ? exchangeDetails : ''
      };

      const updatedShipping = {
        ...(activeReturnOrder.shipping_address || {}),
        return_request: returnPayload
      };

      let query = supabase.from('orders').update({
        status: dbStatus,
        shipping_address: updatedShipping
      });

      if (activeReturnOrder.id) {
        query = query.eq('id', activeReturnOrder.id);
      } else {
        query = query.eq('order_id', parentOrderId);
      }

      const { error } = await query;
      if (error) console.warn("Supabase update error:", error);

      // Save locally to patch UI since RLS might block actual update
      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      localCancellations[parentOrderId] = {
        ...(localCancellations[parentOrderId] || {}),
        status: dbStatus,
        return_request: returnPayload
      };
      localStorage.setItem('localCancellations', JSON.stringify(localCancellations));

      toast.success(`Successfully submitted your ${returnType} request!`, { id: 'return-req' });
      setActiveReturnOrder(null);
      
      // Reset form variables
      setNotes('');
      setBankName('');
      setBankAcc('');
      setBankIfsc('');
      setBankHolder('');
      setExchangeDetails('');

      if (user) {
        fetchOrders(user.id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit request', { id: 'return-req' });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCancelOrder) return;

    setSubmittingCancel(true);
    toast.loading('Registering your cancellation request...', { id: 'cancel-req' });

    try {
      const dbStatus = 'Cancellation Requested';
      const requestPayload = {
        reason: cancelReason,
        notes: cancelNotes,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
        adminNotes: ''
      };

      // Store in nested shipping_address field to guarantee schema compatibility
      const updatedShipping = {
        ...(activeCancelOrder.shipping_address || {}),
        cancellation_request: requestPayload
      };

      let query = supabase.from('orders').update({
        status: dbStatus,
        shipping_address: updatedShipping
      });

      if (activeCancelOrder.id) {
        query = query.eq('id', activeCancelOrder.id);
      } else {
        query = query.eq('order_id', activeCancelOrder.order_id);
      }

      const { error } = await query;

      if (error) console.warn("Supabase update error:", error);

      // Save locally to patch UI since RLS might block actual update
      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      localCancellations[activeCancelOrder.order_id] = {
        ...(localCancellations[activeCancelOrder.order_id] || {}),
        status: dbStatus,
        cancellation_request: requestPayload
      };
      localStorage.setItem('localCancellations', JSON.stringify(localCancellations));

      toast.success('Successfully submitted your cancellation request!', { id: 'cancel-req' });
      setActiveCancelOrder(null);
      setCancelNotes('');

      if (user) {
        fetchOrders(user.id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit request', { id: 'cancel-req' });
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gold mb-2">My Orders</h1>
            <p className="text-muted">Welcome back, {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 border border-border rounded-full text-sm hover:bg-white/5 transition-all"
          >
            Logout
          </button>
        </div>        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-8 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={cn(
              "pb-4 text-sm font-semibold relative transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'orders' ? "text-gold" : "text-white/40 hover:text-white"
            )}
          >
            <Package className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
            {activeTab === 'orders' && (
              <motion.div layoutId="activeDashboardTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={cn(
              "pb-4 text-sm font-semibold relative transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'stats' ? "text-gold" : "text-white/40 hover:text-white"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span>My Stats & Spending</span>
            {activeTab === 'stats' && (
              <motion.div layoutId="activeDashboardTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        </div>

        {activeTab === 'orders' ? (
          orders.length === 0 ? (
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
              {orders.map((order) => {
                const statusLower = (order.status || '').toLowerCase();
                const isCancelled = statusLower.includes('canc');
                const isCancellationRequested = statusLower === 'cancellation requested' || (order.shipping_address?.cancellation_request && order.shipping_address.cancellation_request.status === 'Pending');
                const isReturnProcess = statusLower.includes('return') || statusLower.includes('exchange') || order.shipping_address?.return_request;

                const isCancellationAllowed = order.status === 'Order Placed' || order.status === 'Design Under Review';

                let isReturnPeriodValid = false;
                let daysRemaining = 0;
                if (order.status === 'Delivered') {
                  const deliveryDateStr = order.shipping_address?.delivery_date;
                  const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr) : new Date(order.created_at);
                  const diffTime = Date.now() - deliveryDate.getTime();
                  const diffDays = diffTime / (1000 * 60 * 60 * 24);
                  if (diffDays <= 7) {
                    isReturnPeriodValid = true;
                    daysRemaining = Math.max(0, Math.ceil(7 - diffDays));
                  }
                }
                const hasEligibleItems = order.items && order.items.length > 0
                  ? order.items.some((item: any) => item.config?.allow_return_exchange !== false)
                  : true;

                let displayStatus = order.status;
                if (order.status === 'Cancellation Requested') {
                  displayStatus = 'Cancellation Initiated';
                } else if (order.status === 'Return Requested') {
                  displayStatus = 'Return Initiated';
                } else if (order.status === 'Exchange Requested') {
                  displayStatus = 'Exchange Initiated';
                } else if (order.status === 'Return Approved') {
                  displayStatus = 'Refund Initiated';
                } else if (order.status === 'Refund Initiated') {
                  displayStatus = 'Refund Initiated';
                } else if (order.status === 'Refund Completed') {
                  displayStatus = 'Refund Processed';
                } else if (order.status === 'Exchange Approved') {
                  displayStatus = 'Exchange Approved';
                } else if (order.status === 'Exchange Completed') {
                  displayStatus = 'Exchange Processed';
                }

                let borderStyle = "border-white/10 hover:border-gold/30";
                let bgOverlay = "bg-white/[0.01]";
                if (isCancelled) {
                  borderStyle = "border-red-500/20 md:border-red-500/30 hover:border-red-500/40";
                  bgOverlay = "bg-red-500/[0.02]";
                } else if (isCancellationRequested) {
                  borderStyle = "border-orange-500/20 md:border-orange-500/30 hover:border-orange-500/40 animate-pulse";
                  bgOverlay = "bg-orange-500/[0.02]";
                } else if (isReturnProcess) {
                  borderStyle = "border-amber-500/20 md:border-amber-500/30 hover:border-amber-500/40";
                  bgOverlay = "bg-amber-500/[0.02]";
                }

                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedOrderDetail(order)}
                    className={cn(
                      "glass p-6 md:p-8 rounded-3xl transition-all border cursor-pointer hover:border-gold/40 hover:bg-white/[0.02] duration-300 relative group",
                      borderStyle,
                      bgOverlay
                    )}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-white/5 pb-6">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold overflow-hidden shrink-0">
                          {order.items && order.items[0]?.image ? (
                            <img src={order.items[0].image} className="w-full h-full object-cover" alt="Product" />
                          ) : (
                            <Package className="w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">{order.order_id}</h4>
                          <p className="text-xs text-muted mb-2">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              order.status.includes('Delivered') ? "bg-green-500/10 text-green-400 border-green-500/20" :
                              isCancelled ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              order.status.includes('Return') || order.status.includes('Exchange') || isReturnProcess ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                              {displayStatus}
                            </span>

                            {order.shipping_address?.cancellation_request && (
                              <span className="px-3 py-1 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                                Cancel Requested ({order.shipping_address.cancellation_request.status})
                              </span>
                            )}

                            {order.shipping_address?.return_request && (
                              <span className="px-3 py-1 rounded-full text-[10px] bg-gold/15 text-gold border border-gold/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
                                {order.shipping_address.return_request.type === 'return' ? 'Return Claim Active' : 'Exchange Claim Active'} ({order.shipping_address.return_request.status})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end justify-between gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted mb-1">Total Amount</p>
                          <p className="text-xl font-bold text-gold font-sans">₹{order.total}</p>
                          {order.shipping_address?.applied_coupon && (
                            <div className="mt-1 flex flex-col items-end gap-0.5">
                              <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/15 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
                                {order.shipping_address.applied_coupon}
                              </span>
                              <span className="text-[9px] text-white/50">
                                Saved ₹{order.shipping_address.coupon_discount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link 
                            to={`/track?order=${order.order_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-gold bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all font-sans shrink-0 border border-white/5"
                          >
                            <span>Track Timeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderDetail(order);
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-bg hover:text-bg bg-gold hover:scale-[1.01] px-4 py-2 rounded-xl transition-all font-sans shrink-0"
                          >
                            <span>Receipt & Address</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  {/* Sub-items list */}
                  <div className="pt-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Items ordered:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3">
                      {order.items?.map((item: any, idX: number) => (
                        <div key={idX} className="flex flex-col gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <img src={item.image} className="w-10 h-10 object-cover rounded-lg" alt={item.productName || 'Custom Frame'} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate">{item.productName}</p>
                              <p className="text-[10px] text-muted-foreground text-white/50">Qty: {item.quantity} • Price: ₹{item.price}</p>
                            </div>
                          </div>
                          
                          {/* Artwork Downloads for User */}
                          {(item.config?.uploadedImage || item.config?.customizedImageUrl || item.config?.regionFinalImages?.length > 0) && (
                            <div className="pt-2 mt-2 border-t border-white/5">
                               <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">Your Artwork</p>
                               <div className="flex flex-wrap gap-2">
                                 {item.config?.regionFinalImages?.map((rImage: string, rIdx: number) => rImage ? (
                                   <a 
                                     key={rIdx}
                                     href={rImage} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     download={`region_${rIdx + 1}_${order.order_id}.jpg`}
                                     onClick={(e) => e.stopPropagation()}
                                     className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded overflow-hidden transition-colors"
                                   >
                                     <img src={rImage} className="w-4 h-4 object-cover rounded-sm" />
                                     <span className="text-[10px] whitespace-nowrap text-white/80">Region {rIdx + 1}</span>
                                     <Download className="w-3 h-3 text-gold ml-1" />
                                   </a>
                                 ) : null)}
                                 
                                 {item.config?.uploadedImage && !item.config?.regionFinalImages && (
                                   <a 
                                     href={item.config.uploadedImage} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     download={`artwork_${order.order_id}.jpg`}
                                     onClick={(e) => e.stopPropagation()}
                                     className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                                   >
                                     <span className="text-[10px] text-white/80">Original</span>
                                     <Download className="w-3 h-3 text-gold" />
                                   </a>
                                 )}
                               </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return/Exchange Action or Active Tracking Area */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                    {order.shipping_address?.return_request ? (
                      // Customer Tracking details for Return/Exchange
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            {order.shipping_address.return_request.type === 'return' ? (
                              <RefreshCw className="w-5 h-5 text-red-400 animate-spin-slow shrink-0" />
                            ) : (
                              <ArrowLeftRight className="w-5 h-5 text-gold shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-bold text-white">
                                {order.shipping_address.return_request.type === 'return' ? 'Corporate Return Request' : 'Exchange Replacement'} Progress
                              </p>
                              <p className="text-[10px] text-muted-foreground text-white/50">
                                Reason: {order.shipping_address.return_request.reason}
                              </p>
                            </div>
                          </div>

                          {/* Return Request Status Badge */}
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.shipping_address.return_request.status === 'Approved' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            order.shipping_address.return_request.status === 'Rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            order.shipping_address.return_request.status === 'Completed' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          )}>
                            Request State: {order.shipping_address.return_request.status}
                          </div>
                        </div>

                        {/* Timeline steps */}
                        <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
                          {[
                            { label: 'Submitted', active: true, desc: 'Under Review' },
                            { 
                              label: 'Review Result', 
                              active: order.shipping_address.return_request.status !== 'Pending',
                              desc: order.shipping_address.return_request.status === 'Rejected' ? 'Rejected' : 
                                    order.shipping_address.return_request.status === 'Approved' || order.shipping_address.return_request.status === 'Completed' ? 'Approved' : 'Pending font-sans'
                            },
                            { 
                              label: 'Pickup / Dispatched', 
                              active: order.shipping_address.return_request.status === 'Approved' || order.shipping_address.return_request.status === 'Completed',
                              desc: 'Processing logistic handover'
                            },
                            { 
                              label: order.shipping_address.return_request.type === 'return' ? 'Refund Credited' : 'Replacement Delivered', 
                              active: order.shipping_address.return_request.status === 'Completed',
                              desc: 'Completed'
                            }
                          ].map((timelineStep, timelineIdx) => (
                            <div key={timelineIdx} className="space-y-2">
                              <div className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                timelineStep.active ? "bg-gold shadow-sm shadow-gold/20" : "bg-white/5"
                              )} />
                              <div className="px-1">
                                <p className={cn("font-bold", timelineStep.active ? "text-white" : "text-white/30")}>
                                  {timelineStep.label}
                                </p>
                                <p className="text-[8px] text-muted-foreground text-white/45 hidden sm:block truncate mt-0.5">
                                  {timelineStep.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.shipping_address.return_request.adminNotes && (
                          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-muted font-light space-y-1">
                            <p className="font-bold text-white text-[10px] tracking-wider uppercase text-gold">Owner Response Note:</p>
                            <p className="italic text-white hover:text-white-85">"{order.shipping_address.return_request.adminNotes}"</p>
                          </div>
                        )}
                      </div>
                    ) : order.status === 'Delivered' ? (
                      // Delivered order has return and exchange option
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-4">
                        <div>
                          {isReturnPeriodValid ? (
                            hasEligibleItems ? (
                              <>
                                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                  <Check className="w-4 h-4 text-emerald-450" /> Order Hassle-free Exchange active
                                </p>
                                <p className="text-[10px] text-muted font-light mt-0.5">
                                  Eligible for return and exchange query for {daysRemaining} more day{daysRemaining !== 1 ? 's' : ''}.
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs font-bold text-white/55 flex items-center gap-1 mr-1">
                                  <X className="w-3.5 h-3.5 text-white/40" /> Returns & Exchanges Locked
                                </p>
                                <p className="text-[10px] text-white/45 font-light mt-0.5">
                                  This custom product/frame was uploaded by the creator with return & exchange disabled.
                                </p>
                              </>
                            )
                          ) : (
                            <>
                              <p className="text-xs font-bold text-white/40 flex items-center gap-1">
                                <X className="w-3.5 h-3.5 text-white/30" /> Return Window Closed
                              </p>
                              <p className="text-[10px] text-white/30 font-light mt-0.5">
                                The 7-day post-delivery returns and exchanges period has expired for this order.
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                          <button
                            disabled={!isReturnPeriodValid || !hasEligibleItems}
                            onClick={(e) => {
                              if (!isReturnPeriodValid || !hasEligibleItems) return;
                              e.stopPropagation();
                              setReturnType('return');
                              setActiveReturnOrder(order);
                            }}
                            className={cn(
                              "flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all border",
                              isReturnPeriodValid && hasEligibleItems
                                ? "bg-red-400/10 hover:bg-red-400/20 text-red-400 border-red-400/20 cursor-pointer"
                                : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-50"
                            )}
                          >
                            Return Order
                          </button>
                          <button
                            disabled={!isReturnPeriodValid || !hasEligibleItems}
                            onClick={(e) => {
                              if (!isReturnPeriodValid || !hasEligibleItems) return;
                              e.stopPropagation();
                              setReturnType('exchange');
                              setActiveReturnOrder(order);
                            }}
                            className={cn(
                              "flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all border",
                              isReturnPeriodValid && hasEligibleItems
                                ? "bg-gold/15 hover:bg-gold/25 text-gold border-gold/25 cursor-pointer"
                                : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-50"
                            )}
                          >
                            Request Exchange
                          </button>
                        </div>
                      </div>
                    ) : order.shipping_address?.cancellation_request ? (
                      // Customer Tracking details for Order Cancellation
                      <div className="bg-white/[0.02] border border-red-500/10 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <X className="w-5 h-5 text-red-400 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-white">
                                Cancellation Request Progress
                              </p>
                              <p className="text-[10px] text-muted-foreground text-white/50">
                                Reason: {order.shipping_address.cancellation_request.reason}
                              </p>
                            </div>
                          </div>

                          {/* Cancellation Request Status Badge */}
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.shipping_address.cancellation_request.status === 'Approved' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            order.shipping_address.cancellation_request.status === 'Rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          )}>
                            Status: {order.shipping_address.cancellation_request.status}
                          </div>
                        </div>

                        {/* Timeline steps */}
                        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px]">
                          {[
                            { label: 'Request Filed', active: true, desc: 'Review in progress' },
                            { 
                              label: 'Review Decision', 
                              active: order.shipping_address.cancellation_request.status !== 'Pending',
                              desc: order.shipping_address.cancellation_request.status === 'Rejected' ? 'Rejected' : 
                                    order.shipping_address.cancellation_request.status === 'Approved' ? 'Approved' : 'Pending Review'
                            },
                            { 
                              label: 'Refund / Release', 
                              active: order.shipping_address.cancellation_request.status === 'Approved',
                              desc: 'Processing void action'
                            }
                          ].map((timelineStep, timelineIdx) => (
                            <div key={timelineIdx} className="space-y-2">
                              <div className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                timelineStep.active ? "bg-red-400 shadow-sm shadow-red-400/20" : "bg-white/5"
                              )} />
                              <div className="px-1">
                                <p className={cn("font-bold", timelineStep.active ? "text-white" : "text-white/30")}>
                                  {timelineStep.label}
                                </p>
                                <p className="text-[8px] text-muted-foreground text-white/45 hidden sm:block truncate mt-0.5">
                                  {timelineStep.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.shipping_address.cancellation_request.adminNotes && (
                          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-muted font-light space-y-1">
                            <p className="font-bold text-white text-[10px] tracking-wider uppercase text-gold">Desk Review Memo:</p>
                            <p className="italic text-white hover:text-white-85">"{order.shipping_address.cancellation_request.adminNotes}"</p>
                          </div>
                        )}
                      </div>
                    ) : order.status === 'Cancelled' ? (
                      <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-red-300 flex items-center justify-center gap-1.5">
                          <X className="w-4 h-4 text-red-300" /> This order has been canceled.
                        </p>
                      </div>
                    ) : (
                      // Customer can request cancellation for active order before Delivery
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                        <div>
                          {isCancellationAllowed ? (
                            <>
                              <p className="text-xs font-bold text-gold flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gold" /> Order Cancellation Period Active
                              </p>
                              <p className="text-[10px] text-muted font-light mt-0.5">
                                Our customization desk is preparing your frame. You can request a cancellation now if needed.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-bold text-white/50 flex items-center gap-1">
                                <X className="w-4 h-4 text-white/40" /> Cancellation Locked (Printing in Progress)
                              </p>
                              <p className="text-[10px] text-white/35 font-light mt-0.5">
                                Your order has entered the printing or fabrication phase. Cancellation is no longer available.
                              </p>
                            </>
                          )}
                        </div>
                        <div className="w-full sm:w-auto shrink-0">
                          <button
                            disabled={!isCancellationAllowed}
                            onClick={(e) => {
                              if (!isCancellationAllowed) return;
                              e.stopPropagation();
                              setActiveCancelOrder(order);
                            }}
                            className={cn(
                              "w-full sm:w-auto px-5 py-2.5 border text-xs font-bold rounded-xl transition-all",
                              isCancellationAllowed
                                ? "bg-red-400/10 hover:bg-red-400/20 text-red-400 border-red-400/20 cursor-pointer"
                                : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-50"
                            )}
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )})}
            </div>
          )
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Spending */}
              <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-gold/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gold/10 rounded-2xl text-gold shrink-0">
                    <Coins className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 font-bold uppercase tracking-wider rounded-md font-mono">
                    Lifetime
                  </span>
                </div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest block font-mono">Total Spending</p>
                <p className="text-3xl font-bold text-white font-sans mt-1 tracking-tight">
                  ₹{totalSpend.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-white/40 mt-2 font-light">
                  Across {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Card 2: Avg Order Value */}
              <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-gold/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gold/10 rounded-2xl text-gold shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 font-bold uppercase tracking-wider rounded-md font-mono">
                    Average
                  </span>
                </div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest block font-mono">Order Ticket</p>
                <p className="text-3xl font-bold text-white font-sans mt-1 tracking-tight">
                  ₹{avgOrderValue.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-white/40 mt-2 font-light">
                  Average amount spent per basket order
                </p>
              </div>

              {/* Card 3: Items Ordered */}
              <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-gold/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gold/10 rounded-2xl text-gold shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 font-bold uppercase tracking-wider rounded-md font-mono">
                    Quantity
                  </span>
                </div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest block font-mono">Custom Gifts</p>
                <p className="text-3xl font-bold text-white font-sans mt-1 tracking-tight">
                  {totalItems} <span className="text-lg font-light text-white/50">Units</span>
                </p>
                <p className="text-[10px] text-white/40 mt-2 font-light">
                  Total personalized gifts ordered
                </p>
              </div>

              {/* Card 4: Customer Status Badge */}
              <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-gold/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gold/10 rounded-2xl text-gold shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 font-bold uppercase tracking-wider rounded-md font-mono">
                    Status
                  </span>
                </div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest block font-mono">Customer Class</p>
                <p className="text-2xl font-bold text-white font-sans mt-1.5 tracking-tight">
                  {activeOrders.length >= 5 ? 'Elite Patron' : activeOrders.length >= 2 ? 'Preferred Gifter' : 'Valued Guest'}
                </p>
                <p className="text-[10px] text-white/40 mt-2 font-light">
                  Based on your premium purchase history
                </p>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gold" />
                    <span>6-Month Spending Trend</span>
                  </h3>
                  <p className="text-xs text-muted-foreground text-white/50 mt-1">
                    Visualizing your premium customized purchases month by month (INR)
                  </p>
                </div>
                <div className="text-xs text-[#121214] bg-gold font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider font-mono self-start sm:self-auto">
                  Interactive Chart
                </div>
              </div>

              <div className="w-full h-[320px] pt-4 select-none">
                {totalSpend === 0 ? (
                  <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 border border-dashed border-white/5 rounded-2xl">
                    <HelpCircle className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-sm font-semibold text-white/60">No recent transactions</p>
                    <p className="text-xs text-white/40 mt-1 max-w-sm">
                      We'll map your custom spending trends once you place your first personalized order.
                    </p>
                    <Link to="/products" className="mt-4 px-6 py-2.5 bg-gold text-[#121214] font-bold text-xs rounded-xl hover:scale-[1.02] transition-transform">
                      Start Designing
                    </Link>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4af37" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#9a7b2c" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="highlightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f3e5ab" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d4af37" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222225" vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#60606a" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        fontFamily="JetBrains Mono, ui-monospace, sans-serif"
                      />
                      <YAxis 
                        stroke="#60606a" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dx={-5}
                        tickFormatter={(value) => `₹${value}`}
                        fontFamily="JetBrains Mono, ui-monospace, sans-serif"
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255, 215, 0, 0.02)' }}
                      />
                      <Bar 
                        dataKey="Spend" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={48}
                      >
                        {chartData.map((entry, index) => {
                          const isCurrent = index === chartData.length - 1;
                          return (
                            <Cell 
                              key={`cell-${index}`}
                              fill={entry.Spend === 0 ? 'rgba(255, 255, 255, 0.02)' : isCurrent ? 'url(#highlightGradient)' : 'url(#goldGradient)'} 
                              stroke={entry.Spend === 0 ? 'rgba(255, 255, 255, 0.05)' : 'none'}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Return & Exchange Overlay Modal */}
      <AnimatePresence>
        {activeReturnOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReturnOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface/95 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl glass p-6 md:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gold/10 border border-gold/25 text-[9px] font-bold text-gold uppercase tracking-widest">
                    <ShieldAlert className="w-3 h-3" /> Customer Gifting Protection
                  </div>
                  <h3 className="text-xl font-bold text-white">Return & Exchange Request</h3>
                  <p className="text-xs text-muted-foreground text-white/50">Order ID: {activeReturnOrder.order_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReturnOrder(null)}
                  className="p-1 px-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4 inline" />
                </button>
              </div>

              {/* Toggle Return vs Exchange */}
              <div className="grid grid-cols-2 p-1 bg-black/30 border border-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReturnType('return')}
                  className={cn(
                    "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    returnType === 'return' ? "bg-red-500/10 text-red-400 border border-red-500/15" : "text-white/60 hover:text-white"
                  )}
                >
                  Return Item (Refund)
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('exchange')}
                  className={cn(
                    "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    returnType === 'exchange' ? "bg-gold/15 text-gold border border-gold/20" : "text-white/60 hover:text-white"
                  )}
                >
                  Exchange (Replacement)
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                {/* Reason Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/50 block tracking-wider">Valid Reason for request *</label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                  >
                    {reasons.map((r, i) => (
                      <option key={i} value={r} className="bg-bg text-white">{r}</option>
                    ))}
                  </select>
                </div>

                {/* Additional Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/50 block tracking-wider">Describe detailed issue *</label>
                  <textarea
                    required
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide specific details about packing condition, photo print defect, wood alignments, or layout mismatches..."
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* Return Conditional Form: Bank Details */}
                {returnType === 'return' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3.5 border-t border-white/5 pt-4"
                  >
                    <p className="text-[11px] font-bold uppercase text-red-300 tracking-wider">
                      Please enter refund settlement bank account
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider text-white/40 font-bold block">Bank Name *</label>
                        <input
                          required
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. ICICI Bank"
                          className="w-full bg-bg border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider text-white/40 font-bold block">A/C Holder Name *</label>
                        <input
                          required
                          type="text"
                          value={bankHolder}
                          onChange={(e) => setBankHolder(e.target.value)}
                          placeholder="Name on bank record"
                          className="w-full bg-bg border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider text-white/40 font-bold block">Account Number *</label>
                        <input
                          required
                          type="text"
                          value={bankAcc}
                          onChange={(e) => setBankAcc(e.target.value)}
                          placeholder="Bank Account Number"
                          className="w-full bg-bg border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider text-white/40 font-bold block">IFSC Code *</label>
                        <input
                          required
                          type="text"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value)}
                          placeholder="e.g. ICIC0001234"
                          className="w-full bg-bg border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Exchange Conditional Form */}
                {returnType === 'exchange' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 border-t border-white/5 pt-4"
                  >
                    <label className="text-[10px] uppercase font-bold text-gold block tracking-wider">Exchange Specifications *</label>
                    <input
                      required
                      type="text"
                      value={exchangeDetails}
                      onChange={(e) => setExchangeDetails(e.target.value)}
                      placeholder="e.g. Exchange for standard glass block version or re-print with alternate high-res photo URL"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold"
                    />
                  </motion.div>
                )}

                {/* Confirm submit buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveReturnOrder(null)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReturn}
                    className="flex-1 py-3 bg-gold text-bg text-xs font-black rounded-xl hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {submittingReturn ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Overlay Modal */}
      <AnimatePresence>
        {activeCancelOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCancelOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface/95 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl glass p-6 md:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/25 text-[9px] font-bold text-red-400 uppercase tracking-widest">
                    <ShieldAlert className="w-3 h-3" /> Secure Purchase Cancellation
                  </div>
                  <h3 className="text-xl font-bold text-white">Cancel Your Order</h3>
                  <p className="text-xs text-muted-foreground text-white/50">Order ID: {activeCancelOrder.order_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCancelOrder(null)}
                  className="p-1 px-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4 inline" />
                </button>
              </div>

              <form onSubmit={handleSubmitCancel} className="space-y-4">
                {/* Reason Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/50 block tracking-wider">Reason for Cancellation *</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold cursor-pointer"
                  >
                    {cancellationReasons.map((r, i) => (
                      <option key={i} value={r} className="bg-bg text-white">{r}</option>
                    ))}
                  </select>
                </div>

                {/* Additional Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/50 block tracking-wider">Additional details / Notes *</label>
                  <textarea
                    required
                    rows={3}
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                    placeholder="Describe specific reasons or custom instructions for cancellation desk review..."
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* Confirm submit buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCancelOrder(null)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCancel}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {submittingCancel ? 'Submitting...' : 'Confirm Cancel Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Order Invoice Receipt Details Overlay Modal */}
      <AnimatePresence>
        {selectedOrderDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetail(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl glass p-6 md:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/15 pb-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gold/10 border border-gold/25 text-[10px] font-bold text-gold uppercase tracking-widest">
                    <Package className="w-3.5 h-3.5" /> Order Invoice & Specifications
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{selectedOrderDetail.order_id}</h3>
                  <p className="text-xs text-white/50">
                    Placed on {new Date(selectedOrderDetail.created_at).toLocaleDateString()} at {new Date(selectedOrderDetail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid 2 Columns for customer profile, contact, payment status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Customer Profile Details */}
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-gold flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer & Contact Info
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Purchaser Name:</span>
                      <span className="font-bold text-white text-right">{selectedOrderDetail.shipping_address?.fullName || selectedOrderDetail.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Active Phone:</span>
                      <span className="font-mono text-white text-right font-medium">{selectedOrderDetail.shipping_address?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between gap-2 flex-wrap">
                      <span className="text-white/40">Email Address:</span>
                      <span className="text-white break-all text-right font-mono text-[11px]">{selectedOrderDetail.shipping_address?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Gifting Category:</span>
                      <span className="px-2 py-0.5 bg-gold/10 text-gold border border-gold/15 text-[9px] rounded font-bold uppercase tracking-wider">
                        {selectedOrderDetail.shipping_address?.customer_role || 'Personal Gift'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Shipment Timeline Information */}
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-gold flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Logistics & Carrier status
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Logistics Carrier:</span>
                      <span className="text-white font-medium">PGS Express Courier</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Current Status:</span>
                      <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider animate-pulse">
                        {selectedOrderDetail.status}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Estimated Transit:</span>
                      <span className="text-white font-medium">3-5 Business Days</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/40">Payment Option:</span>
                      <span className="font-bold text-white uppercase text-[9px] p-0.5 px-1.5 rounded bg-white/5 border border-white/5">
                        {selectedOrderDetail.shipping_address?.paymentMethod === 'online' ? 'Razorpay Pre-Paid' : 'Cash on Delivery (COD)'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Postal Address & Shipping Comments */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <h4 className="font-bold text-sm text-gold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" /> Complete Delivery Address
                </h4>
                <p className="text-xs text-white/90 leading-relaxed bg-[#0b0b0d]/80 border border-white/10 p-4 rounded-xl font-medium">
                  {selectedOrderDetail.shipping_address?.address}, {selectedOrderDetail.shipping_address?.city}, {selectedOrderDetail.shipping_address?.state} - <span className="font-mono font-bold text-gold">{selectedOrderDetail.shipping_address?.pinCode}</span>
                </p>
                {selectedOrderDetail.shipping_address?.deliveryInstructions && (
                  <div className="mt-2 text-xs">
                    <p className="text-white/40 font-bold uppercase text-[9px] tracking-wider mb-1">Shipping & Gate Instructions:</p>
                    <p className="text-white/80 p-3 bg-white/[0.01] border border-dashed border-white/10 rounded-lg italic">
                      "{selectedOrderDetail.shipping_address.deliveryInstructions}"
                    </p>
                  </div>
                )}
              </div>

              {/* Product Configurations */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gold flex items-center gap-2">
                    <Package className="w-4 h-4" /> Custom Specifications for Ordered Products
                  </h4>
                  <span className="text-[10px] text-white/40 font-mono">
                    {selectedOrderDetail.items?.length || 0} unique custom item(s)
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                  {selectedOrderDetail.items?.map((item: any, i: number) => (
                    <div key={i} className="p-4 bg-[#0a0a0c] border border-white/5 rounded-2xl flex flex-col gap-4">
                      <div className="flex gap-4 items-start justify-between">
                        <div className="flex gap-4">
                          <img src={item.image} className="w-14 h-14 object-cover rounded-xl border border-white/10 bg-white/5 shadow-inner" alt={item.productName} />
                          <div>
                            <p className="font-bold text-sm text-white">{item.productName}</p>
                            <p className="text-xs text-white/50 mt-0.5">Quantity: <span className="text-white font-bold">{item.quantity}</span> • Unit Price: <span className="text-white font-bold">₹{item.price}</span></p>
                          </div>
                        </div>
                        <span className="font-bold text-gold text-sm whitespace-nowrap">₹{item.price * item.quantity}</span>
                      </div>

                      {/* Customize characteristics */}
                      {item.config && (
                        <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 space-y-2">
                          <p className="text-[9px] uppercase tracking-wider text-gold font-bold">Design Customizer choices:</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                            {Object.entries(item.config).map(([key, val]: any) => {
                              if (['uploadedImage', 'customizedImageUrl', 'regionFinalImages', 'imageUrl', 'image'].includes(key)) return null;
                              if (typeof val !== 'string' && typeof val !== 'number') return null;
                              return (
                                <div key={key} className="flex justify-between border-b border-white/[0.02] pb-1">
                                  <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-white font-semibold truncate max-w-[140px] text-right">{String(val)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Artwork downloads inside invoice */}
                      {(item.config?.uploadedImage || item.config?.customizedImageUrl || item.config?.regionFinalImages?.length > 0) && (
                        <div className="bg-[#121215] p-3 rounded-xl border border-white/5">
                          <p className="text-[9px] font-bold text-gold uppercase tracking-wider mb-2">My Custom Artwork Files:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.config?.regionFinalImages?.map((rImage: string, rIdx: number) => rImage ? (
                              <a 
                                key={rIdx}
                                href={rImage} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download={`region_${rIdx + 1}_${selectedOrderDetail.order_id}.jpg`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded overflow-hidden transition-colors"
                              >
                                <img src={rImage} className="w-4 h-4 object-cover rounded-sm" />
                                <span className="text-[9px] text-white/80">Region {rIdx + 1}</span>
                                <Download className="w-3 h-3 text-gold" />
                              </a>
                            ) : null)}
                            
                            {item.config?.uploadedImage && !item.config?.regionFinalImages && (
                              <a 
                                href={item.config.uploadedImage} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download={`artwork_${selectedOrderDetail.order_id}.jpg`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1e] hover:bg-[#25252b] border border-white/10 rounded transition-colors"
                              >
                                <span className="text-[9px] text-white/80 font-medium">Original Artwork File</span>
                                <Download className="w-3 h-3 text-gold" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Discount Summary */}
              <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs space-y-2 border-t border-dashed">
                <div className="flex justify-between">
                  <span className="text-white/50">Initial Subtotal:</span>
                  <span className="font-medium text-white/80 font-mono">₹{selectedOrderDetail.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || selectedOrderDetail.total}</span>
                </div>
                {selectedOrderDetail.shipping_address?.applied_coupon && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-1 font-medium">
                      Saved from coupon {selectedOrderDetail.shipping_address.applied_coupon}:
                    </span>
                    <span className="font-bold font-mono">-₹{selectedOrderDetail.shipping_address.coupon_discount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/5 pt-2.5 text-base font-bold text-gold">
                  <span>Net Amount Paid:</span>
                  <span className="font-sans">₹{selectedOrderDetail.total}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/5 flex gap-3">
                <Link
                  to={`/track?order=${selectedOrderDetail.order_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                >
                  <Clock className="w-4 h-4" />
                  <span>Open Tracking Board</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderDetail(null);
                  }}
                  className="flex-1 py-3 bg-gold text-bg text-xs font-black rounded-xl transition-all hover:scale-[1.01] active:scale-[98]"
                >
                  Close Receipt invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
