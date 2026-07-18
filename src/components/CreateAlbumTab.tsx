import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Music as MusicIcon, 
  Layout, 
  Save, 
  QrCode, 
  Type, 
  Settings, 
  Square, 
  Palette, 
  Eye, 
  Coins, 
  Key, 
  Sparkles, 
  Compass, 
  ArrowLeftRight, 
  FolderOpen,
  FolderMinus,
  HelpCircle,
  FolderCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Album, Spread, CanvasImage } from '../types/album';

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

const preloadedAudioTracks = [
  { id: '', name: 'No background music' },
  { id: 'romantic-shehnai', name: 'Romantic Shehnai (Wedding Classic)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'cinematic-sitar', name: 'Cinematic Sitar (Acoustic Ambient)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'indian-flute', name: 'Divine Indian Flute (Instrumental)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'bollywood-dhol', name: 'Bollywood Dhol & Taasha (Upbeat Festivities)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'smooth-piano', name: 'Ethereal Grand Piano (Modern Sophistication)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
];

interface CreateAlbumTabProps {
  album: Album;
  setAlbum: React.Dispatch<React.SetStateAction<Album>>;
  onSave: () => void;
  onPreview: () => void;
  isSaving: boolean;
}

export default function CreateAlbumTab({
  album,
  setAlbum,
  onSave,
  onPreview,
  isSaving
}: CreateAlbumTabProps) {
  const [selectedActive, setSelectedActive] = useState<{ spreadId: number | string, page: 'left' | 'right', imgId: string } | null>(null);
  const [canvasMultiTarget, setCanvasMultiTarget] = useState<{ spreadId: number | string, page: 'left' | 'right' } | null>(null);
  const [showViewPin, setShowViewPin] = useState(false);

  // Hidden Inputs Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const canvasMultiInputRef = useRef<HTMLInputElement>(null);

  const currentUploadTarget = useRef<{
    type: 'cover' | 'back_cover' | 'inner_front' | 'inner_back' | 'combined_inner' | 'left' | 'right' | 'canvas',
    spreadId?: number | string,
    page?: 'left' | 'right',
    imgId?: string
  } | null>(null);

  const templates = [
    { name: 'Classic Royal', desc: 'Deep red and gold for traditional Indian celebrations.', colors: ['#4a0404', '#8b0000', '#f59e0b'] },
    { name: 'Vibrant Floral', desc: 'Emerald and rose hues for lively ceremonies like Mehendi.', colors: ['#064e3b', '#10b981', '#fb7185'] },
    { name: 'Minimalist Elegance', desc: 'Clean whites and subtle grays for modern receptions.', colors: ['#ffffff', '#f3f4f6', '#9ca3af'] },
    { name: 'Vintage Sepia', desc: 'Warm earthy tones.', colors: ['#4b3832', '#854442', '#fff4e6'] },
    { name: 'Modern Slate', desc: 'Dark sleek styling.', colors: ['#0f172a', '#1e293b', '#3b82f6'] },
    { name: 'Midnight Black', desc: 'Elegant high-contrast dark theme.', colors: ['#000000', '#111111', '#ffffff'] }
  ];

  // Helper to count uploaded inner photos
  const countInnerPhotos = () => {
    let count = 0;
    album.spreads.forEach(spread => {
      if (spread.leftPageType === 'canvas') {
        count += (spread.leftCanvasImages?.filter(img => img.url).length || 0);
      } else if (spread.leftImage) {
        count += 1;
      }
      if (spread.rightPageType === 'canvas') {
        count += (spread.rightCanvasImages?.filter(img => img.url).length || 0);
      } else if (spread.rightImage) {
        count += 1;
      }
    });
    return count;
  };

  // Image compressor helper
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadTarget.current) return;

    try {
      const base64Str = await resizeImage(file);
      const target = currentUploadTarget.current;

      if (target.type === 'cover') {
        setAlbum(prev => ({ ...prev, cover_url: base64Str }));
        toast.success('Front Cover added!');
      } else if (target.type === 'back_cover') {
        setAlbum(prev => ({ ...prev, back_cover_url: base64Str }));
        toast.success('Back Cover added!');
      } else if (target.type === 'inner_front') {
        setAlbum(prev => ({ ...prev, inner_front_url: base64Str }));
        toast.success('Inner Front cover page added!');
      } else if (target.type === 'inner_back') {
        setAlbum(prev => ({ ...prev, inner_back_url: base64Str }));
        toast.success('Inner Back cover page added!');
      } else if (target.type === 'combined_inner') {
        setAlbum(prev => ({ ...prev, combined_inner_url: base64Str }));
        toast.success('Combined Inner Spread added!');
      } else if (target.type === 'left' && target.spreadId) {
        setAlbum(prev => ({
          ...prev,
          spreads: prev.spreads.map(s => s.id === target.spreadId ? { ...s, leftImage: base64Str } : s)
        }));
      } else if (target.type === 'right' && target.spreadId) {
        setAlbum(prev => ({
          ...prev,
          spreads: prev.spreads.map(s => s.id === target.spreadId ? { ...s, rightImage: base64Str } : s)
        }));
      } else if (target.type === 'canvas' && target.spreadId && target.page && target.imgId) {
        updateCanvasImage(target.spreadId, target.page, target.imgId, { url: base64Str });
      }
    } catch (err) {
      toast.error('Failed to process image file');
    }
  };

  const updateCanvasImage = (spreadId: number | string, page: 'left' | 'right', imgId: string, updates: Partial<CanvasImage>) => {
    setAlbum(prev => ({
      ...prev,
      spreads: prev.spreads.map(s => {
        if (s.id !== spreadId) return s;
        const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
        const images = s[key] || [];
        const updatedImages = images.map((img: any) => img.id === imgId ? { ...img, ...updates } : img);
        return { ...s, [key]: updatedImages };
      })
    }));
  };

  const addCanvasImage = (spreadId: number | string, page: 'left' | 'right') => {
    const newId = 'frame_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    const newFrame: CanvasImage = {
      id: newId,
      url: '',
      x: 15,
      y: 15,
      width: 40,
      height: 40,
      rotation: 0,
      borderType: 'none',
      borderWidth: 3,
      borderColor: '#f59e0b',
      zIndex: 10
    };

    setAlbum(prev => ({
      ...prev,
      spreads: prev.spreads.map(s => {
        if (s.id !== spreadId) return s;
        const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
        const images = s[key] || [];
        return {
          ...s,
          [key]: [...images, newFrame],
          [page === 'left' ? 'leftPageType' : 'rightPageType']: 'canvas'
        };
      })
    }));

    setSelectedActive({ spreadId, page, imgId: newId });
  };

  const removeCanvasImage = (spreadId: number | string, page: 'left' | 'right', imgId: string) => {
    setAlbum(prev => ({
      ...prev,
      spreads: prev.spreads.map(s => {
        if (s.id !== spreadId) return s;
        const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
        const images = s[key] || [];
        const filtered = images.filter((img: any) => img.id !== imgId);
        return { ...s, [key]: filtered };
      })
    }));

    if (selectedActive?.spreadId === spreadId && selectedActive?.page === page && selectedActive?.imgId === imgId) {
      setSelectedActive(null);
    }
  };

  const triggerCanvasImageUpload = (spreadId: number | string, page: 'left' | 'right', imgId: string) => {
    currentUploadTarget.current = { type: 'canvas', spreadId, page, imgId };
    fileInputRef.current?.click();
  };

  const triggerMultiUpload = () => {
    multiFileInputRef.current?.click();
  };

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.info(`Processing ${files.length} images...`);
    const resizedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await resizeImage(files[i]);
        resizedUrls.push(url);
      } catch (err) {
        console.error(err);
      }
    }

    if (resizedUrls.length === 0) {
      toast.error('Could not process any of the images.');
      return;
    }

    const newSpreads = [...album.spreads];
    let currentIdx = 0;

    for (let i = 0; i < newSpreads.length && currentIdx < resizedUrls.length; i++) {
      if (!newSpreads[i].leftImage && (!newSpreads[i].leftPageType || newSpreads[i].leftPageType === 'single')) {
        newSpreads[i].leftImage = resizedUrls[currentIdx++];
      }
      if (currentIdx < resizedUrls.length && !newSpreads[i].rightImage && (!newSpreads[i].rightPageType || newSpreads[i].rightPageType === 'single')) {
        newSpreads[i].rightImage = resizedUrls[currentIdx++];
      }
    }

    while (currentIdx < resizedUrls.length) {
      const left = resizedUrls[currentIdx++];
      const right = currentIdx < resizedUrls.length ? resizedUrls[currentIdx++] : '';
      newSpreads.push({
        id: Date.now() + currentIdx,
        leftImage: left,
        rightImage: right,
        leftPageType: 'single',
        rightPageType: 'single',
        leftCanvasImages: [],
        rightCanvasImages: []
      });
    }

    setAlbum(prev => ({ ...prev, spreads: newSpreads }));
    toast.success(`Successfully uploaded and added ${resizedUrls.length} inner pages!`);
  };

  const triggerCanvasMultiUpload = (spreadId: number | string, page: 'left' | 'right') => {
    setCanvasMultiTarget({ spreadId, page });
    canvasMultiInputRef.current?.click();
  };

  const handleCanvasMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !canvasMultiTarget) return;

    const { spreadId, page } = canvasMultiTarget;
    toast.info(`Processing ${files.length} images for Canvas...`);

    const resizedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await resizeImage(files[i]);
        resizedUrls.push(url);
      } catch (err) {
        console.error(err);
      }
    }

    if (resizedUrls.length === 0) {
      toast.error('Could not process any images.');
      return;
    }

    setAlbum(prev => ({
      ...prev,
      spreads: prev.spreads.map(s => {
        if (s.id !== spreadId) return s;
        const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
        const existingImages = s[key] || [];

        const newFrames = resizedUrls.map((url, idx) => {
          const offset = idx * 6;
          return {
            id: 'frame_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5),
            url,
            x: Math.min(60, 10 + offset),
            y: Math.min(60, 10 + offset),
            width: 35,
            height: 35,
            rotation: (idx % 2 === 0 ? 6 : -6) * idx,
            borderType: 'none',
            borderWidth: 3,
            borderColor: '#f59e0b',
            zIndex: existingImages.length + idx + 1
          };
        });

        return {
          ...s,
          [key]: [...existingImages, ...newFrames],
          [page === 'left' ? 'leftPageType' : 'rightPageType']: 'canvas'
        };
      })
    }));

    setCanvasMultiTarget(null);
    toast.success(`Successfully added ${resizedUrls.length} canvas frames!`);
  };

  const handleAudioSelect = (trackId: string) => {
    const track = preloadedAudioTracks.find(t => t.id === trackId);
    if (!track) return;
    setAlbum(prev => ({
      ...prev,
      audio_url: track.url || '',
      audio_name: track.name
    }));
    toast.success(`Selected theme song: ${track.name}`);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Audio files must be under 8MB to optimize storage.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAlbum(prev => ({
        ...prev,
        audio_url: ev.target?.result as string,
        audio_name: file.name
      }));
      toast.success(`Uploaded background music: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (type: 'cover' | 'back_cover' | 'inner_front' | 'inner_back' | 'combined_inner', spreadId?: number | string) => {
    currentUploadTarget.current = { type, spreadId };
    fileInputRef.current?.click();
  };

  const addSpread = () => {
    setAlbum(prev => ({
      ...prev,
      spreads: [...prev.spreads, {
        id: Date.now() + Math.random(),
        leftImage: '',
        rightImage: '',
        leftPageType: 'single',
        rightPageType: 'single',
        leftCanvasImages: [],
        rightCanvasImages: []
      }]
    }));
  };

  const removeSpread = (id: number | string) => {
    if (album.spreads.length === 1) {
      toast.error('Your album must have at least one spread page!');
      return;
    }
    setAlbum(prev => ({
      ...prev,
      spreads: prev.spreads.filter(s => s.id !== id)
    }));
  };

  const moveSpread = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === album.spreads.length - 1)) return;
    const newSpreads = [...album.spreads];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSpreads[index], newSpreads[swapIndex]] = [newSpreads[swapIndex], newSpreads[index]];
    setAlbum(prev => ({ ...prev, spreads: newSpreads }));
  };

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, spreadId: number | string, page: 'left' | 'right', imgId: string) => {
    e.stopPropagation();
    setSelectedActive({ spreadId, page, imgId });

    const canvasElement = document.getElementById(`canvas-${spreadId}-${page}`);
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const targetSpread = album.spreads.find(s => s.id === spreadId);
    if (!targetSpread) return;
    const imgList = page === 'left' ? targetSpread.leftCanvasImages : targetSpread.rightCanvasImages;
    const img = imgList?.find((i: any) => i.id === imgId);

    if (!img) return;

    const startX = clientX;
    const startY = clientY;
    const startPercentX = img.x;
    const startPercentY = img.y;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      let newX = Math.max(0, Math.min(100 - img.width, startPercentX + deltaPercentX));
      let newY = Math.max(0, Math.min(100 - img.height, startPercentY + deltaPercentY));

      newX = Math.round(newX);
      newY = Math.round(newY);

      updateCanvasImage(spreadId, page, imgId, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  const handleStartResize = (e: React.MouseEvent | React.TouchEvent, spreadId: number | string, page: 'left' | 'right', imgId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasElement = document.getElementById(`canvas-${spreadId}-${page}`);
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const targetSpread = album.spreads.find(s => s.id === spreadId);
    if (!targetSpread) return;
    const imgList = page === 'left' ? targetSpread.leftCanvasImages : targetSpread.rightCanvasImages;
    const img = imgList?.find((i: any) => i.id === imgId);

    if (!img) return;

    const startX = clientX;
    const startY = clientY;
    const startWidth = img.width;
    const startHeight = img.height;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      let newWidth = Math.max(10, Math.min(100 - img.x, startWidth + deltaPercentX));
      let newHeight = Math.max(10, Math.min(100 - img.y, startHeight + deltaPercentY));

      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);

      updateCanvasImage(spreadId, page, imgId, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  const handleStartRotate = (e: React.MouseEvent | React.TouchEvent, spreadId: number | string, page: 'left' | 'right', imgId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasElement = document.getElementById(`canvas-${spreadId}-${page}`);
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = currentX - centerX;
      const dy = currentY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      updateCanvasImage(spreadId, page, imgId, { rotation: Math.round(angle) });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  const generatePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setAlbum(prev => ({ ...prev, view_lock_pin: pin }));
    toast.success(`🔐 Generated secure View-Lock PIN: ${pin}`);
  };

  return (
    <div className="space-y-8 text-white font-sans">
      {/* Hidden file selectors */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />
      <input type="file" ref={multiFileInputRef} className="hidden" accept="image/*" multiple onChange={handleMultiFileUpload} />
      <input type="file" ref={canvasMultiInputRef} className="hidden" accept="image/*" multiple onChange={handleCanvasMultiUpload} />

      {/* Editor top controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] border border-[#1e1e21] p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Covers &amp; Details Config</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Define your book details, templates and covers first</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={onPreview}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-xl font-bold flex items-center gap-2 text-xs transition-all"
          >
            <Eye className="w-4 h-4 text-amber-500" /> Preview Book
          </button>
          
          <button 
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90 rounded-xl font-bold flex items-center gap-2 text-xs transition-all shadow-lg shadow-amber-500/10"
          >
            {isSaving ? (
              <>
                <span className="animate-spin text-sm">↻</span> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 fill-black/10" /> 
                {album.id && !album.id.startsWith('local_') ? 'Update Album' : 'Publish Album'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary columns (Matches screenshots 2 and 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: DETAILS Panel */}
        <div className="lg:col-span-5 bg-[#121214] border border-[#1e1e21] rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Compass className="w-4 h-4 text-amber-500" /> Basic Details
            </h3>
          </div>

          {/* Client name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Client name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Riya &amp; Aman"
              value={album.client_name || ''}
              onChange={(e) => setAlbum(prev => ({ 
                ...prev, 
                client_name: e.target.value,
                title: e.target.value ? `${e.target.value}'s Wedding Album` : prev.title
              }))}
              className="w-full px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-100 placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Function & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Function *</label>
              <select
                value={album.function_name || 'Wedding'}
                onChange={(e) => setAlbum(prev => ({ ...prev, function_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-300 cursor-pointer"
              >
                <option value="Wedding">Wedding</option>
                <option value="Reception">Reception</option>
                <option value="Sangeet">Sangeet</option>
                <option value="Pre-Wedding">Pre-Wedding</option>
                <option value="Birthday">Birthday</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Function date *</label>
              <input
                type="date"
                required
                value={album.function_date || ''}
                onChange={(e) => setAlbum(prev => ({ ...prev, function_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Background Music Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Background music</span>
              <button 
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="text-[10px] text-amber-500 hover:underline font-bold"
              >
                Upload Custom Audio
              </button>
            </label>
            <div className="relative">
              <select
                value={preloadedAudioTracks.find(t => t.url === album.audio_url)?.id || ''}
                onChange={(e) => handleAudioSelect(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-300 cursor-pointer"
              >
                {preloadedAudioTracks.map(track => (
                  <option key={track.id} value={track.id}>{track.name}</option>
                ))}
              </select>
              <MusicIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            </div>
            {album.audio_name && (
              <span className="text-[10px] text-zinc-500 truncate block bg-zinc-950 p-1.5 rounded border border-zinc-900 font-mono">
                🎵 Active: {album.audio_name}
              </span>
            )}
          </div>

          {/* View Lock PIN */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>View-lock PIN (optional)</span>
              <button
                type="button"
                onClick={generatePin}
                className="text-[10px] text-amber-500 hover:underline font-bold flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" /> Auto-Generate
              </button>
            </label>
            <div className="relative">
              <input
                type={showViewPin ? 'text' : 'password'}
                placeholder="••••••"
                value={album.view_lock_pin || ''}
                maxLength={8}
                onChange={(e) => setAlbum(prev => ({ ...prev, view_lock_pin: e.target.value }))}
                className="w-full pl-9 pr-10 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-100 placeholder-zinc-800 font-mono tracking-widest transition-colors"
              />
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <button
                type="button"
                onClick={() => setShowViewPin(!showViewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 hover:text-white"
              >
                {showViewPin ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 leading-normal">If set, customers will be prompted to type this PIN code to unlock their flipbook viewer.</p>
          </div>

          {/* Custom Watermark */}
          <div className="space-y-2 pt-2 border-t border-zinc-900">
            <label className="text-xs font-semibold text-zinc-400">Subtle watermark marking (bottom of pages)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. #SuryaFilms2026"
                value={album.page_marking || ''}
                onChange={(e) => setAlbum(prev => ({ ...prev, page_marking: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl focus:border-amber-500/50 outline-none text-sm text-zinc-100 transition-colors"
              />
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Right column: COVERS & CANVAS LAYOUTS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Cover uploads block (Drop or Tap) */}
          <div className="bg-[#121214] border border-[#1e1e21] rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="border-b border-zinc-800/60 pb-3 mb-5">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <ImageIcon className="w-4 h-4 text-amber-500" /> Outer Covers
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Front Cover Card */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 block">Front Cover *</label>
                <div 
                  onClick={() => triggerUpload('cover')}
                  className="aspect-[4/3] bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                >
                  {album.cover_url ? (
                    <>
                      <img src={album.cover_url} alt="Front Cover" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setAlbum(p => ({...p, cover_url: ''})); }}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-zinc-600 mb-2 mx-auto group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white block">Front cover *</span>
                      <span className="text-[10px] text-zinc-600 mt-1 block">Drop or tap to upload</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Cover Card */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 block">Back Cover *</label>
                <div 
                  onClick={() => triggerUpload('back_cover')}
                  className="aspect-[4/3] bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                >
                  {album.back_cover_url ? (
                    <>
                      <img src={album.back_cover_url} alt="Back Cover" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setAlbum(p => ({...p, back_cover_url: ''})); }}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-zinc-600 mb-2 mx-auto group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white block">Back cover *</span>
                      <span className="text-[10px] text-zinc-600 mt-1 block">Drop or tap to upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inside Covers Selection (Dual Mode) */}
          <div className="bg-[#121214] border border-[#1e1e21] rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3 mb-5">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <ArrowLeftRight className="w-4 h-4 text-amber-500" /> Inside Covers
              </h3>

              {/* Combined Mode Selector */}
              <div className="flex bg-[#09090b] border border-zinc-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setAlbum(p => ({ ...p, is_combined_inner: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!album.is_combined_inner ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Separate
                </button>
                <button
                  type="button"
                  onClick={() => setAlbum(p => ({ ...p, is_combined_inner: true }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${album.is_combined_inner ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Combined Spread
                </button>
              </div>
            </div>

            {!album.is_combined_inner ? (
              /* SEPARATE Mode upload slots */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Inner front (DM First)</label>
                  <div 
                    onClick={() => triggerUpload('inner_front')}
                    className="aspect-[4/3] bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                  >
                    {album.inner_front_url ? (
                      <>
                        <img src={album.inner_front_url} alt="Inner Front" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setAlbum(p => ({...p, inner_front_url: ''})); }}>
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-7 h-7 text-zinc-600 mb-2 mx-auto group-hover:text-amber-500 transition-colors" />
                        <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white block">Inner front (DM First)</span>
                        <span className="text-[9px] text-zinc-650 mt-0.5 block">Same size as cover</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Inner back (DM Last)</label>
                  <div 
                    onClick={() => triggerUpload('inner_back')}
                    className="aspect-[4/3] bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                  >
                    {album.inner_back_url ? (
                      <>
                        <img src={album.inner_back_url} alt="Inner Back" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setAlbum(p => ({...p, inner_back_url: ''})); }}>
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-7 h-7 text-zinc-600 mb-2 mx-auto group-hover:text-amber-500 transition-colors" />
                        <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white block">Inner back (DM Last)</span>
                        <span className="text-[9px] text-zinc-650 mt-0.5 block">Same size as cover</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* COMBINED SPREAD Mode upload slot */
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 block">Combined Inner Spread (Front + Back)</label>
                <div 
                  onClick={() => triggerUpload('combined_inner')}
                  className="aspect-[8/3] bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-zinc-800 hover:border-amber-500/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                >
                  {album.combined_inner_url ? (
                    <>
                      <img src={album.combined_inner_url} alt="Combined Inner" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setAlbum(p => ({...p, combined_inner_url: ''})); }}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-zinc-600 mb-2 mx-auto group-hover:text-amber-500 transition-colors" />
                      <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white block">Combined inner spread (Inner front + Inner back)</span>
                      <span className="text-[9px] text-zinc-650 mt-0.5 block">≈ 2x cover width</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spreads / Layout Section (Dynamic inner pages list with canvas boards) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" /> Inner Pages &amp; Spreads ({countInnerPhotos()} / 200 photos)
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Populate sheets with simple photos or customize rich canvas layouts with frames and margins</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerMultiUpload}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-xl font-bold flex items-center gap-2 text-xs transition-colors"
            >
              <Upload className="w-4 h-4 text-amber-500" /> Select Files
            </button>
            <button
              type="button"
              onClick={() => {
                triggerMultiUpload();
                toast.info("Select folder simulation — select files to represent folder contents.");
              }}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-xl font-bold flex items-center gap-2 text-xs transition-colors"
            >
              <FolderCheck className="w-4 h-4 text-amber-500" /> Select Folder
            </button>
          </div>
        </div>

        {/* Spreads loop */}
        <div className="space-y-6">
          {album.spreads.map((spread, index) => (
            <div key={spread.id} className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl shadow-xl relative">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-950 text-amber-500 border border-amber-500/10 font-bold px-3 py-1 rounded-lg text-xs">
                    Spread {index + 1}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {(!spread.leftPageType || spread.leftPageType === 'single') && (!spread.rightPageType || spread.rightPageType === 'single') ? 'Classic Layout' : 'Canvas rich layout'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => moveSpread(index, 'up')} disabled={index === 0} className="w-7 h-7 bg-zinc-950 hover:bg-zinc-900 rounded-lg disabled:opacity-30 flex items-center justify-center text-xs font-bold text-zinc-400">↑</button>
                  <button onClick={() => moveSpread(index, 'down')} disabled={index === album.spreads.length - 1} className="w-7 h-7 bg-zinc-950 hover:bg-zinc-900 rounded-lg disabled:opacity-30 flex items-center justify-center text-xs font-bold text-zinc-400">↓</button>
                  <button onClick={() => removeSpread(spread.id)} disabled={album.spreads.length === 1} className="w-7 h-7 bg-zinc-950 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-lg flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Left and Right Page Editors */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <PageEditor
                  spread={spread}
                  page="left"
                  triggerImageUpload={triggerUpload}
                  triggerCanvasImageUpload={triggerCanvasImageUpload}
                  triggerCanvasMultiUpload={triggerCanvasMultiUpload}
                  addCanvasImage={addCanvasImage}
                  removeCanvasImage={removeCanvasImage}
                  updateCanvasImage={updateCanvasImage}
                  selectedActive={selectedActive}
                  setSelectedActive={setSelectedActive}
                  handleStartDrag={handleStartDrag}
                  handleStartResize={handleStartResize}
                  handleStartRotate={handleStartRotate}
                  setAlbum={setAlbum}
                />
                <PageEditor
                  spread={spread}
                  page="right"
                  triggerImageUpload={triggerUpload}
                  triggerCanvasImageUpload={triggerCanvasImageUpload}
                  triggerCanvasMultiUpload={triggerCanvasMultiUpload}
                  addCanvasImage={addCanvasImage}
                  removeCanvasImage={removeCanvasImage}
                  updateCanvasImage={updateCanvasImage}
                  selectedActive={selectedActive}
                  setSelectedActive={setSelectedActive}
                  handleStartDrag={handleStartDrag}
                  handleStartResize={handleStartResize}
                  handleStartRotate={handleStartRotate}
                  setAlbum={setAlbum}
                />
              </div>
            </div>
          ))}

          <button 
            type="button"
            onClick={addSpread}
            className="w-full py-4 bg-zinc-950 border-2 border-dashed border-zinc-800/80 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-all font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-500" /> Add New Inner Spread Page
          </button>
        </div>
      </div>
    </div>
  );
}

const PageEditor = ({
  spread,
  page,
  triggerImageUpload,
  triggerCanvasImageUpload,
  triggerCanvasMultiUpload,
  addCanvasImage,
  removeCanvasImage,
  updateCanvasImage,
  selectedActive,
  setSelectedActive,
  handleStartDrag,
  handleStartResize,
  handleStartRotate,
  setAlbum
}: {
  spread: Spread;
  page: 'left' | 'right';
  triggerImageUpload: any;
  triggerCanvasImageUpload: any;
  triggerCanvasMultiUpload: any;
  addCanvasImage: any;
  removeCanvasImage: any;
  updateCanvasImage: any;
  selectedActive: any;
  setSelectedActive: any;
  handleStartDrag: any;
  handleStartResize: any;
  handleStartRotate: any;
  setAlbum: React.Dispatch<React.SetStateAction<Album>>;
}) => {
  const pageType = page === 'left' ? spread.leftPageType : spread.rightPageType;
  const canvasImages = page === 'left' ? spread.leftCanvasImages : spread.rightCanvasImages;
  const singleImage = page === 'left' ? spread.leftImage : spread.rightImage;
  const isCanvas = pageType === 'canvas';

  const isActiveImage = (imgId: string) => {
    return selectedActive?.spreadId === spread.id && selectedActive?.page === page && selectedActive?.imgId === imgId;
  };

  const activeImg = selectedActive?.spreadId === spread.id && selectedActive?.page === page 
    ? canvasImages?.find((img: any) => img.id === selectedActive.imgId)
    : null;

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {page === 'left' ? 'Left Page' : 'Right Page'}
        </span>
        <div className="flex items-center gap-1.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
          <button 
            type="button"
            onClick={() => {
              setAlbum(prev => ({
                ...prev,
                spreads: prev.spreads.map(s => s.id === spread.id ? { ...s, [page === 'left' ? 'leftPageType' : 'rightPageType']: 'single' } : s)
              }));
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${(!pageType || pageType === 'single') ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Square className="w-3 h-3" /> Single
          </button>
          <button 
            type="button"
            onClick={() => {
              const existingImages = canvasImages || [];
              const initializedImages = existingImages.length > 0 ? existingImages : [
                {
                  id: 'frame_' + Date.now() + '_' + page.toUpperCase(),
                  url: singleImage || '',
                  x: 15,
                  y: 15,
                  width: 70,
                  height: 70,
                  rotation: 0,
                  borderType: 'none',
                  borderWidth: 2,
                  borderColor: '#eab308',
                  zIndex: 1
                }
              ];
              setAlbum(prev => ({
                ...prev,
                spreads: prev.spreads.map(s => s.id === spread.id ? { 
                  ...s, 
                  [page === 'left' ? 'leftPageType' : 'rightPageType']: 'canvas',
                  [page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages']: initializedImages
                } : s)
              }));
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${pageType === 'canvas' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Layout className="w-3 h-3" /> Canvas
          </button>
        </div>
      </div>

      {!isCanvas ? (
        <div 
          onClick={() => triggerImageUpload(page, spread.id)}
          className="aspect-[4/3] bg-zinc-950 rounded-xl border-2 border-dashed border-zinc-800 hover:border-amber-500/40 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group relative"
        >
          {singleImage ? (
            <img src={singleImage} alt={page} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" referrerPolicy="no-referrer" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-zinc-700 mb-2 group-hover:text-amber-500 transition-all" />
              <span className="text-xs font-bold text-zinc-500 group-hover:text-white">Add Photo</span>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div 
            id={`canvas-${spread.id}-${page}`}
            className="relative aspect-[4/3] w-full bg-[#08080a] border border-zinc-850 rounded-xl overflow-hidden shadow-inner select-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
            onClick={() => setSelectedActive(null)}
          >
            {canvasImages && canvasImages.length > 0 ? (
              canvasImages.map((img: any) => {
                const isSelected = isActiveImage(img.id);
                const borderConfig = BorderStylesMap[img.borderType || 'none'] || { borderStyle: 'none' };
                const borderStyleProps = {
                  borderStyle: borderConfig.borderStyle || 'solid',
                  borderWidth: img.borderType === 'none' ? '0px' : `${img.borderWidth ?? 2}px`,
                  borderColor: img.borderColor || '#facc15',
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
                      zIndex: img.zIndex || 1,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActive({ spreadId: spread.id, page, imgId: img.id });
                    }}
                    onMouseDown={(e) => handleStartDrag(e, spread.id, page, img.id)}
                    onTouchStart={(e) => handleStartDrag(e, spread.id, page, img.id)}
                    className={`absolute flex items-center justify-center ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black z-50' : 'hover:ring-1 hover:ring-white/30 cursor-grab active:cursor-grabbing'}`}
                  >
                    {img.url ? (
                      <img 
                        src={img.url} 
                        className={`w-full h-full object-cover rounded shadow-lg ${borderConfig.customClass || ''}`} 
                        style={borderStyleProps}
                        alt="Canvas" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 border-2 border-dashed border-zinc-850 rounded flex flex-col items-center justify-center p-2 text-center text-zinc-650">
                        <ImageIcon className="w-5 h-5 mb-1 text-zinc-700" />
                        <span className="text-[10px] font-bold leading-tight">Add Photo</span>
                      </div>
                    )}

                    {isSelected && (
                      <>
                        <div 
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-500 border border-black text-black rounded-full flex items-center justify-center shadow-lg cursor-alias active:scale-90 transition-transform z-50 font-extrabold text-[9px]"
                          title="Rotate frame"
                          onMouseDown={(e) => handleStartRotate(e, spread.id, page, img.id)}
                          onTouchStart={(e) => handleStartRotate(e, spread.id, page, img.id)}
                        >
                          ↻
                        </div>

                        <div 
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-500 border border-black rounded-full flex items-center justify-center shadow-lg cursor-se-resize active:scale-90 transition-transform z-50"
                          title="Resize frame"
                          onMouseDown={(e) => handleStartResize(e, spread.id, page, img.id)}
                          onTouchStart={(e) => handleStartResize(e, spread.id, page, img.id)}
                        >
                          <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        </div>

                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-50 font-mono">
                          X:{img.x}% Y:{img.y}% ({img.width}x{img.height})
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-zinc-600 text-xs">
                <span className="mb-2">Canvas is empty</span>
                <button 
                  type="button" 
                  onClick={() => addCanvasImage(spread.id, page)} 
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-[10px]"
                >
                  + Add Frame
                </button>
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap gap-2 justify-between items-center border-t border-zinc-900 pt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addCanvasImage(spread.id, page)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-lg flex items-center gap-1 border border-zinc-800"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" /> Frame
              </button>
              <button
                type="button"
                onClick={() => triggerCanvasMultiUpload(spread.id, page)}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold rounded-lg flex items-center gap-1 border border-amber-500/20"
                title="Upload multiple pictures straight onto this canvas!"
              >
                <Upload className="w-3.5 h-3.5 text-amber-500" /> Multi-Add
              </button>
            </div>
            
            {activeImg && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => triggerCanvasImageUpload(spread.id, page, activeImg.id)}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-lg"
                >
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentZ = activeImg.zIndex || 1;
                    updateCanvasImage(spread.id, page, activeImg.id, { zIndex: currentZ + 2 });
                    toast.success("Brought Forward");
                  }}
                  className="px-1.5 py-1 bg-[#1e1e21] hover:bg-zinc-800 text-zinc-400 rounded text-[10px] font-bold"
                  title="Bring to Front"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentZ = activeImg.zIndex || 1;
                    updateCanvasImage(spread.id, page, activeImg.id, { zIndex: Math.max(1, currentZ - 2) });
                    toast.success("Sent Backward");
                  }}
                  className="px-1.5 py-1 bg-[#1e1e21] hover:bg-zinc-800 text-zinc-400 rounded text-[10px] font-bold"
                  title="Send to Back"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => removeCanvasImage(spread.id, page, activeImg.id)}
                  className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Active image settings card */}
          {activeImg && (
            <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-4 text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-amber-500" /> Frame Customizer
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono font-bold">
                  ID: {activeImg.id.slice(-5)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-medium text-zinc-400">
                <div className="space-y-1">
                  <span>Width ({activeImg.width}%)</span>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={activeImg.width} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { width: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-ew-resize h-1 bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span>Height ({activeImg.height}%)</span>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={activeImg.height} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { height: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-ew-resize h-1 bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span>Rotation ({activeImg.rotation || 0}°)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={activeImg.rotation || 0} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { rotation: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-ew-resize h-1 bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span>X Coord ({activeImg.x}%)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max={100 - activeImg.width} 
                    value={activeImg.x} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { x: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-ew-resize h-1 bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Ornate Borders Section */}
              <div className="border-t border-zinc-900 pt-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="space-y-1 flex-1">
                    <span className="text-zinc-400 font-bold flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-amber-500" /> Border Style
                    </span>
                    <select
                      value={activeImg.borderType || 'none'}
                      onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { borderType: e.target.value })}
                      className="w-full p-1.5 border border-zinc-800 bg-[#09090b] rounded-lg outline-none text-xs text-zinc-300 cursor-pointer"
                    >
                      <option value="none">No Border</option>
                      <option value="solid">Classic Solid</option>
                      <option value="dashed">Stitched Dashed</option>
                      <option value="double">Elegant Double</option>
                      <option value="ornate-gold">✨ Ornate Imperial Gold</option>
                      <option value="ornate-silver">❄️ Ornate Vintage Silver</option>
                      <option value="royal-red">🔴 Royal Crimson Red</option>
                      <option value="pearl-inlay">⚪ Premium Pearl Inlay</option>
                    </select>
                  </div>

                  {activeImg.borderType !== 'none' && (
                    <div className="space-y-1 flex-1">
                      <span className="text-zinc-400 font-bold">Border Width ({activeImg.borderWidth || 2}px)</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={activeImg.borderWidth || 2} 
                        onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { borderWidth: parseInt(e.target.value) })}
                        className="w-full accent-amber-500 cursor-ew-resize h-1 bg-zinc-800 rounded-lg appearance-none"
                      />
                    </div>
                  )}
                </div>

                {/* Border Colors */}
                {activeImg.borderType !== 'none' && (
                  <div className="space-y-1.5">
                    <span className="text-zinc-400 font-bold">Border Color</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {['#facc15', '#94a3b8', '#e11d48', '#8b5cf6', '#059669', '#ffffff', '#000000'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateCanvasImage(spread.id, page, activeImg.id, { borderColor: color })}
                          className="w-5 h-5 rounded-full border border-zinc-700 shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-white text-[9px] font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {activeImg.borderColor === color && '✓'}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 border border-zinc-800 rounded p-0.5 bg-[#09090b]">
                        <input 
                          type="color" 
                          value={activeImg.borderColor || '#facc15'}
                          onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { borderColor: e.target.value })}
                          className="w-5 h-5 cursor-pointer rounded border-0 p-0 overflow-hidden" 
                        />
                        <span className="text-[10px] font-mono pr-1 text-zinc-500 uppercase">{activeImg.borderColor || '#facc15'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
