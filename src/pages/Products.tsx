import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ShoppingCart, Eye, X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../cartStore';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const CATEGORIES = ['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts'];

export default function Products() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (supabase.auth.getSession === undefined || (supabase as any).supabaseUrl.includes('placeholder')) {
          throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel.');
        }
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // Fallback to mock data if table is empty
          setProducts([
            { id: '1', name: 'Acrylic Frame 8x12', category: 'Photo Frames', price: 525, image: 'https://picsum.photos/seed/frame1/400/400' },
            { id: '2', name: 'Slim LED Frame 12x18', category: 'Photo Frames', price: 2100, image: 'https://picsum.photos/seed/frame2/400/400' },
            { id: '3', name: 'Wooden Print 16x20', category: 'Photo Frames', price: 3500, image: 'https://picsum.photos/seed/frame3/400/400' },
            { id: '4', name: 'Wedding Album Classic', category: 'Album Printing', price: 2500, image: 'https://picsum.photos/seed/album1/400/400' },
            { id: '5', name: 'Custom UV Mug', category: 'Sublimation Gifts', price: 350, image: 'https://picsum.photos/seed/mug1/400/400' },
            { id: '6', name: 'Custom T-Shirt', category: 'Sublimation Gifts', price: 499, image: 'https://picsum.photos/seed/shirt1/400/400' },
          ]);
        }
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast.error(error.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => p.category === activeCategory);

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header & Tabs */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gold mb-8">Our Collection</h1>
          <div className="flex flex-wrap justify-center gap-2 sticky top-24 z-30 py-4 bg-bg/80 backdrop-blur-md">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full border transition-all",
                  activeCategory === cat ? "bg-gold text-bg border-gold font-bold" : "border-border text-white/60 hover:border-gold/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl overflow-hidden group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-bg/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Link 
                    to={`/product/${product.id}`}
                    className="w-12 h-12 bg-white text-bg rounded-full flex items-center justify-center hover:bg-gold transition-colors"
                  >
                    <Eye className="w-6 h-6" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-lg font-bold mb-2 hover:text-gold transition-colors">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-gold font-bold text-xl">₹{product.price}</span>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="p-2 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-bg transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Try-On Modal */}
      <AnimatePresence>
        {isTryOnOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg/90 backdrop-blur-xl"
              onClick={() => setIsTryOnOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh]"
            >
              <button 
                onClick={() => setIsTryOnOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Left Panel - Controls */}
              <div className="w-full md:w-80 p-8 border-r border-border overflow-y-auto">
                <h3 className="text-2xl font-display font-bold text-gold mb-6">Customize Your Frame</h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-4">1. Upload Your Photo</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-gold transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gold mb-2" />
                        <p className="text-xs text-muted">Click to upload</p>
                      </div>
                      <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-4">2. Adjust View</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 glass rounded-lg hover:text-gold"><ZoomOut className="w-5 h-5" /></button>
                      <span className="text-sm font-mono">{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 glass rounded-lg hover:text-gold"><ZoomIn className="w-5 h-5" /></button>
                    </div>
                  </div>

                  <button 
                    onClick={() => { handleAddToCart(selectedProduct); setIsTryOnOpen(false); }}
                    className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="flex-grow bg-black/40 flex items-center justify-center p-12 overflow-hidden relative">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Frame Mockup */}
                  <div className="relative w-full max-w-md aspect-[3/4] bg-white shadow-2xl border-[12px] border-white ring-1 ring-black/10 overflow-hidden">
                    {uploadedImage ? (
                      <motion.img 
                        src={uploadedImage} 
                        style={{ scale: zoom }}
                        className="w-full h-full object-cover cursor-move"
                        drag
                        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-bg/40 gap-2">
                        <Move className="w-12 h-12" />
                        <p className="font-bold">Upload a photo to preview</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay Text */}
                  <div className="absolute bottom-4 left-4 text-white/20 text-[10px] uppercase tracking-widest pointer-events-none">
                    Preview Mode · Personalized Gift Shop
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
