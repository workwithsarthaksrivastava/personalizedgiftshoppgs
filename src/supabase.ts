import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  const msg = 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables (Secrets panel in AI Studio or Environment Variables in Vercel).';
  console.error(msg);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export function serializeAlbumForSupabase(album: any): any {
  // Extract only the database columns
  const dbPayload: any = {
    id: album.id,
    title: album.title || album.client_name || album.name || 'My Celebration Album',
    template: album.template || 'Classic Royal',
    audio_url: album.audio_url || '',
    cover_url: album.cover_url || '',
    orientation: album.orientation || 'Landscape',
    spreads: album.spreads || [],
    created_at: album.created_at || new Date().toISOString()
  };

  // Package all extra fields into page_marking
  const metadata = {
    name: album.name || album.title,
    title: album.title || album.name,
    audio_name: album.audio_name,
    back_cover_url: album.back_cover_url,
    inner_front_url: album.inner_front_url,
    inner_back_url: album.inner_back_url,
    combined_inner_url: album.combined_inner_url,
    is_combined_inner: album.is_combined_inner,
    client_name: album.client_name || album.name || album.title,
    function_name: album.function_name || 'Wedding',
    function_date: album.function_date || new Date().toISOString().split('T')[0],
    view_lock_pin: album.view_lock_pin || '',
    is_public: album.is_public !== undefined ? album.is_public : true,
    status: album.status || 'Published',
    job_number: album.job_number || '',
    studio_name: album.studio_name || '',
    photographer_name: album.photographer_name || '',
    mobile_number: album.mobile_number || '',
    views_count: Number(album.views_count) || 0,
    likes_count: Number(album.likes_count) || 0,
    comments: Array.isArray(album.comments) ? album.comments : [],
    image_urls: Array.isArray(album.image_urls) ? album.image_urls : []
  };

  const pageMarkingObj = {
    user_page_marking: album.page_marking || '',
    metadata
  };

  return {
    ...dbPayload,
    page_marking: JSON.stringify(pageMarkingObj)
  };
}

export function deserializeAlbumFromSupabase(dbAlbum: any): any {
  if (!dbAlbum) return dbAlbum;

  let page_marking = dbAlbum.page_marking || '';
  let extraMetadata: any = {};

  if (typeof page_marking === 'string' && (page_marking.startsWith('{') || page_marking.startsWith('['))) {
    try {
      const parsed = JSON.parse(page_marking);
      if (parsed && typeof parsed === 'object') {
        page_marking = parsed.user_page_marking || '';
        if (parsed.metadata) {
          extraMetadata = parsed.metadata;
        }
      }
    } catch (e) {
      // Not JSON or parse failed, keep page_marking as raw text
    }
  }

  // 1. Resolve Title and Client Name (supporting legacy 'name' column)
  const title = dbAlbum.title || dbAlbum.name || extraMetadata.title || extraMetadata.name || 'My Celebration Album';
  const clientName = extraMetadata.client_name || dbAlbum.client_name || dbAlbum.name || dbAlbum.title || 'Valued Client';

  // 2. Resolve Template name normalization
  let template = dbAlbum.template || extraMetadata.template || 'Classic Royal';
  if (template.toLowerCase().includes('classic')) template = 'Classic Royal';
  else if (template.toLowerCase().includes('floral')) template = 'Vibrant Floral';
  else if (template.toLowerCase().includes('minimal')) template = 'Minimalist Elegance';
  else if (template.toLowerCase().includes('sepia')) template = 'Vintage Sepia';
  else if (template.toLowerCase().includes('slate')) template = 'Modern Slate';
  else if (template.toLowerCase().includes('midnight')) template = 'Midnight Black';

  // 3. Resolve Orientation normalization
  let orientation = dbAlbum.orientation || extraMetadata.orientation || 'Landscape';
  if (orientation.toLowerCase() === 'portrait') orientation = 'Portrait';
  else if (orientation.toLowerCase() === 'square') orientation = 'Square';
  else orientation = 'Landscape';

  // 4. Resolve Spreads with full legacy fallback for 'image_urls' / string arrays
  let rawSpreads = dbAlbum.spreads || extraMetadata.spreads;
  if (typeof rawSpreads === 'string') {
    try {
      rawSpreads = JSON.parse(rawSpreads);
    } catch (e) {
      rawSpreads = [];
    }
  }

  let finalSpreads: any[] = [];
  if (Array.isArray(rawSpreads) && rawSpreads.length > 0) {
    if (typeof rawSpreads[0] === 'string') {
      // Array of raw image URL strings -> convert pairs to spread objects
      for (let i = 0; i < rawSpreads.length; i += 2) {
        finalSpreads.push({
          id: Math.floor(i / 2) + 1,
          leftImage: rawSpreads[i] || '',
          rightImage: rawSpreads[i + 1] || '',
          leftPageType: 'single',
          rightPageType: 'single',
          leftCanvasImages: [],
          rightCanvasImages: []
        });
      }
    } else {
      // Structured spread objects
      finalSpreads = rawSpreads.map((s: any, idx: number) => ({
        id: s.id || idx + 1,
        leftImage: s.leftImage || s.left_image || s.url || '',
        rightImage: s.rightImage || s.right_image || '',
        leftPageType: s.leftPageType || 'single',
        rightPageType: s.rightPageType || 'single',
        leftCanvasImages: Array.isArray(s.leftCanvasImages) ? s.leftCanvasImages : [],
        rightCanvasImages: Array.isArray(s.rightCanvasImages) ? s.rightCanvasImages : []
      }));
    }
  } else {
    // If spreads is empty, check for legacy 'image_urls' or 'images' array
    const legacyImages = Array.isArray(dbAlbum.image_urls) 
      ? dbAlbum.image_urls 
      : (Array.isArray(extraMetadata.image_urls) ? extraMetadata.image_urls : (Array.isArray(dbAlbum.images) ? dbAlbum.images : []));

    if (legacyImages.length > 0) {
      for (let i = 0; i < legacyImages.length; i += 2) {
        finalSpreads.push({
          id: Math.floor(i / 2) + 1,
          leftImage: typeof legacyImages[i] === 'string' ? legacyImages[i] : (legacyImages[i]?.url || ''),
          rightImage: typeof legacyImages[i + 1] === 'string' ? legacyImages[i + 1] : (legacyImages[i + 1]?.url || ''),
          leftPageType: 'single',
          rightPageType: 'single',
          leftCanvasImages: [],
          rightCanvasImages: []
        });
      }
    } else {
      finalSpreads = [{
        id: 1,
        leftImage: '',
        rightImage: '',
        leftPageType: 'single',
        rightPageType: 'single',
        leftCanvasImages: [],
        rightCanvasImages: []
      }];
    }
  }

  // 5. Resolve Cover & Media URLs
  const coverUrl = dbAlbum.cover_url || extraMetadata.cover_url || dbAlbum.qr_code_url || (finalSpreads[0]?.leftImage || '') || '';

  return {
    ...dbAlbum,
    ...extraMetadata,
    id: String(dbAlbum.id || extraMetadata.id || ''),
    title,
    client_name: clientName,
    function_name: extraMetadata.function_name || dbAlbum.function_name || 'Wedding',
    function_date: extraMetadata.function_date || dbAlbum.function_date || (dbAlbum.created_at ? new Date(dbAlbum.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    template,
    orientation,
    audio_url: dbAlbum.audio_url || extraMetadata.audio_url || '',
    audio_name: extraMetadata.audio_name || dbAlbum.audio_name || '',
    cover_url: coverUrl,
    back_cover_url: extraMetadata.back_cover_url || dbAlbum.back_cover_url || '',
    inner_front_url: extraMetadata.inner_front_url || dbAlbum.inner_front_url || '',
    inner_back_url: extraMetadata.inner_back_url || dbAlbum.inner_back_url || '',
    combined_inner_url: extraMetadata.combined_inner_url || dbAlbum.combined_inner_url || '',
    is_combined_inner: Boolean(extraMetadata.is_combined_inner ?? dbAlbum.is_combined_inner ?? false),
    spreads: finalSpreads,
    page_marking,
    views_count: Number(extraMetadata.views_count ?? dbAlbum.views_count ?? 0) || 0,
    likes_count: Number(extraMetadata.likes_count ?? dbAlbum.likes_count ?? 0) || 0,
    comments: Array.isArray(extraMetadata.comments) ? extraMetadata.comments : (Array.isArray(dbAlbum.comments) ? dbAlbum.comments : []),
    view_lock_pin: extraMetadata.view_lock_pin || dbAlbum.view_lock_pin || '',
    is_public: extraMetadata.is_public !== undefined ? extraMetadata.is_public : (dbAlbum.is_public !== undefined ? dbAlbum.is_public : true),
    status: extraMetadata.status || dbAlbum.status || 'Published',
    job_number: extraMetadata.job_number || dbAlbum.job_number || '',
    studio_name: extraMetadata.studio_name || dbAlbum.studio_name || '',
    photographer_name: extraMetadata.photographer_name || dbAlbum.photographer_name || '',
    mobile_number: extraMetadata.mobile_number || dbAlbum.mobile_number || '',
    created_at: dbAlbum.created_at || extraMetadata.created_at || new Date().toISOString()
  };
}
