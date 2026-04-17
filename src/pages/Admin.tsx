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
  RotateCcw,
  Scissors,
  Square,
  Undo2,
  Check
} from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const ImageAreaSelector = ({ image, area, onChange }: any) => {
  const [mode, setMode] = useState(area?.type || 'rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (mode === 'rect') {
      setIsDrawing(true);
      setStartPoint({ x, y });
      onChange({ type: 'rect', x, y, w: 0, h: 0 });
    } else {
      // Lasso / Polygon mode: starts a path or adds a point
      const newPoints = isDrawing ? [...(area.points || []), { x, y }] : [{ x, y }];
      setIsDrawing(true);
      onChange({ type: 'polygon', points: newPoints });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current || mode !== 'rect') return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    onChange({
      type: 'rect',
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      w: Math.abs(currentX - startPoint.x),
      h: Math.abs(currentY - startPoint.y)
    });
  };

  const handleMouseUp = () => {
    if (mode === 'rect') setIsDrawing(false);
  };

  const handleUndo = () => {
    if (mode === 'lasso' && area.points?.length > 0) {
      const newPoints = area.points.slice(0, -1);
      onChange({ type: 'polygon', points: newPoints });
      if (newPoints.length === 0) setIsDrawing(false);
    }
  };

  const clearSelection = () => {
    setIsDrawing(false);
    onChange(mode === 'rect' ? { type: 'rect', x: 0, y: 0, w: 0, h: 0 } : { type: 'polygon', points: [] });
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={() => { setMode('rect'); clearSelection(); }}
          className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", mode === 'rect' ? "bg-gold text-bg border-gold" : "border-white/10 text-muted")}
        >
          <Square className="w-3.5 h-3.5" /> Marquee
        </button>
        <button
          type="button"
          onClick={() => { setMode('lasso'); clearSelection(); }}
          className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", mode === 'lasso' ? "bg-gold text-bg border-gold" : "border-white/10 text-muted")}
        >
          <Scissors className="w-3.5 h-3.5" /> Lasso
        </button>
        {mode === 'lasso' && area.points?.length > 0 && (
          <>
            <button
              type="button"
              onClick={handleUndo}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-muted hover:text-white transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            {isDrawing && (
              <button
                type="button"
                onClick={() => setIsDrawing(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white border border-green-600 hover:bg-green-600 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Confirm Shape
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={clearSelection}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-muted"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-center bg-black/20 rounded-xl p-4">
          <div
            ref={containerRef}
            className="relative inline-flex cursor-crosshair select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
          <img src={image} className="max-h-64 w-auto pointer-events-none rounded-lg" alt="Preview" />
          
          {mode === 'rect' && area?.type === 'rect' && area.w > 0 && area.h > 0 && (
            <div
              className="absolute border-2 border-gold bg-gold/20"
              style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.w}%`,
                height: `${area.h}%`
              }}
            />
          )}

          {mode === 'lasso' && area?.type === 'polygon' && area.points && area.points.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <polygon
                points={area.points.map((p: any) => `${(p.x * containerRef.current!.offsetWidth) / 100},${(p.y * containerRef.current!.offsetHeight) / 100}`).join(' ')}
                className="fill-gold/20 stroke-gold stroke-2"
              />
              {area.points.map((p: any, i: number) => (
                <circle
                  key={i}
                  cx={`${p.x}%`}
                  cy={`${p.y}%`}
                  r="3"
                  className="fill-gold stroke-bg stroke-1"
                />
              ))}
            </svg>
          )}
        </div>
      </div>
      {mode === 'lasso' && isDrawing && (
        <p className="text-[10px] text-muted font-bold uppercase animate-pulse">
          Click to add points • Close the shape or click Confirm
        </p>
      )}
    </div>
    </div>
  )
};

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
    images: [] as string[],
    areaType: 'full',
    customArea: { type: 'rect', x: 0, y: 0, w: 100, h: 100 }
  });

  const handleAreaTypeChange = (type: string) => {
    let area = newProduct.customArea;
    if (type === 'full') area = { type: 'rect', x: 0, y: 0, w: 100, h: 100 };
    else if (type === 'center') area = { type: 'rect', x: 25, y: 25, w: 50, h: 50 };
    else if (type === 'top_half') area = { type: 'rect', x: 0, y: 0, w: 100, h: 50 };
    
    setNewProduct(prev => ({...prev, areaType: type, customArea: area}));
  };

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
    
    let finalDesc = newProduct.description;
    if (newProduct.customArea) {
      finalDesc += `___CONFIG___${JSON.stringify(newProduct.customArea)}`;
    }

    const { error } = await supabase.from('products').insert([{
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      original_price: parseFloat(newProduct.original_price) || null,
      description: finalDesc,
      image: newProduct.image,
      images: newProduct.images.length > 0 ? newProduct.images : [newProduct.image]
    }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Product added successfully');
      setIsAdding(false);
      setNewProduct({ name: '', category: 'Photo Frames', price: '', original_price: '', description: '', image: '', images: [], areaType: 'full', customArea: { type: 'rect', x: 0, y: 0, w: 100, h: 100 } });
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

              {newProduct.image && (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Customization Area</label>
                  <select 
                    value={newProduct.areaType} 
                    onChange={e => handleAreaTypeChange(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold mb-2"
                  >
                    <option value="full">Full Image (100%)</option>
                    <option value="center">Center Square</option>
                    <option value="top_half">Top Half</option>
                    <option value="custom">Custom (Draw Marquee on Image below)</option>
                  </select>

                  <ImageAreaSelector 
                    image={newProduct.image} 
                    area={newProduct.customArea} 
                    onChange={(area: any) => {
                      if (newProduct.areaType !== 'custom') {
                        setNewProduct(prev => ({...prev, areaType: 'custom'}));
                      }
                      setNewProduct(prev => ({...prev, customArea: area}));
                    }} 
                  />
                  <p className="text-xs text-muted mt-2 text-center">
                    This defines the area where user uploads will be applied.
                  </p>
                </div>
              )}

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
  const [loading, setLoading] = useState(false);
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

  const handleCleanupDuplicates = async () => {
    setLoading(true);
    try {
      const { data: allFrames } = await supabase.from('custom_frames').select('id, name');
      if (!allFrames) return;

      const seen = new Set();
      const duplicateIds: string[] = [];

      allFrames.forEach(frame => {
        if (seen.has(frame.name)) {
          duplicateIds.push(frame.id);
        } else {
          seen.add(frame.name);
        }
      });

      if (duplicateIds.length > 0) {
        const { error } = await supabase.from('custom_frames').delete().in('id', duplicateIds);
        if (error) throw error;
        toast.success(`Removed ${duplicateIds.length} duplicate frames!`);
        fetchFrames();
      } else {
        toast.info('No duplicate frames found.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gold">Frame Studio Management</h2>
        <div className="flex gap-4">
          <button 
            onClick={handleCleanupDuplicates}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-5 h-5" /> Cleanup Duplicates
          </button>
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
              
              <div className="p-4 bg-muted/20 rounded-xl border border-border">
                <p className="text-[10px] text-muted uppercase font-bold mb-4">Final Preview</p>
                <div className="flex justify-center">
                  <div className="relative w-24 h-32 bg-white/5 rounded shadow-inner overflow-hidden">
                    {newFrame.image_url ? (
                      <img src={newFrame.image_url} className="absolute inset-0 w-full h-full object-contain z-10" />
                    ) : (
                      <div 
                        style={getFrameStyles(newFrame.class_name)}
                        className={cn("absolute inset-0", newFrame.class_name)} 
                      />
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
            <div className="aspect-[3/4] mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-bg/50 border border-border/20 relative">
              {frame.image_url ? (
                <img src={frame.image_url} className="w-full h-full object-contain z-10" />
              ) : (
                <div 
                  style={getFrameStyles(frame.class_name)}
                  className={cn("w-2/3 h-2/3 shadow-2xl bg-white/5", frame.class_name)} 
                />
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
              <React.Fragment key={order.id}>
                <tr 
                  onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                  className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer"
                >
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
                  <td className="p-6" onClick={e => e.stopPropagation()}>
                    <select 
                      value={order.status} 
                      onChange={e => handleUpdateStatus(order.id, e.target.value)}
                      className="bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
                {selectedOrderId === order.id && (
                  <tr className="bg-white/[0.02]">
                    <td colSpan={5} className="p-6 border-b border-border/30">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-bold text-gold uppercase tracking-widest">Order Details</h5>
                          <div className="text-right text-xs">
                            <p className="font-bold">Shipping Address:</p>
                            <p className="text-muted">{order.shipping_address?.address}</p>
                            <p className="text-muted">{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pinCode}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                <img src={item.image} className="w-full h-full object-cover" alt="Product" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{item.productName}</p>
                                <p className="text-xs text-muted">Price: ₹{item.price} • Quantity: {item.quantity}</p>
                                {item.config && <p className="text-[10px] text-gold mt-1">Custom Design Applied</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Utility Functions ---
const getFrameStyles = (classStr: string): React.CSSProperties => {
  if (!classStr) return {};
  const styles: React.CSSProperties = {};
  const hexMatch = classStr.match(/border-\[(#[a-fA-F0-9]{3,6})\]/);
  if (hexMatch) styles.borderColor = hexMatch[1];
  else {
    const rgbaMatch = classStr.match(/border-\[(rgba?\(.*?\))\]/);
    if (rgbaMatch) styles.borderColor = rgbaMatch[1];
  }
  const widthMatch = classStr.match(/border-\[(\d+px)\]/);
  if (widthMatch) styles.borderWidth = widthMatch[1];
  return styles;
};

// --- Main Admin Layout ---
export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      // Direct session check based on hardcoded login
      if (localStorage.getItem('admin_session') === 'true') {
        setIsAdmin(true);
        return;
      }
      
      navigate('/admin/login');
    };

    checkAdmin();
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
              localStorage.removeItem('admin_session');
              navigate('/admin/login');
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
