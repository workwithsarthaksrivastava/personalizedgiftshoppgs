import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, ArrowLeft, Image as ImageIcon, Music, Layout, Save, QrCode, Type, Settings } from 'lucide-react';
import { supabase } from '../../supabase';
import { toast } from 'sonner';

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
    { id: 1, leftImage: '', rightImage: '' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const currentUploadTarget = useRef<{type: 'cover' | 'left' | 'right', spreadId?: number} | null>(null);

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
      }
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // We can try base64 for audio but it might be large. Let's limit size.
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
    setSpreads(prev => [...prev, { id: Date.now(), leftImage: '', rightImage: '' }]);
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
    const finalId = albumId || proposedSlug;
    try {
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

      const res = await fetch('/album/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save album on server');
      }

      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        const savedAlbum = responseData.data;
        setAlbumId(savedAlbum.id);
        toast.success('Album saved successfully! You can now view and share it.');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback to local storage in browser
      const localId = albumId && albumId.startsWith('local_') ? albumId : 'local_' + Date.now();
      const payload = {
        id: localId,
        title,
        template,
        audio_url: audioUrl,
        cover_url: coverUrl,
        orientation,
        page_marking: pageMarking,
        spreads
      };
      localStorage.setItem('album_' + localId, JSON.stringify(payload));
      setAlbumId(localId);
      toast.success('Saved locally in browser (Server offline)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 pt-24 md:p-8 md:pt-28">
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />

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
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <Layout className="w-4 h-4" /> Preview
            </button>
            {albumId && (
              <button 
                onClick={() => navigate(`/album/${albumId}`)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors"
              >
                <QrCode className="w-4 h-4" /> Share / View
              </button>
            )}
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return
            </button>
            <button 
              onClick={saveAlbum}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              {isSaving ? <span className="animate-spin text-xl">↻</span> : <Save className="w-4 h-4" />} 
              {albumId ? 'Update Album' : 'Save Album'}
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Album Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => {
              const val = e.target.value;
              setTitle(val);
              if (!albumId) {
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
                https://personalizedgiftshop.in/album/{albumId || proposedSlug}
              </span>
            </div>
            <button
              onClick={() => {
                const custom = prompt("Customize your unique Album URL slug:", albumId || proposedSlug);
                if (custom) {
                  const cleaned = custom
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9_-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  if (cleaned) {
                    if (albumId) {
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
          <h2 className="text-2xl font-light">Pages & Spreads</h2>
          {spreads.map((spread, index) => (
            <div key={spread.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Spread {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveSpread(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30">↑</button>
                  <button onClick={() => moveSpread(index, 'down')} disabled={index === spreads.length - 1} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30">↓</button>
                  <button onClick={() => removeSpread(spread.id)} disabled={spreads.length === 1} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg ml-2 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Page */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Left Page</span>
                  </div>
                  <div 
                    onClick={() => triggerImageUpload('left', spread.id)}
                    className="aspect-[4/3] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden group"
                  >
                    {spread.leftImage ? (
                      <img src={spread.leftImage} alt="Left" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-500">Add Photo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Page */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Right Page</span>
                  </div>
                  <div 
                    onClick={() => triggerImageUpload('right', spread.id)}
                    className="aspect-[4/3] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden group"
                  >
                    {spread.rightImage ? (
                      <img src={spread.rightImage} alt="Right" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-500">Add Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addSpread}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" /> Add New Spread
          </button>
        </div>
      </div>
    </div>
  );
}
