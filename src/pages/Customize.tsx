import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Download, 
  ShoppingCart, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Frame as FrameIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useCartStore } from '../cartStore';
import { supabase } from '../supabase';

interface FrameStyle {
  id: string;
  name: string;
  category: string;
  class_name: string;
  price: number;
  image_url?: string;
}

const CATEGORIES = ['All', 'Wood', 'Metal', 'Ornate', 'Modern', 'Colorful', 'Graphic'];

export default function Customize() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [frames, setFrames] = useState<FrameStyle[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchFrames = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('custom_frames').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setFrames(data);
          setSelectedFrame(data[0]);
        }
      } catch (error) {
        console.error('Error fetching frames:', error);
        toast.error('Failed to load frame styles');
      } finally {
        setLoading(false);
      }
    };
    fetchFrames();
  }, []);

  const filteredFrames = activeCategory === 'All' 
    ? frames 
    : frames.filter(f => f.category === activeCategory);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCart = () => {
    if (!uploadedImage) {
      toast.error('Please upload a photo first');
      return;
    }
    addItem({
      productId: `custom-${selectedFrame?.id}`,
      productName: `Custom Frame: ${selectedFrame?.name}`,
      price: selectedFrame?.price || 0,
      quantity: 1,
      image: uploadedImage,
      config: {
        frameId: selectedFrame?.id,
        frameName: selectedFrame?.name,
        zoom,
        rotation
      }
    });
    toast.success('Custom frame added to cart!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Side: Preview Area */}
          <div className="flex-grow space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-display font-bold text-gold mb-4 flex items-center justify-center lg:justify-start gap-4">
                <Sparkles className="w-8 h-8" /> Frame Studio
              </h1>
              <p className="text-muted text-lg max-w-2xl">
                Upload your memory and choose from our collection of 50+ handcrafted frame styles. 
                Preview in real-time and order your personalized masterpiece.
              </p>
            </div>

            <div className="glass rounded-[40px] p-8 md:p-12 flex items-center justify-center min-h-[500px] relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {selectedFrame && (
                  <motion.div 
                    key={selectedFrame.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "relative w-full max-w-md aspect-[3/4] transition-all duration-500 overflow-hidden",
                      !selectedFrame.image_url && selectedFrame.class_name
                    )}
                  >
                    {uploadedImage ? (
                      <motion.img 
                        src={uploadedImage} 
                        style={{ scale: zoom, rotate: `${rotation}deg` }}
                        className="w-full h-full object-cover cursor-move"
                        drag
                        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted/30 gap-4 bg-white/5">
                        <FrameIcon className="w-20 h-20 opacity-20" />
                        <p className="font-bold text-center px-8">Upload a photo to see the magic</p>
                      </div>
                    )}

                    {/* Graphic Frame Overlay */}
                    {selectedFrame.image_url && (
                      <img 
                        src={selectedFrame.image_url} 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" 
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Float Controls */}
              {uploadedImage && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 glass px-6 py-3 rounded-2xl border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:text-gold transition-colors"><ZoomOut className="w-5 h-5" /></button>
                  <div className="w-px h-4 bg-border" />
                  <button onClick={() => setRotation(r => r - 90)} className="p-2 hover:text-gold transition-colors"><RotateCcw className="w-5 h-5" /></button>
                  <div className="w-px h-4 bg-border" />
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 hover:text-gold transition-colors"><ZoomIn className="w-5 h-5" /></button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <label className="flex items-center gap-3 px-8 py-4 bg-white text-bg font-bold rounded-2xl cursor-pointer hover:bg-gold transition-all shadow-xl">
                <Upload className="w-5 h-5" />
                {uploadedImage ? 'Change Photo' : 'Upload Photo'}
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
              <button 
                onClick={handleAddToCart}
                className="flex items-center gap-3 px-8 py-4 gold-gradient text-bg font-bold rounded-2xl hover:scale-105 transition-all shadow-xl"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart • ₹{selectedFrame?.price || 0}
              </button>
            </div>
          </div>

          {/* Right Side: Frame Selection */}
          <div className="w-full lg:w-[450px] space-y-8">
            <div className="glass rounded-[32px] p-8 sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gold">
                <FrameIcon className="w-5 h-5" /> Select Frame Style
              </h3>

              {/* Categories */}
              <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar mb-6">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                      activeCategory === cat ? "bg-gold text-bg border-gold" : "bg-white/5 border-border text-muted hover:border-gold/50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Frames Grid */}
              <div className="grid grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredFrames.map(frame => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={cn(
                      "group relative aspect-[3/4] rounded-xl transition-all overflow-hidden border-2",
                      selectedFrame?.id === frame.id ? "border-gold scale-95" : "border-transparent hover:border-white/20"
                    )}
                  >
                    {frame.image_url ? (
                      <img src={frame.image_url} className="absolute inset-0 w-full h-full object-contain p-2" />
                    ) : (
                      <div className={cn("absolute inset-2", frame.class_name)} />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-bold text-white text-center px-1">{frame.name}</p>
                    </div>
                    {selectedFrame?.id === frame.id && (
                      <div className="absolute top-1 right-1 bg-gold rounded-full p-0.5">
                        <Sparkles className="w-3 h-3 text-bg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted text-sm">Selected Style</span>
                  <span className="text-gold font-bold">{selectedFrame?.name || 'None'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Frame Price</span>
                  <span className="text-2xl font-bold">₹{selectedFrame?.price || 0}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
