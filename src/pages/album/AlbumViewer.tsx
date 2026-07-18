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
  <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" style={{ backgroundColor: theme.coverBg }}>
    <div className="absolute inset-0 bg-black/40 z-10" />
    {album.cover_url && <img src={album.cover_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Cover" />}
    <div className="relative z-20 text-center space-y-4 bg-black/60 p-8 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl w-5/6 max-w-md">
      <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg" style={{ color: theme.title }}>{album.title}</h1>
    </div>
  </div>
);

const BackCover = ({ album, theme }: { album: any, theme: any }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" style={{ backgroundColor: theme.coverBg }}>
    <div className="text-center space-y-4 p-8 border border-white/5 rounded-xl bg-black/20">
      <h2 className="text-xl md:text-2xl font-bold" style={{ color: theme.title }}>The End</h2>
      <p className="text-white/50 text-[10px] tracking-widest uppercase">Created with Surya Films</p>
    </div>
  </div>
);

const AlbumPage = ({ image, marking, theme }: { image: string, marking: string, theme: any }) => (
  <div className="w-full h-full relative flex flex-col border-x border-black/5" style={{ backgroundColor: theme.pageBg }}>
    <div className="flex-grow p-4 md:p-8 flex items-center justify-center">
      {image ? (
        <img src={image} className="max-w-full max-h-full object-contain drop-shadow-md rounded" alt="Page" />
      ) : (
        <div className="w-full h-full border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-300">Blank Page</div>
      )}
    </div>
    {marking && <div className="text-center pb-4 text-[9px] md:text-[10px] font-medium tracking-widest uppercase" style={{ color: theme.text }}>{marking}</div>}
  </div>
);

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
  const [mobileIndex, setMobileIndex] = useState(0);

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

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => toast.error('Browser blocked play. Please interact first.'));
    }
    setIsPlaying(!isPlaying);
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

  const theme = getThemeStyles(album.template);

  const albumIdForShare = id !== 'preview' ? id : (album?.id || '');
  const isSavedAlbum = albumIdForShare && !albumIdForShare.startsWith('local_') && albumIdForShare !== 'preview';
  const shareUrl = isSavedAlbum
    ? `https://personalizedgiftshop.in/album/${albumIdForShare}`
    : '';

  const aspectClass = album.orientation === 'Portrait' ? 'aspect-[3/2]' : 'aspect-[8/3]';

  const sheets: any[] = [];
  if (!album.spreads || album.spreads.length === 0) {
    sheets.push({
      front: <CoverPage album={album} theme={theme} />,
      back: <BackCover album={album} theme={theme} />
    });
  } else {
    sheets.push({
      front: <CoverPage album={album} theme={theme} />,
      back: <AlbumPage image={album.spreads[0]?.leftImage} marking={album.page_marking} theme={theme} />
    });
    for (let i = 0; i < album.spreads.length; i++) {
      const currentSpread = album.spreads[i];
      const nextSpread = album.spreads[i + 1];
      sheets.push({
        front: <AlbumPage image={currentSpread.rightImage} marking={album.page_marking} theme={theme} />,
        back: nextSpread 
                ? <AlbumPage image={nextSpread.leftImage} marking={album.page_marking} theme={theme} /> 
                : <BackCover album={album} theme={theme} />
      });
    }
  }

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

  const singlePages: { content: React.ReactNode; label: string }[] = [];
  singlePages.push({
    content: <CoverPage album={album} theme={theme} />,
    label: 'Cover'
  });
  if (album.spreads && album.spreads.length > 0) {
    album.spreads.forEach((spread: any, idx: number) => {
      singlePages.push({
        content: (
          <div className="w-full h-full relative">
            <AlbumPage image={spread.leftImage} marking={album.page_marking} theme={theme} />
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-black/15 to-transparent z-10 pointer-events-none" />
          </div>
        ),
        label: `Spread ${idx + 1} - Left`
      });
      singlePages.push({
        content: (
          <div className="w-full h-full relative">
            <AlbumPage image={spread.rightImage} marking={album.page_marking} theme={theme} />
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/15 to-transparent z-10 pointer-events-none" />
          </div>
        ),
        label: `Spread ${idx + 1} - Right`
      });
    });
  }
  singlePages.push({
    content: <BackCover album={album} theme={theme} />,
    label: 'Back Cover'
  });

  const singleAspectClass = album.orientation === 'Portrait' ? 'aspect-[2/3]' : 'aspect-[3/2]';

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

      {/* Mobile View Container (Visible on mobile, hidden on desktop) */}
      <div className="w-full px-4 flex flex-col items-center justify-center gap-6 md:hidden mt-24">
        <div className="relative w-full max-w-[360px] mx-auto">
          {/* Main Slide Stage */}
          <div className={`w-full ${singleAspectClass} rounded-2xl overflow-hidden shadow-2xl relative border border-white/10`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mobileIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full"
              >
                {singlePages[mobileIndex]?.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Overlay Arrows on Mobile */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
            <button
              onClick={() => {
                if (mobileIndex > 0) setMobileIndex(prev => prev - 1);
              }}
              disabled={mobileIndex === 0}
              className="w-12 h-12 flex items-center justify-center bg-black/55 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-opacity pointer-events-auto shadow-lg border border-white/10 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                if (mobileIndex < singlePages.length - 1) setMobileIndex(prev => prev + 1);
              }}
              disabled={mobileIndex === singlePages.length - 1}
              className="w-12 h-12 flex items-center justify-center bg-black/55 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-opacity pointer-events-auto shadow-lg border border-white/10 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Page indicator and helpers */}
        <div className="flex flex-col items-center gap-2">
          <span className="px-4 py-1.5 bg-black/45 backdrop-blur-md border border-white/10 text-white/90 rounded-full text-xs font-mono font-medium tracking-wide shadow-sm">
            {singlePages[mobileIndex]?.label} • {mobileIndex + 1} of {singlePages.length}
          </span>
          <p className="text-white/40 text-[11px] text-center max-w-[250px]">
            Tap the arrows to flip through pages
          </p>
        </div>
      </div>

      {/* Main Album Container (Desktop/Tablet) */}
      <div className="hidden md:flex w-full max-w-[95vw] md:max-w-6xl mx-auto items-center justify-center p-4 lg:p-12 relative z-10 mt-16 md:mt-0">
        
        {/* Navigation Buttons (Outside Book) */}
        <button 
          onClick={turnPrev} 
          disabled={currentIndex === 0}
          className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-all z-50 pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
 
        <button 
          onClick={turnNext} 
          disabled={currentIndex === sheets.length}
          className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md disabled:opacity-0 transition-all z-50 pointer-events-auto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
 
        <motion.div 
          className={`relative w-full ${aspectClass} perspective-[2500px] drop-shadow-2xl pointer-events-none`}
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
