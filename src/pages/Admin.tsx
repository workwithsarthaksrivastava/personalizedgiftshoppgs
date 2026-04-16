import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Plus, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Upload,
  X,
  ChevronRight,
  Frame as FrameIcon,
  Edit2,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// --- Dashboard Component ---
const Dashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Orders', value: '0', icon: <ShoppingCart />, color: 'text-blue-400' },
    { label: 'Pending Orders', value: '0', icon: <Clock />, color: 'text-yellow-400' },
    { label: 'Revenue', value: '₹0', icon: <TrendingUp />, color: 'text-green-400' },
    { label: 'Customers', value: '0', icon: <Users />, color: 'text-purple-400' },
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if ((supabase as any).supabaseUrl.includes('placeholder')) {
        toast.error('Supabase not configured. Add secrets to enable analytics.');
        return;
      }
      const { data: orders } = await supabase.from('orders').select('*');
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      if (orders) {
        const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const pending = orders.filter(o => o.status === 'Order Placed' || o.status === 'Design Under Review').length;
        
        setStats([
          { label: 'Total Orders', value: orders.length.toString(), icon: <ShoppingCart />, color: 'text-blue-400' },
          { label: 'Pending Orders', value: pending.toString(), icon: <Clock />, color: 'text-yellow-400' },
          { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <TrendingUp />, color: 'text-green-400' },
          { label: 'Customers', value: (profiles?.length || 0).toString(), icon: <Users />, color: 'text-purple-400' },
        ]);

        setRecentOrders(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 bg-white/5 rounded-xl", stat.color)}>{stat.icon}</div>
            </div>
            <p className="text-muted text-sm mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="glass p-8 rounded-3xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" /> Recent Orders
        </h3>
        <div className="space-y-4">
          {recentOrders.map((order, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold font-bold text-xs">
                  #{order.order_id.split('-')[1]}
                </div>
                <div>
                  <p className="text-sm font-bold">{order.customer_name}</p>
                  <p className="text-xs text-muted">{order.items?.length || 0} items • ₹{order.total}</p>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-full uppercase",
                order.status === 'Delivered' ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
              )}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Products Management Component ---
const ProductsManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Photo Frames',
    price: '',
    original_price: '',
    description: '',
    image: '',
    images: [] as string[]
  });

  const categories = ['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if ((supabase as any).supabaseUrl.includes('placeholder')) return;
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((supabase as any).supabaseUrl.includes('placeholder')) {
      toast.error('Cannot add product: Supabase not configured.');
      return;
    }
    const { error } = await supabase.from('products').insert([{
      ...newProduct,
      price: parseFloat(newProduct.price),
      original_price: parseFloat(newProduct.original_price) || null,
      images: newProduct.images.length > 0 ? newProduct.images : [newProduct.image]
    }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Product added successfully');
      setIsAdding(false);
      setNewProduct({ name: '', category: 'Photo Frames', price: '', original_price: '', description: '', image: '', images: [] });
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMain) {
          setNewProduct(prev => ({ ...prev, image: reader.result as string }));
        } else {
          setNewProduct(prev => ({ ...prev, images: [...prev.images, reader.result as string].slice(0, 5) }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gold">Products</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 gold-gradient text-bg font-bold rounded-xl hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {isAdding && (
        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">New Product Details</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Product Name</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Category</label>
                <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Price (₹)</label>
                  <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Original Price (₹)</label>
                  <input type="number" value={newProduct.original_price} onChange={e => setNewProduct({...newProduct, original_price: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Description</label>
                <textarea rows={4} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold resize-none" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Main Image</label>
                <div className="flex gap-4 items-center">
                  <label className="flex-grow flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-gold transition-colors">
                    <Upload className="w-6 h-6 text-gold mb-2" />
                    <span className="text-xs text-muted">Upload Main</span>
                    <input type="file" className="hidden" onChange={e => handleImageUpload(e, true)} accept="image/*" />
                  </label>
                  {newProduct.image && <img src={newProduct.image} className="w-32 h-32 object-cover rounded-xl border border-border" />}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Gallery Images (Max 4 more)</label>
                <div className="grid grid-cols-5 gap-2">
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-gold transition-colors">
                    <Plus className="w-4 h-4 text-gold" />
                    <input type="file" className="hidden" onChange={e => handleImageUpload(e, false)} accept="image/*" />
                  </label>
                  {newProduct.images.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={img} className="w-full h-full object-cover rounded-lg border border-border" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNewProduct(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}));
                        }} 
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 hover:scale-110 transition-transform z-10"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform mt-4">Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="glass rounded-2xl overflow-hidden group">
            <div className="aspect-video relative">
              <img src={product.image} className="w-full h-full object-cover" />
              <button 
                onClick={() => handleDeleteProduct(product.id)}
                className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">{product.category}</p>
              <h4 className="font-bold mb-2">{product.name}</h4>
              <p className="text-xl font-bold">₹{product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Frames Management Component ---
const FramesManagement = () => {
  const [frames, setFrames] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingFrame, setEditingFrame] = useState<any>(null);
  const [newFrame, setNewFrame] = useState({
    name: '',
    category: 'Wood',
    price: '',
    class_name: '',
    image_url: ''
  });

  const categories = ['Wood', 'Metal', 'Ornate', 'Modern', 'Colorful', 'Graphic'];

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    const { data } = await supabase.from('custom_frames').select('*').order('category', { ascending: true });
    if (data) setFrames(data);
  };

  const handleSaveFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    const frameData = {
      ...newFrame,
      price: parseFloat(newFrame.price)
    };

    let error;
    if (editingFrame) {
      const { error: err } = await supabase.from('custom_frames').update(frameData).eq('id', editingFrame.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('custom_frames').insert([frameData]);
      error = err;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingFrame ? 'Frame updated' : 'Frame added');
      setIsAdding(false);
      setEditingFrame(null);
      setNewFrame({ name: '', category: 'Wood', price: '', class_name: '', image_url: '' });
      fetchFrames();
    }
  };

  const handleFrameImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFrame(prev => ({ ...prev, image_url: reader.result as string, category: 'Graphic' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteFrame = async (id: string) => {
    const { error } = await supabase.from('custom_frames').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Frame deleted');
      fetchFrames();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gold">Frame Studio Management</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => { setIsAdding(true); setEditingFrame(null); }}
            className="flex items-center gap-2 px-6 py-3 gold-gradient text-bg font-bold rounded-xl hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" /> Add New Frame
          </button>
        </div>
      </div>

      {(isAdding || editingFrame) && (
        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">{editingFrame ? 'Edit Frame' : 'New Frame Details'}</h3>
            <button onClick={() => { setIsAdding(false); setEditingFrame(null); }} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSaveFrame} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Frame Name</label>
                <input required value={newFrame.name} onChange={e => setNewFrame({...newFrame, name: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Category</label>
                <select value={newFrame.category} onChange={e => setNewFrame({...newFrame, category: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Price (₹)</label>
                <input required type="number" value={newFrame.price} onChange={e => setNewFrame({...newFrame, price: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Frame Type</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setNewFrame({...newFrame, image_url: ''})}
                    className={cn("flex-1 py-2 rounded-lg border text-xs font-bold", !newFrame.image_url ? "bg-gold text-bg border-gold" : "border-border")}
                  >
                    CSS Based
                  </button>
                  <label className={cn("flex-1 py-2 rounded-lg border text-xs font-bold text-center cursor-pointer", newFrame.image_url ? "bg-gold text-bg border-gold" : "border-border")}>
                    Graphic Based
                    <input type="file" className="hidden" onChange={handleFrameImageUpload} accept="image/*" />
                  </label>
                </div>
              </div>

              {newFrame.image_url ? (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Graphic Preview</label>
                  <img src={newFrame.image_url} className="w-full h-32 object-contain rounded-xl border border-border bg-white/5" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">CSS Class Name (Advanced)</label>
                  <textarea rows={4} required={!newFrame.image_url} value={newFrame.class_name} onChange={e => setNewFrame({...newFrame, class_name: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold font-mono text-xs" placeholder="e.border-[16px] border-[#d2b48c] shadow-xl" />
                </div>
              )}
              
              <div className="p-4 bg-white/5 rounded-xl border border-border">
                <p className="text-[10px] text-muted uppercase font-bold mb-4">Final Preview</p>
                <div className="flex justify-center">
                  <div className="relative w-24 h-32 bg-white/10 overflow-hidden">
                    {newFrame.image_url ? (
                      <img src={newFrame.image_url} className="absolute inset-0 w-full h-full object-contain z-10" />
                    ) : (
                      <div className={cn("absolute inset-0", newFrame.class_name)} />
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform">
                {editingFrame ? 'Update Frame' : 'Save Frame'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {frames.map(frame => (
          <div key={frame.id} className="glass p-4 rounded-2xl group relative">
            <div className="aspect-[3/4] mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-white/5 relative">
              {frame.image_url ? (
                <img src={frame.image_url} className="w-full h-full object-contain z-10" />
              ) : (
                <div className={cn("w-2/3 h-2/3 bg-white/10", frame.class_name)} />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gold uppercase">{frame.category}</p>
              <h4 className="font-bold text-sm truncate">{frame.name}</h4>
              <p className="text-sm">₹{frame.price}</p>
            </div>
            
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
              <button 
                onClick={() => {
                  setEditingFrame(frame);
                  setNewFrame({
                    name: frame.name,
                    category: frame.category,
                    price: frame.price.toString(),
                    class_name: frame.class_name || '',
                    image_url: frame.image_url || ''
                  });
                  setIsAdding(false);
                }}
                className="p-2 bg-gold text-bg rounded-lg hover:scale-110 transition-transform"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteFrame(frame.id)}
                className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Orders Management Component ---
const OrdersManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const statuses = ['Order Placed', 'Design Under Review', 'Printing in Progress', 'Packed & Ready', 'Out for Delivery', 'Delivered'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if ((supabase as any).supabaseUrl.includes('placeholder')) return;
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Status updated');
      fetchOrders();
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gold">Orders</h2>
      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-border">
              <th className="p-6 text-xs font-bold uppercase text-muted">Order ID</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Customer</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Total</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Status</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                <td className="p-6 font-mono text-sm text-gold">{order.order_id}</td>
                <td className="p-6">
                  <p className="font-bold">{order.customer_name}</p>
                  <p className="text-xs text-muted">{order.shipping_address?.phone}</p>
                </td>
                <td className="p-6 font-bold">₹{order.total}</td>
                <td className="p-6">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-full uppercase",
                    order.status === 'Delivered' ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
                  )}>
                    {order.status}
                  </span>
                </td>
                <td className="p-6">
                  <select 
                    value={order.status} 
                    onChange={e => handleUpdateStatus(order.id, e.target.value)}
                    className="bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Admin Layout ---
export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Strict Admin Check: Only allow specific email or 'admin' role in DB
        const isAdminEmail = session.user.email === 'sarthaksrivastava1084@gmail.com';
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (isAdminEmail || (profile && profile.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error('Access denied. Admins only.');
          navigate('/');
        }
      } else {
        navigate('/admin/login');
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin/login');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isAdmin === null) return <div className="min-h-screen bg-bg" />;

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Products', path: '/admin/products', icon: <Package className="w-5 h-5" /> },
    { name: 'Frame Studio', path: '/admin/frames', icon: <FrameIcon className="w-5 h-5" /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Customers', path: '/admin/customers', icon: <Users className="w-5 h-5" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-bg pt-20 flex flex-col lg:flex-row">
      {/* Mobile Admin Nav */}
      <div className="lg:hidden flex overflow-x-auto border-b border-border bg-bg/50 backdrop-blur-md sticky top-20 z-40 p-2 gap-2 no-scrollbar">
        {sidebarLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
              location.pathname === link.path ? "bg-gold text-bg" : "bg-white/5 text-muted hover:text-gold"
            )}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-border p-6 hidden lg:flex flex-col gap-8 sticky top-20 h-[calc(100vh-80px)]">
        <div className="space-y-2">
          {sidebarLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                location.pathname === link.path 
                  ? "bg-gold/10 text-gold border border-gold/20" 
                  : "hover:bg-white/5 hover:text-gold"
              )}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>

        <div className="mt-auto">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-400/10 text-red-400 transition-all text-sm font-medium w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 lg:p-12 overflow-y-auto">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="frames" element={<FramesManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<div className="text-muted">Customers List (Coming Soon)</div>} />
          <Route path="settings" element={<div className="text-muted">Settings (Coming Soon)</div>} />
        </Routes>
      </main>
    </div>
  );
}
