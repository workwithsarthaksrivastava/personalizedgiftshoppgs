import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, deserializeAlbumFromSupabase } from '../../supabase';
import { 
  Music, Play, Pause, QrCode, X, ChevronLeft, ChevronRight, Home,
  Heart, Eye, Share2, Star, MessageSquare, Phone, MapPin, Sliders, Settings, 
  RotateCcw, Volume2, VolumeX, Sparkles, Send, Check
} from 'lucide-react';
import { toast } from 'sonner';

const getThemeStyles = (template: string) => {
  switch (template) {
    case 'Classic Royal': return { bg: '#030303', coverBg: '#2a0404', pageBg: '#fff8f0', text: '#8b0000', title: '#f59e0b', font: 'font-serif' };
    case 'Vibrant Floral': return { bg: '#020202', coverBg: '#053125', pageBg: '#f0fdf4', text: '#064e3b', title: '#10b981', font: 'font-serif' };
    case 'Minimalist Elegance': return { bg: '#09090b', coverBg: '#1e293b', pageBg: '#ffffff', text: '#334155', title: '#0f172a', font: 'font-light' };
    case 'Vintage Sepia': return { bg: '#040404', coverBg: '#2e1d1a', pageBg: '#f5f5f4', text: '#4e342e', title: '#d7ccc8', font: 'font-serif' };
    case 'Modern Slate': return { bg: '#020617', coverBg: '#111827', pageBg: '#f8fafc', text: '#1e293b', title: '#3b82f6', font: 'font-sans' };
    case 'Midnight Black': return { bg: '#000000', coverBg: '#111111', pageBg: '#ffffff', text: '#111111', title: '#ffffff', font: 'font-sans' };
    default: return { bg: '#030303', coverBg: '#18181b', pageBg: '#fdfbf7', text: '#27272a', title: '#f59e0b', font: 'font-sans' };
  }
};

const CoverPage = ({ album, theme }: { album: any, theme: any }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" style={{ backgroundColor: theme.coverBg }}>
    <div className="absolute inset-0 bg-black/40 z-10" />
    {album.cover_url && <img src={album.cover_url} className="absolute inset-0 w-full h-full object-contain opacity-70 z-0" alt="Cover" referrerPolicy="no-referrer" />}
    <div className="relative z-20 text-center space-y-2 sm:space-y-4 bg-black/65 p-4 sm:p-8 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl w-11/12 sm:w-5/6 max-w-md">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg" style={{ color: theme.title }}>{album.title}</h1>
      {album.studio_name && (
        <p className="text-[10px] sm:text-xs text-white/70 tracking-wider uppercase pt-2 border-t border-white/10">
          Presented by {album.studio_name}
        </p>
      )}
    </div>
  </div>
);

const BackCover = ({ album, theme }: { album: any, theme: any }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] overflow-hidden" style={{ backgroundColor: theme.coverBg }}>
    {album.back_cover_url && <img src={album.back_cover_url} className="absolute inset-0 w-full h-full object-contain opacity-40 z-0" alt="Back Cover" referrerPolicy="no-referrer" />}
    <div className="absolute inset-0 bg-black/50 z-10" />
    
    <div className="relative z-20 text-center space-y-4 p-6 sm:p-8 border border-white/10 rounded-2xl bg-black/60 backdrop-blur-md max-w-sm w-11/12">
      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: theme.title }}>The End</h2>
      
      {(album.studio_name || album.photographer_name || album.mobile_number) ? (
        <div className="space-y-2.5 pt-3 border-t border-white/10 text-left text-xs text-white/85">
          {album.studio_name && (
            <div>
              <span className="text-white/40 block text-[9px] uppercase tracking-wider font-mono">Studio</span>
              <span className="font-bold text-amber-400">{album.studio_name}</span>
            </div>
          )}
          {album.photographer_name && (
            <div>
              <span className="text-white/40 block text-[9px] uppercase tracking-wider font-mono">Photographer</span>
              <span className="font-semibold text-white/95">{album.photographer_name}</span>
            </div>
          )}
          {album.mobile_number && (
            <div>
              <span className="text-white/40 block text-[9px] uppercase tracking-wider font-mono">Contact Info</span>
              <span className="font-mono text-white/95">{album.mobile_number}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-white/50 text-[8px] sm:text-[10px] tracking-widest uppercase pt-2 border-t border-white/10">Created with PGS Album</p>
      )}
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
        <div className="flex-grow p-2 sm:p-4 md:p-6 flex items-center justify-center">
          {image ? (
            <img src={image} className="max-w-full max-h-full object-contain drop-shadow-md rounded" alt="Page" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-300 text-xs sm:text-sm">Blank Page</div>
          )}
        </div>
      )}
      {marking && <div className="text-center pb-2 sm:pb-3 text-[8px] sm:text-[9px] font-medium tracking-widest uppercase" style={{ color: theme.text }}>{marking}</div>}
    </div>
  );
};

export default function AlbumViewer() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isAutoplayOn, setIsAutoplayOn] = useState(false);
  
  // Real statistics backed by database
  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplayTimerRef = useRef<any>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize and load counts once album is fetched
  useEffect(() => {
    if (album) {
      setViewsCount(album.views_count ?? 0);
      setLikesCount(album.likes_count ?? 0);
      setComments(album.comments ?? []);
      const savedIsLiked = localStorage.getItem(`isLiked_${album.id}`);
      setIsLiked(savedIsLiked === 'true');
    }
  }, [album]);

  const handleLike = async () => {
    if (!album) return;
    
    const action = isLiked ? 'unlike' : 'like';
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    localStorage.setItem(`isLiked_${album.id}`, nextLiked ? 'true' : 'false');

    // Optimistically update locally
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLikesCount(nextCount);

    if (id && id !== 'preview' && !id.startsWith('local_')) {
      try {
        const res = await fetch(`/album/api/albums/${id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            setLikesCount(resData.likes_count);
          }
        }
      } catch (err) {
        console.warn("Server like sync failed:", err);
      }
    } else {
      localStorage.setItem(`likes_${id}`, String(nextCount));
    }

    if (nextLiked) {
      toast.success('💖 Added to your favorites!');
    }
  };

  // Setup theme and structures safely (with defaults if album is not yet loaded)
  const theme = album ? getThemeStyles(album.template) : { bg: '#030303', coverBg: '#18181b', pageBg: '#fdfbf7', text: '#27272a', title: '#f59e0b', font: 'font-sans' };

  const albumIdForShare = id !== 'preview' ? id : (album?.id || '');
  const isSavedAlbum = albumIdForShare && !albumIdForShare.startsWith('local_') && albumIdForShare !== 'preview';
  const shareUrl = isSavedAlbum
    ? `https://personalizedgiftshop.in/album/${albumIdForShare}`
    : window.location.href;

  // Double page spread rendering orientation aspect calculation
  // Optimized to look significantly larger on mobile screens instead of a super thin strip
  const getAspectClass = () => {
    if (!album) return 'aspect-[2.2/1] md:aspect-[3/1]';
    if (album.orientation === 'Portrait') {
      return 'aspect-[1.3/1] sm:aspect-[1.5/1] md:aspect-[1.8/1]';
    } else if (album.orientation === 'Square') {
      return 'aspect-[1.5/1] sm:aspect-[1.8/1] md:aspect-[2.1/1]';
    } else {
      // Landscape default
      return 'aspect-[1.8/1] sm:aspect-[2.2/1] md:aspect-[3/1]';
    }
  };

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

  // Handle Autoplay slideshow turning pages every 3.5 seconds
  useEffect(() => {
    if (isAutoplayOn) {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= sheets.length) {
            return 0; // Loop back to start
          }
          return prev + 1;
        });
      }, 3500);
    } else {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isAutoplayOn, sheets.length]);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        if (id === 'preview' && location.state?.album) {
          setAlbum(location.state.album);
          setLoading(false);
          return;
        }

        // 1. Try to fetch from server fallback filesystem first
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
              }
            }
          } catch (serverErr) {
            console.warn("Server album fetch failed, trying fallbacks", serverErr);
          }
        }

        // 2. Fallback to client browser storage
        if (id?.startsWith('local_') || id) {
          const localData = localStorage.getItem('album_' + id) || localStorage.getItem('album_local_' + id);
          if (localData) {
            const parsed = JSON.parse(localData);
            setAlbum(parsed);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to direct Supabase query
        try {
          const { data, error } = await supabase.from('albums').select('*').eq('id', id).single();
          if (!error && data) {
            setAlbum(deserializeAlbumFromSupabase(data));
            setLoading(false);
            return;
          }
        } catch (dbErr) {
          console.warn("Supabase DB query error:", dbErr);
        }

        throw new Error("Album not found in database or local storage.");
      } catch (err) {
        console.error(err);
        toast.error('Album not found or error loading');
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id, location.state]);

  // Autoplay audio handling
  useEffect(() => {
    if (album?.audio_url && audioRef.current) {
      audioRef.current.src = album.audio_url;
      audioRef.current.load();
      
      const playAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            document.removeEventListener('click', playAudioWithInteraction);
            document.removeEventListener('touchstart', playAudioWithInteraction);
          })
          .catch((err) => {
            console.log("Browser auto-play blocked. Waiting for first click:", err);
          });
      };

      const playAudioWithInteraction = () => {
        playAudio();
      };

      playAudio();

      document.addEventListener('click', playAudioWithInteraction);
      document.addEventListener('touchstart', playAudioWithInteraction);

      return () => {
        document.removeEventListener('click', playAudioWithInteraction);
        document.removeEventListener('touchstart', playAudioWithInteraction);
      };
    }
  }, [album]);

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

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !album) return;
    
    const commentText = newComment.trim();
    setNewComment('');

    // Optimistically update local state
    setComments(prev => [...prev, commentText]);

    if (id && id !== 'preview' && !id.startsWith('local_')) {
      try {
        const res = await fetch(`/album/api/albums/${id}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: commentText })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            setComments(resData.comments);
            toast.success('Comment added successfully!');
            return;
          }
        }
      } catch (err) {
        console.warn("Server comment sync failed:", err);
      }
    }

    toast.success('Comment added successfully (offline/preview)!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-xs font-mono tracking-widest">LOADING EXPERIENCE...</span>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold font-mono">ALBUM NOT FOUND</h2>
          <p className="text-zinc-500 text-xs">The album has not been initialized or saved yet.</p>
          <button onClick={() => navigate('/create-album')} className="px-5 py-2 bg-amber-500 text-black font-semibold rounded-full text-xs uppercase tracking-wider">
            Create Album
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between text-white overflow-x-hidden relative transition-colors duration-1000 ${theme.font} select-none`} style={{ backgroundColor: '#020202' }}>
      {/* Background Starry Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.06),rgba(0,0,0,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-repeat bg-center opacity-[0.015] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* Hidden Audio */}
      <audio ref={audioRef} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      {/* Top Header - Exact Screenshot Premium Replica */}
      <header className="w-full bg-[#070708]/85 backdrop-blur-md border-b border-[#1b1b1f] py-3.5 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 z-50 sticky top-0 shadow-lg">
        {/* Left: Star Photo Lab Branding & Socials */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-amber-500 shadow-md">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm tracking-wider uppercase text-zinc-100">{album.studio_name || "PGS Album Studio"}</h1>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-500" />
                7
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-1 bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 text-zinc-400 hover:text-amber-500 rounded-full transition-all">
                <span className="text-[9px] font-bold px-1 font-mono">fb</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-1 bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 text-zinc-400 hover:text-amber-500 rounded-full transition-all">
                <span className="text-[9px] font-bold px-1 font-mono">ig</span>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-1 bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 text-zinc-400 hover:text-amber-500 rounded-full transition-all">
                <span className="text-[9px] font-bold px-1 font-mono">yt</span>
              </a>
            </div>
          </div>
        </div>

        {/* Center: Wedding details (Raja Weds Rani Style) */}
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-amber-500 tracking-wide drop-shadow-sm">{album.title}</h2>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">
            <span>{album.function_name || 'Anniversary'}</span>
            <span className="text-zinc-700">•</span>
            <span>{album.function_date ? new Date(album.function_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Feb 11, 2024'}</span>
            <span className="text-zinc-700">•</span>
            <span className="font-mono text-amber-500/80">#PGS-{albumIdForShare.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Right: Contact & Quick controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">SUPPORT HELPLINE</span>
            <a href={`tel:${album.mobile_number || '919162072838'}`} className="text-xs font-bold text-zinc-200 hover:text-amber-400 transition-colors flex items-center gap-1 justify-end font-mono">
              <Phone className="w-3 h-3 text-amber-500" />
              +{album.mobile_number || '91 9162072838'}
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            {album.audio_url && (
              <button 
                onClick={toggleAudio}
                className={`w-9 h-9 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-xl hover:border-amber-500 text-zinc-300 hover:text-white transition-all cursor-pointer ${isPlaying ? 'shadow-[0_0_8px_rgba(245,158,11,0.2)]' : ''}`}
                title="Toggle Music"
              >
                {isPlaying ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>
            )}

            {/* Back to Studio - No Make wording, just pristine navigation */}
            <button 
              onClick={() => navigate('/create-album')}
              className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-xl text-zinc-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-amber-500" />
              Studio
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience Layout Grid */}
      <main className="w-full flex-grow flex flex-col md:flex-row items-center justify-between p-2 sm:p-4 md:p-8 gap-4 relative">
        
        {/* Left Side: Floating PGS Album Badge - Pure Screenshot Style */}
        <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center">
          <div 
            className="bg-[#0c0c0e]/95 border-r border-y border-zinc-800 text-amber-500 text-[11px] font-black uppercase tracking-widest px-2.5 py-7 rounded-r-2xl shadow-xl flex flex-col items-center gap-2.5"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <Sparkles className="w-3.5 h-3.5 rotate-90 text-amber-500 mb-1" />
            <span className="text-zinc-100 font-mono tracking-[0.25em]">PGS ALBUM</span>
          </div>
        </div>

        {/* Center: Unified Responsive Flipbook Canvas */}
        <div className="w-full max-w-[100vw] lg:max-w-5xl mx-auto flex flex-col items-center justify-center relative z-20 flex-grow px-2 md:px-6">
          <div className="relative w-full flex items-center justify-center">
            {/* Left page-flip arrow */}
            <button 
              onClick={turnPrev} 
              disabled={currentIndex === 0}
              className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-[#0d0d0f]/90 hover:bg-[#151518] text-white border border-zinc-800 rounded-full disabled:opacity-0 transition-all z-50 shadow-2xl active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-amber-500" />
            </button>

            {/* Right page-flip arrow */}
            <button 
              onClick={turnNext} 
              disabled={currentIndex === sheets.length}
              className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-[#0d0d0f]/90 hover:bg-[#151518] text-white border border-zinc-800 rounded-full disabled:opacity-0 transition-all z-50 shadow-2xl active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </button>

            {/* Book Flip Animation Container */}
            <motion.div 
              className={`relative w-full ${getAspectClass()} perspective-[2500px] drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)] px-4 sm:px-10 md:px-0`}
              animate={{
                x: currentIndex === 0 ? '-22%' : currentIndex === sheets.length ? '22%' : '0%'
              }}
              transition={{ duration: 0.85, type: 'spring', stiffness: 50, damping: 14 }}
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
                    transition={{ duration: 0.85, type: 'spring', stiffness: 50, damping: 14 }}
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
                    {/* Front Side (Right Page) */}
                    <div 
                      className="absolute inset-0 cursor-pointer group rounded-r-md md:rounded-r-2xl shadow-[-2px_0_15px_rgba(0,0,0,0.4)]" 
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden', 
                        pointerEvents: isFlipped ? 'none' : 'auto',
                        backgroundColor: theme.pageBg
                      }}
                      onClick={turnNext}
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10 pointer-events-none" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] bg-black z-20 transition-opacity pointer-events-none rounded-r-md md:rounded-r-2xl" />
                      <div className="w-full h-full rounded-r-md md:rounded-r-2xl overflow-hidden">
                        {sheet.front}
                      </div>
                    </div>

                    {/* Back Side (Left Page) */}
                    <div 
                      className="absolute inset-0 cursor-pointer group rounded-l-md md:rounded-l-2xl shadow-[2px_0_15px_rgba(0,0,0,0.4)]" 
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)',
                        pointerEvents: isFlipped ? 'auto' : 'none',
                        backgroundColor: theme.pageBg
                      }}
                      onClick={turnPrev}
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-black/25 via-black/5 to-transparent z-10 pointer-events-none" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] bg-black z-20 transition-opacity pointer-events-none rounded-l-md md:rounded-l-2xl" />
                      <div className="w-full h-full rounded-l-md md:rounded-l-2xl overflow-hidden">
                        {sheet.back}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Right Side: Floating Interactive Sidebar Controls - Authentic Screenshot Replica */}
        <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:gap-4 z-40 bg-zinc-950/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-3 md:p-0 rounded-2xl border border-zinc-900 md:border-none w-full md:w-auto max-w-sm">
          {/* Active View metrics */}
          <div className="flex flex-col items-center cursor-default">
            <div className="w-10 h-10 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-300 transition-all">
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 font-mono mt-1">{viewsCount}</span>
          </div>

          {/* Interactive Likes trigger */}
          <button 
            onClick={handleLike}
            className="flex flex-col items-center cursor-pointer group outline-none border-none bg-transparent"
          >
            <div className={`w-10 h-10 border rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-rose-500/10 border-rose-500 text-rose-500 scale-110 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 group-hover:border-rose-500/50 group-hover:text-rose-400'}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
            </div>
            <span className={`text-[10px] font-bold font-mono mt-1 ${isLiked ? 'text-rose-400' : 'text-zinc-400'}`}>{likesCount}</span>
          </button>

          {/* Share trigger */}
          <button 
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              toast.success('🔗 Link copied! Ready to share with your family.');
            }}
            className="flex flex-col items-center cursor-pointer group outline-none border-none bg-transparent"
          >
            <div className="w-10 h-10 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 group-hover:border-indigo-500/50 group-hover:text-indigo-400 rounded-full flex items-center justify-center text-zinc-300 transition-all">
              <Share2 className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 font-mono mt-1">Share</span>
          </button>

          {/* QR Code button */}
          <button 
            onClick={() => setShowQR(true)}
            className="flex flex-col items-center cursor-pointer group outline-none border-none bg-transparent"
          >
            <div className="w-10 h-10 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 group-hover:border-amber-500/50 group-hover:text-amber-400 rounded-full flex items-center justify-center text-zinc-300 transition-all">
              <QrCode className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 font-mono mt-1">QR</span>
          </button>

          {/* Comments panel toggle */}
          <button 
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center cursor-pointer group outline-none border-none bg-transparent"
          >
            <div className="w-10 h-10 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 group-hover:border-emerald-500/50 group-hover:text-emerald-400 rounded-full flex items-center justify-center text-zinc-300 transition-all">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 font-mono mt-1">{comments.length}</span>
          </button>

          {/* Rating Badge */}
          <div className="flex flex-col items-center cursor-default">
            <div className="w-10 h-10 bg-zinc-900/90 border border-zinc-800 rounded-full flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 font-mono mt-1">4.9</span>
          </div>
        </div>
      </main>

      {/* Bottom Control Bar - Detailed Screenshot Replica */}
      <footer className="w-full bg-[#070708]/90 border-t border-[#1b1b1f] py-4 px-4 sm:px-8 z-40 sticky bottom-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* 1. Left controls: Previous & Page shortcuts */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={turnPrev} 
              disabled={currentIndex === 0}
              className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            {/* Quick Sheets shortcuts: F, IF, IB, B */}
            <div className="flex items-center gap-1.5 bg-[#0a0a0c] border border-zinc-800/80 p-1 rounded-lg">
              <button 
                onClick={() => { setCurrentIndex(0); setIsAutoplayOn(false); }}
                className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${currentIndex === 0 ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                title="Front Cover"
              >
                F
              </button>
              <button 
                onClick={() => { setCurrentIndex(1); setIsAutoplayOn(false); }}
                className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${currentIndex === 1 ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                title="Inner Front"
              >
                IF
              </button>
              <button 
                onClick={() => { setCurrentIndex(Math.max(0, sheets.length - 1)); setIsAutoplayOn(false); }}
                className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${currentIndex === sheets.length - 1 ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                title="Inner Back"
              >
                IB
              </button>
              <button 
                onClick={() => { setCurrentIndex(sheets.length); setIsAutoplayOn(false); }}
                className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${currentIndex === sheets.length ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                title="Back Cover"
              >
                B
              </button>
            </div>
          </div>

          {/* 2. Middle control: Page Slider Track (Screenshot Gold Theme) */}
          <div className="flex-grow w-full md:max-w-md flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">START</span>
            <div className="flex-grow relative flex items-center">
              <input 
                type="range" 
                min="0" 
                max={sheets.length} 
                value={currentIndex} 
                onChange={(e) => { setCurrentIndex(Number(e.target.value)); setIsAutoplayOn(false); }}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(currentIndex / sheets.length) * 100}%, #27272a ${(currentIndex / sheets.length) * 100}%, #27272a 100%)`
                }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">END</span>
          </div>

          {/* 3. Right control: Next page indicator & Autoplay slideshow */}
          <div className="flex items-center gap-3">
            {/* Page Counter Indicator Box */}
            <div className="bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-zinc-300">
              {currentIndex} <span className="text-zinc-500 font-normal">/ {sheets.length}</span>
            </div>

            {/* Slideshow play/pause */}
            <button 
              onClick={() => setIsAutoplayOn(!isAutoplayOn)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${isAutoplayOn ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
              title={isAutoplayOn ? 'Pause Slideshow' : 'Play Slideshow'}
            >
              {isAutoplayOn ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button 
              onClick={turnNext} 
              disabled={currentIndex === sheets.length}
              className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-30 transition-all cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Right Support and Special Actions */}
      <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-3">
        {/* WhatsApp chat link */}
        <a 
          href={`https://wa.me/${album.mobile_number || '919162072838'}?text=Hi! I am viewing the album "${encodeURIComponent(album.title)}" and would love to connect.`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce"
          title="WhatsApp Support"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 2.017 14.07 1 11.5 1c-5.45 0-9.877 4.372-9.882 9.8s1.43 4.811 1.43 4.811l-.971 3.543 3.65-.958z" />
          </svg>
        </a>
      </div>

      {/* Modals & Popups */}
      <AnimatePresence>
        {/* 1. Share QR code popup */}
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative shadow-2xl text-white"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-extrabold text-zinc-100 mb-2">Share Gift Album</h3>
              <p className="text-zinc-400 text-xs mb-6">Scan this QR code with any smartphone to open the interactive flipbook instantly.</p>
              <div className="bg-white p-4 rounded-2xl flex items-center justify-center mx-auto w-fit mb-6 shadow-md border-4 border-zinc-800">
                <QRCodeSVG value={shareUrl} size={190} level="H" includeMargin />
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied to clipboard!');
                }}
                className="w-full py-3 bg-amber-500 text-black font-extrabold rounded-xl hover:bg-amber-400 transition-all cursor-pointer"
              >
                Copy Link
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* 2. Comments panel popup */}
        {showComments && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-end p-0 bg-black/75 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-zinc-900 border-l border-zinc-800 w-full max-w-md h-full flex flex-col text-white shadow-2xl relative"
            >
              {/* Comments header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    Guest Comments ({comments.length})
                  </h3>
                  <p className="text-[10px] text-zinc-500">Leave a sweet wish or review for the album</p>
                </div>
                <button 
                  onClick={() => setShowComments(false)}
                  className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {comments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                    <p className="text-xs font-mono">No wishes left yet. Be the first!</p>
                  </div>
                ) : (
                  comments.map((cmt, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-950/80 border border-zinc-900 p-3.5 rounded-xl space-y-1 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 font-mono">Guest #{idx + 1}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">Just Now</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{cmt}</p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Comment Input form */}
              <form onSubmit={addComment} className="p-5 border-t border-zinc-800 bg-zinc-950/90 space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Write a warm comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-grow bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500/50 transition-all font-sans"
                  />
                  <button 
                    type="submit" 
                    className="w-10 h-10 bg-amber-500 text-black rounded-xl flex items-center justify-center hover:bg-amber-400 transition-all shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 text-center font-mono">PGS Album verification active</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
