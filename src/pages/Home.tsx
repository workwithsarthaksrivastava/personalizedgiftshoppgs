import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown, ShieldCheck, Truck, Palette, Award, Package, Clock, Zap, Search, Sparkles, Trash2, Star, ShoppingBag, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Slideshow from '../components/Slideshow';
import HeroProductSection from '../components/HeroProductSection';
import { supabase } from '../supabase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [bgImages, setBgImages] = useState<string[]>([
    '/shop_slideshow_1.png',
    '/shop_slideshow_2.png',
    '/shop_slideshow_3.png',
    '/shop_slideshow_4.png'
  ]);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchDeliveredOrders(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchDeliveredOrders(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (bgImages.length <= 1) return;
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 6000); // 6 seconds per slide for a comfortable read/transition
    return () => clearInterval(timer);
  }, [bgImages]);

  const fetchDeliveredOrders = async (uid: string) => {
    const { data } = await supabase
      .from('orders')
      .select('status')
      .eq('customer_id', uid)
      .eq('status', 'Delivered');
    
    if (data) setDeliveredOrders(data.length);
  };

  const getBadges = () => {
    const badges = [];
    if (user?.email === 'workwithsarthaksrivastava@gmail.com' || deliveredOrders >= 5) {
      badges.push('Verified Customer', 'Regular Buyer');
    }
    return badges;
  };
  
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous';
  const badges = getBadges();

  const features = [
    { icon: <Award className="w-8 h-8 text-gold" />, title: "Premium Quality", desc: "UV-resistant, scratch-proof, glossy finish" },
    { icon: <Palette className="w-8 h-8 text-gold" />, title: "50+ Frame Designs", desc: "Mix and match to find your perfect look" },
    { icon: <Truck className="w-8 h-8 text-gold" />, title: "Fast Delivery", desc: "Order today, doorstep delivery across India" },
    { icon: <ShieldCheck className="w-8 h-8 text-gold" />, title: "Custom Printing", desc: "Your photo, your design — exactly as imagined" },
    { icon: <Package className="w-8 h-8 text-gold" />, title: "Durable Materials", desc: "Acrylic, Glass, Wood, Metal options available" },
    { icon: <Clock className="w-8 h-8 text-gold" />, title: "Easy Tracking", desc: "Real-time order status updates" },
  ];

  // Dynamic recommendations & rich category details setup
  const categoriesList = [
    {
      name: "Album Printing",
      desc: "Premium double layflat professional photo albums to preserve memories.",
      image: "/album_slide_1.png",
      hash: "#album-printing",
      color: "from-blue-600/25 to-indigo-900/40"
    },
    {
      name: "Photo Frames",
      desc: "Acrylic, LED, and wooden frames crafted to blend with your beautiful spaces.",
      image: "/frame_slide_1.png",
      hash: "#photo-frames",
      color: "from-amber-600/25 to-yellow-900/40"
    },
    {
      name: "UV Printing",
      desc: "Vibrant, scratch-proof premium prints direct on crystal glass, acrylic, and wood.",
      image: "/uv_slide_1.png",
      hash: "#uv-printing",
      color: "from-purple-600/25 to-fuchsia-900/40"
    },
    {
      name: "Sublimation Gifts",
      desc: "Personalized corporate merchandise, beautiful magic mugs, cushion gifts.",
      image: "/sublimation_slide_1.png",
      hash: "#sublimation-gifts",
      color: "from-pink-600/25 to-red-900/40"
    }
  ];

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const stored = localStorage.getItem('recent_searches');
      const searches: string[] = stored ? JSON.parse(stored) : [];
      setSearchTerms(searches);

      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;

      let allProducts = data || [];
      if (allProducts.length === 0) {
        allProducts = [
          { id: '1', name: 'Acrylic Frame 8x12', category: 'Photo Frames', price: 525, image: '/frame_slide_1.png', description: 'Premium 2mm, 3mm, 5mm thickness acrylic frame.' },
          { id: '2', name: 'Slim LED Frame 12x18', category: 'Photo Frames', price: 2100, image: '/frame_slide_2.png', description: 'Sleek slim backlit LED frame.' },
          { id: '3', name: 'Wooden Print 16x20', category: 'Photo Frames', price: 3500, image: '/wholesale.png', description: 'Rustic direct-on-wood luxury prints.' },
          { id: '4', name: 'UV Glass Print 8x12', category: 'UV Printing', price: 1200, image: '/uv_slide_1.png', description: 'Ultra glossy scratchproof UV glass prints.' },
          { id: '5', name: 'Custom UV Mug', category: 'Sublimation Gifts', price: 350, image: '/sublimation_slide_1.png', description: 'Vibrant personal heat sublimation corporate and personal mugs.' },
          { id: '6', name: 'Custom T-Shirt', category: 'Sublimation Gifts', price: 499, image: '/sublimation_slide_2.png', description: 'High-quality cotton blend sublimation printed clothing.' },
          { id: '7', name: 'Luxe Wedding Photo Album', category: 'Album Printing', price: 4500, image: '/album_slide_1.png', description: 'Stunning double layflat professional photo albums.' }
        ];
      }

      const mainProducts = allProducts.filter((p: any) => p.category !== '_SUBSECTION_');

      if (searches.length > 0) {
        const matched: any[] = [];
        const seenIds = new Set<string>();

        for (const term of searches) {
          const lowerTerm = term.toLowerCase().trim();
          if (!lowerTerm) continue;

          for (const prod of mainProducts) {
            if (seenIds.has(prod.id)) continue;

            const nameMatch = (prod.name || '').toLowerCase().includes(lowerTerm);
            const descMatch = (prod.description || '').toLowerCase().includes(lowerTerm);
            const catMatch = (prod.category || '').toLowerCase().includes(lowerTerm);

            if (nameMatch || descMatch || catMatch) {
              matched.push(prod);
              seenIds.add(prod.id);
            }
          }
        }

        if (matched.length > 0) {
          if (matched.length < 4) {
            for (const prod of mainProducts) {
              if (matched.length >= 4) break;
              if (!seenIds.has(prod.id)) {
                matched.push(prod);
                seenIds.add(prod.id);
              }
            }
          }
          setRecommendations(matched.slice(0, 4));
        } else {
          setRecommendations(mainProducts.slice(0, 4));
        }
      } else {
        setRecommendations(mainProducts.slice(0, 4));
      }
    } catch (err) {
      console.error('Error calculating home recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleClearSearches = () => {
    try {
      localStorage.removeItem('recent_searches');
      setSearchTerms([]);
      loadRecommendations();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={bgIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url("${bgImages[bgIndex]}")`,
                filter: 'brightness(0.28)'
              }}
            />
          </AnimatePresence>
        </div>
        
        <div className="relative z-10 max-w-4xl px-4 sm:px-6 mx-auto">
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white mb-6 flex flex-col items-center gap-2 font-body"
            >
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
                <span className="text-white/80 text-sm sm:text-base md:text-lg">Welcome,</span>
                <span className="blink-gold font-bold text-lg sm:text-xl md:text-2xl break-all">{userName}</span>
              </div>
              
              {badges.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
                  {badges.map(b => (
                    <span key={b} className="bg-gold/20 text-gold text-[10px] md:text-xs px-2.5 py-0.5 rounded-full flex gap-1 items-center border border-gold/30 whitespace-nowrap">
                        <Zap className="w-3 h-3" /> {b}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gold leading-tight mb-4 sm:mb-6"
          >
            Your Memories, Reimagined.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-white/85 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Custom photo frames, UV prints, and personalized gifts crafted for every moment.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-[280px] sm:max-w-none mx-auto"
          >
            <Link 
              to="/products" 
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 gold-gradient text-bg text-[13px] sm:text-sm md:text-base font-bold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
            >
              Explore Products <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <button 
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 border border-gold text-gold text-[13px] sm:text-sm md:text-base font-bold rounded-full hover:bg-gold hover:text-bg transition-all flex items-center justify-center gap-2"
            >
              Know More <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <Slideshow />
        </div>
      </section>

      <HeroProductSection />

      {/* Explore Our Vibrant Range of Products */}
      <section className="py-24 px-6 bg-surface relative overflow-hidden" id="explore-products-section">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 rounded-full border border-gold/20 text-xs font-bold text-gold uppercase tracking-widest">
              <ShoppingBag className="w-3.5 h-3.5" /> Catalogue
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
              Explore Our <span className="text-gold">Vibrant Range</span> of Products
            </h2>
            <p className="text-muted max-w-xl mx-auto text-sm md:text-base font-light">
              From premium framings and luminous LEDs to custom mugs and UV crystal engravings, discover gifts crafted to perfection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categoriesList.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative aspect-[1.9/1] sm:aspect-[1.8/1] min-h-[160px] sm:min-h-[220px] rounded-3xl overflow-hidden glass border border-white/5 flex flex-col justify-end p-5 sm:p-6 md:p-8 hover:border-gold/30 transition-all shadow-xl"
              >
                {/* Background image & gradient overlay */}
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" 
                  style={{ backgroundImage: `url('${cat.image}')` }} 
                />
                <div className={`absolute inset-0 z-10 bg-gradient-to-t ${cat.color} via-bg/70 to-bg/10 group-hover:opacity-90 transition-opacity duration-300`} />
                <div className="absolute inset-0 z-11 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />

                {/* Content */}
                <div className="relative z-20 space-y-2 md:space-y-3">
                  <h3 className="text-xl md:text-2xl font-bold font-display text-white group-hover:text-gold transition-colors">{cat.name}</h3>
                  <p className="text-white/70 text-[11px] md:text-xs leading-relaxed font-light line-clamp-2 sm:line-clamp-3 max-w-[90%] md:max-w-none">{cat.desc}</p>
                  <div className="pt-1 md:pt-2">
                    <Link
                      to={`/products${cat.hash}`}
                      className="inline-flex items-center gap-1.5 text-xs font-gold group-hover:underline"
                    >
                      Browse Collection <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Based on Searches */}
      <section className="py-24 px-6 bg-bg border-t border-white/5 relative overflow-hidden" id="recent-search-recommendations">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.03),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-white">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 rounded-full border border-gold/20 text-xs font-bold text-gold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Personalized
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white">
                {searchTerms.length > 0 ? "Based on your recent searches" : "Recommended for you"}
              </h2>
              <p className="text-muted text-sm max-w-xl font-light">
                {searchTerms.length > 0 
                  ? "Tailored recommendations matching your recent search strings and catalog navigation."
                  : "Curated selections based on our most popular personalized gifting trends."}
              </p>
            </div>

            {searchTerms.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted">Searches:</span>
                {searchTerms.map((term) => (
                  <span 
                    key={term} 
                    className="text-xs font-medium px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-gold/90"
                  >
                    {term}
                  </span>
                ))}
                <button
                  onClick={handleClearSearches}
                  className="inline-flex items-center gap-1.5 text-xs text-red-400/90 hover:text-red-300 hover:underline ml-2 transition-all"
                  title="Reset suggestions"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear history
                </button>
              </div>
            )}
          </div>

          {loadingRecommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass rounded-3xl h-[340px] animate-pulse relative" />
              ))}
            </div>
          ) : (
            <>
              {searchTerms.length === 0 && (
                <div className="mb-8 p-5 bg-gold/5 rounded-2xl border border-gold/10 text-xs md:text-sm text-gold/80 flex items-center gap-3">
                  <Search className="w-4 h-4 text-gold shrink-0" />
                  <span>
                    You haven't searched for any gifts yet! Use the search bar or filter categories on our 
                    <Link to="/products" className="font-bold underline ml-1 hover:text-white">Products Catalog</Link> to adjust your taste preferences.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {recommendations.map((prod) => (
                  <motion.div
                    key={prod.id}
                    whileHover={{ y: -6 }}
                    className="group glass rounded-3xl border border-white/5 overflow-hidden flex flex-col justify-between h-full hover:border-gold/30 transition-all shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-white/[0.02]">
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-bg/90 border border-white/10 text-[10px] uppercase font-bold tracking-wider text-gold">
                        {prod.category}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-gold">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <span className="text-xs font-semibold">4.9</span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-snug line-clamp-1">{prod.name}</h3>
                        <p className="text-muted text-xs leading-relaxed line-clamp-2">
                          {prod.description?.split('___CONFIG___')[0] || "Exquisite customized premium printing and frame quality."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 mt-auto">
                        <div>
                          <span className="text-[10px] text-muted block uppercase tracking-wider">Price</span>
                          <span className="text-lg font-black text-gold">₹{prod.price}</span>
                        </div>
                        <Link
                          to={`/products/${prod.id}`}
                          className="px-4 py-2 bg-white/5 border border-white/10 hover:border-gold hover:bg-gold hover:text-bg rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          Details <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">Why Choose Us</h2>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="p-8 glass rounded-2xl flex flex-col items-center text-center gap-4"
              >
                <div className="p-4 bg-gold/10 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-muted text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Highlight Section */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">Premium Pricing</h2>
            <p className="text-muted">Best quality at competitive rates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gold mb-6 border-b border-border pb-4">Acrylic Photo Frames</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-muted border-b border-border">
                      <th className="pb-4">Size</th>
                      <th className="pb-4">2MM</th>
                      <th className="pb-4">3MM</th>
                      <th className="pb-4">5MM</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    <tr className="border-b border-border/50"><td className="py-4">8×12</td><td>₹525</td><td>₹700</td><td>₹1000</td></tr>
                    <tr className="border-b border-border/50"><td className="py-4">12×18</td><td>₹1125</td><td>₹1500</td><td>₹2000</td></tr>
                    <tr className="border-b border-border/50"><td className="py-4">16×20</td><td>₹1500</td><td>₹2000</td><td>₹2800</td></tr>
                    <tr><td className="py-4">20×30</td><td>—</td><td>₹3500</td><td>₹4500</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gold mb-6 border-b border-border pb-4">Slim LED Frames</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between"><span>8×12</span><span className="text-gold font-bold">₹1650</span></div>
                  <div className="flex justify-between"><span>12×18</span><span className="text-gold font-bold">₹2100</span></div>
                  <div className="flex justify-between"><span>16×24</span><span className="text-gold font-bold">₹3300</span></div>
                </div>
              </div>
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gold mb-6 border-b border-border pb-4">Wooden Printing</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between"><span>8×12</span><span className="text-gold font-bold">₹1200</span></div>
                  <div className="flex justify-between"><span>12×18</span><span className="text-gold font-bold">₹2000</span></div>
                  <div className="flex justify-between"><span>16×20</span><span className="text-gold font-bold">₹3500</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buy for Enterprise & Corporate Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-surface to-bg relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="max-w-5xl mx-auto glass p-10 md:p-16 rounded-[40px] border border-gold/20 flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-3xl rounded-full" />
          <div className="space-y-4 text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 rounded-full border border-gold/20 text-xs font-bold text-gold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" /> Corporate Partnerships
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-black text-white leading-tight">
              Bulk Gifting & Branding <span className="text-gold">Made Simple</span>
            </h2>
            <p className="text-sm text-white/75 font-light leading-relaxed">
              Planning custom client mementos, employee anniversary gift frames, or logo printed merchandise? Work with our dedicated gift design specialists and unlock premium volume benefits.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to="/enterprise"
              className="inline-flex items-center gap-2 px-8 py-4 gold-gradient text-bg font-bold rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-gold/10"
            >
              <span>Explore Bulk Pricing</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-6 bg-bg border-y border-border">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
          {['Secure Payments', 'Easy Returns', 'Pan-India Delivery', '100% Customizable', '5000+ Happy Customers'].map((badge) => (
            <span key={badge} className="text-sm font-bold tracking-widest uppercase">{badge}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
