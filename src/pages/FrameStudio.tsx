import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, ZoomIn, ZoomOut, Move, ShoppingCart, ChevronLeft, ChevronRight, Zap, RotateCcw, Plus, Check, Percent, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useCartStore } from '../cartStore';
import { useNavigate } from 'react-router-dom';
import ProductReviews from '../components/ProductReviews';
import * as htmlToImage from 'html-to-image';

const MOCK_FALLBACK_PRODUCTS = [
  {
    id: 'mock-spotify-plaque',
    name: 'Custom Spotify Acrylic Plaque',
    price: 499,
    original_price: 699,
    category: 'UV Printing',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
    description: 'A beautiful acrylic plaque customized with your favorite song and picture.'
  },
  {
    id: 'mock-moon-lamp',
    name: '3D Personalized Moon Lamp',
    price: 899,
    original_price: 1299,
    category: 'Sublimation Gifts',
    image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&q=80&w=400',
    description: 'An elegant 3D glow lamp custom engraved with your family or partner photo.'
  },
  {
    id: 'mock-glass-frame',
    name: 'Illuminated Acrylic Photo Frame',
    price: 699,
    original_price: 999,
    category: 'Photo Frames',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400',
    description: 'High definition acrylic photo frame backed with premium warm LED wooden stand.'
  },
  {
    id: 'mock-magic-mug',
    name: 'Interactive Heat Changing Mug',
    price: 349,
    original_price: 499,
    category: 'Sublimation Gifts',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
    description: 'Pour hot beverage to magically reveal your personalized message and image.'
  },
  {
    id: 'mock-wooden-box',
    name: 'Vintage Engraved Keepsake Box',
    price: 599,
    original_price: 799,
    category: 'Photo Frames',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=400',
    description: 'Timeless pine wood keepsake box styled with custom engraved text.'
  }
];

export default function FrameStudio() {
  const [frames, setFrames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);
  const [regionsData, setRegionsData] = useState<{uploadedImage: string | null, zoom: number, rotation: number, position: {x:number, y:number}}[]>([]);
  const [activeRegionIndex, setActiveRegionIndex] = useState(0);

  const uploadedImage = regionsData[activeRegionIndex]?.uploadedImage || null;
  const zoom = regionsData[activeRegionIndex]?.zoom || 1;
  const rotation = regionsData[activeRegionIndex]?.rotation || 0;
  const position = regionsData[activeRegionIndex]?.position || { x: 0, y: 0 };

  const updateActiveRegion = (updates: any) => {
    setRegionsData(prev => {
      const next = [...prev];
      if (next[activeRegionIndex]) {
        next[activeRegionIndex] = { ...next[activeRegionIndex], ...updates };
      }
      return next;
    });
  };

  const setZoom = (fnOrVal: any) => {
    updateActiveRegion({ zoom: typeof fnOrVal === 'function' ? fnOrVal(zoom) : fnOrVal });
  };
  const setRotation = (fnOrVal: any) => {
    updateActiveRegion({ rotation: typeof fnOrVal === 'function' ? fnOrVal(rotation) : fnOrVal });
  };
  const setPosition = (fnOrVal: any) => {
    updateActiveRegion({ position: typeof fnOrVal === 'function' ? fnOrVal(position) : fnOrVal });
  };
  const setUploadedImage = (fnOrVal: any) => {
    updateActiveRegion({ uploadedImage: typeof fnOrVal === 'function' ? fnOrVal(uploadedImage) : fnOrVal });
  };
  
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [acc1Checked, setAcc1Checked] = useState(true);
  const [acc2Checked, setAcc2Checked] = useState(false);
  const [selectedParams, setSelectedParams] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState('');
  const [aiTip, setAiTip] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addItem, clearCart } = useCartStore();

  useEffect(() => {
    const fetchFrames = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('category', '%Frame%');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFrames(data);
        } else {
          setFrames([
            { id: '1', name: 'Premium Black Frame', price: 999, description: '' },
            { id: '2', name: 'Oak Wood Frame', price: 1299, description: '' },
            { id: '3', name: 'Classic Gold Frame', price: 1499, description: '' },
          ]);
        }
      } catch (error: any) {
        console.warn('Error fetching frames, using default frames instead:', error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchFrames();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedImage && uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage);
      }
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setIsCustomizing(true);

      const nextEmptyIndex = regionsData.findIndex((r, idx) => idx !== activeRegionIndex && !r.uploadedImage);
      if (nextEmptyIndex !== -1) {
         setActiveRegionIndex(nextEmptyIndex);
      }
    }
  };

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

  const getConfig = (product: any) => {
    try {
      const parts = (product.description || '').split('___CONFIG___');
      if (parts.length > 1) {
        return JSON.parse(parts[1]);
      }
    } catch(e) {}
    return {};
  };

  const isOutOfStock = (product: any) => {
    const config = getConfig(product);
    if (typeof config.in_stock !== 'undefined') return !config.in_stock;
    return false;
  };

  useEffect(() => {
    if (!selectedFrame) {
      setSimilarProducts([]);
      setAiTip('');
      return;
    }
    
    // Initialize regionsData for frame
    const config = getConfig(selectedFrame);
    const areas = config?.customAreas?.length > 0 ? config.customAreas : [config || { x:0, y:0, w:100, h:100 }];
    setRegionsData(areas.map(() => ({ uploadedImage: null, zoom: 1, rotation: 0, position: {x: 0, y: 0} })));

    const fetchSimilarAndTip = async () => {
      try {
        setAiLoading(true);
        const { data: similarList } = await supabase
          .from('products')
          .select('*')
          .neq('category', '_SUBSECTION_')
          .neq('id', selectedFrame.id);
        
        const candidateList = similarList && similarList.length > 0 ? similarList : MOCK_FALLBACK_PRODUCTS;
        
        const resRecommendation = await fetch('/album/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentProduct: selectedFrame,
            candidates: candidateList
          })
        });

        if (resRecommendation.ok) {
          const recommendationResult = await resRecommendation.json();
          if (recommendationResult.recommendedIds && recommendationResult.recommendedIds.length > 0) {
            const recommended = candidateList.filter((p: any) => recommendationResult.recommendedIds.includes(p.id));
            if (recommended.length > 0) {
              setSimilarProducts(recommended.slice(0, 6));
            } else {
              const sameCategory = candidateList.filter((p: any) => p.category === selectedFrame.category);
              setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
            }
            setAiTip(recommendationResult.stylistTip || 'Stylist Tip: Hang this gorgeous custom frame alongside companion prints to create a stunning family memory gallery wall!');
          } else {
            const sameCategory = candidateList.filter((p: any) => p.category === selectedFrame.category);
            setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
            setAiTip('Stylist Tip: Hang this gorgeous custom frame alongside companion prints to create a stunning family memory gallery wall!');
          }
        } else {
          const sameCategory = candidateList.filter((p: any) => p.category === selectedFrame.category);
          setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
          setAiTip('Stylist Tip: Hang this gorgeous custom frame alongside companion prints to create a stunning family memory gallery wall!');
        }
      } catch (err) {
        console.warn("Fallback enabled. API overloaded:", err);
        const candidateList = MOCK_FALLBACK_PRODUCTS;
        const sameCategory = candidateList.filter((p: any) => p.category === selectedFrame.category);
        setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
      } finally {
        setAiLoading(false);
      }
    };
    
    fetchSimilarAndTip();
  }, [selectedFrame]);

  const urlToBase64 = async (url: string): Promise<{ data: string, mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({ data: base64String, mimeType: blob.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const captureCustomization = async (): Promise<{ customizedPreviewUrl: string | null, regionFinalImages: string[] }> => {
    let customizedPreviewUrl = null;
    const regionFinalImages: string[] = [];

    for (const r of regionsData) {
      let img = r.uploadedImage;
      if (img && img.startsWith('blob:')) {
         try {
           const { data, mimeType } = await urlToBase64(img);
           img = `data:${mimeType};base64,${data}`;
         } catch(e) {}
      }
      regionFinalImages.push(img || '');
    }

    const el = document.getElementById('frame-customization-preview');
    if (el) {
      try {
        const controls = el.querySelectorAll('.move-icon, .upload-placeholder');
        controls.forEach(c => (c as HTMLElement).style.display = 'none');
        
        let oldBorders: string[] = [];
        const containers = el.querySelectorAll('.region-container');
        containers.forEach(c => {
           oldBorders.push((c as HTMLElement).style.border);
           (c as HTMLElement).style.border = 'none';
        });

        // Force all images inside preview to fetch uniquely avoiding cache issues
        const imgs = el.querySelectorAll('img');
        const originalSrcs: string[] = [];
        imgs.forEach((img, idx) => {
           originalSrcs.push(img.src);
           img.crossOrigin = 'anonymous';
           if (img.src && !img.src.startsWith('blob:') && !img.src.startsWith('data:')) {
              img.src = img.src + (img.src.includes('?') ? '&' : '?') + 'cors=' + Date.now();
           }
        });

        await new Promise(r => setTimeout(r, 800));

        customizedPreviewUrl = await htmlToImage.toPng(el as HTMLElement, { pixelRatio: 2 });
        
        imgs.forEach((img, idx) => {
           img.src = originalSrcs[idx];
        });

        controls.forEach(c => (c as HTMLElement).style.display = '');
        containers.forEach((c, i) => {
           (c as HTMLElement).style.border = oldBorders[i];
        });
      } catch(e) {
        console.error("Failed to snapshot:", e);
      }
    }
    return { customizedPreviewUrl, regionFinalImages };
  };

  const handleSaveFinalImage = async () => {
    const missingImages = regionsData.some(r => !r.uploadedImage);
    if (missingImages) {
      toast.error('Please upload an image for every custom region before saving.');
      return;
    }
    const toastId = toast.loading('Generating high quality image...');
    const { customizedPreviewUrl } = await captureCustomization();
    if (customizedPreviewUrl) {
      const link = document.createElement('a');
      link.href = customizedPreviewUrl;
      link.download = `${selectedFrame?.name.replace(/\\s+/g, '_') || 'frame'}_customized.png`;
      link.click();
      toast.success('Image saved successfully!', { id: toastId });
    } else {
      toast.error('Failed to generate image.', { id: toastId });
    }
  };

  const handleAddToCart = async (product: any) => {
    if (!product) return;
    
    const config = getConfig(product);
    if (config.requiresCustomName && !customName.trim()) {
      toast.error('Please enter a custom name for this product');
      return;
    }

    const hasAnyImage = regionsData.some(r => r.uploadedImage);
    const missingImages = regionsData.some(r => !r.uploadedImage);
    if ((hasAnyImage || isCustomizing) && missingImages) {
      toast.error('Please upload an image for every custom region');
      return;
    }

    if (config.custom_params?.length > 0) {
      const allSelected = config.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options before adding to cart');
        return;
      }
    }

    const toastId = toast.loading('Processing customization...');
    const { customizedPreviewUrl, regionFinalImages } = await captureCustomization();

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: customizedPreviewUrl || product.image || `https://picsum.photos/seed/${product.id}/400/400`,
      config: {
        ...(customizedPreviewUrl ? {
          originalProductImage: product.image,
          customImage: customizedPreviewUrl,
          customizedImageUrl: customizedPreviewUrl,
          regionFinalImages,
          zoom: regionsData[0]?.zoom || 1,
          rotation: regionsData[0]?.rotation || 0,
          position: regionsData[0]?.position || {x:0, y:0}
        } : {}),
        selectedParams,
        ...(customName.trim() ? { customName: customName.trim() } : {}),
        allow_return_exchange: config.allow_return_exchange !== false
      }
    });

    toast.success('Added to cart', { id: toastId });
  };

  const handleBuyNow = async (product: any) => {
    if (!product) return;

    const config = getConfig(product);
    if (config.requiresCustomName && !customName.trim()) {
      toast.error('Please enter a custom name for this product');
      return;
    }

    const hasAnyImage = regionsData.some(r => r.uploadedImage);
    const missingImages = regionsData.some(r => !r.uploadedImage);
    if ((hasAnyImage || isCustomizing) && missingImages) {
      toast.error('Please upload an image for every custom region');
      return;
    }

    if (config.custom_params?.length > 0) {
      const allSelected = config.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options');
        return;
      }
    }

    const toastId = toast.loading('Processing customization...');
    const { customizedPreviewUrl, regionFinalImages } = await captureCustomization();

    clearCart();
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: customizedPreviewUrl || product.image || `https://picsum.photos/seed/${product.id}/400/400`,
      config: {
        ...(customizedPreviewUrl ? {
          originalProductImage: product.image,
          customImage: customizedPreviewUrl,
          customizedImageUrl: customizedPreviewUrl,
          regionFinalImages,
          zoom: regionsData[0]?.zoom || 1,
          rotation: regionsData[0]?.rotation || 0,
          position: regionsData[0]?.position || {x:0, y:0}
        } : {}),
        selectedParams,
        ...(customName.trim() ? { customName: customName.trim() } : {}),
        allow_return_exchange: config.allow_return_exchange !== false
      }
    });
    
    toast.dismiss(toastId);
    navigate('/checkout');
  };

  const handleAddBundleToCart = (product: any) => {
    if (!product) return;
    
    const config = getConfig(product);
    if (config.requiresCustomName && !customName.trim()) {
      toast.error('Please enter a custom name for this product');
      return;
    }

    if (config.custom_params?.length > 0) {
      const allSelected = config.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options for your customizable product first');
        return;
      }
    }

    // 1. Add primary product
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: uploadedImage || product.image || `https://picsum.photos/seed/${product.id}/400/400`,
      config: {
        ...(uploadedImage ? {
          originalProductImage: product.image,
          customImage: uploadedImage,
          zoom,
          rotation,
          position
        } : {}),
        selectedParams,
        ...(customName.trim() ? { customName: customName.trim() } : {}),
        allow_return_exchange: config.allow_return_exchange !== false
      }
    });

    // 2. Add Deluxe velvet gift wrap
    if (acc1Checked) {
      addItem({
        productId: `accessory-gift-wrap-${product.id}`,
        productName: 'Premium Velvet Gift Box & Greetings Card',
        price: 149,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=300'
      });
    }

    // 3. Add Warm LED Base
    if (acc2Checked) {
      addItem({
        productId: `accessory-led-base-${product.id}`,
        productName: 'Universal USB Wooden Warm LED Light Base',
        price: 299,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=300'
      });
    }

    toast.success('customized gift bundle added to cart!');
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const amount = clientWidth * 0.75;
      carouselRef.current.scrollTo({
        left: scrollLeft + (direction === 'left' ? -amount : amount),
        behavior: 'smooth'
      });
    }
  };

  // Handle conditional view when selectedFrame is defined (Product Detail Page View)
  if (selectedFrame) {
    const originalPrice = selectedFrame.original_price || Math.round(selectedFrame.price * 1.4);
    const [descText] = (selectedFrame.description || '').split('___CONFIG___');
    const config = getConfig(selectedFrame);
    const custom_params = config.custom_params || [];
    const outOfStock = isOutOfStock(selectedFrame);

    return (
      <div className="pt-32 pb-20 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb back navigation */}
          <button 
            onClick={() => { 
              setSelectedFrame(null); 
              setUploadedImage(null); 
              setZoom(1); 
              setRotation(0); 
              setPosition({ x: 0, y: 0 }); 
              setIsCustomizing(false); 
            }} 
            className="inline-flex items-center gap-2 text-muted hover:text-gold mb-8 transition-colors text-sm font-bold"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Frames Catalog
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Interactive Framing Studio Preview & Alignments */}
            <div className="space-y-6">
              <div className="relative aspect-square rounded-[40px] overflow-hidden glass p-8 flex items-center justify-center bg-black/40 group">
                {/* Visual frame renderer */}
                <div 
                  id="frame-customization-preview"
                  className="relative shadow-2xl shrink-0 rounded-xl" 
                  style={{ 
                    width: 'min(100%, 48vh * 0.75)', 
                    aspectRatio: '3/4',
                  }}
                >
                  {selectedFrame.image ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-white/5 rounded-xl p-8">
                      {regionsData.map((rData, index) => {
                         const area = (config.customAreas?.length > 0 ? config.customAreas : [config])[index] || config || { x:0, y:0, w:100, h:100 };
                         const isActive = index === activeRegionIndex;
                         let style: any = {};
                         let clip: any = undefined;
                         if (area.type === 'polygon' && area.points?.length > 0) {
                            const xs = area.points.map((p: any) => p.x);
                            const ys = area.points.map((p: any) => p.y);
                            const minX = Math.min(...xs);
                            const maxX = Math.max(...xs);
                            const minY = Math.min(...ys);
                            const maxY = Math.max(...ys);
                            const w = maxX - minX;
                            const h = maxY - minY;
                            style = { left: `${minX}%`, top: `${minY}%`, width: `${w}%`, height: `${h}%` };
                            if (w > 0 && h > 0) {
                              const polygonPoints = area.points.map((p: any) => `${((p.x - minX) / w) * 100}% ${((p.y - minY) / h) * 100}%`).join(', ');
                              clip = `polygon(${polygonPoints})`;
                            }
                         } else {
                           style = { left: `${area.x || 20}%`, top: `${area.y || 15}%`, width: `${area.w || 60}%`, height: `${area.h || 70}%` };
                         }
                         return (
                          <div 
                            key={index}
                            className={cn(
                              "absolute z-0 overflow-hidden bg-white/10 cursor-pointer region-container",
                              isActive ? "border-2 border-gold/80" : ""
                            )}
                            style={{ ...style, clipPath: clip }}
                            onClick={() => setActiveRegionIndex(index)}
                          >
                            {rData.uploadedImage ? (
                              <motion.img 
                                src={rData.uploadedImage} 
                                style={{ 
                                  scale: rData.zoom, 
                                  rotate: rData.rotation, 
                                  x: rData.position.x, 
                                  y: rData.position.y 
                                }}
                                className={cn("w-full h-full object-cover", isActive ? "cursor-move" : "pointer-events-none")}
                                drag={isActive}
                                dragMomentum={false}
                                onDragEnd={(_, info) => { if(isActive) setPosition({ x: info.offset.x, y: info.offset.y }) }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-white/30 text-center animate-pulse border-2 border-dashed border-white/20 upload-placeholder">
                                <Move className={cn("w-8 h-8 mb-2", isActive ? "text-gold" : "")} />
                                <p className={cn("font-bold text-xs uppercase tracking-widest", isActive ? "text-gold" : "")}>Region {index + 1}</p>
                                <p className="text-[10px] mt-1 font-medium">Upload photo</p>
                              </div>
                            )}
                          </div>
                         );
                      })}
                      
                      <img 
                        crossOrigin="anonymous"
                        src={selectedFrame.image} 
                        alt={selectedFrame.name} 
                        className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" 
                      />
                    </div>
                  ) : (
                    <div 
                      className={cn("w-full h-full relative flex items-center justify-center overflow-hidden bg-white/5", config.class_name)} 
                      style={{
                        ...getFrameStyles(config.class_name),
                      }}
                    >
                      {regionsData.map((rData, index) => {
                         const area = (config.customAreas?.length > 0 ? config.customAreas : [config])[index] || config || { x:0, y:0, w:100, h:100 };
                         const isActive = index === activeRegionIndex;
                         let style: any = {};
                         let clip: any = undefined;
                         if (area.type === 'polygon' && area.points?.length > 0) {
                            const xs = area.points.map((p: any) => p.x);
                            const ys = area.points.map((p: any) => p.y);
                            const minX = Math.min(...xs);
                            const maxX = Math.max(...xs);
                            const minY = Math.min(...ys);
                            const maxY = Math.max(...ys);
                            const w = maxX - minX;
                            const h = maxY - minY;
                            style = { left: `${minX}%`, top: `${minY}%`, width: `${w}%`, height: `${h}%` };
                            if (w > 0 && h > 0) {
                              const polygonPoints = area.points.map((p: any) => `${((p.x - minX) / w) * 100}% ${((p.y - minY) / h) * 100}%`).join(', ');
                              clip = `polygon(${polygonPoints})`;
                            }
                         } else {
                           style = { left: `${area.x || 0}%`, top: `${area.y || 0}%`, width: `${area.w || 100}%`, height: `${area.h || 100}%` };
                         }

                         return (
                          <div 
                            key={index}
                            className={cn(
                              "absolute bg-white/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center cursor-pointer region-container",
                              isActive ? "border-2 border-gold/80 z-20" : "z-10"
                            )}
                            style={{ ...style, clipPath: clip }}
                            onClick={() => setActiveRegionIndex(index)}
                          >
                            {rData.uploadedImage ? (
                              <motion.img 
                                src={rData.uploadedImage} 
                                style={{ 
                                  scale: rData.zoom, 
                                  rotate: rData.rotation, 
                                  x: rData.position.x, 
                                  y: rData.position.y 
                                }}
                                className={cn("w-full h-full object-cover", isActive ? "cursor-move" : "pointer-events-none")}
                                drag={isActive}
                                dragMomentum={false}
                                onDragEnd={(_, info) => { if(isActive) setPosition({ x: info.offset.x, y: info.offset.y }) }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-black/20 p-8 text-center animate-pulse upload-placeholder">
                                <Move className={cn("w-12 h-12 mb-4", isActive ? "text-gold" : "")} />
                                <p className={cn("font-bold text-base uppercase tracking-widest", isActive ? "text-gold" : "")}>Region {index + 1}</p>
                                <p className="text-xs mt-2 font-medium">Upload photo to fill</p>
                              </div>
                            )}
                          </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Zoom & Alignment adjustments container */}
              {uploadedImage && (
                <div className="flex items-center gap-3 justify-center glass px-4 py-2 rounded-2xl border border-white/5 shadow-2xl w-full max-w-sm mx-auto">
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:text-gold transition-colors text-white" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-border" />
                  <button onClick={() => setRotation(r => r - 90)} className="p-1.5 hover:text-gold transition-colors text-white" title="Rotate Left"><RotateCcw className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-border" />
                  <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1.5 hover:text-gold transition-colors text-white" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                </div>
              )}

              {/* Upload Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                  <Upload className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="font-bold text-sm text-white">{uploadedImage ? 'Change Photo' : 'Upload Your Photo'}</p>
                    <p className="text-[10px] text-muted">Use your own memories</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
                
                <button 
                  onClick={handleSaveFinalImage}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-gold/5 border border-gold/20 rounded-2xl hover:bg-gold/10 transition-all group"
                >
                  <ShoppingCart className="w-5 h-5 text-gold group-hover:scale-110 transition-transform hidden" />
                  <div className="text-center">
                    <p className="font-bold text-sm text-gold">Save Final Image</p>
                    <p className="text-[10px] text-gold/60">Download your framed artwork</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Column: Custom Product Details & Params */}
            <div className="flex flex-col">
              <div className="mb-8">
                <span className="px-3 py-1 bg-gold/10 text-gold rounded-full font-bold tracking-widest uppercase text-[10px] mb-4 inline-block border border-gold/20">
                  {selectedFrame.category || "Photo Frames"}
                </span>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic">
                  {selectedFrame.name}
                </h1>
                
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-gold">₹{selectedFrame.price}</span>
                  {originalPrice > selectedFrame.price && (
                    <span className="text-xl text-muted line-through">₹{originalPrice}</span>
                  )}
                </div>
              </div>

              <div className="prose prose-invert mb-8">
                <p className="text-muted leading-relaxed whitespace-pre-wrap">
                  {descText || "Create high fidelity framed photographs with museum-quality materials. Perfectly sealed backing with high durability wooden contours."}
                </p>
              </div>

              {/* Custom Parameter Choice Options */}
              {custom_params.length > 0 && (
                <div className="space-y-6 mb-10">
                  {custom_params.map((param: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <label className="text-xs font-bold text-muted uppercase tracking-widest">{param.label}</label>
                      <div className="flex flex-wrap gap-2">
                        {param.options.map((option: string) => (
                          <button
                            key={option}
                            onClick={() => setSelectedParams(prev => ({ ...prev, [param.label]: option }))}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer",
                              selectedParams[param.label] === option
                                ? "bg-gold text-bg border-gold"
                                : "border-white/10 text-white hover:border-gold/50"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {getConfig(selectedFrame)?.requiresCustomName && (
                <div className="space-y-3 mb-10">
                  <label className="text-xs font-bold text-gold uppercase tracking-widest flex items-center gap-2">
                    Custom Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter custom name for this product"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition-colors text-white"
                    required
                  />
                </div>
              )}

              {/* Add Cart & Buy Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                {outOfStock ? (
                  <div className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-center">
                    Currently Out of Stock
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleAddToCart(selectedFrame)}
                      className="flex-1 py-4 border border-gold text-gold font-bold rounded-xl hover:bg-gold/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart className="w-5 h-5" /> Add to Cart
                    </button>
                    <button 
                      onClick={() => handleBuyNow(selectedFrame)}
                      className="flex-1 py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-5 h-5" /> Buy Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Frequently Bought Together section */}
          {!outOfStock && (
            <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider mb-2">
                    <Percent className="w-4 h-4" /> Save Combo Discount
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-bold">Frequently Bought Together</h3>
                  <p className="text-sm text-muted">Complete your customized framing package with our premium accessories.</p>
                </div>
                
                {/* Bundle total indicator */}
                <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col items-end shrink-0 w-full md:w-auto">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xs text-muted font-bold">Bundle Total:</span>
                    <span className="text-2xl font-bold text-gold">
                      ₹{selectedFrame.price + (acc1Checked ? 149 : 0) + (acc2Checked ? 299 : 0) - ((acc1Checked && acc2Checked) ? 50 : 0)}
                    </span>
                    {(acc1Checked && acc2Checked) && (
                      <span className="text-sm text-muted/60 line-through">
                        ₹{selectedFrame.price + 149 + 299}
                      </span>
                    )}
                  </div>
                  {(acc1Checked && acc2Checked) && (
                    <p className="text-[10px] text-green-400 font-bold uppercase mb-3">⭐ Combo Offer: ₹50 discount applied!</p>
                  )}
                  <button 
                    onClick={() => handleAddBundleToCart(selectedFrame)}
                    className="w-full md:w-auto px-6 py-2.5 bg-gold text-bg text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Bundle to Cart
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-8 justify-center">
                {/* Product Bundle visualizer chain */}
                <div className="flex flex-wrap items-center justify-center gap-4 py-4">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 relative glass flex items-center justify-center bg-black/40">
                      <img src={uploadedImage || selectedFrame.image || `https://picsum.photos/seed/${selectedFrame.id}/150/150`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 bg-gold/90 text-bg text-[8px] font-bold px-1.5 py-0.5 rounded">THIS</div>
                    </div>
                    <p className="text-[11px] font-bold text-white/50 text-center w-24 truncate mt-2">{selectedFrame.name}</p>
                    <p className="text-[10px] text-gold font-bold">₹{selectedFrame.price}</p>
                  </div>

                  <Plus className="w-5 h-5 text-muted/50" />

                  <button 
                    onClick={() => setAcc1Checked(!acc1Checked)}
                    className={cn(
                      "flex flex-col items-center transition-all cursor-pointer",
                      acc1Checked ? "opacity-100 scale-100" : "opacity-40 hover:opacity-75 scale-95"
                    )}
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 relative glass flex items-center justify-center bg-black/40">
                      <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=150" className="w-full h-full object-cover" />
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
                        acc1Checked ? "opacity-0" : "opacity-100"
                      )}>
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-white/70 text-center w-24 truncate mt-2">Premium Gift Box</p>
                    <p className="text-[10px] text-gold font-bold">₹149</p>
                  </button>

                  <Plus className="w-5 h-5 text-muted/50" />

                  <button 
                    onClick={() => setAcc2Checked(!acc2Checked)}
                    className={cn(
                      "flex flex-col items-center transition-all cursor-pointer",
                      acc2Checked ? "opacity-100 scale-100" : "opacity-40 hover:opacity-75 scale-95"
                    )}
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 relative glass flex items-center justify-center bg-black/40">
                      <img src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=150" className="w-full h-full object-cover" />
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
                        acc2Checked ? "opacity-0" : "opacity-100"
                      )}>
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-white/70 text-center w-24 truncate mt-2">Wooden Warm LED Base</p>
                    <p className="text-[10px] text-gold font-bold">₹299</p>
                  </button>
                </div>

                {/* Description list / checkboxes */}
                <div className="flex-1 space-y-4 w-full">
                  <div onClick={() => setAcc1Checked(!acc1Checked)} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-dashed border-white/5">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                      acc1Checked ? "bg-gold border-gold text-bg" : "border-white/20"
                    )}>
                      {acc1Checked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Deluxe Velvet Gift Wrapping & Premium Card <span className="text-xs text-gold font-bold">₹149</span>
                      </h4>
                      <p className="text-xs text-muted mt-1 leading-normal">Premium packaging tailored for personalized gifting. Includes heavy red velvet box casing and a customized handwriting message card.</p>
                    </div>
                  </div>

                  <div onClick={() => setAcc2Checked(!acc2Checked)} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-dashed border-white/5">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                      acc2Checked ? "bg-gold border-gold text-bg" : "border-white/20"
                    )}>
                      {acc2Checked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Universal Warm LED Wooden Base Stand <span className="text-xs text-gold font-bold">₹299</span>
                      </h4>
                      <p className="text-xs text-muted mt-1 leading-normal">Upgrade your gifts to spectacular glowing accents. Adds a dual wood stand embedded with brilliant warm backlamps powered via standard USB.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Stylist Suggestion Box & Similar Gifts Section */}
          <div className="mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider">AI Recommendation Engine</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white">Similar & Complementary Gifts</h3>
                <p className="text-sm text-muted">Aesthetic pairings matched by our AI styling expert.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollCarousel('left')}
                  className="p-2.5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
                  aria-label="Previous products"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollCarousel('right')}
                  className="p-2.5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
                  aria-label="Next products"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AI Stylist suggestion tooltip */}
            <AnimatePresence mode="wait">
              {(aiLoading || aiTip) && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="mb-8 p-6 rounded-3xl border border-gold/20 bg-gold/[0.02] backdrop-blur relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full" />
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold/10 rounded-2xl border border-gold/30 text-gold relative shrink-0">
                      <Sparkles className="w-5 h-5" />
                      {aiLoading && (
                        <span className="absolute inset-0 border-2 border-gold/40 rounded-2xl animate-ping opacity-75" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                        AI Gift Stylist Suggestion
                        {aiLoading && (
                          <span className="text-[9px] lowercase animate-pulse text-muted">(evaluating perfect matches...)</span>
                        )}
                      </h5>
                      <p className="text-xs text-white/95 leading-relaxed font-light">
                        {aiLoading ? (
                          <span className="inline-flex gap-1 items-center">
                            Analyzing details of "{selectedFrame.name}" and comparing with companion designs...
                            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce delay-75" />
                            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce delay-150" />
                            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce delay-225" />
                          </span>
                        ) : (
                          aiTip
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-6 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {(similarProducts.length > 0 ? similarProducts : MOCK_FALLBACK_PRODUCTS).map((item: any) => {
                const displayImg = item.images?.[0] || item.image;
                const hasOldPrice = item.original_price && item.original_price > item.price;
                const itemOldPrice = item.original_price || Math.round(item.price * 1.4);
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -6 }}
                    className="w-[260px] flex-shrink-0 glass rounded-3xl border border-white/10 hover:border-gold/30 overflow-hidden cursor-pointer group transition-all"
                    onClick={() => {
                      // If it is another Frame product, set it as selectedFrame. Otherwise, go to product details page.
                      if (item.category?.toLowerCase().includes('frame')) {
                        setSelectedFrame(item);
                        setUploadedImage(null);
                        setZoom(1);
                        setRotation(0);
                        setPosition({ x: 0, y: 0 });
                        setIsCustomizing(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        navigate(`/product/${item.id}`);
                      }
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-white/5">
                      <img 
                        src={displayImg} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2.5 py-0.5 rounded-full text-[9px] font-bold text-gold uppercase tracking-wider">
                        {item.category}
                      </div>
                    </div>
                    
                    <div className="p-5 space-y-2">
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-gold transition-colors">{item.name}</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-gold font-mono">₹{item.price}</span>
                        {itemOldPrice > item.price && (
                          <span className="text-xs text-muted line-through font-mono">₹{itemOldPrice}</span>
                        )}
                      </div>
                      
                      <span 
                        className="w-full py-2 bg-white/5 border border-white/10 rounded-xl group-hover:bg-gold group-hover:text-bg group-hover:border-gold text-[10px] font-bold text-white leading-none tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 mt-2"
                      >
                        <span>Explore Gift</span> <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Frame reviews block exactly matching product detail */}
          <ProductReviews productId={selectedFrame.id} />
        </div>
      </div>
    );
  }

  // Standard Catalog Grid view of Frame Studio
  return (
    <div className="min-h-screen bg-bg pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold mb-4">Frame Studio</h1>
          <p className="text-muted max-w-2xl mx-auto font-light text-sm">
            Choose an artisanal frame of museum-quality backing and contour, then upload your favorite photo to tailor your memories.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {frames.map((frame, index) => {
              const outOfStock = isOutOfStock(frame);
              const config = getConfig(frame);
              return (
                <motion.div
                  key={frame.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "glass p-6 rounded-3xl cursor-pointer group flex flex-col items-center border border-white/10",
                    outOfStock ? "opacity-75 grayscale bg-white/[0.01]" : "hover:border-gold/30 transition-all bg-white/[0.02]"
                  )}
                  onClick={() => !outOfStock && setSelectedFrame(frame)}
                >
                  {/* Frame Container */}
                  <div className="relative w-full aspect-square mb-6 bg-white/5 rounded-3xl flex items-center justify-center overflow-hidden border border-white/5">
                    {frame.image ? (
                      <div className="relative w-full h-full flex items-center justify-center p-8">
                        {/* Stock Photo behind frame */}
                        <img 
                          src={`https://picsum.photos/seed/${frame.id}/400/400`} 
                          alt="Random art representation"
                          className="absolute w-[60%] h-[70%] object-cover shadow-inner group-hover:scale-105 transition-transform duration-700 z-0"
                          referrerPolicy="no-referrer"
                        />
                        {/* Frame Product Overlay */}
                        <img 
                          src={frame.image} 
                          alt={frame.name} 
                          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        {/* CSS Based Frame */}
                        <div 
                          style={getFrameStyles(config.class_name)}
                          className={cn("w-2/3 h-3/4 shadow-2xl bg-white/5 flex items-center justify-center relative overflow-hidden", config.class_name)}
                        >
                          <img 
                            src={`https://picsum.photos/seed/${frame.id}/400/400`} 
                            alt="Art mockup representation"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-center text-white">{frame.name}</h3>
                  <p className="text-gold font-bold text-2xl mb-4 font-mono">₹{frame.price}</p>
                  
                  {outOfStock ? (
                    <span className="px-4 py-2 bg-red-500/20 text-red-400 font-bold rounded-xl text-sm">Out of Stock</span>
                  ) : (
                    <button className="px-6 py-2 bg-gold/10 text-gold border border-gold/30 hover:bg-gold hover:text-bg transition-colors duration-300 font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer">
                      Create Custom Photo
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
