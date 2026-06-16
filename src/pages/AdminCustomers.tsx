import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Phone, MapPin, Package, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    if (ordersData) {
      setOrders(ordersData);
      
      // Group orders by customer. Using customer_id if available, otherwise email/phone hash.
      const customerMap = new Map<string, any>();
      
      ordersData.forEach(order => {
        // Fallback id for older orders without customer_id
        const customerId = order.customer_id || order.shipping_address?.email || order.shipping_address?.phone || 'unknown';
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: order.customer_name || order.shipping_address?.fullName || 'Unknown Customer',
            email: order.shipping_address?.email || 'N/A',
            phone: order.shipping_address?.phone || 'N/A',
            address: order.shipping_address ? `${order.shipping_address.address}, ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pinCode}` : 'N/A',
            totalSpent: 0,
            ordersCount: 0,
            orders: []
          });
        }
        
        const customer = customerMap.get(customerId);
        customer.orders.push(order);
        customer.ordersCount += 1;
        customer.totalSpent += (order.total || 0);
        
        // Ensure name, email and phone are updated if they were missing in previous orders
        if (customer.name === 'Unknown Customer' && order.customer_name) customer.name = order.customer_name;
        if (customer.email === 'N/A' && order.shipping_address?.email) customer.email = order.shipping_address.email;
        if (customer.phone === 'N/A' && order.shipping_address?.phone) customer.phone = order.shipping_address.phone;
      });
      
      const customersList = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(customersList);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-white p-8 animate-pulse text-center w-full">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-white mb-6">Customers Base</h2>
      
      <div className="grid gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xl uppercase shrink-0">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display mb-1">{customer.name}</h3>
                  <div className="flex flex-col gap-1 text-sm text-white/60">
                    {customer.email !== 'N/A' && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {customer.email}</div>}
                    {customer.phone !== 'N/A' && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {customer.phone}</div>}
                    {customer.address !== 'N/A' && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {customer.address}</div>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 bg-black/20 p-4 rounded-xl shrink-0">
                <div className="text-center">
                  <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Total Spent</p>
                  <p className="text-xl font-bold text-gold">₹{customer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Orders</p>
                  <p className="text-xl font-bold text-white">{customer.ordersCount}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
              className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {expandedCustomer === customer.id ? (
                <><ChevronUp className="w-5 h-5" /> Hide Orders</>
              ) : (
                <><ChevronDown className="w-5 h-5" /> View {customer.ordersCount} Orders</>
              )}
            </button>

            {expandedCustomer === customer.id && (
              <div className="mt-4 space-y-4 pt-4 border-t border-white/5">
                {customer.orders.map((order: any) => (
                  <div key={order.id} className="bg-black/30 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gold font-bold">#{order.order_id}</span>
                        <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="text-xs px-2 py-1 bg-gold/20 text-gold rounded-full whitespace-nowrap">{order.status}</span>
                      </div>
                      <p className="text-sm text-white/70">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0">
                      <p className="font-bold text-white">₹{order.total?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {customers.length === 0 && (
          <div className="text-center text-white/50 py-12 glass rounded-2xl">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
