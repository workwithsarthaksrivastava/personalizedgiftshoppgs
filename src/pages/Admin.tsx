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
  Check,
  Layers,
  Search,
  Filter,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import AdminSlideshows from './AdminSlideshows';
import AdminCustomers from './AdminCustomers';

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
const SubsectionsManagement = () => {
  const [subsections, setSubsections] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', parent_category: 'Sublimation Gifts', image: '' });
  
  const parentCategories = ['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts'];

  useEffect(() => {
    fetchSubsections();
  }, []);

  const fetchSubsections = async () => {
    const { data } = await supabase.from('products').select('*').eq('category', '_SUBSECTION_').order('created_at', { ascending: false });
    if (data) setSubsections(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesc = `___CONFIG___${JSON.stringify({ parent_category: newSub.parent_category })}`;
    const { error } = await supabase.from('products').insert([{
      name: newSub.name,
      category: '_SUBSECTION_',
      price: 0,
      description: finalDesc,
      image: newSub.image
    }]);

    if (error) toast.error(error.message);
    else {
      toast.success('Subsection added');
      setIsAdding(false);
      setNewSub({ name: '', parent_category: 'Sublimation Gifts', image: '' });
      fetchSubsections();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { toast.success('Deleted'); fetchSubsections(); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewSub(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const parseParent = (desc: string) => {
    try {
      const config = JSON.parse((desc || '').split('___CONFIG___')[1] || '{}');
      return config.parent_category || 'Unknown';
    } catch { return 'Unknown'; }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gold">Subsections</h2>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-6 py-3 gold-gradient text-bg font-bold rounded-xl hover:scale-105 transition-transform"><Plus className="w-5 h-5"/> Add Subsection</button>
      </div>

      {isAdding && (
         <form onSubmit={handleSave} className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-top-4 mb-8">
            <h3 className="text-xl font-bold mb-6">New Subsection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Parent Category</label>
                <select required value={newSub.parent_category} onChange={e => setNewSub({...newSub, parent_category: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold">
                  {parentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Subsection Name</label>
                <input required value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
              </div>
              <div className="md:col-span-2 flex gap-4 items-center">
                 <label className="flex-grow flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-gold transition-colors">
                    <Upload className="w-6 h-6 text-gold mb-2" />
                    <span className="text-xs text-muted">Upload Cover Photo</span>
                    <input type="file" required className="hidden" onChange={handleImageUpload} accept="image/*" />
                 </label>
                 {newSub.image && <img src={newSub.image} className="w-32 h-32 object-cover rounded-xl border border-border" />}
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                 <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 border border-border rounded-xl hover:bg-white/5">Cancel</button>
                 <button type="submit" className="px-6 py-2 bg-gold text-bg font-bold rounded-xl hover:scale-105 transition-transform">Save Subsection</button>
              </div>
            </div>
         </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subsections.map(sub => (
          <div key={sub.id} className="glass p-4 rounded-2xl group relative overflow-hidden">
            <div className="aspect-square mb-4 rounded-lg overflow-hidden relative">
              <img src={sub.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <h4 className="font-bold text-lg text-center">{sub.name}</h4>
            <p className="text-xs text-muted text-center italic">{parseParent(sub.description)}</p>
            <button onClick={() => handleDelete(sub.id)} className="absolute top-4 right-4 p-2 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
               <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductsManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Photo Frames',
    subcategory: '',
    price: '',
    original_price: '',
    description: '',
    image: '',
    images: [] as string[],
    areaType: 'full',
    customArea: { type: 'rect', x: 0, y: 0, w: 100, h: 100 },
    customAreas: [] as any[],
    requiresCustomName: false,
    in_stock: true,
    custom_params: [] as { label: string, options: string[], optionsText?: string }[],
    allow_return_exchange: true
  });
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [subsections, setSubsections] = useState<any[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkImages, setBulkImages] = useState<{file: string, name: string}[]>([]);

  const handleAreaTypeChange = (type: string) => {
    let area = newProduct.customArea;
    if (type === 'full') area = { type: 'rect', x: 0, y: 0, w: 100, h: 100 };
    else if (type === 'center') area = { type: 'rect', x: 25, y: 25, w: 50, h: 50 };
    else if (type === 'top_half') area = { type: 'rect', x: 0, y: 0, w: 100, h: 50 };
    
    setNewProduct(prev => ({...prev, areaType: type, customArea: area}));
  };

  const handleAddParam = () => {
    setNewProduct(prev => ({
      ...prev,
      custom_params: [...prev.custom_params, { label: '', options: [], optionsText: '' }]
    }));
  };

  const handleUpdateParam = (index: number, label: string, optionsText: string) => {
    const updated = [...newProduct.custom_params];
    updated[index] = {
      label,
      // Split by comma, space, or newline
      options: optionsText.split(/[,\s\n]+/).map(o => o.trim()).filter(Boolean)
    };
    setNewProduct(prev => ({ ...prev, custom_params: updated }));
  };

  const handleRemoveParam = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      custom_params: prev.custom_params.filter((_, i) => i !== index)
    }));
  };

  const isProductInStock = (product: any) => {
    try {
      const parts = (product.description || '').split('___CONFIG___');
      if (parts.length > 1) {
        const config = JSON.parse(parts[1]);
        if (typeof config.in_stock !== 'undefined') return !!config.in_stock;
      }
    } catch(e) {}
    return true; // default true
  };

  const isProductHero = (product: any) => {
    try {
      const parts = (product.description || '').split('___CONFIG___');
      if (parts.length > 1) {
        const configStr = parts.slice(1).join('___CONFIG___');
        const config = JSON.parse(configStr);
        console.log('isProductHero for', product.name, configStr, config);
        return !!config.is_hero;
      }
    } catch(e) {
        console.error('Error in isProductHero for', product.name, e);
    }
    return false;
  };

  const toggleProductStock = async (product: any) => {
    const descParts = (product.description || '').split('___CONFIG___');
    const desc = descParts[0];
    const configStr = descParts.slice(1).join('___CONFIG___');
    
    let config: any = { in_stock: true };
    try {
      if (configStr) config = { ...config, ...JSON.parse(configStr) };
    } catch (e) {}
    
    config.in_stock = typeof config.in_stock === 'undefined' ? false : !config.in_stock;
    const newDesc = `${desc}___CONFIG___${JSON.stringify(config)}`;
    
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, description: newDesc } : p));
    
    const { error, data } = await supabase.from('products').update({ description: newDesc }).eq('id', product.id).select();
    if (error) { toast.error(error.message); fetchProducts(); return; }
    if (!data || data.length === 0) { toast.error('Check RLS policies - Failed to update product'); fetchProducts(); return; }

    toast.success('Stock status updated');
  };

  const toggleProductHero = async (product: any) => {
    const descParts = (product.description || '').split('___CONFIG___');
    const desc = descParts[0];
    const configStr = descParts.slice(1).join('___CONFIG___');
    
    let config: any = { is_hero: false };
    try {
      if (configStr) config = { ...config, ...JSON.parse(configStr) };
    } catch (e) {
      console.error('Error parsing config', e);
    }
    
    const isNowHero = !config.is_hero;
    config.is_hero = isNowHero;
    const newDesc = `${desc}___CONFIG___${JSON.stringify(config)}`;
    
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, description: newDesc } : p));
    
    const { error, data } = await supabase.from('products').update({ description: newDesc }).eq('id', product.id).select();
    if (error) { toast.error(error.message); fetchProducts(); return; }
    if (!data || data.length === 0) { toast.error('Check RLS policies - Failed to update product'); fetchProducts(); return; }
    
    toast.success(config.is_hero ? 'Product set as hero' : 'Product removed from hero');
  };

  const [categories, setCategories] = useState<string[]>(['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts']);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if ((supabase as any).supabaseUrl.includes('placeholder')) return;
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) {
      setProducts(data.filter((p: any) => p.category !== '_SUBSECTION_' && !p.category.startsWith('_SLIDESHOW_')));
      setSubsections(data.filter((p: any) => p.category === '_SUBSECTION_'));
      const mainProds = data.filter((p: any) => p.category !== '_SUBSECTION_' && !p.category.startsWith('_SLIDESHOW_'));
      const uniqueCats = Array.from(new Set(mainProds.map((p: any) => p.category))).filter(Boolean);
      const allCats = Array.from(new Set(['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts', ...uniqueCats]));
      setCategories(allCats as string[]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((supabase as any).supabaseUrl.includes('placeholder')) {
      toast.error('Cannot add product: Supabase not configured.');
      return;
    }
    
    if (isBulkMode && bulkImages.length === 0) {
      toast.error('Please upload at least one image for bulk mode');
      return;
    }

    const config = {
      ...newProduct.customArea,
      customAreas: newProduct.customAreas || [],
      requiresCustomName: newProduct.requiresCustomName,
      areaType: newProduct.areaType,
      in_stock: newProduct.in_stock,
      custom_params: newProduct.custom_params,
      subcategory: newProduct.subcategory,
      allow_return_exchange: newProduct.allow_return_exchange
    };
    
    let finalDesc = `${newProduct.description}___CONFIG___${JSON.stringify(config)}`;

    if (isBulkMode) {
      const inserts = bulkImages.map(img => ({
        name: img.name.replace(/\.[^/.]+$/, ""), // remove extension
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        original_price: parseFloat(newProduct.original_price) || null,
        description: finalDesc,
        image: img.file,
        images: [img.file]
      }));

      const { error } = await supabase.from('products').insert(inserts);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Successfully added ${inserts.length} products`);
        setIsAdding(false);
        setNewProduct(prev => ({ ...prev, name: '', image: '', images: [], description: '', allow_return_exchange: true }));
        setBulkImages([]);
        fetchProducts();
      }
    } else {
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
        setNewProduct(prev => ({ ...prev, name: '', image: '', images: [], description: '', allow_return_exchange: true }));
        fetchProducts();
      }
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

  const handleBulkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBulkImages(prev => [...prev, { name: file.name, file: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
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

  const parseParent = (desc: string) => {
    try {
      const config = JSON.parse((desc || '').split('___CONFIG___')[1] || '{}');
      return config.parent_category || 'Unknown';
    } catch { return 'Unknown'; }
  };

  const currentCategorySubs = subsections.filter(s => parseParent(s.description) === newProduct.category);

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
        <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-top-4 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">New Product Details</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isBulkMode}
                  onChange={(e) => setIsBulkMode(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-gold bg-bg accent-gold"
                />
                <span className="text-xs font-bold uppercase tracking-widest text-gold text-nowrap">Bulk Upload Mode</span>
              </label>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>
          </div>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">
                  {isBulkMode ? "Base Product Name (Number will be appended)" : "Product Name"}
                </label>
                <input required={!isBulkMode} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" disabled={isBulkMode} placeholder={isBulkMode ? "Names will be taken from image files" : ""} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Category (Select or Type New)</label>
                <div className="relative">
                  <input 
                    required 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold"
                    list="product-category-options"
                    placeholder="E.g. Clothing, Mugs, Frames..."
                  />
                  <datalist id="product-category-options">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Subsection (Optional)</label>
                <select 
                  value={newProduct.subcategory} 
                  onChange={e => setNewProduct({...newProduct, subcategory: e.target.value})} 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold disabled:opacity-50"
                  disabled={currentCategorySubs.length === 0}
                >
                  <option value="">
                    {currentCategorySubs.length === 0 
                      ? `No subsections in ${newProduct.category || 'this category'}`
                      : `None (Directly under ${newProduct.category})`}
                  </option>
                  {currentCategorySubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="in_stock" 
                    checked={newProduct.in_stock} 
                    onChange={e => setNewProduct({...newProduct, in_stock: e.target.checked})} 
                    className="w-4 h-4 rounded border-border text-gold bg-bg accent-gold"
                  />
                  <label htmlFor="in_stock" className="text-xs font-bold text-muted uppercase cursor-pointer">In Stock</label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="allow_return_exchange" 
                    checked={newProduct.allow_return_exchange} 
                    onChange={e => setNewProduct({...newProduct, allow_return_exchange: e.target.checked})} 
                    className="w-4 h-4 rounded border-border text-gold bg-bg accent-gold"
                  />
                  <label htmlFor="allow_return_exchange" className="text-xs font-bold text-muted uppercase cursor-pointer">Allow Return & Exchange (Delivered orders within 7 Days)</label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted uppercase">Custom Parameters (e.g. Size, Color)</label>
                  <button type="button" onClick={handleAddParam} className="text-[10px] font-bold text-gold hover:underline">
                    + Add Parameter
                  </button>
                </div>
                {newProduct.custom_params.map((param, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl border border-border space-y-3">
                    <div className="flex justify-between gap-2">
                      <input 
                        placeholder="Label (e.g. Size)" 
                        value={param.label} 
                        onChange={e => handleUpdateParam(idx, e.target.value, param.options.join(', '))}
                        className="flex-grow bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                      />
                      <button type="button" onClick={() => handleRemoveParam(idx)} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input 
                      type="text"
                      placeholder="Options (e.g. S M L)" 
                      defaultValue={param.optionsText || param.options.join(' ')} 
                      onBlur={e => handleUpdateParam(idx, param.label, e.target.value)}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {isBulkMode ? (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Upload Multiple Images (Each creates 1 product)</label>
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-gold transition-colors">
                    <Upload className="w-8 h-8 text-gold mb-4" />
                    <span className="text-sm font-bold text-white mb-2">Click to select images</span>
                    <span className="text-xs text-muted">You can select multiple files at once</span>
                    <input type="file" multiple className="hidden" onChange={handleBulkImageUpload} accept="image/*" />
                  </label>
                  
                  {bulkImages.length > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-gold">{bulkImages.length} Images Selected</h4>
                        <button type="button" onClick={() => setBulkImages([])} className="text-xs text-red-500 hover:text-red-400">Clear All</button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {bulkImages.map((img, i) => (
                          <div key={i} className="relative aspect-square group">
                            <img src={img.file} className="w-full h-full object-cover rounded-lg border border-border" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2 text-center text-[10px] break-all">
                              {img.name}
                            </div>
                            <button 
                              type="button"
                              onClick={() => setBulkImages(prev => prev.filter((_, idx) => idx !== i))} 
                              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:scale-110 transition-transform z-10"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                      
                      {newProduct.areaType === 'custom' && (
                        <div className="flex flex-col gap-2 mt-4 items-center bg-black/10 p-3 rounded-lg border border-white/5">
                            <p className="text-xs text-muted">You can add multiple customizable regions for this product.</p>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                onClick={() => setNewProduct(prev => ({...prev, customAreas: [...prev.customAreas, prev.customArea]}))}
                                className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-bold"
                              >
                                Confirm Current selection as Region {newProduct.customAreas.length + 1}
                              </button>
                              {newProduct.customAreas.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setNewProduct(prev => ({...prev, customAreas: []}))}
                                  className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold"
                                >
                                  Clear saved {newProduct.customAreas.length} Region(s)
                                </button>
                              )}
                            </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2 border border-white/10 p-3 rounded-xl bg-black/20">
                          <input 
                            type="checkbox" 
                            id="requiresCustomName"
                            checked={newProduct.requiresCustomName} 
                            onChange={e => setNewProduct(prev => ({...prev, requiresCustomName: e.target.checked}))}
                            className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                          />
                          <label htmlFor="requiresCustomName" className="text-sm font-bold text-white cursor-pointer flex-grow">
                            Require Customer to input custom name for this product
                          </label>
                      </div>

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
                </>
              )}
              <button type="submit" className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform mt-4">
                {isBulkMode ? `Save ${bulkImages.length || ''} Products` : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategoryFilter('All')}
          className={cn(
            "px-4 py-1.5 rounded-full border text-xs font-bold transition-all uppercase tracking-wider",
            activeCategoryFilter === 'All' ? "bg-gold text-bg border-gold" : "border-border text-white/60 hover:border-gold/50"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full border text-xs font-bold transition-all uppercase tracking-wider",
              activeCategoryFilter === cat ? "bg-gold text-bg border-gold" : "border-border text-white/60 hover:border-gold/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(p => activeCategoryFilter === 'All' || p.category === activeCategoryFilter).map(product => (
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
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-gold uppercase tracking-widest">{product.category}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleProductStock(product)}
                    className={cn(
                      "px-2 py-0.5 text-[8px] font-bold rounded-full uppercase transition-all hover:scale-105",
                      (isProductInStock(product)) ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                    )}
                  >
                    {(isProductInStock(product)) ? 'In Stock' : 'Out of Stock'}
                  </button>
                  <button 
                    onClick={() => toggleProductHero(product)}
                    className={cn(
                      "px-2 py-0.5 text-[8px] font-bold rounded-full uppercase transition-all hover:scale-105",
                      (isProductHero(product)) ? "bg-gold text-bg" : "bg-white/10 text-muted"
                    )}
                  >
                    {(isProductHero(product)) ? 'Unset Hero' : 'Set Hero'}
                  </button>
                </div>
              </div>
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
    category: 'Photo Frames',
    price: '',
    class_name: '',
    image_url: '',
    orientation: 'portrait' as 'portrait' | 'landscape',
    thickness: '15mm',
    size_options: '8x10, 11x14, 16x20',
    in_stock: true,
    allow_return_exchange: true
  });

  const categories = ['Photo Frames', 'Wood Frames', 'Metal Frames', 'Ornate Frames', 'Modern Frames', 'Colorful Frames'];

  const toggleFrameStock = async (frame: any) => {
    const isCurrentlyStocked = isProductInStock(frame);
    let config = parseConfig(frame.description);
    config.in_stock = !isCurrentlyStocked;
    const descParts = (frame.description || '').split('___CONFIG___');
    const newDesc = `${descParts[0]}___CONFIG___${JSON.stringify(config)}`;
    
    const { error } = await supabase.from('products').update({ description: newDesc }).eq('id', frame.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Frame stock status updated');
      fetchFrames();
    }
  };

  const isProductInStock = (product: any) => {
    try {
      const parts = (product.description || '').split('___CONFIG___');
      if (parts.length > 1) {
        const config = JSON.parse(parts[1]);
        if (typeof config.in_stock !== 'undefined') return !!config.in_stock;
      }
    } catch(e) {}
    return true;
  };

  const parseConfig = (desc: string) => {
    try {
      const parts = (desc || '').split('___CONFIG___');
      if (parts.length > 1) return JSON.parse(parts[1]);
    } catch (e) {}
    return {};
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    const { data } = await supabase.from('products').select('*').ilike('category', '%Frame%').order('created_at', { ascending: false });
    if (data) setFrames(data);
  };

  const handleSaveFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      class_name: newFrame.class_name,
      orientation: newFrame.orientation,
      thickness: newFrame.thickness,
      size_options: newFrame.size_options,
      in_stock: newFrame.in_stock,
      allow_return_exchange: newFrame.allow_return_exchange
    };
    
    const frameData = {
      name: newFrame.name,
      category: newFrame.category,
      price: parseFloat(newFrame.price),
      image: newFrame.image_url,
      description: `___CONFIG___${JSON.stringify(config)}`
    };
    
    let error;
    if (editingFrame) {
      const { error: err } = await supabase.from('products').update(frameData).eq('id', editingFrame.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('products').insert([frameData]);
      error = err;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingFrame ? 'Frame updated' : 'Frame added');
      setIsAdding(false);
      setEditingFrame(null);
      setNewFrame({ 
        name: '', 
        category: 'Photo Frames', 
        price: '', 
        class_name: '', 
        image_url: '',
        orientation: 'portrait',
        thickness: '15mm',
        size_options: '8x10, 11x14, 16x20',
        in_stock: true,
        allow_return_exchange: true
      });
      fetchFrames();
    }
  };

  const handleFrameImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFrame(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteFrame = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Frame deleted');
      fetchFrames();
    }
  };

  const handleCleanupDuplicates = async () => {
    setLoading(true);
    try {
      const { data: allFrames } = await supabase.from('products').select('id, name').ilike('category', '%Frame%');
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
        const { error } = await supabase.from('products').delete().in('id', duplicateIds);
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Orientation</label>
                  <select value={newFrame.orientation} onChange={e => setNewFrame({...newFrame, orientation: e.target.value as any})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold">
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase mb-2">Thickness</label>
                  <input placeholder="e.g. 15mm" value={newFrame.thickness} onChange={e => setNewFrame({...newFrame, thickness: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-2">Size Options (CSV)</label>
                <input placeholder="e.g. 8x10, 11x14" value={newFrame.size_options} onChange={e => setNewFrame({...newFrame, size_options: e.target.value})} className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-gold" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="frame_in_stock" 
                    checked={newFrame.in_stock} 
                    onChange={e => setNewFrame({...newFrame, in_stock: e.target.checked})} 
                    className="w-4 h-4 rounded border-border text-gold bg-bg accent-gold"
                  />
                  <label htmlFor="frame_in_stock" className="text-xs font-bold text-muted uppercase cursor-pointer">In Stock</label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="frame_allow_return_exchange" 
                    checked={newFrame.allow_return_exchange} 
                    onChange={e => setNewFrame({...newFrame, allow_return_exchange: e.target.checked})} 
                    className="w-4 h-4 rounded border-border text-gold bg-bg accent-gold"
                  />
                  <label htmlFor="frame_allow_return_exchange" className="text-xs font-bold text-muted uppercase cursor-pointer">Allow Return & Exchange (Delivered orders within 7 Days)</label>
                </div>
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
        {frames.map(frame => {
          const config = parseConfig(frame.description);
          return (
            <div key={frame.id} className="glass p-4 rounded-2xl group relative">
              <div className="aspect-[3/4] mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-bg/50 border border-border/20 relative">
                {frame.image ? (
                  <img src={frame.image} className="w-full h-full object-contain z-10" />
                ) : (
                  <div 
                    style={getFrameStyles(config.class_name)}
                    className={cn("w-2/3 h-2/3 shadow-2xl bg-white/5", config.class_name)} 
                  />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-gold uppercase">{frame.category}</p>
                  <button 
                    onClick={() => toggleFrameStock(frame)}
                    className={cn(
                      "px-2 py-0.5 text-[8px] font-bold rounded-full uppercase transition-all hover:scale-105",
                      isProductInStock(frame) ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                    )}
                  >
                    {isProductInStock(frame) ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>
                <h4 className="font-bold text-sm truncate">{frame.name}</h4>
                <p className="text-sm">₹{frame.price}</p>
                <p className="text-[10px] text-muted">{config.orientation || 'portrait'} • {config.thickness || '15mm'}</p>
              </div>
              
              <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                <button 
                  onClick={() => {
                    setEditingFrame(frame);
                    setNewFrame({
                      name: frame.name,
                      category: frame.category,
                      price: frame.price.toString(),
                      class_name: config.class_name || '',
                      image_url: frame.image || '',
                      orientation: config.orientation || 'portrait',
                      thickness: config.thickness || '15mm',
                      size_options: config.size_options || '8x10, 11x14, 16x20',
                      in_stock: config.in_stock !== false,
                      allow_return_exchange: config.allow_return_exchange !== false
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
          );
        })}
      </div>
    </div>
  );
};

// --- Orders Management Component ---
const OrdersManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{[key: string]: string}>({});
  const statuses = [
    'Order Placed', 
    'Design Under Review', 
    'Printing in Progress', 
    'Packed & Ready', 
    'Out for Delivery', 
    'Delivered',
    'Cancellation Requested',
    'Cancelled',
    'Cancellation Rejected',
    'Refund Initiated',
    'Return Requested',
    'Return Approved',
    'Return Rejected',
    'Refund Completed',
    'Exchange Requested',
    'Exchange Approved',
    'Exchange Rejected',
    'Exchange Completed'
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateCancellationRequest = async (orderId: string, currentRequest: any, targetCancelStatus: 'Approved' | 'Rejected', customMsg: string) => {
    try {
      const updatedReq = {
        ...currentRequest,
        status: targetCancelStatus,
        adminNotes: customMsg,
        processedAt: new Date().toISOString()
      };

      const mainStatus = targetCancelStatus === 'Approved' ? 'Cancelled' : 'Cancellation Rejected';

      const { data } = await supabase.from('orders').select('shipping_address').eq('id', orderId).single();
      const currentShipping = data?.shipping_address || {};
      const updatedShipping = {
        ...currentShipping,
        cancellation_request: updatedReq
      };

      const { error } = await supabase
        .from('orders')
        .update({
          status: mainStatus,
          shipping_address: updatedShipping
        })
        .eq('id', orderId);

      // Patch localStorage so Admin changes reflect immediately for demo
      const dbOrder = orders.find(o => o.id === orderId);
      if (dbOrder && dbOrder.order_id) {
        const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
        localCancellations[dbOrder.order_id] = {
          ...(localCancellations[dbOrder.order_id] || {}),
          status: mainStatus,
          cancellation_request: updatedReq
        };
        localStorage.setItem('localCancellations', JSON.stringify(localCancellations));
      }

      if (error) console.warn("Supabase admin update error (cancellation):", error);
      toast.success(`Cancellation request ${targetCancelStatus}`);
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating cancellation request');
    }
  };

  const handleUpdateReturnRequest = async (orderId: string, currentRequest: any, targetRefundStatus: 'Approved' | 'Rejected' | 'Completed', customMsg: string) => {
    try {
      const updatedReq = {
        ...currentRequest,
        status: targetRefundStatus,
        adminNotes: customMsg,
        processedAt: new Date().toISOString()
      };

      // Map to main order status
      let mainStatus = '';
      if (currentRequest.type === 'return') {
        if (targetRefundStatus === 'Approved') mainStatus = 'Return Approved';
        else if (targetRefundStatus === 'Rejected') mainStatus = 'Return Rejected';
        else if (targetRefundStatus === 'Completed') mainStatus = 'Refund Completed';
      } else {
        if (targetRefundStatus === 'Approved') mainStatus = 'Exchange Approved';
        else if (targetRefundStatus === 'Rejected') mainStatus = 'Exchange Rejected';
        else if (targetRefundStatus === 'Completed') mainStatus = 'Exchange Completed';
      }

      // Fetch current shipping_address
      const { data } = await supabase.from('orders').select('shipping_address').eq('id', orderId).single();
      const currentShipping = data?.shipping_address || {};
      const updatedShipping = {
        ...currentShipping,
        return_request: updatedReq
      };

      const { error } = await supabase
        .from('orders')
        .update({
          status: mainStatus,
          shipping_address: updatedShipping
        })
        .eq('id', orderId);

      // Patch localStorage so Admin changes reflect immediately for demo
      const dbOrder = orders.find(o => o.id === orderId);
      if (dbOrder && dbOrder.order_id) {
        const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
        localCancellations[dbOrder.order_id] = {
          ...(localCancellations[dbOrder.order_id] || {}),
          status: mainStatus,
          return_request: updatedReq
        };
        localStorage.setItem('localCancellations', JSON.stringify(localCancellations));
      }

      if (error) console.warn("Supabase admin update error (return):", error);
      toast.success(`Updated request status to ${targetRefundStatus}`);
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating status');
    }
  };

  const fetchOrders = async () => {
    if ((supabase as any).supabaseUrl.includes('placeholder')) return;
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    if (data) {
      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      const patchedData = data.map(order => {
        if (localCancellations[order.order_id]) {
          return {
            ...order,
            status: localCancellations[order.order_id].status || order.status,
            shipping_address: {
              ...(order.shipping_address || {}),
              cancellation_request: localCancellations[order.order_id].cancellation_request || order.shipping_address?.cancellation_request,
              return_request: localCancellations[order.order_id].return_request || order.shipping_address?.return_request
            }
          };
        }
        return order;
      });
      setOrders(patchedData);
    }
  };

  const downloadSingleImage = async (url: string, filename: string) => {
    if (!url) return;
    try {
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Failed download via fetch, falling back to direct tab opening', e);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadItemAssets = async (item: any, orderId: string, itemIdx: number) => {
    toast.info(`Starting downloads for item: ${item.productName}`);
    let downloadedCount = 0;

    if (item.config?.regionFinalImages && item.config.regionFinalImages.length > 0) {
      for (let rIdx = 0; rIdx < item.config.regionFinalImages.length; rIdx++) {
        const rImage = item.config.regionFinalImages[rIdx];
        if (rImage) {
          const extension = rImage.startsWith('data:image/png') ? 'png' : 'jpg';
          await downloadSingleImage(rImage, `order_${orderId}_item_${itemIdx + 1}_region_${rIdx + 1}_original.${extension}`);
          downloadedCount++;
          await new Promise(r => setTimeout(r, 250));
        }
      }
    } else if (item.config?.uploadedImage) {
      const upImg = item.config.uploadedImage;
      const extension = upImg.startsWith('data:image/png') ? 'png' : 'jpg';
      await downloadSingleImage(upImg, `order_${orderId}_item_${itemIdx + 1}_original.${extension}`);
      downloadedCount++;
      await new Promise(r => setTimeout(r, 250));
    }

    if (item.config?.customizedImageUrl) {
      const custImg = item.config.customizedImageUrl;
      const extension = custImg.startsWith('data:image/png') ? 'png' : 'jpg';
      await downloadSingleImage(custImg, `order_${orderId}_item_${itemIdx + 1}_final_customized.${extension}`);
      downloadedCount++;
    }

    if (downloadedCount > 0) {
      toast.success(`Successfully downloaded ${downloadedCount} assets for ${item.productName}`);
    } else {
      toast.error(`No customizable image assets found for ${item.productName}`);
    }
  };

  const downloadAllOrderAssets = async (order: any) => {
    const items = order.items || [];
    const customItems = items.filter((item: any) => item.config?.uploadedImage || item.config?.customizedImageUrl || item.config?.regionFinalImages?.length > 0);
    
    if (customItems.length === 0) {
      toast.error("No customizable design assets found in this order.");
      return;
    }

    const toastId = toast.loading(`Downloading all customized assets for order ${order.order_id}...`);
    
    let totalDownloaded = 0;
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (item.config?.regionFinalImages && item.config.regionFinalImages.length > 0) {
        for (let rIdx = 0; rIdx < item.config.regionFinalImages.length; rIdx++) {
          const rImage = item.config.regionFinalImages[rIdx];
          if (rImage) {
            const extension = rImage.startsWith('data:image/png') ? 'png' : 'jpg';
            await downloadSingleImage(rImage, `order_${order.order_id}_item_${idx + 1}_region_${rIdx + 1}_original.${extension}`);
            totalDownloaded++;
            await new Promise(r => setTimeout(r, 250));
          }
        }
      } else if (item.config?.uploadedImage) {
        const upImg = item.config.uploadedImage;
        const extension = upImg.startsWith('data:image/png') ? 'png' : 'jpg';
        await downloadSingleImage(upImg, `order_${order.order_id}_item_${idx + 1}_original.${extension}`);
        totalDownloaded++;
        await new Promise(r => setTimeout(r, 250));
      }

      if (item.config?.customizedImageUrl) {
        const custImg = item.config.customizedImageUrl;
        const extension = custImg.startsWith('data:image/png') ? 'png' : 'jpg';
        await downloadSingleImage(custImg, `order_${order.order_id}_item_${idx + 1}_final_customized.${extension}`);
        totalDownloaded++;
        await new Promise(r => setTimeout(r, 250));
      }
    }
    
    toast.success(`Successfully downloaded ${totalDownloaded} media assets.`, { id: toastId });
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    let finalStatus = newStatus;
    
    if (newStatus === 'Cancelled') {
        const isPaid = (order.payment_status || 'pending').toLowerCase() === 'paid';
        if (isPaid) {
            finalStatus = 'Refund Initiated';
        }
    }

    const { data } = await supabase.from('orders').select('shipping_address').eq('id', id).single();
    
    let updateData: any = { status: finalStatus };
    let updatedShipping = { ...(data?.shipping_address || {}) };

    if (finalStatus === 'Delivered') {
      if (!updatedShipping.delivery_date) {
        updatedShipping.delivery_date = new Date().toISOString();
      }
    }

    if (updatedShipping.cancellation_request) {
      updatedShipping.cancellation_request = null;
    }

    updateData.shipping_address = updatedShipping;

    const { error } = await supabase.from('orders').update(updateData).eq('id', id);

    const dbOrder = orders.find(o => o.id === id);
    if (dbOrder && dbOrder.order_id) {
      const localCancellations = JSON.parse(localStorage.getItem('localCancellations') || '{}');
      localCancellations[dbOrder.order_id] = {
        ...(localCancellations[dbOrder.order_id] || {}),
        status: finalStatus,
        delivery_date: finalStatus === 'Delivered' ? (localCancellations[dbOrder.order_id]?.delivery_date || updatedShipping.delivery_date) : localCancellations[dbOrder.order_id]?.delivery_date
      };
      localStorage.setItem('localCancellations', JSON.stringify(localCancellations));
    }

    if (error) console.warn("Supabase generic update error:", error);
    toast.success(`Status updated to ${finalStatus}`);
    fetchOrders();
  };

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending-cancellations' | 'pending-returns' | 'completed-claims'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const pendingCancellationsCount = orders.filter(order => 
    (order.status || '').toLowerCase() === 'cancellation requested' || 
    order.shipping_address?.cancellation_request?.status === 'Pending'
  ).length;

  const pendingReturnsCount = orders.filter(order => {
    const statusLower = (order.status || '').toLowerCase();
    return statusLower === 'return requested' || statusLower === 'exchange requested' ||
      order.shipping_address?.return_request?.status === 'Pending';
  }).length;
  
  const completedClaimsCount = orders.filter(order => {
    const statusLower = (order.status || '').toLowerCase();
    const isResolvedCancel = (order.shipping_address?.cancellation_request && order.shipping_address.cancellation_request.status !== 'Pending');
    const isResolvedReturn = (order.shipping_address?.return_request && order.shipping_address.return_request.status !== 'Pending');
    const isCompletedStatus = statusLower.includes('cancel') || statusLower.includes('refund') || statusLower.includes('reject') || statusLower.includes('complete');
    return isResolvedCancel || isResolvedReturn || isCompletedStatus;
  }).length;

  const filteredOrders = orders.filter(order => {
    // 1. Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (order.order_id || '').toLowerCase().includes(searchLower) ||
      (order.customer_name || '').toLowerCase().includes(searchLower);

    // 2. Payment filter
    const paymentStatusLower = (order.payment_status || 'pending').toLowerCase();
    const matchesPayment = paymentFilter === 'all' || paymentStatusLower === paymentFilter;

    // 3. Claims/Status filter
    const statusLower = (order.status || '').toLowerCase();
    let matchesClaims = true;
    
    if (activeFilter === 'pending-cancellations') {
      matchesClaims = statusLower === 'cancellation requested' || order.shipping_address?.cancellation_request?.status === 'Pending';
    } else if (activeFilter === 'pending-returns') {
      matchesClaims = statusLower === 'return requested' || statusLower === 'exchange requested' || order.shipping_address?.return_request?.status === 'Pending';
    } else if (activeFilter === 'completed-claims') {
      const isResolvedCancel = (order.shipping_address?.cancellation_request && order.shipping_address.cancellation_request.status !== 'Pending');
      const isResolvedReturn = (order.shipping_address?.return_request && order.shipping_address.return_request.status !== 'Pending');
      const isCompletedStatus = statusLower.includes('cancel') || statusLower.includes('refund') || statusLower.includes('reject') || statusLower.includes('complete');
      matchesClaims = isResolvedCancel || isResolvedReturn || isCompletedStatus;
    }

    return matchesSearch && matchesPayment && matchesClaims;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gold">Orders</h2>
          <p className="text-xs text-muted mt-1">Manage, filter, and review custom frame orders and client requests.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-colors text-white placeholder-white/30 pointer-events-auto"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-colors text-white appearance-none cursor-pointer"
          >
            <option value="all" className="bg-bg text-white">All Payment Statuses</option>
            <option value="paid" className="bg-bg text-emerald-400">Paid</option>
            <option value="pending" className="bg-bg text-amber-400">Pending</option>
            <option value="failed" className="bg-bg text-red-400">Failed</option>
          </select>
        </div>
      </div>

      {/* Claim Filtering Tab System */}
      <div className="flex flex-wrap border-b border-white/10 pb-0.5 gap-2 sm:gap-4 select-none">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={cn(
            "pb-3.5 text-xs sm:text-sm font-semibold relative transition-all cursor-pointer px-4 pt-2.5 rounded-t-xl",
            activeFilter === 'all' 
              ? "text-gold bg-white/5 border-b-2 border-gold" 
              : "text-white/40 hover:text-white"
          )}
        >
          All Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('pending-cancellations')}
          className={cn(
            "pb-3.5 text-xs sm:text-sm font-semibold relative transition-all cursor-pointer px-4 pt-2.5 rounded-t-xl flex items-center gap-2",
            activeFilter === 'pending-cancellations' 
              ? "text-red-400 bg-red-500/5 border-b-2 border-red-500" 
              : "text-white/40 hover:text-red-300"
          )}
        >
          {pendingCancellationsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
          )}
          <span>Cancellations ({pendingCancellationsCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('pending-returns')}
          className={cn(
            "pb-3.5 text-xs sm:text-sm font-semibold relative transition-all cursor-pointer px-4 pt-2.5 rounded-t-xl flex items-center gap-2",
            activeFilter === 'pending-returns' 
              ? "text-amber-400 bg-amber-500/5 border-b-2 border-amber-500" 
              : "text-white/40 hover:text-amber-300"
          )}
        >
          {pendingReturnsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          )}
          <span>Returns & Exchanges ({pendingReturnsCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('completed-claims')}
          className={cn(
            "pb-3.5 text-xs sm:text-sm font-semibold relative transition-all cursor-pointer px-4 pt-2.5 rounded-t-xl",
            activeFilter === 'completed-claims' 
              ? "text-purple-400 bg-purple-500/5 border-b-2 border-purple-500" 
              : "text-white/40 hover:text-purple-300"
          )}
        >
          Resolved Claims ({completedClaimsCount})
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-border">
              <th className="p-6 text-xs font-bold uppercase text-muted">Order ID</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Customer</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Total</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Status / Claim Alerts</th>
              <th className="p-6 text-xs font-bold uppercase text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-16 text-center text-muted font-light text-sm italic">
                  No orders match the select filter "{activeFilter === 'pending-cancellations' ? 'Cancellations' : activeFilter === 'pending-returns' ? 'Returns & Exchanges' : activeFilter === 'completed-claims' ? 'Resolved Claims' : 'All'}"
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const hasPendingCancel = order.shipping_address?.cancellation_request?.status === 'Pending';
                const hasPendingReturn = order.shipping_address?.return_request?.status === 'Pending';
                const isExpanded = selectedOrderId === order.id;

                let rowBg = "";
                let rowBorder = "border-b border-border/50";
                if (hasPendingCancel) {
                  rowBg = "bg-red-500/[0.02] hover:bg-red-500/[0.04]";
                  rowBorder = "border-b border-red-500/10";
                } else if (hasPendingReturn) {
                  rowBg = "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]";
                  rowBorder = "border-b border-amber-500/10";
                } else {
                  rowBg = "hover:bg-white/5";
                }

                return (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                      className={cn(
                        "transition-colors cursor-pointer",
                        rowBg,
                        rowBorder
                      )}
                    >
                      <td className="p-6 font-mono text-sm text-gold">
                        <div className="flex items-center gap-2">
                          <span>{order.order_id}</span>
                          {(hasPendingCancel || hasPendingReturn) && (
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="font-bold">{order.customer_name}</p>
                        <p className="text-xs text-muted mb-1">{order.shipping_address?.phone}</p>
                        {(order.customer_role || order.shipping_address?.customer_role || order.shipping_address?.customerRole || order.shipping_address?.role) && (
                          <span className="inline-block px-2 py-0.5 bg-gold/15 text-gold border border-gold/25 rounded text-[9px] font-bold uppercase tracking-wider">
                            Role: {order.customer_role || order.shipping_address?.customer_role || order.shipping_address?.customerRole || order.shipping_address?.role}
                          </span>
                        )}
                      </td>
                      <td className="p-6 font-bold">
                        <div>₹{order.total}</div>
                        {order.shipping_address?.applied_coupon && (
                          <div className="text-[9px] text-green-400 font-black mt-1 uppercase tracking-wider">
                            Coupon: {order.shipping_address.applied_coupon} (-₹{order.shipping_address.coupon_discount})
                          </div>
                        )}
                        <div className="mt-2 text-[10px] uppercase font-bold tracking-wider">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-white border",
                            (order.payment_status || 'pending').toLowerCase() === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            (order.payment_status || 'pending').toLowerCase() === 'failed' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}>
                            {(order.payment_status || 'Pending')}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1.5 align-start">
                          <span className={cn(
                            "px-3 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider text-center border inline-block w-fit",
                            order.status === 'Delivered' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            order.status.includes('Cancel') ? "bg-red-500/10 text-red-405 border-red-500/20 text-red-400" :
                            order.status.includes('Return') || order.status.includes('Exchange') ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          )}>
                            {order.status}
                          </span>

                          {/* Specific claim labels inside table list */}
                          {order.shipping_address?.cancellation_request && (
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider flex items-center gap-1.5 border w-fit",
                              hasPendingCancel 
                                ? "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse" 
                                : "bg-white/5 text-white/50 border-white/5 font-light"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", hasPendingCancel ? "bg-red-500 animate-ping" : "bg-white/35")} />
                              Cancel Claim: {order.shipping_address.cancellation_request.status}
                            </span>
                          )}

                          {order.shipping_address?.return_request && (
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider flex items-center gap-1.5 border w-fit",
                              hasPendingReturn 
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse" 
                                : "bg-white/5 text-white/50 border-white/5 font-light"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", hasPendingReturn ? "bg-amber-500 animate-ping" : "bg-white/35")} />
                              {order.shipping_address.return_request.type} active: {order.shipping_address.return_request.status}
                            </span>
                          )}

                          {/* Click indication helper */}
                          {(hasPendingCancel || hasPendingReturn) && !isExpanded && (
                            <span className="text-[10px] text-gold font-bold uppercase tracking-wide animate-pulse mt-1">
                              ⚠️ Click to Open claim Desk
                            </span>
                          )}
                        </div>
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-gold uppercase tracking-widest">Order Details</h5>
                            <button
                              onClick={() => downloadAllOrderAssets(order)}
                              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-bg text-xs font-bold uppercase hover:scale-[1.02] active:scale-95 transition-all pointer-events-auto"
                            >
                              <Download className="w-4 h-4" /> Download All Order Assets
                            </button>
                          </div>
                          <div className="text-left sm:text-right text-xs">
                            <p className="font-bold">Shipping Address:</p>
                            <p className="text-muted">{order.shipping_address?.address}</p>
                            <p className="text-muted">{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pinCode}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-6 p-6 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex gap-4 min-w-[200px]">
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                  <img src={item.image} className="w-full h-full object-cover" alt="Product" />
                                </div>
                                <div>
                                  <p className="font-bold">{item.productName}</p>
                                  {item.config?.customName && (
                                    <p className="text-[11px] font-bold text-gold uppercase tracking-widest mt-1">
                                      Custom Name: <span className="text-white">{item.config.customName}</span>
                                    </p>
                                  )}
                                  <p className="text-xs text-muted mb-2 mt-1">Price: ₹{item.price} • Quantity: {item.quantity}</p>
                                  
                                  {(item.config?.uploadedImage || item.config?.customizedImageUrl || item.config?.regionFinalImages?.length > 0) && (
                                    <div className="mt-3 flex flex-col gap-2">
                                      <span className="px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-bold rounded uppercase w-fit inline-block">
                                        Customized
                                      </span>
                                      <button
                                        onClick={() => downloadItemAssets(item, order.order_id, idx)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-white/10 hover:bg-gold hover:text-bg rounded-lg border border-white/10 hover:border-gold transition-all w-fit pointer-events-auto"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Download Item Assets
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Display Custom Images if available */}
                              {(item.config?.uploadedImage || item.config?.customizedImageUrl || item.config?.regionFinalImages?.length > 0) && (
                                <div className="flex flex-wrap gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                  {item.config?.regionFinalImages?.map((rImage: string, rIdx: number) => rImage ? (
                                    <div key={rIdx} className="space-y-2">
                                      <p className="text-xs text-muted font-bold uppercase">Original Region {rIdx + 1}</p>
                                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/20 relative group">
                                        <img src={rImage} className="w-full h-full object-cover" />
                                        <button 
                                          onClick={() => downloadSingleImage(rImage, `order_${order.order_id}_item_${idx + 1}_region_${rIdx + 1}_original.${rImage.startsWith('data:image/png') ? 'png' : 'jpg'}`)}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-gold cursor-pointer"
                                        >
                                          Save Original
                                        </button>
                                      </div>
                                    </div>
                                  ) : null)}

                                  {item.config?.uploadedImage && !item.config?.regionFinalImages && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted font-bold uppercase">Original Image</p>
                                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/20 relative group">
                                        <img src={item.config.uploadedImage} className="w-full h-full object-cover" />
                                        <button 
                                          onClick={() => downloadSingleImage(item.config.uploadedImage, `order_${order.order_id}_item_${idx + 1}_original.${item.config.uploadedImage.startsWith('data:image/png') ? 'png' : 'jpg'}`)}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-gold cursor-pointer"
                                        >
                                          Save Original
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {item.config?.customizedImageUrl && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted font-bold uppercase">Customized Preview</p>
                                      <div className="w-24 h-24 bg-white/10 rounded-lg overflow-hidden border border-white/20 relative group">
                                        <img src={item.config.customizedImageUrl} className="w-full h-full object-contain" />
                                        <button 
                                          onClick={() => downloadSingleImage(item.config.customizedImageUrl, `order_${order.order_id}_item_${idx + 1}_final_customized.${item.config.customizedImageUrl.startsWith('data:image/png') ? 'png' : 'jpg'}`)}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-gold cursor-pointer"
                                        >
                                          Save Final
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Customer Order Cancellation Operational Decision Center */}
                        {order.shipping_address?.cancellation_request ? (
                          <div className="mt-8 p-6 bg-white/[0.02] border border-red-500/10 rounded-2xl space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-400/10 border border-red-400/25 text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1.5">
                                  Cancellation Review Desk
                                </span>
                                <h6 className="text-sm font-bold text-white">Review Cancellation Request</h6>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-white/50">Current Status:</span>
                                <span className={cn(
                                  "px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider",
                                  order.shipping_address.cancellation_request.status === 'Approved' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                  order.shipping_address.cancellation_request.status === 'Rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  "bg-yellow-500/10 text-yellow-500 border border-yellow-500/25"
                                )}>
                                  {order.shipping_address.cancellation_request.status}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Request Metadata Info Card */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Claims Action</p>
                                    <p className="font-bold text-red-450 mt-1 uppercase text-red-400">Order Cancellation</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Requested On</p>
                                    <p className="text-white/80 mt-1">
                                      {order.shipping_address.cancellation_request.requestedAt ? new Date(order.shipping_address.cancellation_request.requestedAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-xs">
                                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Stated Reason</p>
                                  <p className="text-xs font-semibold text-red-300">{order.shipping_address.cancellation_request.reason}</p>
                                </div>

                                <div className="text-xs p-3.5 bg-black/45 border border-white/5 rounded-xl">
                                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Additional Customer Comments</p>
                                  <p className="text-xs text-white/90 font-light italic">"{order.shipping_address.cancellation_request.notes || 'No description notes provided.'}"</p>
                                </div>
                              </div>

                              {/* Operations Desk Review Actions */}
                              <div className="space-y-4 bg-black/25 border border-white/5 rounded-2xl p-4.5">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-white/50 block tracking-wider mb-2">Write Review Desk Comments / Memo *</label>
                                  <textarea
                                    rows={3}
                                    placeholder="e.g. Request validated. Print queue has been updated to bypass this order. Refund initiated."
                                    value={adminNotes[order.id] || ''}
                                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="w-full bg-bg border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-gold resize-none"
                                  />
                                </div>

                                <div className="space-y-2.5">
                                  <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Governance Execution Actions</p>
                                  
                                  {order.shipping_address.cancellation_request.status === 'Pending' && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCancellationRequest(order.id, order.shipping_address.cancellation_request, 'Rejected', adminNotes[order.id] || 'Cancellation request declined. The production cycle and logistics are already completed.')}
                                        className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Reject Request
                                      </button>
                                      <button
                                        type="button"
                                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-bg rounded-xl text-xs font-black transition-all cursor-pointer"
                                        onClick={() => handleUpdateCancellationRequest(order.id, order.shipping_address.cancellation_request, 'Approved', adminNotes[order.id] || 'Cancellation request approved. Print layout bypassed or canceled safely.')}
                                      >
                                        Approve & Void
                                      </button>
                                    </div>
                                  )}

                                  {(order.shipping_address.cancellation_request.status === 'Approved' || order.shipping_address.cancellation_request.status === 'Rejected') && (
                                    <div className="p-3 bg-white/5 border border-white/5 text-center text-xs text-white/40 italic rounded-xl font-light">
                                      Decision logged & closed. No further execution elements required.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* Customer Return & Exchange Operational Decision Center */}
                        {order.shipping_address?.return_request ? (
                          <div className="mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/25 text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                                  Return & Exchange Desk
                                </span>
                                <h6 className="text-sm font-bold text-white">Review Customer Claim</h6>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-white/50">Current Status:</span>
                                <span className={cn(
                                  "px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider",
                                  order.shipping_address.return_request.status === 'Approved' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                  order.shipping_address.return_request.status === 'Rejected' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  order.shipping_address.return_request.status === 'Completed' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                                  "bg-yellow-500/10 text-yellow-500 border border-yellow-500/25"
                                )}>
                                  {order.shipping_address.return_request.status}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Request Metadata Info Card */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Claims Action</p>
                                    <p className="font-bold text-white mt-1 capitalize">{order.shipping_address.return_request.type}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Claim Registered On</p>
                                    <p className="text-white/80 mt-1">
                                      {order.shipping_address.return_request.requestedAt ? new Date(order.shipping_address.return_request.requestedAt).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-xs">
                                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Stated Return Reason</p>
                                  <p className="text-xs font-semibold text-amber-400">{order.shipping_address.return_request.reason}</p>
                                </div>

                                <div className="text-xs p-3.5 bg-black/40 border border-white/5 rounded-xl">
                                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Customer Detailed Notes</p>
                                  <p className="text-xs text-white/90 font-light italic">"{order.shipping_address.return_request.notes || 'No description notes provided.'}"</p>
                                </div>

                                {/* Conditional Refund Bank Settlement Detail info */}
                                {order.shipping_address.return_request.type === 'return' && order.shipping_address.return_request.bankDetails && (
                                  <div className="space-y-2 border-t border-white/5 pt-4">
                                    <p className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Refund Electronic settlement Bank account</p>
                                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
                                      <div>
                                        <span className="text-white/35">Bank:</span> <span className="text-white/90">{order.shipping_address.return_request.bankDetails.bankName || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-white/35">Holder:</span> <span className="text-white/90">{order.shipping_address.return_request.bankDetails.holderName || 'N/A'}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-white/35">A/C Number:</span> <span className="text-gold font-semibold">{order.shipping_address.return_request.bankDetails.accountNumber || 'N/A'}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-white/35">IFSC Code:</span> <span className="text-gold font-semibold">{order.shipping_address.return_request.bankDetails.ifscCode || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Conditional Exchange specs */}
                                {order.shipping_address.return_request.type === 'exchange' && (
                                  <div className="space-y-1.5 border-t border-white/5 pt-4 text-xs">
                                    <p className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Requested Exchange specifications / Replacements</p>
                                    <p className="text-xs text-white font-medium bg-gold/10 p-3 rounded-xl border border-gold/15">
                                      {order.shipping_address.return_request.exchangeDetails || 'Standard frame/reprint swap request'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Operations Desk Review Actions */}
                              <div className="space-y-4 bg-black/25 border border-white/5 rounded-2xl p-4.5">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-white/50 block tracking-wider mb-2">Write Review Desk Comments / Memo *</label>
                                  <textarea
                                    rows={3}
                                    placeholder="e.g. Approved. Logistic pickup scheduled tomorrow / Incorrect aspect ratio confirmed. Printing replacement frame."
                                    value={adminNotes[order.id] || ''}
                                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="w-full bg-bg border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-gold resize-none"
                                  />
                                </div>

                                <div className="space-y-2.5">
                                  <p className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Governance Execution Actions</p>
                                  
                                  {order.shipping_address.return_request.status === 'Pending' && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateReturnRequest(order.id, order.shipping_address.return_request, 'Rejected', adminNotes[order.id] || 'Request declined by Review Desk due to incomplete or mismatching criteria.')}
                                        className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Reject Request
                                      </button>
                                      <button
                                        type="button"
                                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-bg rounded-xl text-xs font-black transition-all cursor-pointer"
                                        onClick={() => handleUpdateReturnRequest(order.id, order.shipping_address.return_request, 'Approved', adminNotes[order.id] || 'Your return request has been validated & approved. Our carrier agent will contact you for pickup within 24-48 hours.')}
                                      >
                                        Approve Request
                                      </button>
                                    </div>
                                  )}

                                  {order.shipping_address.return_request.status === 'Approved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateReturnRequest(order.id, order.shipping_address.return_request, 'Completed', adminNotes[order.id] || 'Process complete. Financial refund credited to stated bank details / Product replacement has been physically delivered.')}
                                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer"
                                    >
                                      Mark Logistics & settlements Completed
                                    </button>
                                  )}

                                  {(order.shipping_address.return_request.status === 'Completed' || order.shipping_address.return_request.status === 'Rejected') && (
                                    <div className="p-3 bg-white/5 border border-white/5 text-center text-xs text-white/40 italic rounded-xl font-light">
                                      Decision logged & closed. No further execution elements required.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
                );
              })
            )}
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
    { name: 'Subsections', path: '/admin/subsections', icon: <Layers className="w-5 h-5" /> },
    { name: 'Frame Studio', path: '/admin/frames', icon: <FrameIcon className="w-5 h-5" /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Customers', path: '/admin/customers', icon: <Users className="w-5 h-5" /> },
    { name: 'Slideshows', path: '/admin/slideshows', icon: <ImageIcon className="w-5 h-5" /> },
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
          <Route path="subsections" element={<SubsectionsManagement />} />
          <Route path="frames" element={<FramesManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="slideshows" element={<AdminSlideshows />} />
          <Route path="settings" element={<div className="text-muted">Settings (Coming Soon)</div>} />
        </Routes>
      </main>
    </div>
  );
}
