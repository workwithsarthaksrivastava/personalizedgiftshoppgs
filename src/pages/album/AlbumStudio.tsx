import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, serializeAlbumForSupabase, deserializeAlbumFromSupabase } from '../../supabase';
import { 
  fetchAlbumsFromR2, 
  saveAlbumToR2, 
  deleteAlbumFromR2, 
  sanitizeAndUploadAlbumAssetsToR2 
} from '../../lib/r2Storage';
import { toast } from 'sonner';
import { Album, Spread } from '../../types/album';

// Modular Components
import DashboardSidebar from '../../components/DashboardSidebar';
import DashboardHeader from '../../components/DashboardHeader';
import MyAlbumsTab from '../../components/MyAlbumsTab';
import CreateAlbumTab from '../../components/CreateAlbumTab';
import { 
  DashboardOverviewTab, 
  MusicTab, 
  NotificationsTab, 
  SettingsTab,
  FeedbackTab,
  SupportTab
} from '../../components/DashboardTabs';

// Live user albums database and dynamic creator

const initialBlankAlbum = (): Album => ({
  id: '',
  title: 'My Celebration Album',
  client_name: '',
  function_name: 'Wedding',
  function_date: new Date().toISOString().split('T')[0],
  audio_url: '',
  audio_name: '',
  cover_url: '',
  back_cover_url: '',
  inner_front_url: '',
  inner_back_url: '',
  combined_inner_url: '',
  is_combined_inner: false,
  orientation: 'Landscape',
  page_marking: '',
  template: 'Classic Royal',
  spreads: [
    {
      id: 1,
      leftImage: '',
      rightImage: '',
      leftPageType: 'single',
      rightPageType: 'single',
      leftCanvasImages: [],
      rightCanvasImages: []
    }
  ]
});

export default function AlbumStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return sessionStorage.getItem('studio_active_tab') || 'my-albums';
  });
  const [isSaving, setIsSaving] = useState(false);

  // Database of albums in state
  const [albums, setAlbums] = useState<Album[]>([]);
  // The active album that is loaded in the editor
  const [activeAlbum, setActiveAlbum] = useState<Album>(() => {
    const saved = sessionStorage.getItem('studio_active_album');
    return saved ? JSON.parse(saved) : initialBlankAlbum();
  });

  // Keep sessionStorage in sync with activeTab and activeAlbum
  useEffect(() => {
    sessionStorage.setItem('studio_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('studio_active_album', JSON.stringify(activeAlbum));
  }, [activeAlbum]);

  // Fetch albums from Cloudflare R2 / Server storage with Supabase & local fallback
  const loadAlbums = async () => {
    try {
      // 1. Fetch from Cloudflare R2 database
      const r2Albums = await fetchAlbumsFromR2();

      // 2. Also read any local storage fallbacks
      const localAlbums: Album[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('album_local_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) localAlbums.push(JSON.parse(raw));
          } catch (e) {
            console.error(e);
          }
        }
      }

      // 3. Fallback to Supabase if R2 is empty
      let supabaseList: Album[] = [];
      if (r2Albums.length === 0) {
        try {
          const { data } = await supabase.from('albums').select('*');
          if (data && Array.isArray(data)) {
            supabaseList = data.map(deserializeAlbumFromSupabase);
          }
        } catch (e) {
          console.warn("Supabase fetch fallback skipped:", e);
        }
      }

      // Combine unique albums by ID
      const albumMap = new Map<string, Album>();
      for (const alb of [...r2Albums, ...supabaseList, ...localAlbums]) {
        if (alb && alb.id) {
          albumMap.set(String(alb.id), alb);
        }
      }

      const combined = Array.from(albumMap.values());
      combined.sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      });

      setAlbums(combined);
    } catch (err) {
      console.error("Error in loadAlbums:", err);
      setAlbums([]);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  // Action: Create New Album
  const handleInitiateCreate = () => {
    setActiveAlbum(initialBlankAlbum());
    setActiveTab('create-album');
  };

  // Action: Edit Existing Album
  const handleEditAlbum = (album: Album) => {
    setActiveAlbum({ ...album });
    setActiveTab('create-album');
    toast.success(`Loaded "${album.client_name || album.title}" inside editor!`);
  };

  // Action: Delete Album
  const handleDeleteAlbum = async (id: string) => {
    try {
      // 1. Delete from Cloudflare R2 / Server storage
      await deleteAlbumFromR2(id);

      // 2. Delete from Supabase if connected
      if (!id.startsWith('local_')) {
        try {
          await supabase.from('albums').delete().eq('id', id);
        } catch (err) {
          console.warn("Supabase delete skipped:", err);
        }
      } else {
        localStorage.removeItem('album_' + id);
      }

      setAlbums(prev => prev.filter(a => a.id !== id));
      toast.success('Album deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete album.');
    }
  };

  // Action: Toggle Access (Public vs Private)
  const handleTogglePublic = async (id: string) => {
    const album = albums.find(a => a.id === id);
    if (!album) return;

    const updatedPublic = album.is_public === false; // toggle
    const updatedAlbum = { ...album, is_public: updatedPublic };
    
    // Update local state
    setAlbums(prev => prev.map(a => a.id === id ? updatedAlbum : a));

    try {
      // Save to Cloudflare R2
      await saveAlbumToR2(updatedAlbum);

      // Supabase backup
      if (!id.startsWith('local_')) {
        const serialized = serializeAlbumForSupabase(updatedAlbum);
        await supabase.from('albums').update({ page_marking: serialized.page_marking }).eq('id', id);
      } else {
        localStorage.setItem('album_' + id, JSON.stringify(updatedAlbum));
      }
      toast.success(`Album is now ${updatedPublic ? 'Publicly shareable' : 'Private'}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Toggle Lock status
  const handleToggleLock = async (id: string) => {
    const album = albums.find(a => a.id === id);
    if (!album) return;

    let updatedPin = '';
    if (!album.view_lock_pin) {
      // Prompt or generate PIN
      const pin = prompt('Set a 4 to 6-digit PIN code to secure this album:', '1234');
      if (pin === null) return;
      if (!pin.trim()) {
        toast.error('PIN cannot be empty!');
        return;
      }
      updatedPin = pin.trim();
    }

    const updatedAlbum = { ...album, view_lock_pin: updatedPin };
    setAlbums(prev => prev.map(a => a.id === id ? updatedAlbum : a));

    try {
      // Save to Cloudflare R2
      await saveAlbumToR2(updatedAlbum);

      // Supabase backup
      if (!id.startsWith('local_')) {
        const serialized = serializeAlbumForSupabase(updatedAlbum);
        await supabase.from('albums').update({ page_marking: serialized.page_marking }).eq('id', id);
      } else {
        localStorage.setItem('album_' + id, JSON.stringify(updatedAlbum));
      }
      toast.success(updatedPin ? `🔐 Album password protection set (PIN: ${updatedPin})` : '🔓 Album unlocked');
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Save active album
  const handleSaveActiveAlbum = async () => {
    if (!activeAlbum.client_name?.trim()) {
      toast.error('Please specify a client name before publishing!');
      return;
    }

    setIsSaving(true);

    // Create custom url slug
    const cleanedSlug = activeAlbum.client_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const finalId = activeAlbum.id ? activeAlbum.id : `${cleanedSlug}-${randomCode}`;

    const newAlbumPayload: Album = {
      ...activeAlbum,
      id: finalId,
      title: `${activeAlbum.client_name}'s Premium Flipbook`,
      status: 'Published',
      job_number: activeAlbum.job_number || `PJ-${Math.floor(10000 + Math.random() * 90000)}`,
      created_at: activeAlbum.created_at || new Date().toISOString()
    };

    try {
      // 1. Upload any base64 images directly to Cloudflare R2
      toast.info('Publishing to Cloudflare R2 database...');
      const uploadedAlbum = await sanitizeAndUploadAlbumAssetsToR2(newAlbumPayload);

      // 2. Save complete album document to Cloudflare R2 database
      const savedResult = await saveAlbumToR2(uploadedAlbum);
      console.log("[Cloudflare R2 Database] Successfully published album:", savedResult.id);
      toast.success('✨ Album published to Cloudflare R2 database!');

      // 3. Optional background sync with Supabase for legacy mirroring
      try {
        const dbPayload = serializeAlbumForSupabase(uploadedAlbum);
        await supabase.from('albums').upsert(dbPayload);
      } catch (dbErr) {
        console.warn("Optional Supabase sync skipped:", dbErr);
      }

      await loadAlbums();
      setActiveTab('my-albums');
      setActiveAlbum(initialBlankAlbum());
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(`Error saving album: ${err.message || 'Please check connection'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Open Preview Page
  const handleOpenPreview = () => {
    navigate('/album/preview', { state: { album: activeAlbum } });
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans select-none">
      
      {/* 1. Left Sidebar Navigation */}
      <DashboardSidebar 
        activeTab={activeTab === 'feedback' || activeTab === 'support' ? 'my-albums' : activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'create-album') {
            handleInitiateCreate();
          } else {
            setActiveTab(tab);
          }
        }} 
        onLogout={() => {
          toast.success('Goodbye Rajesh Kumar!');
          navigate('/');
        }}
      />

      {/* 2. Main Portal Container */}
      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden bg-[#0c0c0e]">
        
        {/* Header toolbar */}
        <DashboardHeader 
          onBack={activeTab !== 'my-albums' ? () => setActiveTab('my-albums') : undefined} 
          activeTab={activeTab}
        />

        {/* Dynamic Inner views scroll panel */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 relative z-10">
          {activeTab === 'dashboard' && (
            <DashboardOverviewTab 
              onNavigateTab={(tab) => {
                if (tab === 'create-album') handleInitiateCreate();
                else setActiveTab(tab);
              }}
              totalAlbums={albums.length}
            />
          )}

          {activeTab === 'my-albums' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-wide">My Created Albums</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Browse and manage all published client books and QR stamps</p>
                </div>
                <button
                  onClick={handleInitiateCreate}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
                >
                  Create New Album +
                </button>
              </div>

              <MyAlbumsTab 
                albums={albums}
                onEditAlbum={handleEditAlbum}
                onDeleteAlbum={handleDeleteAlbum}
                onTogglePublic={handleTogglePublic}
                onToggleLock={handleToggleLock}
                onRefresh={loadAlbums}
              />
            </div>
          )}

          {activeTab === 'create-album' && (
            <CreateAlbumTab 
              album={activeAlbum}
              setAlbum={setActiveAlbum}
              onSave={handleSaveActiveAlbum}
              onPreview={handleOpenPreview}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'music' && (
            <MusicTab />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab />
          )}

          {activeTab === 'settings' && (
            <SettingsTab />
          )}

          {activeTab === 'feedback' && (
            <FeedbackTab />
          )}

          {activeTab === 'support' && (
            <SupportTab />
          )}
        </div>
      </div>
    </div>
  );
}
