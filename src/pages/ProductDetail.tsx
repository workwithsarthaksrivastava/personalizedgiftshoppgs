import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCartStore } from '../cartStore';
import { toast } from 'sonner';
import { ShoppingCart, Zap, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const { addItem, clearCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setProduct(data);
        setMainImage(data.images?.[0] || data.image);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-bg pt-32 text-center">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-bg pt-32 text-center">Product not found</div>;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: mainImage,
    });
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    clearCart();
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: mainImage,
    });
    navigate('/checkout');
  };

  const images = product.images || [product.image];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted hover:text-gold mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back to Products
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden glass p-2">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setMainImage(img)}
                    className={cn(
                      "w-24 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      mainImage === img ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <span className="text-gold font-bold tracking-widest uppercase text-sm mb-2">{product.category}</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl font-bold text-gold">₹{product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xl text-muted line-through mb-1">₹{product.original_price}</span>
              )}
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm font-bold text-green-400 mb-2 bg-green-400/10 px-2 py-1 rounded">
                  {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                </span>
              )}
            </div>

            <div className="prose prose-invert mb-10">
              <p className="text-muted leading-relaxed whitespace-pre-wrap">
                {product.description || "A beautiful personalized gift to capture your best memories."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                onClick={handleAddToCart}
                className="flex-1 py-4 border border-gold text-gold font-bold rounded-xl hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
              <button 
                onClick={handleBuyNow}
                className="flex-1 py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" /> Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
