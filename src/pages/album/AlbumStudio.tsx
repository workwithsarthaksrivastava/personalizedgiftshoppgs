import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, ArrowLeft, Image as ImageIcon, Music, Layout, Save, QrCode, Type, Settings, Square, Palette } from 'lucide-react';
import { supabase } from '../../supabase';
import { toast } from 'sonner';

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

export default function AlbumStudio() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [albumId, setAlbumId] = useState<string | null>(null);

  const generateUniqueId = (albumName: string) => {
    const slug = albumName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
      .replace(/^-+|-+$/g, '');   // remove leading/trailing hyphens
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit code
    return slug ? `${slug}-${random}` : `album-${Date.now()}`;
  };

  // Album State
  const [title, setTitle] = useState('My Celebration Album');
  const [proposedSlug, setProposedSlug] = useState(() => {
    return 'my-celebration-album-' + Math.floor(1000 + Math.random() * 9000);
  });
  const [template, setTemplate] = useState('Classic Royal');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioName, setAudioName] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [orientation, setOrientation] = useState('Landscape');
  const [pageMarking, setPageMarking] = useState('');
  
  const [spreads, setSpreads] = useState<any[]>([
    { 
      id: 1, 
      leftImage: '', 
      rightImage: '',
      leftPageType: 'single',
      rightPageType: 'single',
      leftCanvasImages: [],
      rightCanvasImages: []
    }
  ]);

  // Active selected image details: { spreadId, page: 'left' | 'right', imgId }
  const [selectedActive, setSelectedActive] = useState<{ spreadId: number, page: 'left' | 'right', imgId: string } | null>(null);
  const [canvasMultiTarget, setCanvasMultiTarget] = useState<{ spreadId: number, page: 'left' | 'right' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const canvasMultiInputRef = useRef<HTMLInputElement>(null);

  const currentUploadTarget = useRef<{
    type: 'cover' | 'left' | 'right' | 'canvas', 
    spreadId?: number,
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

  // We'll resize images to keep base64 payload small
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
        setCoverUrl(base64Str);
      } else if (target.type === 'left' && target.spreadId) {
        setSpreads(prev => prev.map(s => s.id === target.spreadId ? { ...s, leftImage: base64Str } : s));
      } else if (target.type === 'right' && target.spreadId) {
        setSpreads(prev => prev.map(s => s.id === target.spreadId ? { ...s, rightImage: base64Str } : s));
      } else if (target.type === 'canvas' && target.spreadId && target.page && target.imgId) {
        updateCanvasImage(target.spreadId, target.page, target.imgId, { url: base64Str });
      }
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const updateCanvasImage = (spreadId: number, page: 'left' | 'right', imgId: string, updates: Partial<any>) => {
    setSpreads(prev => prev.map(s => {
      if (s.id !== spreadId) return s;
      const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
      const images = s[key] || [];
      const updatedImages = images.map((img: any) => img.id === imgId ? { ...img, ...updates } : img);
      return { ...s, [key]: updatedImages };
    }));
  };

  const addCanvasImage = (spreadId: number, page: 'left' | 'right') => {
    const newId = 'frame_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    const newFrame = {
      id: newId,
      url: '',
      x: 15,
      y: 15,
      width: 40,
      height: 40,
      rotation: 0,
      borderType: 'none',
      borderWidth: 3,
      borderColor: '#8b5cf6',
      zIndex: 10
    };
    
    setSpreads(prev => prev.map(s => {
      if (s.id !== spreadId) return s;
      const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
      const images = s[key] || [];
      return { 
        ...s, 
        [key]: [...images, newFrame],
        [page === 'left' ? 'leftPageType' : 'rightPageType']: 'canvas'
      };
    }));
    
    setSelectedActive({ spreadId, page, imgId: newId });
  };

  const removeCanvasImage = (spreadId: number, page: 'left' | 'right', imgId: string) => {
    setSpreads(prev => prev.map(s => {
      if (s.id !== spreadId) return s;
      const key = page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages';
      const images = s[key] || [];
      const filtered = images.filter((img: any) => img.id !== imgId);
      return { ...s, [key]: filtered };
    }));
    if (selectedActive?.spreadId === spreadId && selectedActive?.page === page && selectedActive?.imgId === imgId) {
      setSelectedActive(null);
    }
  };

  const triggerCanvasImageUpload = (spreadId: number, page: 'left' | 'right', imgId: string) => {
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
        console.error("Error resizing image:", err);
      }
    }

    if (resizedUrls.length === 0) {
      toast.error('Could not process any of the images.');
      return;
    }

    const newSpreads = [...spreads];
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

    setSpreads(newSpreads);
    toast.success(`Successfully uploaded and added ${resizedUrls.length} photos!`);
  };

  const triggerCanvasMultiUpload = (spreadId: number, page: 'left' | 'right') => {
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

    setSpreads(prev => prev.map(s => {
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
          borderColor: '#8b5cf6',
          zIndex: existingImages.length + idx + 1
        };
      });

      return {
        ...s,
        [key]: [...existingImages, ...newFrames],
        [page === 'left' ? 'leftPageType' : 'rightPageType']: 'canvas'
      };
    }));

    setCanvasMultiTarget(null);
    toast.success(`Successfully added ${resizedUrls.length} frames to this canvas!`);
  };

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, spreadId: number, page: 'left' | 'right', imgId: string) => {
    e.stopPropagation();
    setSelectedActive({ spreadId, page, imgId });
    
    const canvasElement = document.getElementById(`canvas-${spreadId}-${page}`);
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const targetSpread = spreads.find(s => s.id === spreadId);
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

  const handleStartResize = (e: React.MouseEvent | React.TouchEvent, spreadId: number, page: 'left' | 'right', imgId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasElement = document.getElementById(`canvas-${spreadId}-${page}`);
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const targetSpread = spreads.find(s => s.id === spreadId);
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

  const handleStartRotate = (e: React.MouseEvent | React.TouchEvent, spreadId: number, page: 'left' | 'right', imgId: string) => {
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

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Audio file must be under 5MB for local storage mode');
      return;
    }
    
    setAudioName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAudioUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = (type: 'cover' | 'left' | 'right', spreadId?: number) => {
    currentUploadTarget.current = { type, spreadId };
    fileInputRef.current?.click();
  };

  const addSpread = () => {
    setSpreads(prev => [...prev, { 
      id: Date.now(), 
      leftImage: '', 
      rightImage: '',
      leftPageType: 'single',
      rightPageType: 'single',
      leftCanvasImages: [],
      rightCanvasImages: []
    }]);
  };

  const removeSpread = (id: number) => {
    if (spreads.length === 1) return;
    setSpreads(prev => prev.filter(s => s.id !== id));
  };

  const moveSpread = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === spreads.length - 1)) return;
    const newSpreads = [...spreads];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSpreads[index], newSpreads[swapIndex]] = [newSpreads[swapIndex], newSpreads[index]];
    setSpreads(newSpreads);
  };

  const saveAlbum = async () => {
    setIsSaving(true);
    const finalId = albumId && !albumId.startsWith('local_') ? albumId : proposedSlug;
    
    try {
      // 1. Uniqueness validation
      const isNew = !albumId || albumId.startsWith('local_');
      if (isNew) {
        const { data: existing, error: checkError } = await supabase
          .from('albums')
          .select('id')
          .eq('id', finalId);

        if (checkError) {
          console.error("Supabase uniqueness check error details:", checkError);
        }
        if (existing && existing.length > 0) {
          toast.error("This link name is already taken, please choose another.");
          setIsSaving(false);
          return;
        }
      }

      // 2. Build complete payload
      const payload = {
        id: finalId,
        title,
        template,
        audio_url: audioUrl,
        cover_url: coverUrl,
        orientation,
        page_marking: pageMarking,
        spreads
      };

      // 3. Save directly to Supabase
      const { data, error: dbError } = await supabase
        .from('albums')
        .upsert(payload)
        .select();

      if (dbError !== null) {
        console.error("Supabase Save Error Details:", dbError);
        if (dbError.code === '23505') {
          toast.error("This link name is already taken, please choose another.");
        } else {
          toast.error("Failed to save album — please try again");
        }
        setIsSaving(false);
        return;
      }

      if (!data || data.length === 0) {
        console.error("Save completed but no data returned from database insert/upsert");
        toast.error("Failed to save album — please try again");
        setIsSaving(false);
        return;
      }

      // 4. Update local server fallback filesystem (non-blocking)
      try {
        await fetch('/album/api/albums', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (serverErr) {
        console.warn("Express server disk sync failed (Supabase save succeeded):", serverErr);
      }

      // Clear the temporary local storage version
      if (albumId && albumId.startsWith('local_')) {
        localStorage.removeItem('album_' + albumId);
      }

      setAlbumId(finalId);
      toast.success('Album saved successfully! You can now view and share it.');
    } catch (err: any) {
      console.error("Unexpected error in album save handler:", err);
      toast.error("Failed to save album — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 pt-24 md:p-8 md:pt-28">
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />
      <input type="file" ref={multiFileInputRef} className="hidden" accept="image/*" multiple onChange={handleMultiFileUpload} />
      <input type="file" ref={canvasMultiInputRef} className="hidden" accept="image/*" multiple onChange={handleCanvasMultiUpload} />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-light text-slate-900 flex items-center gap-2">
               Album Studio
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/album/preview', { state: { album: { id: albumId || proposedSlug, title, template, audio_url: audioUrl, cover_url: coverUrl, orientation, page_marking: pageMarking, spreads } } })}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <Layout className="w-4 h-4" /> Preview
            </button>
            {albumId && !albumId.startsWith('local_') && (
              <button 
                onClick={() => navigate(`/album/${albumId}`)}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" /> Share / View
              </button>
            )}
            <button 
              onClick={() => navigate(-1)}
              disabled={isSaving}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Return
            </button>
            <button 
              onClick={saveAlbum}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin text-sm">↻</span> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> 
                  {albumId && !albumId.startsWith('local_') ? 'Update Album' : 'Save Album'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Local-only save warning banner */}
        {albumId && albumId.startsWith('local_') && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <span>⚠️ <strong>This album is only saved on this device.</strong> Please retry saving online to enable sharing.</span>
            <button 
              onClick={saveAlbum}
              disabled={isSaving}
              className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors text-xs shrink-0 self-start sm:self-auto disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Retry Saving Online'}
            </button>
          </div>
        )}

        {/* Title Input */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Album Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => {
              const val = e.target.value;
              setTitle(val);
              if (!albumId || albumId.startsWith('local_')) {
                setProposedSlug(generateUniqueId(val));
              }
            }}
            className="w-full text-2xl outline-none font-medium text-slate-900 border-b-2 border-transparent focus:border-slate-200 pb-2 transition-colors"
            placeholder="E.g., Surya & Aditi's Wedding"
          />
          
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-indigo-700">
              <span className="font-semibold">Live Shareable Link:</span>{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 select-all">
                https://personalizedgiftshop.in/album/{albumId && !albumId.startsWith('local_') ? albumId : proposedSlug}
              </span>
            </div>
            <button
              onClick={() => {
                const custom = prompt("Customize your unique Album URL slug:", albumId && !albumId.startsWith('local_') ? albumId : proposedSlug);
                if (custom) {
                  const cleaned = custom
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9_-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  if (cleaned) {
                    if (albumId && !albumId.startsWith('local_')) {
                      setAlbumId(cleaned);
                    } else {
                      setProposedSlug(cleaned);
                    }
                    toast.success('Unique slug updated!');
                  }
                }
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline self-start sm:self-auto"
            >
              Customize URL
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Layout className="w-5 h-5 text-amber-500" /> Template Gallery
          </h2>
          <p className="text-slate-500 text-sm mb-6">Choose a design layout that perfectly matches your celebration's vibe.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div 
                key={t.name}
                onClick={() => setTemplate(t.name)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${template === t.name ? 'border-amber-500 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex h-20 rounded-lg overflow-hidden mb-3">
                  {t.colors.map(c => <div key={c} style={{backgroundColor: c}} className="flex-1" />)}
                </div>
                <h3 className="font-semibold text-slate-800">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audio */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-amber-500" /> Global Album Audio
            </h2>
            <p className="text-slate-500 text-sm mb-4">Select a background song that will play on loop for the entire album (optional).</p>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3 text-slate-600">
                <Music className="w-5 h-5" />
                <span className="text-sm font-medium">{audioName || 'No audio selected'}</span>
              </div>
              <button onClick={() => audioInputRef.current?.click()} className="text-amber-600 text-sm font-semibold hover:text-amber-700">
                Upload Audio
              </button>
            </div>
            {audioUrl && <audio controls src={audioUrl} className="w-full mt-4 h-10" />}
          </div>

          {/* Cover */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" /> Album Cover Photo
            </h2>
            <p className="text-slate-500 text-sm mb-4">Select a cover photo for the album (optional).</p>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3 text-slate-600">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{coverUrl ? 'Cover image added' : 'No cover photo selected'}</span>
              </div>
              <button onClick={() => triggerImageUpload('cover')} className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">
                Upload Cover
              </button>
            </div>
            {coverUrl && (
              <div className="mt-4 h-32 rounded-lg overflow-hidden border border-slate-200">
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Orientation */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-emerald-500" /> Album Orientation
            </h2>
            <p className="text-slate-500 text-sm mb-4">Choose if you want a portrait album or a landscape album.</p>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setOrientation('Landscape')}
                className={`p-4 rounded-xl border-2 cursor-pointer ${orientation === 'Landscape' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200'}`}
              >
                <div className="font-semibold text-sm">Landscape Album</div>
                <div className="text-xs text-slate-500 mt-1">Classic wide book style</div>
              </div>
              <div 
                onClick={() => setOrientation('Portrait')}
                className={`p-4 rounded-xl border-2 cursor-pointer ${orientation === 'Portrait' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200'}`}
              >
                <div className="font-semibold text-sm">Portrait Album</div>
                <div className="text-xs text-slate-500 mt-1">Vertical tall book style</div>
              </div>
            </div>
          </div>

          {/* Page Marking */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Type className="w-5 h-5 text-rose-500" /> Custom Page Marking
            </h2>
            <p className="text-slate-500 text-sm mb-4">Add a custom watermark or subtle footnote text to the bottom of each inner page.</p>
            <input 
              type="text" 
              value={pageMarking}
              onChange={e => setPageMarking(e.target.value)}
              placeholder="e.g. #SuryaAditi2026"
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm"
            />
          </div>
        </div>

        {/* Spreads Manager */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-2xl font-light text-slate-800">Pages & Spreads</h2>
              <p className="text-xs text-slate-500 mt-0.5">Mix single-image pages with free-form canvas boards</p>
            </div>
            <button
              type="button"
              onClick={triggerMultiUpload}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium flex items-center gap-2 text-xs transition-colors border border-indigo-200 shadow-sm"
            >
              <Upload className="w-4 h-4" /> Bulk Multi-Image Upload
            </button>
          </div>

          {spreads.map((spread, index) => (
            <div key={spread.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs">Spread {index + 1}</span>
                  <span className="text-[11px] text-slate-400">({(!spread.leftPageType || spread.leftPageType === 'single') && (!spread.rightPageType || spread.rightPageType === 'single') ? 'Classic Layout' : 'Canvas Rich Layout'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveSpread(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 text-xs font-bold">↑</button>
                  <button onClick={() => moveSpread(index, 'down')} disabled={index === spreads.length - 1} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 text-xs font-bold">↓</button>
                  <button onClick={() => removeSpread(spread.id)} disabled={spreads.length === 1} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg ml-2 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <PageEditor
                  spread={spread}
                  page="left"
                  triggerImageUpload={triggerImageUpload}
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
                  spreads={spreads}
                  setSpreads={setSpreads}
                />
                <PageEditor
                  spread={spread}
                  page="right"
                  triggerImageUpload={triggerImageUpload}
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
                  spreads={spreads}
                  setSpreads={setSpreads}
                />
              </div>
            </div>
          ))}

          <button 
            onClick={addSpread}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" /> Add New Spread
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
  spreads,
  setSpreads
}: {
  spread: any;
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
  spreads: any[];
  setSpreads: React.Dispatch<React.SetStateAction<any[]>>;
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {page === 'left' ? 'Left Page' : 'Right Page'}
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => {
              setSpreads(prev => prev.map(s => s.id === spread.id ? { ...s, [page === 'left' ? 'leftPageType' : 'rightPageType']: 'single' } : s));
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition-all ${(!pageType || pageType === 'single') ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
              setSpreads(prev => prev.map(s => s.id === spread.id ? { 
                ...s, 
                [page === 'left' ? 'leftPageType' : 'rightPageType']: 'canvas',
                [page === 'left' ? 'leftCanvasImages' : 'rightCanvasImages']: initializedImages
              } : s));
            }}
            className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition-all ${pageType === 'canvas' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Layout className="w-3 h-3" /> Canvas
          </button>
        </div>
      </div>

      {!isCanvas ? (
        <div 
          onClick={() => triggerImageUpload(page, spread.id)}
          className="aspect-[4/3] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden group"
        >
          {singleImage ? (
            <img src={singleImage} alt={page} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity animate-fade-in" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-500">Add Photo</span>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div 
            id={`canvas-${spread.id}-${page}`}
            className="relative aspect-[4/3] w-full bg-[#18181b] border border-slate-700 rounded-xl overflow-hidden shadow-inner select-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
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
                      zIndex: img.zIndex || 1,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActive({ spreadId: spread.id, page, imgId: img.id });
                    }}
                    onMouseDown={(e) => handleStartDrag(e, spread.id, page, img.id)}
                    onTouchStart={(e) => handleStartDrag(e, spread.id, page, img.id)}
                    className={`absolute flex items-center justify-center ${isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black z-50 animate-pulse' : 'hover:ring-1 hover:ring-white/30 cursor-grab active:cursor-grabbing'}`}
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
                      <div className="w-full h-full bg-zinc-800 border-2 border-dashed border-zinc-700 rounded flex flex-col items-center justify-center p-2 text-center text-zinc-500">
                        <ImageIcon className="w-6 h-6 mb-1 text-zinc-650" />
                        <span className="text-[10px] font-medium leading-tight">Add Photo</span>
                      </div>
                    )}

                    {isSelected && (
                      <>
                        <div 
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-violet-600 border border-white text-white rounded-full flex items-center justify-center shadow-lg cursor-alias active:scale-90 transition-transform z-50 font-bold"
                          title="Rotate frame"
                          onMouseDown={(e) => handleStartRotate(e, spread.id, page, img.id)}
                          onTouchStart={(e) => handleStartRotate(e, spread.id, page, img.id)}
                        >
                          ↻
                        </div>

                        <div 
                          className="absolute -bottom-1.5 -right-1.5 w-4.5 h-4.5 bg-violet-600 border border-white rounded-full flex items-center justify-center shadow-lg cursor-se-resize active:scale-90 transition-transform z-50"
                          title="Resize frame"
                          onMouseDown={(e) => handleStartResize(e, spread.id, page, img.id)}
                          onTouchStart={(e) => handleStartResize(e, spread.id, page, img.id)}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>

                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-50">
                          X:{img.x}% Y:{img.y}% ({img.width}x{img.height})
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500 text-xs">
                <span className="mb-2">Canvas is empty</span>
                <button 
                  type="button" 
                  onClick={() => addCanvasImage(spread.id, page)} 
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg text-xs"
                >
                  + Add Frame
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center border-t border-slate-100 pt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addCanvasImage(spread.id, page)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Frame
              </button>
              <button
                type="button"
                onClick={() => triggerCanvasMultiUpload(spread.id, page)}
                className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold rounded-lg text-xs flex items-center gap-1 border border-violet-100"
                title="Upload multiple pictures straight onto this canvas!"
              >
                <Upload className="w-3 h-3" /> Multi-Add
              </button>
            </div>
            
            {activeImg && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => triggerCanvasImageUpload(spread.id, page, activeImg.id)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs"
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
                  className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
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
                  className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                  title="Send to Back"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => removeCanvasImage(spread.id, page, activeImg.id)}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-xs"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {activeImg && (
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4 text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-200/55 pb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-violet-500" /> Frame Customizer
                </span>
                <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-mono font-bold">
                  ID: {activeImg.id.slice(-5)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Width ({activeImg.width}%)</span>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={activeImg.width} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { width: parseInt(e.target.value) })}
                    className="w-full accent-violet-650 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Height ({activeImg.height}%)</span>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={activeImg.height} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { height: parseInt(e.target.value) })}
                    className="w-full accent-violet-650 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Rotation ({activeImg.rotation || 0}°)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={activeImg.rotation || 0} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { rotation: parseInt(e.target.value) })}
                    className="w-full accent-violet-650 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">X Coord ({activeImg.x}%)</span>
                  <input 
                    type="range" 
                    min="0" 
                    max={100 - activeImg.width} 
                    value={activeImg.x} 
                    onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { x: parseInt(e.target.value) })}
                    className="w-full accent-violet-650 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200/55 pt-3 space-y-3 font-sans">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="space-y-1 flex-1">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Palette className="w-3 h-3 text-indigo-500" /> Border Style
                    </span>
                    <select
                      value={activeImg.borderType || 'none'}
                      onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { borderType: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded-lg outline-none text-xs text-slate-700"
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
                      <span className="text-slate-500 font-medium">Border Width ({activeImg.borderWidth || 2}px)</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="25" 
                        value={activeImg.borderWidth || 2} 
                        onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { borderWidth: parseInt(e.target.value) })}
                        className="w-full accent-indigo-650 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>
                  )}
                </div>

                {activeImg.borderType !== 'none' && (
                  <div className="space-y-1.5">
                    <span className="text-slate-500 font-medium">Border Color</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {['#d97706', '#94a3b8', '#e11d48', '#8b5cf6', '#059669', '#ffffff', '#000000'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateCanvasImage(spread.id, page, activeImg.id, { borderColor: color })}
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-white text-[9px] font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {activeImg.borderColor === color && '✓'}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 border border-slate-200 rounded p-0.5 bg-white">
                        <input 
                          type="color" 
                          value={activeImg.borderColor || '#000000'}
                          onChange={(e) => updateCanvasImage(spread.id, page, activeImg.id, { borderColor: e.target.value })}
                          className="w-5 h-5 cursor-pointer rounded border-0 p-0 overflow-hidden" 
                        />
                        <span className="text-[10px] font-mono pr-1 text-slate-500 uppercase">{activeImg.borderColor || '#000000'}</span>
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
