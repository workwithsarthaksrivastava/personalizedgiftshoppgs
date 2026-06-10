import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle, RefreshCw, ArrowLeftRight, X, Check, ShieldAlert, Download, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Return and Exchange states
  const [showReturnModal, setShowReturnModal] = useState(false);
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of mind / Found alternative gift choice');
  const [cancelNotes, setCancelNotes] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

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

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOrderId = (orderId || '').trim();
    if (!cleanOrderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', cleanOrderId)
        .single();
      
      if (data) {
        let patchedData = { ...data };
        const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
        if (localCancellations[data.order_id]) {
          patchedData = {
            ...data,
            status: localCancellations[data.order_id].status,
            shipping_address: {
              ...(data.shipping_address || {}),
              cancellation_request: localCancellations[data.order_id].cancellation_request || data.shipping_address?.cancellation_request,
              return_request: localCancellations[data.order_id].return_request || data.shipping_address?.return_request
            }
          };
        }
        setOrder(patchedData);
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

  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

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

      const updatedShipping = {
        ...(order.shipping_address || {}),
        cancellation_request: requestPayload
      };

      let query = supabase.from('orders').update({
        status: dbStatus,
        shipping_address: updatedShipping
      });

      if (order.id) {
        query = query.eq('id', order.id);
      } else {
        query = query.eq('order_id', order.order_id);
      }

      const { error } = await query;
      if (error) console.warn("Supabase update error:", error);

      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      localCancellations[order.order_id] = {
        ...(localCancellations[order.order_id] || {}),
        status: dbStatus,
        cancellation_request: requestPayload
      };
      localStorage.setItem('localCancellations', JSON.stringify(localCancellations));

      toast.success('Successfully submitted your cancellation request!', { id: 'cancel-req' });
      setShowCancelModal(false);
      setCancelNotes('');
      
      handleTrack();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit request', { id: 'cancel-req' });
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSubmittingReturn(true);
    toast.loading('Registering your return/exchange request...', { id: 'return-req' });

    try {
      const parentOrderId = order.order_id || order.orderId;
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
        ...(order.shipping_address || {}),
        return_request: returnPayload
      };

      let query = supabase.from('orders').update({
        status: dbStatus,
        shipping_address: updatedShipping
      });

      if (order.id) {
        query = query.eq('id', order.id);
      } else {
        query = query.eq('order_id', parentOrderId);
      }

      const { error } = await query;
      if (error) console.warn("Supabase update error:", error);

      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      localCancellations[parentOrderId] = {
        ...(localCancellations[parentOrderId] || {}),
        status: dbStatus,
        return_request: returnPayload
      };
      localStorage.setItem('localCancellations', JSON.stringify(localCancellations));

      toast.success(`Successfully submitted your ${returnType} request!`, { id: 'return-req' });
      setShowReturnModal(false);
      setNotes('');
      setBankName('');
      setBankAcc('');
      setBankIfsc('');
      setBankHolder('');
      setExchangeDetails('');

      handleTrack();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit request', { id: 'return-req' });
    } finally {
      setSubmittingReturn(false);
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

  let displayStatus = order ? order.status : '';
  if (order) {
    if (order.status === 'Cancellation Requested') {
      displayStatus = 'Cancellation Initiated';
    } else if (order.status === 'Return Requested') {
      displayStatus = 'Return Initiated';
    } else if (order.status === 'Exchange Requested') {
      displayStatus = 'Exchange Initiated';
    } else if (order.status === 'Return Approved') {
      displayStatus = 'Refund Initiated';
    } else if (order.status === 'Refund Completed') {
      displayStatus = 'Refund Processed';
    } else if (order.status === 'Exchange Approved') {
      displayStatus = 'Exchange Approved';
    } else if (order.status === 'Exchange Completed') {
      displayStatus = 'Exchange Processed';
    }
  }

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
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-gold">{order.order_id || order.orderId}</h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    order.status.includes('Delivered') || order.status.includes('Completed') ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    order.status.includes('Cancel') || order.status.includes('Reject') ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    order.status.includes('Return') || order.status.includes('Exchange') || order.status.includes('Refund') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {displayStatus}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted uppercase tracking-widest mb-1">Estimated Delivery</p>
                <h3 className="text-xl font-bold">3-5 Business Days</h3>
              </div>
            </div>

            {/* Active Cancellation Tracking Dashboard */}
            {order.shipping_address?.cancellation_request && (
              <div className="mb-12 bg-red-500/[0.02] border border-red-500/15 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Claims Board Tracker</p>
                      <h3 className="text-md font-bold text-white capitalize">
                        Order Cancellation Review Process
                      </h3>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    order.shipping_address.cancellation_request.status === 'Approved' ? "bg-green-500/10 text-green-400 border border-green-500/15" :
                    order.shipping_address.cancellation_request.status === 'Rejected' ? "bg-red-500/10 text-red-300 border border-red-500/15" :
                    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  )}>
                    Verification Phase: {order.shipping_address.cancellation_request.status}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Claims desk Journey status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Request Filed', active: true, info: 'Review in progress' },
                      { 
                        label: 'Verification Desk', 
                        active: order.shipping_address.cancellation_request.status !== 'Pending', 
                        info: order.shipping_address.cancellation_request.status === 'Rejected' ? 'Claims Mismatched (Declined)' : 
                              order.shipping_address.cancellation_request.status === 'Approved' ? 'Validated & Approved' : 'Under assessment'
                      },
                      { 
                        label: 'Void / Refund', 
                        active: order.shipping_address.cancellation_request.status === 'Approved',
                        info: 'Transaction closed'
                      }
                    ].map((trackStep, trackIdx) => (
                      <div key={trackIdx} className={cn(
                        "p-4 rounded-2xl border transition-all duration-300",
                        trackStep.active 
                          ? "bg-red-500/[0.04] border-red-500/25 text-white" 
                          : "bg-white/[0.01] border-white/5 text-white/30"
                      )}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                            trackStep.active ? "bg-red-400 text-bg font-black" : "bg-white/5 text-white/40"
                          )}>
                            {trackIdx + 1}
                          </div>
                          <p className="font-bold text-xs truncate">{trackStep.label}</p>
                        </div>
                        <p className="text-[9px] text-white/50 leading-relaxed font-light">{trackStep.info}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.shipping_address.cancellation_request.adminNotes && (
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-red-300 font-bold uppercase tracking-wider mb-1">Official Review Desk Resolution Comments:</p>
                    <p className="text-xs italic text-white/90">"{order.shipping_address.cancellation_request.adminNotes}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Active Return/Exchange Tracking Dashboard */}
            {order.shipping_address?.return_request && (
              <div className="mb-12 bg-gold/[0.02] border border-gold/15 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      {order.shipping_address.return_request.type === 'return' ? (
                        <RefreshCw className="w-5 h-5 animate-spin-slow text-red-400" />
                      ) : (
                        <ArrowLeftRight className="w-5 h-5 text-gold" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gold font-bold uppercase tracking-widest">Active Claims Desk Tracking</p>
                      <h3 className="text-md font-bold text-white capitalize">
                        {order.shipping_address.return_request.type === 'return' ? 'Order Return (Refund)' : 'Product Exchange Swap'} Process
                      </h3>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    order.shipping_address.return_request.status === 'Approved' ? "bg-green-500/10 text-green-400 border border-green-500/15" :
                    order.shipping_address.return_request.status === 'Rejected' ? "bg-red-500/10 text-red-300 border border-red-500/15" :
                    order.shipping_address.return_request.status === 'Completed' ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" :
                    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  )}>
                    Verification Phase: {order.shipping_address.return_request.status}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Claims desk Journey status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Claim Filed', active: true, info: 'Review in progress' },
                      { 
                        label: 'Verification Desk', 
                        active: order.shipping_address.return_request.status !== 'Pending', 
                        info: order.shipping_address.return_request.status === 'Rejected' ? 'Claims Mismatched (Declined)' : 
                              order.shipping_address.return_request.status === 'Approved' || order.shipping_address.return_request.status === 'Completed' ? 'Validated & Approved' : 'Under assessment'
                      },
                      { 
                        label: 'Cargo Handover', 
                        active: order.shipping_address.return_request.status === 'Approved' || order.shipping_address.return_request.status === 'Completed',
                        info: 'Collection courier agent assigned'
                      },
                      { 
                        label: order.shipping_address.return_request.type === 'return' ? 'Refund Settled' : 'Replacement Shipped', 
                        active: order.shipping_address.return_request.status === 'Completed',
                        info: 'Transaction closed'
                      }
                    ].map((trackStep, trackIdx) => (
                      <div key={trackIdx} className={cn(
                        "p-4 rounded-2xl border transition-all duration-300",
                        trackStep.active 
                          ? "bg-gold/[0.04] border-gold/25 text-white" 
                          : "bg-white/[0.01] border-white/5 text-white/30"
                      )}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                            trackStep.active ? "bg-gold text-bg font-black" : "bg-white/5 text-white/40"
                          )}>
                            {trackIdx + 1}
                          </div>
                          <p className="font-bold text-xs truncate">{trackStep.label}</p>
                        </div>
                        <p className="text-[9px] text-white/50 leading-relaxed font-light">{trackStep.info}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.shipping_address.return_request.adminNotes && (
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-wider mb-1">Official Review Desk Resolution Comments:</p>
                    <p className="text-xs italic text-white/90">"{order.shipping_address.return_request.adminNotes}"</p>
                  </div>
                )}
              </div>
            )}

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

            {/* INITIATION ACTIONS PANEL */}
            <div className="mt-12 p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col gap-4">
              {order.status === 'Delivered' ? (
                // Delivered order return/exchange options
                !order.shipping_address?.return_request ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Order Hassle-free Gifting Guarantee active
                      </p>
                      <p className="text-[10px] text-muted font-light mt-0.5">
                        Eligible for return and exchange query under 7 days of delivery.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => {
                          setReturnType('return');
                          setShowReturnModal(true);
                        }}
                        className="flex-grow sm:flex-initial px-5 py-2.5 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold rounded-xl transition-all cursor-pointer animate-fade-in"
                      >
                        Return Order
                      </button>
                      <button
                        onClick={() => {
                          setReturnType('exchange');
                          setShowReturnModal(true);
                        }}
                        className="flex-grow sm:flex-initial px-5 py-2.5 bg-gold/15 hover:bg-gold/25 text-gold border border-gold/25 text-xs font-bold rounded-xl transition-all cursor-pointer animate-fade-in"
                      >
                        Request Exchange
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/50 text-center py-2 italic font-light">Return / Exchange claim request has been registered for this customer.</p>
                )
              ) : (
                // Active order cancellation options
                order.status !== 'Cancelled' && 
                order.status !== 'Cancellation Requested' && 
                order.status !== 'Canceled' && 
                !order.shipping_address?.cancellation_request ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-gold flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gold" /> Order Cancellation Period Active
                      </p>
                      <p className="text-[10px] text-muted font-light mt-0.5">
                        Our customization desk is preparing your frame. You can request a cancellation now if needed.
                      </p>
                    </div>
                    <div className="w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => {
                          setShowCancelModal(true);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 text-xs font-bold rounded-xl transition-all cursor-pointer animate-fade-in"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/50 text-center py-2 italic font-light">Cancellation request process active or finalized under desk review.</p>
                )
              )}
            </div>

            {/* Complete Receiver contact & Shipping Address details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 bg-white/[0.01] border border-white/5 p-6 rounded-3xl">
              {/* Receiver Profile card */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gold flex items-center gap-2">
                  <User className="w-4 h-4" /> Receiver & Contact Details
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Purchaser Name:</span>
                    <span className="font-bold text-white">{order.shipping_address?.fullName || order.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Active Mobile Number:</span>
                    <span className="font-mono text-white">{order.shipping_address?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="text-white/40">Registered Email Address:</span>
                    <span className="text-white font-mono break-all">{order.shipping_address?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Gifting Type Segment:</span>
                    <span className="px-2 py-0.5 bg-gold/10 text-gold border border-gold/15 text-[10px] rounded font-bold uppercase">
                      {order.shipping_address?.customer_role || 'Customer'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-1.5">
                  <span className="text-white/40 text-xs block">Full Ship-To Address:</span>
                  <p className="text-xs text-white bg-[#0b0b0d]/50 p-3 rounded-xl border border-white/5 leading-relaxed font-medium">
                    {order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.state} - <span className="font-mono font-bold text-gold">{order.shipping_address?.pinCode}</span>
                  </p>
                </div>
              </div>

              {/* Delivery Schedule & Preferences */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
                <h4 className="font-bold text-sm text-gold flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Order Logistics & Payments
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Settlement Method:</span>
                    <span className="font-bold text-white uppercase text-[10px] p-0.5 px-2 rounded bg-white/5 border border-white/5">
                      {order.shipping_address?.paymentMethod === 'online' ? 'Prepaid (Through Razorpay)' : 'Cash on Delivery (COD)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Delivery Method:</span>
                    <span className="text-white">PGS Express Gifting Delivery</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Package Status:</span>
                    <span className="font-bold text-emerald-400 uppercase tracking-widest">{order.status}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-1.5">
                  <span className="text-white/40 text-xs block">Delivery instruction / Guidelines:</span>
                  <p className="text-xs text-white/80 bg-[#0b0b0d]/50 p-3 rounded-xl border border-white/5 min-h-[64px] italic leading-relaxed font-light">
                    {order.shipping_address?.deliveryInstructions || 'No specific delivery instructions filled.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-border/50">
              <h4 className="font-bold mb-4">Order Items</h4>
              <div className="space-y-4">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-border/50">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" alt={item.productName} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{item.productName}</p>
                          <p className="text-xs text-muted mt-0.5">Quantity: <span className="text-white font-medium">{item.quantity}</span> • Price: <span className="text-white font-medium">₹{item.price}</span></p>
                          
                          {/* Item Custom configurator specifications */}
                          {item.config && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {Object.entries(item.config).map(([key, val]: any) => {
                                if (['uploadedImage', 'customizedImageUrl', 'regionFinalImages', 'imageUrl', 'image'].includes(key)) return null;
                                if (typeof val !== 'string' && typeof val !== 'number') return null;
                                return (
                                  <span key={key} className="inline-block text-[9px] bg-white/10 border border-white/10 px-2 py-0.5 rounded text-white/70">
                                    <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {String(val)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-sm text-gold">₹{item.price * item.quantity}</span>
                    </div>

                    {/* Artwork Downloads for User */}
                    {(item.config?.uploadedImage || item.config?.customizedImageUrl || item.config?.regionFinalImages?.length > 0) && (
                      <div className="pl-16">
                         <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">Your Artwork</p>
                         <div className="flex flex-wrap gap-2">
                           {item.config?.regionFinalImages?.map((rImage: string, rIdx: number) => rImage ? (
                             <a 
                               key={rIdx}
                               href={rImage} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               download={`region_${rIdx + 1}_${order.order_id}.jpg`}
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
                <div className="pt-4 border-t border-border flex justify-between font-bold text-gold">
                  <span>Total Paid</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Return/Exchange Overlay Modal */}
      <AnimatePresence>
        {showReturnModal && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReturnModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl glass p-6 md:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-[9px] font-bold text-amber-300 uppercase tracking-widest animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Secure Refund/Exchange Center
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {returnType === 'return' ? 'Process Item Return & Refund' : 'Request Exchange Alternative'}
                  </h3>
                  <p className="text-xs text-white/50">Order ID: {order.order_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
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
                      <option key={i} value={r} className="bg-bg text-black">{r}</option>
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
                    onClick={() => setShowReturnModal(false)}
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
        {showCancelModal && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl glass p-6 md:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/25 text-[9px] font-bold text-red-400 uppercase tracking-widest">
                    <ShieldAlert className="w-3 h-3" /> Secure Purchase Cancellation
                  </div>
                  <h3 className="text-xl font-bold text-white">Cancel Your Order</h3>
                  <p className="text-xs text-white/50">Order ID: {order.order_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
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
                      <option key={i} value={r} className="bg-bg text-black">{r}</option>
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
                    onClick={() => setShowCancelModal(false)}
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
    </div>
  );
}
