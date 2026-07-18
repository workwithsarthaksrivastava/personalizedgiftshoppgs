import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../supabase';
import { Music, Play, Pause, QrCode, X, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { toast } from 'sonner';

const getThemeStyles = (template: string) => {
  switch (template) {
    case 'Classic Royal': return { bg: '#2d0a0a', coverBg: '#4a0404', pageBg: '#fff8f0', text: '#8b0000', title: '#f59e0b', font: 'font-serif' };
    case 'Vibrant Floral': return { bg: '#064e3b', coverBg: '#064e3b', pageBg: '#f0fdf4', text: '#064e3b', title: '#10b981', font: 'font-serif' };
    case 'Minimalist Elegance': return { bg: '#f8fafc', coverBg: '#ffffff', pageBg: '#ffffff', text: '#334155', title: '#0f172a', font: 'font-light' };
    case 'Vintage Sepia': return { bg: '#3e2723', coverBg: '#4e342e', pageBg: '#f5f5f4', text: '#4e342e', title: '#d7ccc8', font: 'font-serif' };
    case 'Modern Slate': return { bg: '#0f172a', coverBg: '#1e293b', pageBg: '#f8fafc', text: '#1e293b', title: '#3b82f6', font: 'font-sans' };
    case 'Midnight Black': return { bg: '#000000', coverBg: '#111111', pageBg: '#ffffff', text: '#111111', title: '#ffffff', font: 'font-sans' };
    default: return { bg: '#09090b', coverBg: '#18181b', pageBg: '#fdfbf7', text: '#27272a', title: '#f59e0b', font: 'font-sans' };
  }
};

const CoverPage = ({ album, theme }: { album: any, theme: any }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" style={{ backgroundColor: theme.coverBg }}>
    <div className="absolute inset-0 bg-black/40 z-10" />
    {album.cover_url && <img src={album.cover_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Cover" referrerPolicy="no-referrer" />}
    <div className="relative z-20 text-center space-y-2 sm:space-y-4 bg-black/60 p-4 sm:p-8 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl w-11/12 sm:w-5/6 max-w-md">
      <h1 className="text-xl sm:text-2xl md:text-4xl font-bold drop-shadow-lg" style={{ color: theme.title }}>{album.title}</h1>
    </div>
  </div>
);

const BackCover = ({ album, theme }: { album: any, theme: any }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" style={{ backgroundColor: theme.coverBg }}>
    <div className="text-center space-y-2 sm:space-y-4 p-4 sm:p-8 border border-white/5 rounded-xl bg-black/20">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: theme.title }}>The End</h2>
      <p className="text-white/50 text-[8px] sm:text-[10px] tracking-widest uppercase">Created with Surya Films</p>
    </div>
  </div>
);

const BorderStylesMap: Record<string, { borderStyle?: string; customClass?: string }> = {
  'none': { borderStyle: 'none' },
  'solid': { borderStyle: 'solid' },
  'dashed': { borderStyle: 'dashed' },
  'double': { borderStyle: 'double' },
  'groove': { borderStyle: 'groove' },
  'ridge': { borderStyle: 'ridge' },
  'ornate-gold': {
    borderStyle: 'solid',
    customClass: 'ring-4 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] bg-amber-500/5 p-1'
  },
  'ornate-silver': {
    borderStyle: 'solid',
    customClass: 'ring-4 ring-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.6)] bg-slate-300/5 p-1'
  },
  'royal-red': {
    borderStyle: 'solid',
    customClass: 'ring-4 ring-rose-600 shadow-[0_0_18px_rgba(225,29,72,0.7)] bg-rose-600/5 p-1'
  },
  'pearl-inlay': {
    borderStyle: 'double',
    customClass: 'ring-2 ring-stone-200 shadow-[inset_0_0_10px_rgba(255,255,255,0.8),_0_0_10px_rgba(0,0,0,0.4)] bg-stone-100/5 p-1.5'
  }
};

const AlbumPage = ({ 
  image, 
  pageType, 
  canvasImages, 
  marking, 
  theme 
}: { 
  image?: string, 
  pageType?: 'single' | 'canvas', 
  canvasImages?: any[], 
  marking: string, 
  theme: any 
}) => {
  const isCanvas = pageType === 'canvas';
  return (
    <div className="w-full h-full relative flex flex-col border-x border-black/5" style={{ backgroundColor: theme.pageBg }}>
      {isCanvas ? (
        <div className="flex-grow relative w-full h-full overflow-hidden">
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.8
            }}
          />
          {canvasImages && canvasImages.length > 0 ? (
            canvasImages.map((img: any) => {
              const borderConfig = BorderStylesMap[img.borderType || 'none'] || { borderStyle: 'solid' };
              const borderStyleProps = {
                borderStyle: borderConfig.borderStyle || 'solid',
                borderWidth: img.borderType === 'none' ? '0px' : `${img.borderWidth ?? 2}px`,
                borderColor: img.borderColor || '#000000',
              };

              return (
                <div 
                  key={img.id}
                  style={{
                    position: 'absolute',
                    left: `${img.x}%`,
                    top: `${img.y}%`,
                    width: `${img.width}%`,
                    height: `${img.height}%`,
                    transform: `rotate(${img.rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    zIndex: img.zIndex || 10,
                  }}
                  className="pointer-events-auto"
                >
                  {img.url ? (
                    <img 
                      src={img.url} 
                      className={`w-full h-full object-cover rounded shadow-lg ${borderConfig.customClass || ''}`} 
                      style={borderStyleProps}
                      alt="Canvas Photo" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-300 text-[10px]">
                      Empty Photo
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-300 text-xs sm:text-sm">Empty Canvas</div>
          )}
        </div>
      ) : (
        <div className="flex-grow p-2 sm:p-4 md:p-8 flex items-center justify-center">
          {image ? (
            <img src={image} className="max-w-full max-h-full object-contain drop-shadow-md rounded" alt="Page" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-300 text-xs sm:text-sm">Blank Page</div>
          )}
        </div>
      )}
      {marking && <div className="text-center pb-2 sm:pb-4 text-[8px] sm:text-[10px] font-medium tracking-widest uppercase" style={{ color: theme.text }}>{marking}</div>}
    </div>
  );
};

import { useLocation } from 'react-router-dom';

export default function AlbumViewer() {
  const { id } = useParams();
  const location = useLocation();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Setup theme and structures safely (with defaults if album is not yet loaded)
  const theme = album ? getThemeStyles(album.template) : { bg: '#09090b', coverBg: '#18181b', pageBg: '#fdfbf7', text: '#27272a', title: '#f59e0b', font: 'font-sans' };

  const albumIdForShare = id !== 'preview' ? id : (album?.id || '');
  const isSavedAlbum = albumIdForShare && !albumIdForShare.startsWith('local_') && albumIdForShare !== 'preview';
  const shareUrl = isSavedAlbum
    ? `https://personalizedgiftshop.in/album/${albumIdForShare}`
    : '';

  const aspectClass = album ? (album.orientation === 'Portrait' ? 'aspect-[3/2]' : 'aspect-[8/3]') : 'aspect-[8/3]';

  const sheets: any[] = [];
  if (album) {
    if (!album.spreads || album.spreads.length === 0) {
      sheets.push({
        front: <CoverPage album={album} theme={theme} />,
        back: <BackCover album={album} theme={theme} />
      });
    } else {
      sheets.push({
        front: <CoverPage album={album} theme={theme} />,
        back: <AlbumPage 
                image={album.spreads[0]?.leftImage} 
                pageType={album.spreads[0]?.leftPageType}
                canvasImages={album.spreads[0]?.leftCanvasImages}
                marking={album.page_marking} 
                theme={theme} 
              />
      });
      for (let i = 0; i < album.spreads.length; i++) {
        const currentSpread = album.spreads[i];
        const nextSpread = album.spreads[i + 1];
        sheets.push({
          front: <AlbumPage 
                   image={currentSpread.rightImage} 
                   pageType={currentSpread.rightPageType}
                   canvasImages={currentSpread.rightCanvasImages}
                   marking={album.page_marking} 
                   theme={theme} 
                 />,
          back: nextSpread 
                  ? <AlbumPage 
                      image={nextSpread.leftImage} 
                      pageType={nextSpread.leftPageType}
                      canvasImages={nextSpread.leftCanvasImages}
                      marking={album.page_marking} 
                      theme={theme} 
                    /> 
                  : <BackCover album={album} theme={theme} />
        });
      }
    }
  }

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        if (id === 'preview' && location.state?.album) {
          setAlbum(location.state.album);
          setLoading(false);
          return;
        }

        // 1. Try to fetch from server fallback filesystem first (enables cross-device QR viewing)
        if (id && id !== 'preview') {
          try {
            const res = await fetch(`/album/api/albums/${id}`);
            if (res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const responseData = await res.json();
                if (responseData.success && responseData.data) {
                  setAlbum(responseData.data);
                  setLoading(false);
                  return;
                }
              } else {
                console.warn("API returned non-JSON response, falling back to direct Supabase query.");
              }
            }
          } catch (serverErr) {
            console.warn("Server album fetch failed, trying fallbacks", serverErr);
          }
        }

        // 2. Fallback to client browser storage for local previews
        if (id?.startsWith('local_')) {
          const localData = localStorage.getItem('album_' + id);
          if (localData) {
            const parsed = JSON.parse(localData);
            setAlbum(parsed);
          } else {
            toast.error('Local album not found');
          }
          setLoading(false);
          return;
        }

        // 3. Fallback to direct Supabase query
        try {
          const { data, error } = await supabase.from('albums').select('*').eq('id', id).single();
          if (!error && data) {
            setAlbum(data);
            setLoading(false);
            return;
          }
          if (error) {
            console.warn("Supabase query fallback info:", error.message);
          }
        } catch (dbErr) {
          console.warn("Supabase DB query error:", dbErr);
        }

        throw new Error("Album not found in server, local storage, or database.");
      } catch (err) {
        console.error(err);
        toast.error('Album not found or error loading');
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id, location.state]);

  // Robust immediate autoplay & first-interaction audio play fallback
  useEffect(() => {
    if (album?.audio_url && audioRef.current) {
      audioRef.current.src = album.audio_url;
      audioRef.current.load();
      
      const playAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            // Clean up interaction fallback listeners once playing starts
            document.removeEventListener('click', playAudioWithInteraction);
            document.removeEventListener('touchstart', playAudioWithInteraction);
          })
          .catch((err) => {
            console.log("Browser blocked auto-play. Waiting for first interaction:", err);
          });
      };

      const playAudioWithInteraction = () => {
        playAudio();
      };

      // Attempt to play immediately
      playAudio();

      // Set up click/touch fallback listener in case of browser autoplay blocks
      document.addEventListener('click', playAudioWithInteraction);
      document.addEventListener('touchstart', playAudioWithInteraction);

      return () => {
        document.removeEventListener('click', playAudioWithInteraction);
        document.removeEventListener('touchstart', playAudioWithInteraction);
      };
    }
  }, [album]);

  // Handle keyboard arrow navigation (Left/Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < sheets.length) {
          setCurrentIndex(prev => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, sheets.length]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => toast.error('Browser blocked play. Please interact first.'));
    }
    setIsPlaying(!isPlaying);
  };

  const turnNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex < sheets.length) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const turnPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <h2>Album not found</h2>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center overflow-x-hidden transition-colors duration-1000 ${theme.font}`} style={{ backgroundColor: theme.bg }}>
      {/* Hidden Audio */}
      <audio ref={audioRef} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      {/* Floating Controls */}
      <div className="fixed top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-none">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
          <a href="https://personalizedgiftshop.in" className="text-white/70 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
            <Home className="w-4 h-4" /> Home
          </a>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          {album.audio_url && (
            <button 
              onClick={toggleAudio}
              className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/60 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
            </button>
          )}
          <button 
            onClick={() => {
              if (!isSavedAlbum) {
                toast.error('Please save your album in the Studio first to generate a shareable QR code!');
              } else {
                setShowQR(true);
              }
            }}
            className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-full hover:bg-amber-400 transition-colors text-sm flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Unified Flipbook Container (Responsive) */}
      <div className="w-full max-w-[98vw] md:max-w-6xl mx-auto flex flex-col items-center justify-center p-2 md:p-12 relative z-10 mt-20 md:mt-0 flex-grow">
        
        <div className="relative w-full flex items-center justify-center">
          {/* Navigation Buttons */}
          <button 
            onClick={turnPrev} 
            disabled={currentIndex === 0}
            className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-all z-50 pointer-events-auto shadow-lg border border-white/10 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
  
          <button 
            onClick={turnNext} 
            disabled={currentIndex === sheets.length}
            className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-all z-50 pointer-events-auto shadow-lg border border-white/10 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
  
          <motion.div 
            className={`relative w-full ${aspectClass} perspective-[2500px] drop-shadow-2xl px-10 sm:px-14 md:px-0`}
            animate={{
              x: currentIndex === 0 ? '-25%' : currentIndex === sheets.length ? '25%' : '0%'
            }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 45, damping: 15 }}
          >
            {sheets.map((sheet, index) => {
              const isFlipped = index < currentIndex;
              let zIndex = 100 - Math.abs(currentIndex - index);
              if (index === currentIndex || index === currentIndex - 1) {
                zIndex = 150;
              }
  
              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{ rotateY: isFlipped ? -180 : 0 }}
                  transition={{ duration: 0.8, type: 'spring', stiffness: 45, damping: 15 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '50%',
                    height: '100%',
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                    zIndex,
                  }}
                >
                  {/* Front (Right Page) */}
                  <div 
                    className="absolute inset-0 cursor-pointer group rounded-r-md md:rounded-r-2xl shadow-[-1px_0_10px_rgba(0,0,0,0.1)]" 
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      WebkitBackfaceVisibility: 'hidden', 
                      pointerEvents: isFlipped ? 'none' : 'auto',
                      backgroundColor: theme.pageBg
                    }}
                    onClick={turnNext}
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-black z-20 transition-opacity pointer-events-none rounded-r-md md:rounded-r-2xl" />
                    <div className="w-full h-full rounded-r-md md:rounded-r-2xl overflow-hidden">
                      {sheet.front}
                    </div>
                  </div>
  
                  {/* Back (Left Page) */}
                  <div 
                    className="absolute inset-0 cursor-pointer group rounded-l-md md:rounded-l-2xl shadow-[1px_0_10px_rgba(0,0,0,0.1)]" 
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      WebkitBackfaceVisibility: 'hidden', 
                      transform: 'rotateY(180deg)',
                      pointerEvents: isFlipped ? 'auto' : 'none',
                      backgroundColor: theme.pageBg
                    }}
                    onClick={turnPrev}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-black/20 via-black/5 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-black z-20 transition-opacity pointer-events-none rounded-l-md md:rounded-l-2xl" />
                    <div className="w-full h-full rounded-l-md md:rounded-l-2xl overflow-hidden">
                      {sheet.back}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Page indicator and helpers */}
        <div className="flex flex-col items-center gap-2 mt-8 md:mt-12">
          <span className="px-4 py-1.5 bg-black/45 backdrop-blur-md border border-white/10 text-white/90 rounded-full text-xs font-mono font-medium tracking-wide shadow-sm">
            {currentIndex === 0 
              ? 'Cover' 
              : currentIndex === sheets.length 
                ? 'Back Cover' 
                : `Spread ${currentIndex} of ${sheets.length - 1}`}
          </span>
          <p className="text-white/40 text-[11px] text-center max-w-[250px] md:max-w-md">
            Tap the left/right side of the book, use arrow keys, or use the navigation buttons to turn pages.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Share Album</h3>
              <p className="text-slate-500 text-sm mb-6">Anyone can scan this QR code to view the album instantly without logging in.</p>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 flex items-center justify-center mx-auto w-fit mb-6 shadow-sm">
                <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin />
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied to clipboard!');
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Copy Link
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
