import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCartStore } from '../cartStore';
import { toast } from 'sonner';
import { ShoppingCart, Zap, ChevronLeft, ChevronRight, Upload, Edit, Sparkles, Move, ZoomIn, ZoomOut, RotateCcw, Wand2, X as CloseX, Plus, Check, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import { cn } from '../lib/utils';

import ProductReviews from '../components/ProductReviews';
import { WishlistButton } from '../components/WishlistButton';

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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
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
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAspectRatio, setAiAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addItem, clearCart } = useCartStore();

  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [acc1Checked, setAcc1Checked] = useState(true);
  const [acc2Checked, setAcc2Checked] = useState(false);
  const [aiTip, setAiTip] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

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

  const handleGenerateAiImage = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let contents: any;
      if (uploadedImage) {
        const { data, mimeType } = await urlToBase64(uploadedImage);
        contents = {
          parts: [
            { inlineData: { data, mimeType } },
            { text: `Edit this image based on: ${aiPrompt}` }
          ]
        };
      } else {
        contents = {
          parts: [{ text: aiPrompt }],
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: {
          imageConfig: {
            aspectRatio: aiAspectRatio
          }
        }
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64Data}`;
          setUploadedImage(imageUrl);
          setIsCustomizing(true);
          setShowAiModal(false);
          foundImage = true;
          toast.success('Design generated!');
          break;
        }
      }
      if (!foundImage) toast.error('Model produced no image. Try a different prompt.');
    } catch (error: any) {
      console.error('AI Generation error:', error);
      if (error?.message?.includes('429') || error?.status === 429 || error?.toString().includes('Quota')) {
        toast.error('AI Quota exceeded. Please upgrade your API key or try again later.');
      } else {
        toast.error('AI Generation failed. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (data) {
          setProduct(data);
          
          let config = { type: 'rect', x: 0, y: 0, w: 100, h: 100 } as any;
          const [descText, configString] = (data.description || '').split('___CONFIG___');
          if (configString) {
            try { config = JSON.parse(configString); if (!config.type) config.type = 'rect'; } catch(e) {}
          }
          const areas = config.customAreas?.length > 0 ? config.customAreas : [config];
          setRegionsData(areas.map(() => ({ uploadedImage: null, zoom: 1, rotation: 0, position: {x: 0, y: 0} })));
          
          setMainImage(data.images?.[0] || data.image || '');
          // Instantly finish top-level page loading so details screen mounts smoothly without waiting for AI recommendations
          setLoading(false);

          // Now fetch similar products & stylist tips asynchronously in the background
          try {
            setAiLoading(true);
            const { data: similarList } = await supabase
              .from('products')
              .select('*')
              .neq('category', '_SUBSECTION_')
              .neq('id', id);
            
            const candidateList = similarList && similarList.length > 0 ? similarList : MOCK_FALLBACK_PRODUCTS;

            const resRecommendation = await fetch('/album/api/recommendations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentProduct: data,
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
                  const sameCategory = candidateList.filter((p: any) => p.category === data.category);
                  setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
                }
                setAiTip(recommendationResult.stylistTip || 'Stylist Tip: Complete your custom gift set with these matching items in the same collection!');
              } else {
                const sameCategory = candidateList.filter((p: any) => p.category === data.category);
                setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
                setAiTip('Stylist Tip: Complete your custom gift set with these matching items in the same collection!');
              }
            } else {
              const sameCategory = candidateList.filter((p: any) => p.category === data.category);
              setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
            }
          } catch (e) {
            console.warn("Fallback enabled. API overloaded:", e);
            const candidateList = MOCK_FALLBACK_PRODUCTS;
            const sameCategory = candidateList.filter((p: any) => p.category === data.category);
            setSimilarProducts(sameCategory.length >= 3 ? sameCategory.slice(0, 6) : candidateList.slice(0, 6));
          } finally {
            setAiLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    return () => {
      if (uploadedImage && uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedImage && uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage);
      }
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setIsCustomizing(true);
      
      // Auto-advance to next empty region if one exists
      const nextEmptyIndex = regionsData.findIndex((r, idx) => idx !== activeRegionIndex && !r.uploadedImage);
      if (nextEmptyIndex !== -1) {
         setActiveRegionIndex(nextEmptyIndex);
      }
    }
  };

  const [selectedParams, setSelectedParams] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState('');

  const [isProcessingCart, setIsProcessingCart] = useState(false);

  const captureCustomization = async (): Promise<{ customizedPreviewUrl: string | null, regionFinalImages: string[] }> => {
    let customizedPreviewUrl = null;
    const regionFinalImages: string[] = [];

    for (const r of regionsData) {
      let img = r.uploadedImage;
      if (img && img.startsWith('blob:')) {
         try {
           const { data, mimeType } = await urlToBase64(img);
           img = `data:${mimeType};base64,${data}`;
         } catch(e){}
      }
      regionFinalImages.push(img || '');
    }

    const el = document.getElementById('product-customization-preview');
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

          // adding a slight delay so images can load their new src
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
          toast.error("Snapshot error: " + (e as Error).message);
        }
      } else {
        toast.error("Preview element not found.");
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
      link.download = `${product?.name.replace(/\\s+/g, '_') || 'product'}_customized.png`;
      link.click();
      toast.success('Image saved successfully!', { id: toastId });
    } else {
      toast.error('Failed to generate image.', { id: toastId });
    }
  };

  const handleAddToCart = async () => {
    if (!product || isProcessingCart) return;
    
    if (customizationArea.requiresCustomName && !customName.trim()) {
      toast.error('Please enter a custom name for this product');
      return;
    }

    const hasAnyImage = regionsData.some(r => r.uploadedImage);
    const missingImages = regionsData.some(r => !r.uploadedImage);
    if ((hasAnyImage || isCustomizing) && missingImages) {
      toast.error('Please upload an image for every custom region');
      return;
    }

    if (customizationArea.custom_params?.length > 0) {
      const allSelected = customizationArea.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options before adding to cart');
        return;
      }
    }

    setIsProcessingCart(true);
    const toastId = toast.loading('Processing customization...');
    const { customizedPreviewUrl, regionFinalImages } = await captureCustomization();

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: customizedPreviewUrl || mainImage,
      config: {
        ...(customizedPreviewUrl ? {
          originalProductImage: mainImage,
          customImage: customizedPreviewUrl,
          customizedImageUrl: customizedPreviewUrl,
          regionFinalImages,
          zoom,
          rotation,
          position
        } : {}),
        selectedParams,
        ...(customName.trim() ? { customName: customName.trim() } : {}),
        allow_return_exchange: customizationArea.allow_return_exchange !== false
      }
    });
    
    setIsProcessingCart(false);
    toast.success('Added to cart', { id: toastId });
  };

  const handleBuyNow = async () => {
    if (!product || isProcessingCart) return;

    if (customizationArea.requiresCustomName && !customName.trim()) {
      toast.error('Please enter a custom name for this product');
      return;
    }
    
    const hasAnyImage = regionsData.some(r => r.uploadedImage);
    const missingImages = regionsData.some(r => !r.uploadedImage);
    if ((hasAnyImage || isCustomizing) && missingImages) {
      toast.error('Please upload an image for every custom region');
      return;
    }

    if (customizationArea.custom_params?.length > 0) {
      const allSelected = customizationArea.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options');
        return;
      }
    }

    setIsProcessingCart(true);
    const toastId = toast.loading('Processing customization...');
    const { customizedPreviewUrl, regionFinalImages } = await captureCustomization();

    clearCart();
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: customizedPreviewUrl || mainImage,
      config: {
        ...(customizedPreviewUrl ? {
          originalProductImage: mainImage,
          customImage: customizedPreviewUrl,
          customizedImageUrl: customizedPreviewUrl,
          regionFinalImages,
          zoom,
          rotation,
          position
        } : {}),
        selectedParams,
        ...(customName.trim() ? { customName: customName.trim() } : {}),
        allow_return_exchange: customizationArea.allow_return_exchange !== false
      }
    });
    
    setIsProcessingCart(false);
    toast.dismiss(toastId);
    navigate('/checkout');
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddBundleToCart = async () => {
    if (!product) return;
    
    if (customizationArea.requiresCustomName && !customName.trim()) {
      toast.error('Please enter a custom name for this product');
      return;
    }
    
    const hasAnyImage = regionsData.some(r => r.uploadedImage);
    const missingImages = regionsData.some(r => !r.uploadedImage);
    if ((hasAnyImage || isCustomizing) && missingImages) {
      toast.error('Please upload an image for every custom region');
      return;
    }

    if (customizationArea.custom_params?.length > 0) {
      const allSelected = customizationArea.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options for your customizable product first');
        return;
      }
    }

    setIsProcessingCart(true);
    const toastId = toast.loading('Processing bundle customization...');
    const { customizedPreviewUrl, regionFinalImages } = await captureCustomization();

    // 1. Add primary product
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: customizedPreviewUrl || mainImage,
      config: {
        ...(customizedPreviewUrl ? {
          originalProductImage: mainImage,
          customImage: customizedPreviewUrl,
          customizedImageUrl: customizedPreviewUrl,
          regionFinalImages,
          zoom,
          rotation,
          position
        } : {}),
        selectedParams,
        ...(customName.trim() ? { customName: customName.trim() } : {}),
        allow_return_exchange: customizationArea.allow_return_exchange !== false
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

    setIsProcessingCart(false);
    toast.success('Customized gift bundle added to cart!', { id: toastId });
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto col-span-full">
          <div className="h-6 w-32 bg-white/10 animate-pulse rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-white/5 animate-pulse rounded-[40px] border border-white/10"></div>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-2/3 bg-white/10 animate-pulse rounded"></div>
                  <div className="h-10 w-24 bg-white/10 animate-pulse rounded"></div>
                </div>
                <div className="h-4 w-1/4 bg-white/10 animate-pulse rounded mt-2"></div>
              </div>
              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="h-4 w-full bg-white/10 animate-pulse rounded"></div>
                <div className="h-4 w-5/6 bg-white/10 animate-pulse rounded"></div>
                <div className="h-4 w-4/6 bg-white/10 animate-pulse rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 w-32 bg-white/10 animate-pulse rounded"></div>
                <div className="h-12 w-full bg-white/10 animate-pulse rounded-xl"></div>
              </div>
              <div className="h-14 w-full bg-white/10 animate-pulse rounded-xl mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center text-muted">Product not found</div>;
  }

  const images = product.images || [product.image || ''];

  const [descText, configString] = (product.description || '').split('___CONFIG___');
  let customizationArea = { type: 'rect', x: 0, y: 0, w: 100, h: 100 } as any;
  if (configString) {
    try {
      customizationArea = JSON.parse(configString);
      // Compatibility for old rect formats
      if (!customizationArea.type) {
        customizationArea.type = 'rect';
      }
    } catch(e) {}
  }

  // Calculate coordinates and styles based on type
  let containerStyle: React.CSSProperties = {};
  let clipPath: string | undefined = undefined;

  if (customizationArea.type === 'rect') {
    containerStyle = {
      left: `${customizationArea.x}%`,
      top: `${customizationArea.y}%`,
      width: `${customizationArea.w}%`,
      height: `${customizationArea.h}%`,
    };
  } else if (customizationArea.type === 'polygon' && customizationArea.points?.length > 0) {
    const xs = customizationArea.points.map((p: any) => p.x);
    const ys = customizationArea.points.map((p: any) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;

    containerStyle = {
      left: `${minX}%`,
      top: `${minY}%`,
      width: `${w}%`,
      height: `${h}%`,
    };

    if (w > 0 && h > 0) {
      const polygonPoints = customizationArea.points
        .map((p: any) => `${((p.x - minX) / w) * 100}% ${((p.y - minY) / h) * 100}%`)
        .join(', ');
      clipPath = `polygon(${polygonPoints})`;
    }
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted hover:text-gold mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back to Products
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery & Preview */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-[40px] overflow-hidden glass p-4 group">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isCustomizing ? 'custom' : 'product'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  {isCustomizing || regionsData.some(r => r.uploadedImage) ? (
                    <div className="w-full h-full relative bg-white/5 rounded-3xl overflow-hidden flex items-center justify-center p-4">
                      
                      <div id="product-customization-preview" className="relative inline-flex max-w-full max-h-full items-center justify-center">
                        {/* Undelaying Product Image as Background (Low Opacity) */}
                        <img 
                          crossOrigin="anonymous"
                          src={mainImage} 
                          className="max-w-full max-h-full object-contain opacity-30 select-none pointer-events-none rounded-2xl" 
                          alt=""
                        />
                        
                        {/* Customization Constraints Area */}
                        {regionsData.map((rData, index) => {
                          const area = (customizationArea.customAreas?.length > 0 ? customizationArea.customAreas : [customizationArea])[index] || customizationArea;
                          let style: any = {};
                          let clip: any = undefined;
                          if (area.type === 'rect') {
                            style = { left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%` };
                          } else if (area.type === 'polygon' && area.points?.length > 0) {
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
                          }
                          const isActive = index === activeRegionIndex;

                          return (
                            <div 
                              key={index}
                              onClick={() => { setActiveRegionIndex(index); setIsCustomizing(true); }}
                              className={cn(
                                "absolute flex items-center justify-center bg-black/20 overflow-hidden cursor-pointer region-container",
                                area.type === 'rect' ? "border-2 border-dashed" : "border",
                                isActive ? "border-gold/80 z-20 shadow-[0_0_0_2px_rgba(201,168,76,0.3)]" : "border-gold/30 z-10"
                              )}
                              style={{ ...style, clipPath: clip }}
                            >
                              {rData.uploadedImage ? (
                                <motion.div
                                  drag={isActive}
                                  dragMomentum={false}
                                  onDragEnd={(_, info) => { if(isActive) setPosition({ x: info.offset.x, y: info.offset.y }) }}
                                  style={{ x: rData.position.x, y: rData.position.y, scale: rData.zoom, rotate: rData.rotation }}
                                  className={cn("w-full h-full relative", isActive ? "cursor-move z-10" : "pointer-events-none")}
                                >
                                  <img 
                                    src={rData.uploadedImage} 
                                    className="w-full h-full object-cover shadow-2xl pointer-events-none" 
                                    alt="Custom preview"
                                  />
                                  {isActive && (
                                    <div className="absolute top-2 right-2 bg-gold p-1 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity move-icon">
                                      <Move className="w-4 h-4 text-bg" />
                                    </div>
                                  )}
                                </motion.div>
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none upload-placeholder">
                                  <Upload className={cn("w-6 h-6 mb-1 transition-colors", isActive ? "text-gold" : "text-white/50")} />
                                  <span className={cn("text-[10px] font-bold transition-colors", isActive ? "text-gold" : "text-white/50")}>
                                    Region {index + 1}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Floating Controls for Customization */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 glass px-4 py-2 rounded-2xl border-white/10 shadow-2xl">
                        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:text-gold transition-colors"><ZoomOut className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-border" />
                        <button onClick={() => setRotation(r => r - 90)} className="p-1.5 hover:text-gold transition-colors"><RotateCcw className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-border" />
                        <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1.5 hover:text-gold transition-colors"><ZoomIn className="w-4 h-4" /></button>
                      </div>

                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <button 
                          onClick={handleSaveFinalImage}
                          className="px-4 py-2 bg-gold text-bg rounded-xl font-bold text-xs hover:scale-105 transition-transform"
                        >
                          Save Final Image
                        </button>
                        <button 
                          onClick={() => setIsCustomizing(false)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-xs font-bold"
                        >
                          Exit Preview
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={mainImage} 
                      alt={product.name} 
                      className="w-full h-full object-contain rounded-3xl" 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {images.length > 1 && !isCustomizing && (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      setMainImage(img);
                    }}
                    className={cn(
                      "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 glass",
                      mainImage === img ? "border-gold scale-95" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Customization Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                <Upload className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="font-bold text-sm">{uploadedImage ? 'Change Photo' : 'Upload Your Photo'}</p>
                  <p className="text-[10px] text-muted">Use your own memories</p>
                </div>
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
              <button 
                onClick={() => setShowAiModal(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gold/5 border border-gold/20 rounded-2xl hover:bg-gold/10 transition-all group border-dashed"
              >
                <Wand2 className="w-5 h-5 text-gold group-hover:rotate-12 transition-transform" />
                <div className="text-left">
                  <p className="font-bold text-sm text-gold">AI Generate</p>
                  <p className="text-[10px] text-gold/60">Create unique art with AI</p>
                </div>
              </button>
            </div>
          </div>

          {/* AI Generation Modal */}
          <AnimatePresence>
            {showAiModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isGenerating && setShowAiModal(false)}
                  className="absolute inset-0 bg-bg/90 backdrop-blur-xl"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-xl glass p-8 rounded-[40px] border-white/10 shadow-2xl"
                >
                  <button 
                    onClick={() => setShowAiModal(false)}
                    className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <CloseX className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20">
                      {uploadedImage ? <Edit className="w-6 h-6 text-gold" /> : <Sparkles className="w-6 h-6 text-gold" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold">
                        {uploadedImage ? 'AI Image Editor' : 'AI Design Studio'}
                      </h3>
                      <p className="text-sm text-muted">
                        {uploadedImage ? 'Tell AI how to transform your photo' : 'Describe the design you want to create'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {uploadedImage && (
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <img src={uploadedImage} className="w-16 h-16 object-cover rounded-lg border border-white/10" alt="Reference" />
                        <div className="flex-grow">
                          <p className="text-xs font-bold text-gold">Editing Mode Active</p>
                          <p className="text-[10px] text-muted">AI will use your photo as a baseline for generation</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-muted uppercase">Aspect Ratio</label>
                      <select 
                        value={aiAspectRatio}
                        onChange={(e) => setAiAspectRatio(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-sm text-white"
                      >
                        <option className="bg-gray-900 text-white" value="1:1">1:1 (Square)</option>
                        <option className="bg-gray-900 text-white" value="3:4">3:4 (Portrait)</option>
                        <option className="bg-gray-900 text-white" value="4:3">4:3 (Landscape)</option>
                        <option className="bg-gray-900 text-white" value="9:16">9:16 (Vertical)</option>
                        <option className="bg-gray-900 text-white" value="16:9">16:9 (Widescreen)</option>
                      </select>
                    </div>

                    <div className="relative">
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={uploadedImage ? "Example: Add a cinematic sunset background, make it look like an oil painting..." : "Example: A vibrant sunset with silhouette of a family, cinematic lighting..."}
                        className="w-full bg-bg border border-white/10 rounded-2xl p-6 outline-none focus:border-gold h-40 resize-none transition-all placeholder:text-muted/50"
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] text-muted italic">
                        Powered by Gemini
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerateAiImage}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className={cn(
                        "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                        isGenerating || !aiPrompt.trim() 
                          ? "bg-white/5 text-muted cursor-not-allowed" 
                          : "gold-gradient text-bg hover:scale-[1.02]"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                          <span>Generating Art...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          <span>Generate Design</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-3 gap-3">
                      {['Family Portrait', 'Minimalist Nature', 'Pop Art Style'].map(preset => (
                        <button 
                          key={preset}
                          onClick={() => setAiPrompt(preset)}
                          className="text-[10px] font-bold p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <span className="px-3 py-1 bg-gold/10 text-gold rounded-full font-bold tracking-widest uppercase text-[10px] mb-4 inline-block border border-gold/20">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-bold text-gold">₹{product.price}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xl text-muted line-through">₹{product.original_price}</span>
                )}
              </div>
            </div>

            <div className="prose prose-invert mb-8">
              <p className="text-muted leading-relaxed whitespace-pre-wrap">
                {descText || "A beautiful personalized gift to capture your best memories."}
              </p>
            </div>

            {customizationArea.custom_params?.length > 0 && (
              <div className="space-y-6 mb-8">
                {customizationArea.custom_params.map((param: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">{param.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {param.options.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => setSelectedParams(prev => ({ ...prev, [param.label]: option }))}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
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

            {customizationArea.requiresCustomName && (
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

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              {customizationArea.in_stock === false ? (
                <div className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-center">
                  Currently Out of Stock
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 py-4 border border-gold text-gold font-bold rounded-xl hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                  <WishlistButton item={{ productId: product.id, productName: product.name, price: product.price, quantity: 1, image: mainImage, config: selectedParams }} />
                  <button 
                    onClick={handleBuyNow}
                    className="flex-1 py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" /> Buy Now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>



        {/* Frequently Bought Together & Bundle Discount */}
        {customizationArea.in_stock !== false && (
          <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider mb-2">
                  <Percent className="w-4 h-4" /> Save Combo Discount
                </span>
                <h3 className="text-2xl md:text-3xl font-display font-bold">Frequently Bought Together</h3>
                <p className="text-sm text-muted">Complete your personalized gift package with complementary accessories.</p>
              </div>
              
              {/* Calculations panel */}
              <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col items-end shrink-0 w-full md:w-auto">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs text-muted font-bold">Bundle Total:</span>
                  <span className="text-2xl font-bold text-gold">
                    ₹{product.price + (acc1Checked ? 149 : 0) + (acc2Checked ? 299 : 0) - ((acc1Checked && acc2Checked) ? 50 : 0)}
                  </span>
                  {((acc1Checked && acc2Checked)) && (
                    <span className="text-sm text-muted/60 line-through">
                      ₹{product.price + 149 + 299}
                    </span>
                  )}
                </div>
                {((acc1Checked && acc2Checked)) && (
                  <p className="text-[10px] text-green-400 font-bold uppercase mb-3">⭐ Combo Offer: ₹50 discount applied!</p>
                )}
                <button 
                  onClick={handleAddBundleToCart}
                  className="w-full md:w-auto px-6 py-2.5 bg-gold text-bg text-sm font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Bundle to Cart
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8 justify-center">
              {/* Product Bundle visualizer chain */}
              <div className="flex flex-wrap items-center justify-center gap-4 py-4">
                {/* Main Product node */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 relative glass flex items-center justify-center bg-black/40">
                    <img src={uploadedImage || mainImage} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-gold/90 text-bg text-[8px] font-bold px-1.5 py-0.5 rounded">THIS</div>
                  </div>
                  <p className="text-[11px] font-bold text-white/50 text-center w-24 truncate mt-2">{product.name}</p>
                  <p className="text-[10px] text-gold font-bold">₹{product.price}</p>
                </div>

                <Plus className="w-5 h-5 text-muted/50" />

                {/* Gift wrapping node */}
                <button 
                  onClick={() => setAcc1Checked(!acc1Checked)}
                  className={cn(
                    "flex flex-col items-center transition-all",
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

                {/* Warm LED Light Base node */}
                <button 
                  onClick={() => setAcc2Checked(!acc2Checked)}
                  className={cn(
                    "flex flex-col items-center transition-all",
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

              {/* Description & Selection Checklist */}
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

        {/* Similar customizable gifts section / Carousel */}
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
                className="p-2.5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scrollCarousel('right')}
                className="p-2.5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Stylist Tip box */}
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
                          Analyzing details of "{product.name}" and comparing with companion designs...
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
              
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -6 }}
                  className="w-[260px] flex-shrink-0 glass rounded-3xl border border-white/10 hover:border-gold/30 overflow-hidden cursor-pointer group transition-all"
                  onClick={() => navigate(`/product/${item.id}`)}
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
                      <span className="text-sm font-bold text-gold font-mono font-bold">₹{item.price}</span>
                      {hasOldPrice && (
                        <span className="text-xs text-muted line-through font-mono">₹{item.original_price}</span>
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

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
