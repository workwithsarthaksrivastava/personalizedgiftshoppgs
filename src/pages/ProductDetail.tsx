import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCartStore } from '../cartStore';
import { toast } from 'sonner';
import { ShoppingCart, Zap, ChevronLeft, Upload, Edit, Sparkles, Move, ZoomIn, ZoomOut, RotateCcw, Wand2, X as CloseX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAspectRatio, setAiAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addItem, clearCart } = useCartStore();

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
      toast.error('AI Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
    }
  };

  const [selectedParams, setSelectedParams] = useState<Record<string, string>>({});

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if all custom params are selected
    if (customizationArea.custom_params?.length > 0) {
      const allSelected = customizationArea.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options before adding to cart');
        return;
      }
    }

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: uploadedImage || mainImage,
      config: {
        ...(uploadedImage ? {
          originalProductImage: mainImage,
          customImage: uploadedImage,
          zoom,
          rotation,
          position
        } : {}),
        selectedParams
      }
    });
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (customizationArea.custom_params?.length > 0) {
      const allSelected = customizationArea.custom_params.every((p: any) => selectedParams[p.label]);
      if (!allSelected) {
        toast.error('Please select all options');
        return;
      }
    }

    clearCart();
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: uploadedImage || mainImage,
      config: {
        ...(uploadedImage ? {
          originalProductImage: mainImage,
          customImage: uploadedImage,
          zoom,
          rotation,
          position
        } : {}),
        selectedParams
      }
    });
    navigate('/checkout');
  };

  if (loading) return <div className="min-h-screen bg-bg pt-32 text-center text-white font-bold animate-pulse">Loading Magic...</div>;
  if (!product) return <div className="min-h-screen bg-bg pt-32 text-center text-white font-bold">Product not found</div>;

  const images = product.images || [product.image];

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
                  {isCustomizing && uploadedImage ? (
                    <div className="w-full h-full relative bg-white/5 rounded-3xl overflow-hidden flex items-center justify-center p-4">
                      
                      <div className="relative inline-flex max-w-full max-h-full items-center justify-center">
                        {/* Undelaying Product Image as Background (Low Opacity) */}
                        <img 
                          src={mainImage} 
                          className="max-w-full max-h-full object-contain opacity-30 select-none pointer-events-none rounded-2xl" 
                          alt=""
                        />
                        
                        {/* Customization Constraints Area */}
                        <div 
                          className={cn(
                            "absolute flex items-center justify-center bg-black/20 overflow-hidden",
                            customizationArea.type === 'rect' ? "border-2 border-gold/40 border-dashed" : "border border-gold/20"
                          )}
                          style={{
                            ...containerStyle,
                            clipPath
                          }}
                        >
                          {/* User's Uploaded Image with Controls */}
                          <motion.div
                            drag
                            dragMomentum={false}
                            onDragEnd={(_, info) => setPosition({ x: info.offset.x, y: info.offset.y })}
                            style={{ x: position.x, y: position.y, scale: zoom, rotate: rotation }}
                            className="w-full h-full cursor-move relative z-10"
                          >
                            <img 
                              src={uploadedImage} 
                              className="w-full h-full object-cover shadow-2xl" 
                              alt="Custom preview"
                            />
                            <div className="absolute top-2 right-2 bg-gold p-1 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity">
                              <Move className="w-4 h-4 text-bg" />
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Floating Controls for Customization */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 glass px-4 py-2 rounded-2xl border-white/10 shadow-2xl">
                        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:text-gold transition-colors"><ZoomOut className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-border" />
                        <button onClick={() => setRotation(r => r - 90)} className="p-1.5 hover:text-gold transition-colors"><RotateCcw className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-border" />
                        <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1.5 hover:text-gold transition-colors"><ZoomIn className="w-4 h-4" /></button>
                      </div>

                      <button 
                        onClick={() => setIsCustomizing(false)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-xs font-bold"
                      >
                        Exit Preview
                      </button>
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
                    onClick={() => setMainImage(img)}
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
              <div className="space-y-6 mb-10">
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
      </div>
    </div>
  );
}
