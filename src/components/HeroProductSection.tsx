import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const getFallbackHeroes = () => [
  {
    id: 'hero-1',
    name: 'Luxe Wedding Photo Album',
    price: 4500,
    original_price: 5999,
    category: 'Album Printing',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    description: 'Stunning double layflat professional photo albums with seamless panoramic page spreads, premium cover options, and lifetime crystal-clear digital hosting.'
  },
  {
    id: 'hero-2',
    name: 'Slim LED Frame 12x18',
    price: 2100,
    original_price: 2999,
    category: 'Photo Frames',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    description: 'Sleek slim backlit LED frame with elegant golden border finish, uniform brightness dispersion, and energy-efficient durable micro-LED panels.'
  },
  {
    id: 'hero-3',
    name: 'Acrylic Frame 8x12',
    price: 525,
    original_price: 799,
    category: 'Photo Frames',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    description: 'Premium crystal-clear acrylic frames with custom 3D glass edge polish and sturdy aluminum desktop mounts for high definition prints.'
  }
];

export default function HeroProductSection() {
  const [heroProducts, setHeroProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
          console.warn("Supabase fetch returned error. Falling back to default premium heroes.", error.message);
          setHeroProducts(getFallbackHeroes());
          return;
        }
        
        let foundHeroes: any[] = [];
        if (data && data.length > 0) {
          foundHeroes = data.filter(p => {
            try {
              const parts = (p.description || '').split('___CONFIG___');
              if (parts.length > 1) {
                  const configStr = parts.slice(1).join('___CONFIG___');
                  const config = JSON.parse(configStr);
                  return !!config.is_hero;
              }
            } catch(e) { }
            return false;
          });
        }
        
        if (foundHeroes.length === 0) {
          setHeroProducts(getFallbackHeroes());
        } else {
          setHeroProducts(foundHeroes);
        }
      } catch (err: any) {
        console.warn("Error fetching hero products, using beautiful fallback heroes:", err?.message || err);
        setHeroProducts(getFallbackHeroes());
      } finally {
        setLoading(false);
      }
    };
    fetchHeroProducts();
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      next();
    }, 6000);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  if (loading) return null; // Remove debug text for clean preview and final behavior
  if (heroProducts.length === 0) return null; // Remove debug text for clean preview and final behavior

  const safeIndex = currentIndex >= heroProducts.length ? 0 : currentIndex;
  const currentProduct = heroProducts[safeIndex];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold flex items-center justify-center gap-3">
            <Star className="text-gold w-8 h-8 fill-gold" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold to-white">
              Featured Collections
            </span>
            <Star className="text-gold w-8 h-8 fill-gold" />
          </h2>
          <p className="text-muted mt-4 text-sm tracking-widest uppercase">Handpicked premium items for you</p>
        </div>

        <div className="relative glass rounded-[2.5rem] overflow-hidden p-8 md:p-16 border border-gold/20 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <div className="order-2 md:order-1 space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold tracking-widest uppercase mb-2">
                  <span className="animate-pulse mr-2">●</span> Trending Now
                </div>
                
                <h3 className="text-4xl md:text-5xl font-bold leading-tight">
                  {currentProduct.name}
                </h3>
                
                <p className="text-lg text-muted line-clamp-3">
                  {currentProduct.description.split('___CONFIG___')[0]}
                </p>
                
                <div className="flex items-center gap-4 pt-4">
                  <div className="text-3xl font-bold text-gold">
                    ₹{currentProduct.price}
                  </div>
                  {currentProduct.original_price && (
                    <div className="text-lg text-muted line-through">
                      ₹{currentProduct.original_price}
                    </div>
                  )}
                </div>

                <div className="pt-8">
                  <Link 
                    to={`/products/${currentProduct.id}`} 
                    className="group flex items-center gap-2 px-8 py-4 gold-gradient text-bg font-bold rounded-full hover:scale-105 transition-transform w-fit"
                  >
                    View Product
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="order-1 md:order-2 relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent z-10 opacity-50" />
                <img 
                  src={currentProduct.image} 
                  alt={currentProduct.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {heroProducts.length > 1 && (
            <>
              <button 
                onClick={prev} 
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-bg/80 backdrop-blur text-gold border border-gold/30 rounded-full hover:bg-gold hover:text-bg transition-colors z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={next} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-bg/80 backdrop-blur text-gold border border-gold/30 rounded-full hover:bg-gold hover:text-bg transition-colors z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {heroProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-8 bg-gold' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
