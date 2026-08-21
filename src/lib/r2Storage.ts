import { Album } from '../types/album';

/**
 * Uploads a File directly to Cloudflare R2 storage via the backend API.
 */
export async function uploadFileToR2(file: File, albumId: string = 'general'): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('albumId', albumId);
  formData.append('filename', file.name);

  const res = await fetch('/api/r2-upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let errMessage = res.statusText;
    try {
      const errData = await res.json();
      errMessage = errData.message || errMessage;
    } catch (e) {
      errMessage = await res.text();
    }

    if (errMessage.includes('NOT_FOUND') || errMessage.includes('The page could not be found')) {
      throw new Error(`Cloudflare R2 Account ID is incorrect. Please ensure you only entered the Account ID (e.g. 1a2b3c...), not a full URL or bucket name.`);
    }

    throw new Error(`Cloudflare R2 Upload failed: ${errMessage}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to upload to Cloudflare R2');
  }

  return { url: data.url, key: data.key };
}

/**
 * Uploads a base64 DataURL (image or audio) to Cloudflare R2 storage.
 */
export async function uploadBase64ToR2(
  dataUrl: string,
  albumId: string = 'general',
  filename?: string
): Promise<{ url: string; key: string }> {
  // If it's already a hosted URL (not base64), return as is
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return { url: dataUrl, key: '' };
  }

  const generatedName = filename || `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

  const res = await fetch('/api/r2-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataUrl,
      albumId,
      filename: generatedName
    })
  });

  if (!res.ok) {
    let errMessage = res.statusText;
    try {
      const errData = await res.json();
      errMessage = errData.message || errMessage;
    } catch (e) {
      errMessage = await res.text();
    }
    
    // Check for common Cloudflare 404 / malformed endpoint errors
    if (errMessage.includes('NOT_FOUND') || errMessage.includes('The page could not be found')) {
      throw new Error(`Cloudflare R2 Account ID is incorrect. Please ensure you only entered the Account ID (e.g. 1a2b3c...), not a full URL or bucket name.`);
    }

    throw new Error(`Failed to upload to Cloudflare R2: ${errMessage}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Upload failed');
  }

  return { url: data.url, key: data.key };
}

/**
 * Recursively converts any inline base64 images inside an album to Cloudflare R2 hosted URLs.
 */
export async function sanitizeAndUploadAlbumAssetsToR2(
  album: Album,
  onProgress?: (msg: string) => void
): Promise<Album> {
  const albumId = album.id || `album_${Date.now()}`;
  const sanitized: Album = JSON.parse(JSON.stringify(album));

  // 1. Cover images
  if (sanitized.cover_url?.startsWith('data:')) {
    onProgress?.('Uploading Front Cover to Cloudflare R2...');
    const { url } = await uploadBase64ToR2(sanitized.cover_url, albumId, 'cover.jpg');
    sanitized.cover_url = url;
  }

  if (sanitized.back_cover_url?.startsWith('data:')) {
    onProgress?.('Uploading Back Cover to Cloudflare R2...');
    const { url } = await uploadBase64ToR2(sanitized.back_cover_url, albumId, 'back_cover.jpg');
    sanitized.back_cover_url = url;
  }

  if (sanitized.inner_front_url?.startsWith('data:')) {
    onProgress?.('Uploading Inner Front to Cloudflare R2...');
    const { url } = await uploadBase64ToR2(sanitized.inner_front_url, albumId, 'inner_front.jpg');
    sanitized.inner_front_url = url;
  }

  if (sanitized.inner_back_url?.startsWith('data:')) {
    onProgress?.('Uploading Inner Back to Cloudflare R2...');
    const { url } = await uploadBase64ToR2(sanitized.inner_back_url, albumId, 'inner_back.jpg');
    sanitized.inner_back_url = url;
  }

  if (sanitized.combined_inner_url?.startsWith('data:')) {
    onProgress?.('Uploading Combined Inner to Cloudflare R2...');
    const { url } = await uploadBase64ToR2(sanitized.combined_inner_url, albumId, 'combined_inner.jpg');
    sanitized.combined_inner_url = url;
  }

  if (sanitized.audio_url?.startsWith('data:')) {
    onProgress?.('Uploading Audio track to Cloudflare R2...');
    const { url } = await uploadBase64ToR2(sanitized.audio_url, albumId, 'theme_audio.mp3');
    sanitized.audio_url = url;
  }

  // 2. Spreads images
  if (Array.isArray(sanitized.spreads)) {
    for (let i = 0; i < sanitized.spreads.length; i++) {
      const spread = sanitized.spreads[i];
      if (spread.leftImage?.startsWith('data:')) {
        onProgress?.(`Uploading Spread ${i + 1} Left page to Cloudflare R2...`);
        const { url } = await uploadBase64ToR2(spread.leftImage, albumId, `spread_${i + 1}_left.jpg`);
        spread.leftImage = url;
      }
      if (spread.rightImage?.startsWith('data:')) {
        onProgress?.(`Uploading Spread ${i + 1} Right page to Cloudflare R2...`);
        const { url } = await uploadBase64ToR2(spread.rightImage, albumId, `spread_${i + 1}_right.jpg`);
        spread.rightImage = url;
      }
      if (Array.isArray(spread.leftCanvasImages)) {
        for (let c = 0; c < spread.leftCanvasImages.length; c++) {
          const cImg = spread.leftCanvasImages[c];
          if (cImg.url?.startsWith('data:')) {
            const { url } = await uploadBase64ToR2(cImg.url, albumId, `spread_${i + 1}_l_canvas_${c + 1}.jpg`);
            cImg.url = url;
          }
        }
      }
      if (Array.isArray(spread.rightCanvasImages)) {
        for (let c = 0; c < spread.rightCanvasImages.length; c++) {
          const cImg = spread.rightCanvasImages[c];
          if (cImg.url?.startsWith('data:')) {
            const { url } = await uploadBase64ToR2(cImg.url, albumId, `spread_${i + 1}_r_canvas_${c + 1}.jpg`);
            cImg.url = url;
          }
        }
      }
    }
  }

  return sanitized;
}

/**
 * Fetch all albums from Cloudflare R2 / Server storage.
 */
export async function fetchAlbumsFromR2(): Promise<Album[]> {
  try {
    const res = await fetch('/api/albums');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Error fetching albums from Cloudflare R2:", err);
    return [];
  }
}

/**
 * Fetch single album from Cloudflare R2 / Server storage.
 */
export async function fetchAlbumByIdFromR2(id: string): Promise<Album | null> {
  try {
    const res = await fetch(`/api/albums/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.error(`Error fetching album ${id}:`, err);
    return null;
  }
}

/**
 * Save album to Cloudflare R2 / Server storage.
 */
export async function saveAlbumToR2(album: Album): Promise<Album> {
  const res = await fetch('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(album)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save album to Cloudflare R2: ${errText || res.statusText}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to save album');
  }

  return data.data;
}

/**
 * Delete album from Cloudflare R2 / Server storage.
 */
export async function deleteAlbumFromR2(id: string): Promise<boolean> {
  const res = await fetch(`/api/albums/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return res.ok;
}

/**
 * Toggle like for an album on Cloudflare R2 / Server storage.
 */
export async function likeAlbumOnR2(id: string, action: 'like' | 'unlike'): Promise<number> {
  const res = await fetch(`/api/albums/${encodeURIComponent(id)}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to update likes');
  const data = await res.json();
  return data.likes_count ?? 0;
}

/**
 * Add a comment to an album on Cloudflare R2 / Server storage.
 */
export async function commentAlbumOnR2(id: string, comment: string): Promise<string[]> {
  const res = await fetch(`/api/albums/${encodeURIComponent(id)}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment })
  });
  if (!res.ok) throw new Error('Failed to add comment');
  const data = await res.json();
  return data.comments || [];
}
