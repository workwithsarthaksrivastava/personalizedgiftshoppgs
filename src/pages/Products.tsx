import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ShoppingCart, Eye, X, ZoomIn, ZoomOut, Move, Search, SlidersHorizontal, Sparkles, RotateCcw, ChevronRight, ChevronLeft, Check, Building2, Mic, MicOff, Star, Zap, Plus, Minus, Tag, Maximize2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../cartStore';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import Slideshow from '../components/Slideshow';

// Module-level cache for instant SWR page transitions
let cachedProducts: any[] | null = null;
let cachedCategories: string[] | null = null;

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<string[]>(cachedCategories || ['All', 'Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts']);
  const [activeCategory, setActiveCategory] = useState('All');

  // Sync category state with URL parameters or hashes
  useEffect(() => {
    // 1. Check direct query parameters (?category=...)
    const searchParams = new URLSearchParams(location.search);
    const catQuery = searchParams.get('category');
    if (catQuery) {
      const matched = categories.find(c => c.toLowerCase() === catQuery.toLowerCase());
      if (matched) {
        setActiveCategory(matched);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // 2. Check hash changes (#album-printing, #photo-frames, #uv-printing, #sublimation-gifts)
    if (location.hash) {
      const cleanHash = decodeURIComponent(location.hash.toLowerCase().replace('#', ''));
      const normalizedHash = cleanHash.replace(/[-_ ]/g, '');
      const matchedCat = categories.find(cat => cat.toLowerCase().replace(/[-_ ]/g, '') === normalizedHash);
      if (matchedCat) {
        setActiveCategory(matchedCat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [location.hash, location.search, categories]);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [products, setProducts] = useState<any[]>(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts);
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  
  // Quick View States
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedQuickViewParams, setSelectedQuickViewParams] = useState<Record<string, string>>({});
  const [quickViewQuantity, setQuickViewQuantity] = useState<number>(1);

  const handleOpenQuickView = (product: any) => {
    setQuickViewProduct(product);
    setQuickViewQuantity(1);
    
    const [_, configString] = (product.description || '').split('___CONFIG___');
    let parsedConfig = {} as any;
    if (configString) {
      try {
        parsedConfig = JSON.parse(configString);
      } catch (e) {}
    }
    
    const initialParams: Record<string, string> = {};
    if (parsedConfig.custom_params?.length > 0) {
      parsedConfig.custom_params.forEach((param: any) => {
        if (param.options?.length > 0) {
          initialParams[param.label] = param.options[0];
        }
      });
    }
    
    setSelectedQuickViewParams(initialParams);
    setIsQuickViewOpen(true);
    setIsSearchFocused(false);
  };

  const handleQuickViewBuyNow = () => {
    if (!quickViewProduct) return;
    
    const [_, configString] = (quickViewProduct.description || '').split('___CONFIG___');
    let parsedConfig = {} as any;
    if (configString) {
      try {
        parsedConfig = JSON.parse(configString);
      } catch (e) {}
    }
    
    if (parsedConfig.custom_params?.length > 0) {
      const allSelected = parsedConfig.custom_params.every((param: any) => selectedQuickViewParams[param.label]);
      if (!allSelected) {
        toast.error('Please select all customized options before purchasing');
        return;
      }
    }
    
    clearCart();
    
    addItem({
      productId: quickViewProduct.id,
      productName: quickViewProduct.name,
      price: quickViewProduct.price,
      quantity: quickViewQuantity,
      image: quickViewProduct.image,
      config: {
        selectedParams: selectedQuickViewParams
      }
    });
    
    setIsQuickViewOpen(false);
    navigate('/checkout');
    toast.success(`Proceeding to checkout with ${quickViewProduct.name}`);
  };

  const handleQuickViewAddToCart = () => {
    if (!quickViewProduct) return;
    
    const [_, configString] = (quickViewProduct.description || '').split('___CONFIG___');
    let parsedConfig = {} as any;
    if (configString) {
      try {
        parsedConfig = JSON.parse(configString);
      } catch (e) {}
    }
    
    if (parsedConfig.custom_params?.length > 0) {
      const allSelected = parsedConfig.custom_params.every((param: any) => selectedQuickViewParams[param.label]);
      if (!allSelected) {
        toast.error('Please select all customized options first');
        return;
      }
    }
    
    addItem({
      productId: quickViewProduct.id,
      productName: quickViewProduct.name,
      price: quickViewProduct.price,
      quantity: quickViewQuantity,
      image: quickViewProduct.image,
      config: {
        selectedParams: selectedQuickViewParams
      }
    });
    
    setIsQuickViewOpen(false);
    toast.success(`Added ${quickViewProduct.name} to cart!`);
  };

  const previewRef = useRef<HTMLDivElement>(null);

  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);

  // Advanced Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Auto-save search queries and category views to recent searches in localStorage
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2) {
      const db = setTimeout(() => {
        try {
          const stored = localStorage.getItem('recent_searches');
          let list: string[] = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(list)) list = [];
          
          list = list.filter(item => typeof item === 'string' && item.trim() !== '' && item.toLowerCase() !== trimmed.toLowerCase());
          list.unshift(trimmed);
          list = list.slice(0, 6);
          
          localStorage.setItem('recent_searches', JSON.stringify(list));
        } catch (e) {
          console.error('Error updating recent_searches:', e);
        }
      }, 800);
      return () => clearTimeout(db);
    }
  }, [searchQuery]);

  // Track category clicks for recommendations too
  useEffect(() => {
    if (activeCategory && activeCategory !== 'All') {
      try {
        const stored = localStorage.getItem('recent_searches');
        let list: string[] = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list)) list = [];
        
        list = list.filter(item => typeof item === 'string' && item.trim() !== '' && item.toLowerCase() !== activeCategory.toLowerCase());
        list.unshift(activeCategory);
        list = list.slice(0, 6);
        
        localStorage.setItem('recent_searches', JSON.stringify(list));
      } catch (e) {
        console.error('Error updating recent_searches category:', e);
      }
    }
  }, [activeCategory]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Voice Search states & recognition logic
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser. Please try Chrome or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening for your voice...', { id: 'voice-search' });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone permission in your browser.', { id: 'voice-search' });
        } else {
          toast.error(`Voice recognition error: ${event.error}`, { id: 'voice-search' });
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          setIsSearchFocused(true);
          toast.success(`Searching for: "${transcript}"`, { id: 'voice-search' });
          
          // Flash feedback
          const synth = window.speechSynthesis;
          if (synth && !synth.speaking) {
            const utterance = new SpeechSynthesisUtterance(`Searching for ${transcript}`);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            synth.speak(utterance);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      toast.error('Failed to start voice search.', { id: 'voice-search' });
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  // AI Search Assistant States
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    setAiInsight('');
    toast.loading('AI Gift Assistant is analyzing your matching requests...', { id: 'ai-search' });

    try {
      const res = await fetch('/album/api/search-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiInput })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchQuery(data.searchQuery || '');
        
        if (data.category) {
          const matchedCat = categories.find((c) => c.toLowerCase() === data.category.toLowerCase());
          if (matchedCat) {
            setActiveCategory(matchedCat);
          } else {
            setActiveCategory('All');
          }
        } else {
          setActiveCategory('All');
        }

        setMinPrice(data.minPrice || 0);
        setMaxPrice(data.maxPrice || 0);
        setOnlyInStock(!!data.inStockOnly);
        setAiInsight(data.aiInsight || '');
        setIsFiltersOpen(true);
        toast.success('Your personalized AI filter is configured!', { id: 'ai-search' });
      } else {
        toast.error('AI response error. Executing standard keyword lookup.', { id: 'ai-search' });
        setSearchQuery(aiInput);
      }
    } catch (err) {
      console.error('AI search assistant error:', err);
      toast.error('Failed to communicate with AI. Searching by text instead.', { id: 'ai-search' });
      setSearchQuery(aiInput);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(0);
    setOnlyInStock(false);
    setSortBy('default');
    setAiInput('');
    setAiInsight('');
    setActiveCategory('All');
    setActiveSubsection(null);
    toast.success('Search and filters cleared');
  };

  const handleTryOnAddToCart = async () => {
    if (!selectedProduct) return;
    
    let customizedImage = undefined;
    if (previewRef.current && uploadedImage) {
      toast.loading('Saving customized design...', { id: 'saving-design' });
      try {
        const canvas = await html2canvas(previewRef.current, { useCORS: true, allowTaint: true });
        customizedImage = canvas.toDataURL('image/jpeg', 0.8);
        toast.dismiss('saving-design');
      } catch (err) {
        toast.dismiss('saving-design');
        toast.error('Failed to capture customized design');
      }
    }

    const isOutOfStock = selectedProduct.description?.includes('in_stock":false');
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    addItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      quantity: 1,
      image: selectedProduct.image,
      config: uploadedImage ? {
        uploadedImage: uploadedImage,
        customizedImageUrl: customizedImage
      } : undefined
    });
    
    toast.success(`${selectedProduct.name} added to cart!`);
    setIsTryOnOpen(false);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!cachedProducts) {
        setLoading(true);
      }
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
          cachedProducts = data;
          const mainProds = data.filter((p: any) => p.category !== '_SUBSECTION_' && !p.category.startsWith('_SLIDESHOW_'));
          const uniqueCats = Array.from(new Set(mainProds.map((p: any) => p.category))).filter(Boolean);
          const allCats = Array.from(new Set(['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts', ...uniqueCats]));
          const computedCats = ['All', ...allCats] as string[];
          setCategories(computedCats);
          cachedCategories = computedCats;
        } else {
          // Fallback to mock data if table is empty
          const fallback = [
            { id: '1', name: 'Acrylic Frame 8x12', category: 'Photo Frames', price: 525, image: 'https://picsum.photos/seed/frame1/400/400' },
            { id: '2', name: 'Slim LED Frame 12x18', category: 'Photo Frames', price: 2100, image: 'https://picsum.photos/seed/frame2/400/400' },
            { id: '3', name: 'Wooden Print 16x20', category: 'Photo Frames', price: 3500, image: 'https://picsum.photos/seed/frame3/400/400' },
            { id: '4', name: 'Wedding Album Classic', category: 'Album Printing', price: 2500, image: 'https://picsum.photos/seed/album1/400/400' },
            { id: '5', name: 'Custom UV Mug', category: 'Sublimation Gifts', price: 350, image: 'https://picsum.photos/seed/mug1/400/400' },
            { id: '6', name: 'Custom T-Shirt', category: 'Sublimation Gifts', price: 499, image: 'https://picsum.photos/seed/shirt1/400/400' },
          ];
          setProducts(fallback);
          cachedProducts = fallback;
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

  const parseParent = (desc: string) => {
    try {
      const config = JSON.parse((desc || '').split('___CONFIG___')[1] || '{}');
      return config.parent_category || 'Unknown';
    } catch { return 'Unknown'; }
  };

  const getSubcategory = (desc: string) => {
    try {
      const config = JSON.parse((desc || '').split('___CONFIG___')[1] || '{}');
      return config.subcategory || null;
    } catch { return null; }
  };

  const mainProducts = products.filter(p => p.category !== '_SUBSECTION_' && !p.category.startsWith('_SLIDESHOW_') && (activeCategory === 'All' || p.category === activeCategory));
  const subsections = activeCategory === 'All'
    ? []
    : products.filter(p => p.category === '_SUBSECTION_').filter(s => parseParent(s.description) === activeCategory);
  
  // Master Advanced filtering pipeline
  const displayedProducts = products.filter((p) => {
    // 1. Exclude subsections and slideshows
    if (p.category === '_SUBSECTION_' || p.category.startsWith('_SLIDESHOW_')) return false;

    // 2. Category Filter (skip if 'All')
    if (activeCategory !== 'All' && p.category !== activeCategory) {
      return false;
    }

    // 3. Text Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      const catMatch = (p.category || '').toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !catMatch) {
         return false;
      }
    }

    // 4. Price Limits Filter
    if (minPrice > 0 && p.price < minPrice) return false;
    if (maxPrice > 0 && p.price > maxPrice) return false;

    // 5. Availability Status Filter
    const isOutOfStock = p.description?.includes('in_stock":false');
    if (onlyInStock && isOutOfStock) return false;

    // 6. Subcategory selection filter (only if no general search criteria overrides it)
    if (activeCategory !== 'All' && !searchQuery && minPrice === 0 && maxPrice === 0 && !onlyInStock) {
      const sub = getSubcategory(p.description);
      if (activeSubsection) {
        if (sub !== activeSubsection) return false;
      } else {
        if (sub && sub !== '') return false;
      }
    }

    return true;
  });

  // Apply Sort parameters
  const sortedProducts = [...displayedProducts].sort((a, b) => {
    if (sortBy === 'price-low-high') {
      return a.price - b.price;
    } else if (sortBy === 'price-high-low') {
      return b.price - a.price;
    } else if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0; // Default Supabase listing sorting
  });

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubsection(null);
  };

  // Autocomplete / suggestion logic
  const showSuggestions = isSearchFocused && searchQuery.trim().length >= 1;

  const suggestedCategories = categories.filter((cat) => {
    if (cat === 'All') return false;
    return cat.toLowerCase().includes(searchQuery.toLowerCase());
  }).slice(0, 3);

  const suggestedSubsections = products.filter((p) => {
    if (p.category !== '_SUBSECTION_') return false;
    return (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  }).slice(0, 4);

  const suggestedProducts = products.filter((p) => {
    if (p.category === '_SUBSECTION_' || p.category.startsWith('_SLIDESHOW_')) return false;
    const q = searchQuery.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const descMatch = (p.description || '').toLowerCase().includes(q);
    return nameMatch || descMatch;
  }).slice(0, 5);

  const hasSuggestions = suggestedCategories.length > 0 || suggestedSubsections.length > 0 || suggestedProducts.length > 0;

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubsection(null);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleSelectSubsection = (sub: any) => {
    const parentCat = parseParent(sub.description);
    if (parentCat && parentCat !== 'Unknown') {
      setActiveCategory(parentCat);
    }
    setActiveSubsection(sub.id);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleSelectProductInSearch = (productId: string) => {
    navigate(`/product/${productId}`);
    setIsSearchFocused(false);
  };

  const handleAddToCart = (product: any) => {
    const isOutOfStock = product.description?.includes('in_stock":false');
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

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

  if (loading) {
    return (
      <div className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton Header & Tabs */}
          <div className="text-center mb-12">
            <div className="h-12 w-64 bg-white/10 animate-pulse rounded-lg mx-auto mb-8"></div>
            <div className="flex justify-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-32 bg-white/10 animate-pulse rounded-full"></div>
              ))}
            </div>
          </div>
          
          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden border border-white/10 h-[380px]">
                <div className="w-full h-[65%] bg-white/5 animate-pulse"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 bg-white/10 animate-pulse rounded"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-1/4 bg-white/10 animate-pulse rounded"></div>
                    <div className="h-10 w-10 bg-white/10 animate-pulse rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header & Tabs */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/25 rounded-full text-[10px] font-bold text-gold uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" /> Ordering in Bulk? 
            <Link to="/enterprise" className="underline hover:text-white transition-colors ml-1 inline-flex items-center gap-0.5">
              Explore Enterprise Plans <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <h1 className="text-5xl font-bold text-gold mb-8">Our Collection</h1>
          <div className="flex flex-wrap justify-center gap-2 sticky top-24 z-30 py-4 bg-bg/80 backdrop-blur-md">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
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

        {/* Search and Advanced Filters Section */}
        <div className="mb-12 max-w-3xl mx-auto space-y-6">
          {/* Main search input bar and filters trigger button */}
          <div className="flex gap-3 relative" ref={searchContainerRef}>
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Search premium gifts, photo frames, or custom prints..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-12 pr-20 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all font-light"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  className={cn(
                    "p-1.5 rounded-full transition-all relative flex items-center justify-center",
                    isListening 
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/35" 
                      : "text-white/40 hover:text-white hover:bg-white/10"
                  )}
                  title={isListening ? "Listening... Click to stop" : "Search by voice"}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4 text-white" />
                      <span className="absolute -inset-1 rounded-full border border-red-500 animate-ping opacity-75"></span>
                    </>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-[380px] overflow-y-auto divide-y divide-white/5"
                  >
                    {!hasSuggestions ? (
                      <div className="p-4 text-center text-sm text-white/40">
                        No gift categories or products match "{searchQuery}"
                      </div>
                    ) : (
                      <>
                        {/* Categories Group */}
                        {suggestedCategories.length > 0 && (
                          <div className="p-3">
                            <span className="text-[10px] font-bold text-gold/60 tracking-wider px-2 uppercase block mb-1">
                              Parent Categories & Collections
                            </span>
                            <div className="space-y-0.5">
                              {suggestedCategories.map((cat) => (
                                <button
                                  key={cat}
                                  onClick={() => handleSelectCategory(cat)}
                                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center text-gold text-xs font-bold">
                                      C
                                    </div>
                                    <span>{cat}</span>
                                  </div>
                                  <span className="text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                    Explore category →
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Subsections/Subcategories Group */}
                        {suggestedSubsections.length > 0 && (
                          <div className="p-3">
                            <span className="text-[10px] font-bold text-gold/60 tracking-wider px-2 uppercase block mb-1">
                              Specific Gift Types (Subcategories)
                            </span>
                            <div className="space-y-0.5">
                              {suggestedSubsections.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleSelectSubsection(sub)}
                                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    {sub.image ? (
                                      <img
                                        src={sub.image}
                                        alt={sub.name}
                                        className="w-6 h-6 rounded-md object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold">
                                        S
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium">{sub.name}</span>
                                      <span className="text-[10px] text-white/40">
                                        in {parseParent(sub.description)}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                    View catalog →
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Products/Gifts Group */}
                        {suggestedProducts.length > 0 && (
                          <div className="p-3">
                            <span className="text-[10px] font-bold text-gold/60 tracking-wider px-2 uppercase block mb-1">
                              Matching Gifts & Frames
                            </span>
                            <div className="space-y-0.5">
                              {suggestedProducts.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => handleOpenQuickView(p)}
                                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    {p.image ? (
                                      <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-6 h-6 rounded-md object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-xs font-semibold">
                                        P
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
                                      <span className="text-[10px] text-white/40">
                                        {p.category}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gold">₹{p.price}</span>
                                    <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-gold transition-colors" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={cn(
                "px-5 py-3.5 rounded-2xl border flex items-center gap-2.5 text-sm font-medium transition-all shrink-0",
                isFiltersOpen || minPrice > 0 || maxPrice > 0 || onlyInStock || sortBy !== 'default'
                  ? "bg-gold/10 border-gold/40 text-gold shadow-md"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-white/20"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(minPrice > 0 || maxPrice > 0 || onlyInStock || sortBy !== 'default') && (
                <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* AI Search Assistant Form */}
          <form onSubmit={handleAiSearch} className="relative group overflow-hidden rounded-2xl border border-gold/20 bg-gold/[0.02] p-1 flex items-center gap-2">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 blur-2xl rounded-full pointer-events-none" />
            <div className="pl-3.5 flex items-center gap-2 text-gold shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <input
              type="text"
              placeholder="Ask AI: 'show me sublimation mug or keychains under ₹500 that are in stock'"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={isAiLoading}
              className="flex-grow bg-transparent border-0 text-white placeholder-white/30 text-xs py-2 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiInput.trim()}
              className="px-4 py-2 bg-gold text-bg text-[11px] font-bold rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100 transition-all shrink-0 flex items-center gap-1.5"
            >
              {isAiLoading ? 'Analyzing...' : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Let AI Search</span>
                </>
              )}
            </button>
          </form>

          {/* AI Insight banner */}
          <AnimatePresence>
            {aiInsight && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl border border-gold/30 bg-gold/[0.03] text-xs text-gold/90 font-light leading-relaxed flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-gold animate-bounce" />
                <span><strong>AI Stylist Advisor:</strong> {aiInsight}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expandable Advanced Filters Accordion Drawer */}
          <AnimatePresence>
            {isFiltersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Price filter limits */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 block tracking-wider uppercase">Price Limits (₹)</label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30">Min</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={minPrice || ''}
                            onChange={(e) => setMinPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-full pl-9 pr-2 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold/30"
                          />
                        </div>
                        <span className="text-white/30 text-xs">to</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30">Max</span>
                          <input
                            type="number"
                            placeholder="5000"
                            value={maxPrice || ''}
                            onChange={(e) => setMaxPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-full pl-9 pr-2 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold/30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sorting criteria */}
                    <div className="space-y-2 flex flex-col justify-start">
                      <label className="text-[10px] font-bold text-white/40 block tracking-wider uppercase">Sorting Arrangement</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full py-2 px-3 bg-bg border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold/30 cursor-pointer"
                      >
                        <option value="default">Default Order</option>
                        <option value="price-low-high">Price: Low to High</option>
                        <option value="price-high-low">Price: High to Low</option>
                        <option value="name">Alphabetical (A - Z)</option>
                      </select>
                    </div>

                    {/* Availability settings */}
                    <div className="space-y-2 flex flex-col justify-between h-full">
                      <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Availability</label>
                      <label className="flex items-center gap-3 cursor-pointer py-2 group select-none">
                        <input
                          type="checkbox"
                          checked={onlyInStock}
                          onChange={(e) => setOnlyInStock(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                          onlyInStock ? "bg-gold border-gold text-bg font-bold" : "border-white/20 group-hover:border-gold/40 bg-white/5"
                        )}>
                          {onlyInStock && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                        <span className="text-xs text-white/80 group-hover:text-white transition-colors">Only show In Stock items</span>
                      </label>
                    </div>
                  </div>

                  {/* Reset row buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs">
                    <p className="text-white/40 font-light">
                      Active: {minPrice > 0 ? `₹${minPrice}` : '₹0'} to {maxPrice > 0 ? `₹${maxPrice}` : 'Unlimited'} · {onlyInStock ? 'In Stock' : 'All States'}
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30 hover:bg-red-500/[0.03] hover:text-red-400 transition-all flex items-center gap-1.5 font-medium text-white/60 text-xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Slideshow Sections based on active category */}
        {activeCategory === 'UV Printing' && (
          <div className="mb-12 max-w-5xl mx-auto">
            <Slideshow category="_SLIDESHOW_UV_" className="aspect-[16/9]" />
          </div>
        )}

        {activeCategory === 'Album Printing' && (
          <div className="mb-12 max-w-5xl mx-auto">
            <Slideshow category="_SLIDESHOW_ALBUM_" className="aspect-[16/9]" />
          </div>
        )}

        {activeCategory === 'Photo Frames' && (
          <div className="mb-12 max-w-5xl mx-auto">
            <Slideshow category="_SLIDESHOW_FRAME_" className="aspect-[16/9]" />
          </div>
        )}

        {activeCategory === 'Sublimation Gifts' && (
          <div className="mb-12 max-w-5xl mx-auto">
            <Slideshow category="_SLIDESHOW_SUBLIMATION_" className="aspect-[16/9]" />
          </div>
        )}

        {activeSubsection && (
          <div className="mb-8">
            <button 
              onClick={() => setActiveSubsection(null)} 
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-2"
            >
              ← Back to {activeCategory} Categories
            </button>
          </div>
        )}

        {/* Product / Subsection Areas */}
        <div className="space-y-12">
          {/* Subsections Grid */}
          {!activeSubsection && subsections.length > 0 && !searchQuery && minPrice === 0 && maxPrice === 0 && !onlyInStock && (
            <div>
              {sortedProducts.length > 0 && (
                <h3 className="text-2xl font-display font-bold text-gold mb-6 border-b border-border pb-2">Subcategories</h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {subsections.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setActiveSubsection(sub.id)}
                    className="glass rounded-2xl overflow-hidden group border border-white/10 hover:border-gold/30 cursor-pointer flex flex-col h-full"
                  >
                    <div className="relative flex-grow w-full min-h-[300px] overflow-hidden bg-white/5">
                      <img 
                        src={sub.image} 
                        alt={sub.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent flex items-end justify-center pb-6">
                        <h3 className="text-2xl font-bold font-display text-white">{sub.name}</h3>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Products Grid */}
          {sortedProducts.length > 0 ? (
            <div>
              {!activeSubsection && subsections.length > 0 && (
                <h3 className="text-2xl font-display font-bold text-gold mb-6 border-b border-border pb-2">All {activeCategory}</h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {sortedProducts.map((product) => {
                  const isOutOfStock = product.description?.includes('in_stock":false');
                  
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "glass rounded-2xl overflow-hidden group border transition-all cursor-pointer",
                        isOutOfStock ? "opacity-75 grayscale-[0.5] border-white/5" : "border-white/10 hover:border-gold/30"
                      )}
                      onClick={() => handleOpenQuickView(product)}
                    >
                  <div className="relative aspect-square overflow-hidden bg-white/[0.02]">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {isOutOfStock && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-gold transition-colors line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gold font-bold text-xl">₹{product.price}</span>
                      {!isOutOfStock && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="p-2 bg-gold/10 text-gold rounded-lg hover:bg-gold hover:text-bg transition-all cursor-pointer"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  </motion.div>
                );
              })}
              </div>
            </div>
          ) : (
            /* No Results Found empty state */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-6 glass rounded-2xl border border-white/5 max-w-lg mx-auto space-y-4"
            >
              <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto text-gold mb-2">
                <Search className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gold">No Customized Gifts Found</h3>
              <p className="text-sm text-white/50 font-light leading-relaxed">
                We couldn't find any products matching your specific filters in <span className="text-white">"{activeCategory}"</span>.
                {aiInsight ? " Try adjusting your AI prompt or select a different category option." : " Try searching for generic words like 'frame', 'mug', or resetting the price caps."}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-gold text-bg text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            </motion.div>
          )}
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
                    onClick={handleTryOnAddToCart}
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
                  <div ref={previewRef} className="relative w-full max-w-md aspect-[3/4] bg-white shadow-2xl border-[12px] border-white ring-1 ring-black/10 overflow-hidden">
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

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && quickViewProduct && (() => {
          const [descText, configString] = (quickViewProduct.description || '').split('___CONFIG___');
          let parsedConfig = {} as any;
          if (configString) {
            try {
              parsedConfig = JSON.parse(configString);
            } catch (e) {}
          }
          const isOutOfStock = quickViewProduct.description?.includes('in_stock":false');
          const originalPrice = Math.round(quickViewProduct.price * 1.25);
          const sampleRating = 4.9;
          const sampleReviewCount = Math.floor((quickViewProduct.id.charCodeAt(0) || 45) * 3) + 24;

          return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6" id="quick-view-modal-portal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsQuickViewOpen(false)}
              />

              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative w-full max-w-4xl bg-[#121214] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
              >
                {/* Top Right Controls Group */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsQuickViewOpen(false);
                      navigate(`/product/${quickViewProduct.id}`);
                    }}
                    className="p-2.5 bg-black/40 hover:bg-white/10 text-white/70 hover:text-white rounded-full border border-white/10 transition-colors flex items-center justify-center"
                    title="View Full Details"
                    aria-label="View Full Details"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsQuickViewOpen(false)}
                    className="p-2.5 bg-black/40 hover:bg-white/10 text-white/70 hover:text-white rounded-full border border-white/10 transition-colors flex items-center justify-center"
                    title="Close"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Left Panel - Image Column */}
                <div className="w-full md:w-1/2 relative bg-black/35 flex items-center justify-center overflow-hidden min-h-[250px] md:min-h-0 aspect-square md:aspect-auto">
                  <img 
                    src={quickViewProduct.image} 
                    alt={quickViewProduct.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                  />
                  
                  {isOutOfStock && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {!isOutOfStock && (
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      <span className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        In Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Panel - Product Actions Column */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-full">
                  <div className="flex-grow space-y-6">
                    
                    {/* Category breadcrumb */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-gold/15 text-gold font-bold rounded-lg uppercase tracking-wider text-[10px]">
                        {quickViewProduct.category}
                      </span>
                      {parsedConfig.subcategory && (
                        <>
                          <span className="text-white/30">/</span>
                          <span className="text-white/60 font-light text-[11px] truncate max-w-[120px]">
                            {parsedConfig.subcategory}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Product Name Title */}
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
                        {quickViewProduct.name}
                      </h2>
                      
                      {/* Premium rating stars */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-white/50">
                          {sampleRating} ({sampleReviewCount} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Pricing Segment */}
                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-white/40 block tracking-widest uppercase">Special Price</span>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold font-display text-gold">
                            ₹{quickViewProduct.price}
                          </span>
                          <span className="text-sm text-white/40 line-through">
                            ₹{originalPrice}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-bold uppercase tracking-wider block">
                          Save 20%
                        </span>
                        <span className="text-[9px] text-white/30 block mt-1 font-light">Inclusive of personalization</span>
                      </div>
                    </div>

                    {/* Description Text */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Tag className="w-3.5 h-3.5 text-gold" /> Product Info
                      </h4>
                      <p className="text-sm font-light text-white/70 leading-relaxed">
                        {descText || 'Premium grade custom personalization product built using premium luxury materials, perfect for gifting your loved ones.'}
                      </p>
                    </div>

                    {/* Dynamic customization parameters customization selections */}
                    {parsedConfig.custom_params?.length > 0 && (
                      <div className="space-y-4 pt-1 border-t border-white/5">
                        {parsedConfig.custom_params.map((param: any) => (
                          <div key={param.label} className="space-y-2">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block font-mono">
                              Choose {param.label}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {param.options?.map((opt: string) => {
                                const isSelected = selectedQuickViewParams[param.label] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setSelectedQuickViewParams(prev => ({ ...prev, [param.label]: opt }))}
                                    className={cn(
                                      "px-3.5 py-2 rounded-xl text-xs transition-all flex items-center justify-center border font-semibold cursor-pointer",
                                      isSelected
                                        ? "bg-gold border-gold text-bg shadow-md shadow-gold/20"
                                        : "bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white"
                                    )}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quantity selection counter bar */}
                    {!isOutOfStock && (
                      <div className="space-y-2 pt-1 border-t border-white/5">
                        <label className="text-[10px] font-bold text-white/40 block tracking-widest uppercase font-mono">Order Quantity</label>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden p-1">
                            <button
                              type="button"
                              onClick={() => setQuickViewQuantity(q => Math.max(1, q - 1))}
                              className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                              disabled={quickViewQuantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-mono text-sm font-bold text-white">
                              {quickViewQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuickViewQuantity(q => q + 1)}
                              className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column Buttons */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
                    {isOutOfStock ? (
                      <button
                        className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold cursor-not-allowed text-center uppercase tracking-wider text-sm"
                        disabled
                      >
                        Item Out Of Stock
                      </button>
                    ) : (
                      <>
                        <div className="flex gap-3">
                          {/* Buy Now Button */}
                          <button
                            type="button"
                            onClick={handleQuickViewBuyNow}
                            className="flex-1 py-3.5 px-6 gold-gradient text-[#121214] font-bold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10 cursor-pointer"
                          >
                            <Zap className="w-4 h-4 stroke-[3px]" />
                            <span className="tracking-wide text-sm font-bold">Buy Now</span>
                          </button>

                          {/* Quick Add To Cart Button */}
                          <button
                            type="button"
                            onClick={handleQuickViewAddToCart}
                            className="py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-gold/30 text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer btn"
                            title="Add to Cart"
                          >
                            <ShoppingCart className="w-5 h-5 text-gold" />
                          </button>
                        </div>

                        {/* Core Design personalizer Studio redirection link */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickViewOpen(false);
                            navigate(`/product/${quickViewProduct.id}`);
                          }}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-gold hover:text-gold/85 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Customize & Upload Your Photos</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
