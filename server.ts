import express from "express";
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ override: true });
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { readPsd } from "ag-psd";
import { createCanvas } from "@napi-rs/canvas";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

let ai: GoogleGenAI | null = null;
const getAiClient = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. AI Recommendation fallback will be used.");
      return null;
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
};

function serializeAlbumForSupabase(album: any): any {
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

function deserializeAlbumFromSupabase(dbAlbum: any): any {
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
      // Not JSON or parse failed
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Support running under a subdirectory proxy (e.g. /album/* mapped to this container)
  // Rewrite incoming /album/api/* to /api/* so internal routes match correctly
  app.use((req, res, next) => {
    if (req.url.startsWith('/album/api/')) {
      req.url = req.url.replace('/album/api/', '/api/');
    }
    next();
  });

  // Helper inside startServer to init supabase client
  const getSupabaseClient = () => {
    const url = (process.env.VITE_SUPABASE_URL || "").trim();
    const key = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    if (!url || !key || url.includes("placeholder")) {
      return null;
    }
    return createClient(url, key);
  };

  // State to track last executed database keep-alive check
  let lastCheckedTime = 0;
  const STATUS_CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // Check every 12 hours

  const runDatabaseKeepAliveCheck = async () => {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.log("[Keep-Alive] Supabase client is not configured yet. Skipping search / insert keep-alive.");
      return;
    }

    try {
      console.log("[Keep-Alive] Starting database activity keep-alive check...");

      // 1. Check if the marker product exists
      const { data: markerData, error: markerError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('name', '_SYSTEM_LAST_PING_')
        .eq('category', '_SUBSECTION_')
        .limit(1);

      if (markerError) {
        console.error("[Keep-Alive] Error querying marker product:", markerError.message);
        return;
      }

      const now = Date.now();
      const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
      let shouldPing = false;
      let markerId: string | null = null;

      if (!markerData || markerData.length === 0) {
        console.log("[Keep-Alive] No marker product found. Preparing to establish marker and run demo activity.");
        shouldPing = true;
      } else {
        const marker = markerData[0];
        markerId = marker.id;
        
        // Parse the last_ping timestamp
        let lastPing = 0;
        try {
          const configParts = (marker.description || '').split('___CONFIG___');
          if (configParts.length > 1) {
            const config = JSON.parse(configParts[1]);
            lastPing = Number(config.last_ping) || 0;
          }
        } catch (e) {
          console.error("[Keep-Alive] Error parsing last_ping from description config:", e);
        }

        const elapsed = now - lastPing;
        console.log(`[Keep-Alive] Last ping occurred ${Math.round(elapsed / (1000 * 60 * 60))} hours ago.`);

        if (elapsed >= sixDaysMs) {
          console.log("[Keep-Alive] More than 6 days have passed since last write. Running active keep-alive write...");
          shouldPing = true;
        } else {
          console.log("[Keep-Alive] Database activity is fresh. Next check scheduled in approximately " + 
            ((sixDaysMs - elapsed) / (1000 * 60 * 60 * 24)).toFixed(1) + " days.");
        }
      }

      if (shouldPing) {
        // A. Update or Create the Keep-Alive marker with the new timestamp so other server instances don't double-trigger
        const updatedConfig = `___CONFIG___${JSON.stringify({ parent_category: '_SYSTEM_INTERNAL_', last_ping: now })}`;
        
        if (markerId) {
          const { error: updateError } = await supabaseClient
            .from('products')
            .update({ description: updatedConfig })
            .eq('id', markerId);
          if (updateError) {
            console.error("[Keep-Alive] Failed to update marker timestamp:", updateError.message);
            return;
          }
        } else {
          const { data: newMarker, error: createError } = await supabaseClient
            .from('products')
            .insert([{
              name: '_SYSTEM_LAST_PING_',
              category: '_SUBSECTION_',
              price: 0,
              description: updatedConfig,
              image: 'https://images.unsplash.com/photo-1546051888-791244c193e0?auto=format&fit=crop&q=80&w=300'
            }])
            .select();

          if (createError) {
            console.error("[Keep-Alive] Failed to create marker product:", createError.message);
            return;
          }
          if (newMarker && newMarker[0]) {
            markerId = newMarker[0].id;
          }
        }

        // B. Add the temporary demo product to generate write activity
        console.log("[Keep-Alive] Inserting temporary demo product for active database keeping...");
        const demoConfig = `___CONFIG___${JSON.stringify({ parent_category: '_SYSTEM_INTERNAL_', is_demo: true })}`;
        const { data: demoProducts, error: demoInsertError } = await supabaseClient
          .from('products')
          .insert([{
            name: '_SYSTEM_DEMO_PRODUCT_',
            category: '_SUBSECTION_',
            price: 0,
            description: demoConfig,
            image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=300'
          }])
          .select();

        if (demoInsertError) {
          console.error("[Keep-Alive] Failed to insert temporary demo product:", demoInsertError.message);
          return;
        }

        const demoProduct = demoProducts ? demoProducts[0] : null;
        if (!demoProduct) {
          console.error("[Keep-Alive] Temporary demo product was not returned on insert.");
          return;
        }

        console.log(`[Keep-Alive] Temporary demo product inserted successfully with ID: ${demoProduct.id}. Waiting 25 seconds before deletion...`);

        // C. Sleep for 25 seconds then delete the demo product (completed in < 30 seconds as requested)
        setTimeout(async () => {
          try {
            console.log(`[Keep-Alive] Deleting temporary product ${demoProduct.id} from database now...`);
            const { error: deleteError } = await supabaseClient
              .from('products')
              .delete()
              .eq('id', demoProduct.id);

            if (deleteError) {
              console.error(`[Keep-Alive] Error deleting temporary demo product ${demoProduct.id}:`, deleteError.message);
            } else {
              console.log("[Keep-Alive] Success! Temporary demo product deleted successfully. Database successfully kept active.");
            }
          } catch (deleteErr: any) {
            console.error("[Keep-Alive] Exception occurred during temporary product cleanup:", deleteErr);
          }
        }, 25000); // 25 seconds (less than 30 seconds)
      }

    } catch (err: any) {
      console.error("[Keep-Alive] Unhandled exception in runDatabaseKeepAliveCheck:", err);
    }
  };

  // Express middleware to trigger the check asynchronously on occasional routes (debounced to once every 12 hours)
  app.use((req, res, next) => {
    const now = Date.now();
    if (now - lastCheckedTime > STATUS_CHECK_INTERVAL_MS) {
      lastCheckedTime = now;
      // Triggers asynchronously so we don't slow down high-priority user requests
      runDatabaseKeepAliveCheck().catch(err => {
        console.error("[Keep-Alive] Async keep-alive execution error:", err);
      });
    }
    next();
  });

  app.get("/api/test-env", (req, res) => {
    res.json({
      id: process.env.RAZORPAY_KEY_ID,
      secret: process.env.RAZORPAY_KEY_SECRET ? "exists (length " + process.env.RAZORPAY_KEY_SECRET.length + ")" : "undefined"
    });
  });

  app.get("/api/slideshow-images", (req, res) => {
    res.json({
      images: [
        "/shop_slideshow_1.png",
        "/shop_slideshow_2.png",
        "/shop_slideshow_3.png",
        "/shop_slideshow_4.png",
      ]
    });
  });

  // --- Cloudflare R2 Database & Storage Integration ---
  let r2Client: S3Client | null = null;
  function getR2Client(): S3Client | null {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      return null;
    }
    if (!r2Client) {
      let accountId = process.env.R2_ACCOUNT_ID.trim();
      accountId = accountId.replace(/^https?:\/\//, '').replace(/\.r2\.cloudflarestorage\.com.*$/, '').replace(/\/$/, '');
      
      r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
        },
      });
    }
    return r2Client;
  }

  function getR2FileUrl(key: string): string {
    if (process.env.R2_PUBLIC_URL) {
      const base = process.env.R2_PUBLIC_URL.replace(/\/+$/, '');
      return `${base}/${key}`;
    }
    return `/api/r2-file/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  const albumsDir = path.join(process.cwd(), "data", "albums");
  if (!fs.existsSync(albumsDir)) {
    fs.mkdirSync(albumsDir, { recursive: true });
  }

  const uploadsDir = path.join(process.cwd(), "data", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/api/local-uploads', express.static(uploadsDir));

  // Save album to Cloudflare R2 and local cache
  async function saveAlbumToCloudflareR2(albumData: any): Promise<void> {
    const id = albumData.id;
    const jsonStr = JSON.stringify(albumData, null, 2);

    // 1. Write to local server disk cache
    const filePath = path.join(albumsDir, `${id}.json`);
    fs.writeFileSync(filePath, jsonStr, "utf-8");

    // 2. Write to Cloudflare R2
    const client = getR2Client();
    if (client && process.env.R2_BUCKET_NAME) {
      try {
        await client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `albums-data/${id}.json`,
          Body: Buffer.from(jsonStr, 'utf-8'),
          ContentType: 'application/json',
        }));
        console.log(`[Cloudflare R2] Successfully saved album ${id} to bucket ${process.env.R2_BUCKET_NAME}`);
      } catch (err: any) {
        console.error(`[Cloudflare R2] Error saving album ${id} to R2:`, err.message);
      }
    }
  }

  // Get album by ID from Cloudflare R2 / local cache
  async function getAlbumFromCloudflareR2(id: string): Promise<any | null> {
    // 1. Check local disk first
    const filePath = path.join(albumsDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
      } catch (e) {
        console.warn(`Failed reading local album ${id}:`, e);
      }
    }

    // 2. Check Cloudflare R2
    const client = getR2Client();
    if (client && process.env.R2_BUCKET_NAME) {
      try {
        const response = await client.send(new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `albums-data/${id}.json`,
        }));
        if (response.Body) {
          const str = await (response.Body as any).transformToString();
          const parsed = JSON.parse(str);
          // Cache to local disk
          fs.writeFileSync(filePath, str, "utf-8");
          return parsed;
        }
      } catch (err: any) {
        console.warn(`[Cloudflare R2] Album ${id} not found in R2:`, err.message);
      }
    }

    // 3. Fallback: Supabase (for legacy compatibility)
    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("albums")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          const parsed = deserializeAlbumFromSupabase(data);
          fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf-8");
          return parsed;
        }
      } catch (e) {
        console.warn(`Supabase fallback failed for album ${id}:`, e);
      }
    }

    return null;
  }

  // List all albums from Cloudflare R2 & disk
  async function listAlbumsFromCloudflareR2(): Promise<any[]> {
    const albumMap = new Map<string, any>();

    // 1. Read from local disk cache
    if (fs.existsSync(albumsDir)) {
      const files = fs.readdirSync(albumsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(albumsDir, file), "utf-8");
            const album = JSON.parse(content);
            if (album && album.id) {
              albumMap.set(String(album.id), album);
            }
          } catch (e) {
            console.warn(`Error reading album file ${file}:`, e);
          }
        }
      }
    }

    // 2. Query Cloudflare R2 `albums-data/`
    const client = getR2Client();
    if (client && process.env.R2_BUCKET_NAME) {
      try {
        const listResp = await client.send(new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME,
          Prefix: 'albums-data/',
        }));

        if (listResp.Contents) {
          for (const item of listResp.Contents) {
            if (item.Key && item.Key.endsWith('.json')) {
              const albumId = item.Key.replace('albums-data/', '').replace('.json', '');
              if (!albumMap.has(albumId)) {
                try {
                  const getResp = await client.send(new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: item.Key,
                  }));
                  if (getResp.Body) {
                    const str = await (getResp.Body as any).transformToString();
                    const parsed = JSON.parse(str);
                    if (parsed && parsed.id) {
                      albumMap.set(String(parsed.id), parsed);
                      // Cache locally
                      fs.writeFileSync(path.join(albumsDir, `${parsed.id}.json`), str, "utf-8");
                    }
                  }
                } catch (readErr) {
                  console.warn(`Failed reading R2 album ${item.Key}:`, readErr);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn(`[Cloudflare R2] List albums error:`, err.message);
      }
    }

    // 3. Merge legacy Supabase albums if any
    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from("albums").select("*");
        if (!error && Array.isArray(data)) {
          for (const raw of data) {
            const parsed = deserializeAlbumFromSupabase(raw);
            if (parsed && parsed.id && !albumMap.has(String(parsed.id))) {
              albumMap.set(String(parsed.id), parsed);
            }
          }
        }
      } catch (e) {
        console.warn("Supabase legacy list sync skipped:", e);
      }
    }

    const allAlbums = Array.from(albumMap.values());
    allAlbums.sort((a, b) => {
      const dateA = new Date(a.created_at || '').getTime();
      const dateB = new Date(b.created_at || '').getTime();
      return dateB - dateA;
    });

    return allAlbums;
  }

  // Delete album from Cloudflare R2 & disk
  async function deleteAlbumFromCloudflareR2(id: string): Promise<void> {
    // 1. Delete local file
    const filePath = path.join(albumsDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("Failed to delete local album file:", e);
      }
    }

    // 2. Delete from Cloudflare R2
    const client = getR2Client();
    if (client && process.env.R2_BUCKET_NAME) {
      try {
        await client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `albums-data/${id}.json`,
        }));
      } catch (e) {
        console.warn("Failed to delete R2 album json:", e);
      }
    }

    // 3. Delete from Supabase if connected
    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
      try {
        await supabaseClient.from("albums").delete().eq("id", id);
      } catch (e) {
        console.warn("Failed to delete from Supabase:", e);
      }
    }
  }

  // Stream/proxy R2 assets with public caching
  app.get(['/api/r2-file/*', '/album/api/r2-file/*'], async (req, res) => {
    try {
      const key = req.params[0] || req.url.split('/r2-file/')[1];
      if (!key) return res.status(400).send("Missing key");

      const decodedKey = decodeURIComponent(key);
      const client = getR2Client();
      if (!client || !process.env.R2_BUCKET_NAME) {
        return res.status(500).send("Cloudflare R2 is not configured");
      }

      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: decodedKey,
      });

      const response = await client.send(command);

      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      if (response.ContentLength) {
        res.setHeader('Content-Length', response.ContentLength);
      }

      (response.Body as any).pipe(res);
    } catch (err: any) {
      console.error("Error streaming R2 file:", err.message);
      res.status(404).send("File not found");
    }
  });

  // Direct Upload to Cloudflare R2 (Supports Multipart File & Base64 DataURL)
  app.post(['/api/r2-upload', '/album/api/r2-upload'], upload.single('file'), async (req, res) => {
    try {
      const client = getR2Client();
      let buffer: Buffer;
      let contentType = 'image/jpeg';
      let albumId = req.body.albumId || 'general';
      let filename = req.body.filename || `img_${Date.now()}.jpg`;

      if (req.file) {
        buffer = req.file.buffer;
        contentType = req.file.mimetype || 'image/jpeg';
        filename = req.file.originalname || filename;
      } else if (req.body.dataUrl) {
        const parts = req.body.dataUrl.split(';base64,');
        if (parts.length === 2) {
          const mimeMatch = parts[0].match(/:(.*?)$/);
          if (mimeMatch) contentType = mimeMatch[1];
          buffer = Buffer.from(parts[1], 'base64');
        } else {
          buffer = Buffer.from(req.body.dataUrl, 'base64');
        }
      } else {
        return res.status(400).json({ success: false, message: "No file or dataUrl provided" });
      }

      const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const objectKey = `albums/${albumId}/${Date.now()}_${cleanFilename}`;

      if (client && process.env.R2_BUCKET_NAME) {
        await client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: objectKey,
          Body: buffer,
          ContentType: contentType,
        }));
        const fileUrl = getR2FileUrl(objectKey);
        return res.json({ success: true, url: fileUrl, key: objectKey });
      } else {
        // Fallback to local server disk upload if R2 credentials not supplied
        const albumUploadDir = path.join(uploadsDir, albumId);
        if (!fs.existsSync(albumUploadDir)) fs.mkdirSync(albumUploadDir, { recursive: true });
        const localFile = path.join(albumUploadDir, `${Date.now()}_${cleanFilename}`);
        fs.writeFileSync(localFile, buffer);
        const localUrl = `/api/local-uploads/${albumId}/${path.basename(localFile)}`;
        return res.json({ success: true, url: localUrl, key: cleanFilename });
      }
    } catch (err: any) {
      console.error("Cloudflare R2 direct upload error:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to upload image" });
    }
  });

  // Presigned URL generator for client direct PUT upload to R2
  app.post(['/api/r2-upload-url', '/album/api/r2-upload-url'], async (req, res) => {
    try {
      const { albumId = 'general', filename = `photo_${Date.now()}.jpg`, contentType = 'image/jpeg' } = req.body;
      const client = getR2Client();

      if (!client || !process.env.R2_BUCKET_NAME) {
        return res.status(500).json({ success: false, message: "Cloudflare R2 is not configured on the server." });
      }

      const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const objectKey = `albums/${albumId}/${Date.now()}_${cleanFilename}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      const publicUrl = getR2FileUrl(objectKey);

      res.json({ success: true, uploadUrl: presignedUrl, objectKey, publicUrl });
    } catch (error: any) {
      console.error("Error generating R2 presigned URL:", error);
      res.status(500).json({ success: false, message: "Failed to generate upload URL", error: error.message });
    }
  });

  // GET /api/albums -> List all albums from Cloudflare R2 / disk
  app.get(['/api/albums', '/album/api/albums'], async (req, res) => {
    try {
      const albumsList = await listAlbumsFromCloudflareR2();
      return res.json({ success: true, data: albumsList });
    } catch (err: any) {
      console.error("Error listing albums:", err);
      return res.status(500).json({ success: false, message: "Internal server error listing albums", error: err.message });
    }
  });

  // GET /api/albums/:id -> Get single album and increment views
  app.get(['/api/albums/:id', '/album/api/albums/:id'], async (req, res) => {
    try {
      const { id } = req.params;
      const albumData = await getAlbumFromCloudflareR2(id);

      if (!albumData) {
        return res.status(404).json({ success: false, message: "Album not found on Cloudflare R2 or server" });
      }

      // Ensure stats fields exist
      if (albumData.views_count === undefined) albumData.views_count = 0;
      if (albumData.likes_count === undefined) albumData.likes_count = 0;
      if (albumData.comments === undefined) albumData.comments = [];

      // Increment views
      albumData.views_count += 1;

      // Asynchronously update view count
      saveAlbumToCloudflareR2(albumData).catch(e => console.warn("Failed to persist view count update:", e));

      return res.json({ success: true, data: albumData });
    } catch (err: any) {
      console.error("Error reading album:", err);
      return res.status(500).json({ success: false, message: "Internal server error reading album", error: err.message });
    }
  });

  // POST /api/albums/:id/like -> Update likes
  app.post(['/api/albums/:id/like', '/album/api/albums/:id/like'], async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'like' or 'unlike'
      const albumData = await getAlbumFromCloudflareR2(id);

      if (!albumData) {
        return res.status(404).json({ success: false, message: "Album not found to update likes" });
      }

      if (albumData.likes_count === undefined) albumData.likes_count = 0;
      if (albumData.views_count === undefined) albumData.views_count = 0;
      if (albumData.comments === undefined) albumData.comments = [];

      if (action === 'like') {
        albumData.likes_count += 1;
      } else if (action === 'unlike') {
        albumData.likes_count = Math.max(0, albumData.likes_count - 1);
      }

      await saveAlbumToCloudflareR2(albumData);
      return res.json({ success: true, likes_count: albumData.likes_count });
    } catch (err: any) {
      console.error("Error updating likes:", err);
      return res.status(500).json({ success: false, message: "Internal server error updating likes" });
    }
  });

  // POST /api/albums/:id/comment -> Add comment
  app.post(['/api/albums/:id/comment', '/album/api/albums/:id/comment'], async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ success: false, message: "Comment cannot be empty" });
      }

      const albumData = await getAlbumFromCloudflareR2(id);
      if (!albumData) {
        return res.status(404).json({ success: false, message: "Album not found to add comment" });
      }

      if (albumData.comments === undefined) albumData.comments = [];
      if (albumData.views_count === undefined) albumData.views_count = 0;
      if (albumData.likes_count === undefined) albumData.likes_count = 0;

      albumData.comments.push(comment.trim());

      await saveAlbumToCloudflareR2(albumData);
      return res.json({ success: true, comments: albumData.comments });
    } catch (err: any) {
      console.error("Error adding comment:", err);
      return res.status(500).json({ success: false, message: "Internal server error adding comment" });
    }
  });

  // POST /api/albums -> Save/Update album to Cloudflare R2
  app.post(['/api/albums', '/album/api/albums'], async (req, res) => {
    try {
      const payload = req.body;
      let id = payload.id;

      if (!id || id === "preview" || id.startsWith("local_")) {
        const cleanedSlug = (payload.client_name || payload.title || 'album')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        id = `${cleanedSlug}-${randomCode}`;
      }

      // Preserve stats
      const existing = await getAlbumFromCloudflareR2(id);
      const albumData = {
        ...payload,
        id,
        views_count: payload.views_count !== undefined ? payload.views_count : (existing?.views_count || 0),
        likes_count: payload.likes_count !== undefined ? payload.likes_count : (existing?.likes_count || 0),
        comments: payload.comments !== undefined ? payload.comments : (existing?.comments || []),
        created_at: payload.created_at || existing?.created_at || new Date().toISOString()
      };

      await saveAlbumToCloudflareR2(albumData);

      // Also try syncing to Supabase if configured (as background non-blocking task)
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        try {
          const dbPayload = serializeAlbumForSupabase(albumData);
          await supabaseClient.from("albums").upsert(dbPayload);
        } catch (dbErr) {
          console.warn("Optional Supabase sync skipped:", dbErr);
        }
      }

      return res.json({ success: true, data: albumData });
    } catch (err: any) {
      console.error("Error saving album to Cloudflare R2:", err);
      return res.status(500).json({ success: false, message: "Failed saving album to Cloudflare R2", error: err.message });
    }
  });

  // DELETE /api/albums/:id -> Delete album from Cloudflare R2
  app.delete(['/api/albums/:id', '/album/api/albums/:id', '/api/albums', '/album/api/albums'], async (req, res) => {
    try {
      const id = req.params.id || (req.query.id as string);
      if (!id) return res.status(400).json({ success: false, message: "Album ID is required" });
      await deleteAlbumFromCloudflareR2(id);
      return res.json({ success: true, message: `Album ${id} deleted successfully from Cloudflare R2.` });
    } catch (err: any) {
      console.error("Error deleting album:", err);
      return res.status(500).json({ success: false, message: "Error deleting album", error: err.message });
    }
  });

  // Razorpay order creation endpoint
  app.post("/api/create-razorpay-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;

      console.log("Rzp Keys in server:", process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ success: false, message: "Razorpay API keys are not configured in environment variables." });
      }

      if (process.env.RAZORPAY_KEY_ID === "rzp_test_dummy") {
        return res.status(500).json({ success: false, message: "Using dummy keys!" });
      }

      const amountInPaise = Math.round(amount * 100);
      if (amountInPaise < 100) {
        return res.status(400).json({ success: false, message: "Amount must be at least 100 paise" });
      }

      console.log("Creating Razorpay order with:", {
        amountInPaise, currency, receipt,
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET ? `***${process.env.RAZORPAY_KEY_SECRET.slice(-4)}` : "missing"
      });

      const instance = new Razorpay({
        key_id: String(process.env.RAZORPAY_KEY_ID).trim(),
        key_secret: String(process.env.RAZORPAY_KEY_SECRET).trim(),
      });

      const options = {
        amount: amountInPaise, // amount in smallest currency unit (paisa)
        currency,
        receipt,
      };

      const order = await instance.orders.create(options);

      if (!order) {
        return res.status(500).json({ success: false, message: "Order creation failed" });
      }

      res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        isMock: (order as any).isMock || false
      });

    } catch (error: any) {
      console.error("Razorpay error:", error);
      if (error.statusCode === 401) {
        return res.status(401).json({ success: false, message: "Razorpay Authentication failed", details: error });
      }
      res.status(500).json({ success: false, message: error.message || "Failed to create order", details: error });
    }
  });

  // Razorpay order verification endpoint
  app.post("/api/verify-razorpay-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!key_secret) {
        return res.status(500).json({ success: false, message: "Server misconfigured" });
      }
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");
      
      const isValid = (expectedSignature === razorpay_signature);

      if (isValid) {
        // Here you would usually mark the order as paid in database if server-side only
        res.status(200).json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Razorpay verification error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to verify payment" });
    }
  });

  // Dynamic Slideshow Images Endpoint
  app.get("/api/slideshow-images", (req, res) => {
    try {
      const publicPath = path.join(process.cwd(), "public");
      
      let chatGptFiles: string[] = [];
      if (fs.existsSync(publicPath)) {
        const files = fs.readdirSync(publicPath);
        chatGptFiles = files
          .filter(file => file.toLowerCase().startsWith("chatgpt"))
          .map(file => `/${file}`);
      }
      
      const defaultSlides = [
        "/welcome.png",
        "/enterprise.png",
        "/wholesale.png"
      ];
      
      // Combine and filter out duplicates
      const uniqueSlides = [...defaultSlides];
      chatGptFiles.forEach(file => {
        if (!uniqueSlides.includes(file)) {
          uniqueSlides.push(file);
        }
      });
      
      res.json({ images: uniqueSlides });
    } catch (error) {
      console.error("Error reading slideshow directory:", error);
      res.json({ images: ["/welcome.png", "/enterprise.png", "/wholesale.png"] });
    }
  });

  // AI-Based Gift Recommendations Endpoint
  app.post("/api/recommendations", async (req, res) => {
    try {
      const { currentProduct, candidates } = req.body;
      
      if (!currentProduct || !candidates || !Array.isArray(candidates) || candidates.length === 0) {
        return res.json({ recommendedIds: [], stylistTip: "Stylist Tip: Complete your custom gift set with these matching items in the same collection!" });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback gracefully if key is not configured
        const sameCategory = candidates.filter((p: any) => p.category === currentProduct.category).slice(0, 3);
        const selected = sameCategory.length > 0 ? sameCategory : candidates.slice(0, 3);
        return res.json({
          recommendedIds: selected.map((p: any) => p.id),
          stylistTip: "Stylist Tip: Complete your custom gift set with these matching items in the same collection!"
        });
      }

      const prompt = `You are an expert AI Gift Stylist.
We have an e-commerce store with personalized gifts and keepsakes.
A customer is currently viewing this product:
Name: "${currentProduct.name}"
Category: "${currentProduct.category}"
Description: "${currentProduct.description || ''}"
Price: ₹${currentProduct.price}

Here is a list of candidate products they could also buy:
${candidates.map((p, idx) => `- Candidates [Product ID: "${p.id}"]: Name: "${p.name}", Category: "${p.category}", Price: ₹${p.price}`).join('\n')}

Analyze which top 3 candidate products would go exceptionally well together as a personalized gift package, complementary item, or similar recommended alternative for this customer.
Return a list of up to 3 candidate IDs and a delightful, highly specific styling tip of exactly why these recommended products complement the current item.
Always be friendly, encouraging, and specific to the actual items (e.g., matching photo frames with UV prints, sublimation gifts with custom lamps). Keep the tip under 80 words.`;

      const aiClient = getAiClient();
      if (!aiClient) throw new Error("AI not configured");
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of the recommended candidate IDs that best compliment the current product."
              },
              stylistTip: {
                type: Type.STRING,
                description: "Delightful feedback and recommendation explanation from the AI Gift Stylist."
              }
            },
            required: ["recommendedIds", "stylistTip"]
          }
        }
      });

      const result = JSON.parse(response.text?.trim() || "{}");
      res.json(result);
    } catch (error: any) {
      console.warn("AI Recommendation fallback activated due to API error.");
      // Fallback gracefully on error
      const { currentProduct, candidates } = req.body;
      const sameCategory = (candidates || []).filter((p: any) => p.category === currentProduct?.category).slice(0, 3);
      const selected = sameCategory.length > 0 ? sameCategory : (candidates || []).slice(0, 3);
      res.json({
        recommendedIds: selected.map((p: any) => p.id),
        stylistTip: "Stylist Tip: Complete your custom gift set with these matching items in the same collection!"
      });
    }
  });

  // AI-Based Advanced Search & Intent Parser Endpoint
  app.post("/api/search-assistant", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.json({
          searchQuery: "",
          category: null,
          minPrice: 0,
          maxPrice: 0,
          inStockOnly: false,
          aiInsight: "What kind of custom gift are you looking for today? Tell me who it is for, your budget, or preferred styling!"
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback classical parsing if API key is not configured
        const lower = query.toLowerCase();
        let parsedCategory = null;
        if (lower.includes("frame") || lower.includes("wooden") || lower.includes("photo")) parsedCategory = "Photo Frames";
        else if (lower.includes("album") || lower.includes("classic") || lower.includes("print")) parsedCategory = "Album Printing";
        else if (lower.includes("uv") || lower.includes("acrylic") || lower.includes("plaque")) parsedCategory = "UV Printing";
        else if (lower.includes("mug") || lower.includes("shirt") || lower.includes("gift") || lower.includes("sublimation") || lower.includes("lamp")) parsedCategory = "Sublimation Gifts";

        let maxPrice = 0;
        const prices = lower.match(/(?:under|below|budget|less than|₹|rs\.?)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:rupees|rs|paisa|inr)?/);
        if (prices?.[1]) {
          maxPrice = parseInt(prices[1], 10);
        }

        return res.json({
          searchQuery: query.replace(/(?:under|below|budget|less than|₹|rs\.?)\s*\d+|(?:photo|frame|album|classic|uv|acrylic|mug|shirt|gift|sublimation|lamp)/gi, "").trim(),
          category: parsedCategory,
          minPrice: 0,
          maxPrice,
          inStockOnly: lower.includes("stock") || lower.includes("available") || lower.includes("ready"),
          aiInsight: `Filtered for personalized gifts based on keywords. (Simple fallback filter applied)`
        });
      }

      const prompt = `You are an expert AI Gift Shopping Assistant at a premium personalized gift shop.
A user has typed the following search or filter request: "${query}"

We have 4 main categories of custom products:
1. 'Album Printing'
2. 'Photo Frames'
3. 'UV Printing'
4. 'Sublimation Gifts'

Extract the structured search criteria from the user's natural language input.
- searchQuery: Refined search text (e.g. "classic", "custom mug", "wood stand") (max 3 words, or empty string).
- category: ONLY one of those 4 categories listed above, or null if they don't specify any or refer to multiple.
- minPrice: Numeric value of minimum price requested (0 if not specified).
- maxPrice: Numeric value of maximum price requested (0 if not specified, e.g. "under 500" -> maxPrice: 500).
- inStockOnly: True if they specifically mention in stock, available, instock, ready, now. False otherwise.
- aiInsight: A tiny, ultra-polite stylist insight (max 12 words) reacting to their search constraint cheerfully (e.g., "A perfect choice! Acrylic prints look stunning under warm room lights." or "These matching frames make for beautiful custom table accents."). Make it friendly and specific.`;

      const aiClient = getAiClient();
      if (!aiClient) throw new Error("AI not configured");
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              searchQuery: { type: Type.STRING },
              category: { type: Type.STRING, nullable: true },
              minPrice: { type: Type.INTEGER },
              maxPrice: { type: Type.INTEGER },
              inStockOnly: { type: Type.BOOLEAN },
              aiInsight: { type: Type.STRING }
            },
            required: ["searchQuery", "category", "minPrice", "maxPrice", "inStockOnly", "aiInsight"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.warn("AI Search Assistant fallback activated due to API error.");
      res.json({
        searchQuery: "",
        category: null,
        minPrice: 0,
        maxPrice: 0,
        inStockOnly: false,
        aiInsight: "Exploring our complete customizable inventory for you!"
      });
    }
  });

  // --- PSD Upload & Auto-Analyze ---
  app.post('/api/upload-psd', upload.single('psdFile'), async (req: any, res: any) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PSD file uploaded' });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    try {
      // 1. Upload raw PSD to Supabase Storage bucket named 'raw-psd'
      const psdFilename = `${Date.now()}-${req.file.originalname}`;
      const { data: rawUploadData, error: rawUploadError } = await supabaseClient.storage
        .from('raw-psd')
        .upload(psdFilename, req.file.buffer, {
          contentType: 'image/vnd.adobe.photoshop'
        });

      if (rawUploadError) {
        console.error("Failed to upload raw PSD:", rawUploadError);
      }
      
      const rawPsdPath = rawUploadData?.path || psdFilename;

      // 2. Parse PSD using ag-psd
      const { initializeCanvas } = await import('ag-psd');
      initializeCanvas((width, height) => createCanvas(width, height) as any);
      
      const psd = readPsd(req.file.buffer, { skipCompositeImageData: false, skipThumbnail: true });
      const layersData: any[] = [];
      
      const canvasWidth = psd.width;
      const canvasHeight = psd.height;

      // Extract composite image for preview if possible
      let previewUrl = "";
      if (psd.canvas) {
        const previewBuffer = (psd.canvas as any).toBuffer('image/png');
        const previewFilename = `preview-${psdFilename}.png`;
        const { data: previewUploadData } = await supabaseClient.storage
          .from('processed-layers')
          .upload(previewFilename, previewBuffer, { contentType: 'image/png' });
          
        if (previewUploadData) {
          const { data: { publicUrl } } = supabaseClient.storage.from('processed-layers').getPublicUrl(previewFilename);
          previewUrl = publicUrl;
        }
      }

      // Process layers
      if (psd.children) {
        for (let i = 0; i < psd.children.length; i++) {
          const layer = psd.children[i];
          if (layer.hidden) continue;

          const layerName = layer.name || `Layer ${i}`;
          const left = layer.left || 0;
          const top = layer.top || 0;
          const width = (layer.right || 0) - left;
          const height = (layer.bottom || 0) - top;
          const opacity = (layer.opacity ?? 255) / 255;

          if (layer.text) {
            const textContent = layer.text.text || "";
            let fontSize = 24;
            let fontName = "Arial"; // Default fallback font
            
            // Note: If PSD uses a font not available on the web, falling back to a default web-safe font.
            if (layer.text.transform && layer.text.transform[0]) {
              fontSize = Math.round(layer.text.transform[0] * 12) || 24; 
            }
            
            layersData.push({
              name: layerName,
              type: 'text',
              text: textContent,
              left,
              top,
              width,
              height,
              opacity,
              font: fontName,
              fontSize
            });
          } else if (layer.canvas) {
            // It's a raster/image layer
            try {
              const buffer = (layer.canvas as any).toBuffer('image/png');
              const layerFilename = `layer-${Date.now()}-${i}.png`;
              
              const { data: layerUploadData } = await supabaseClient.storage
                .from('processed-layers')
                .upload(layerFilename, buffer, { contentType: 'image/png' });

              if (layerUploadData) {
                const { data: { publicUrl } } = supabaseClient.storage.from('processed-layers').getPublicUrl(layerFilename);
                layersData.push({
                  name: layerName,
                  type: 'image',
                  url: publicUrl,
                  left,
                  top,
                  width,
                  height,
                  opacity
                });
              }
            } catch (err) {
              console.warn(`Skipped layer ${layerName} due to rendering error`, err);
            }
          } else {
            console.log(`Layer ${layerName} unsupported, skipped.`);
          }
        }
      }
      
      // Save metadata to psd_templates
      const { data: dbData, error: dbError } = await supabaseClient
        .from('psd_templates')
        .insert([{
          source_path: rawPsdPath,
          canvas_width: canvasWidth,
          canvas_height: canvasHeight,
          layers: layersData,
          preview_url: previewUrl // Optional, added for ease of use
        }])
        .select('id')
        .single();
        
      if (dbError) {
         console.error("Database insert error:", dbError);
         return res.status(500).json({ error: "Failed to save template to database." });
      }

      res.json({
        success: true,
        templateId: dbData.id,
        canvasWidth,
        canvasHeight,
        layers: layersData,
        previewUrl
      });
      
    } catch (err: any) {
      console.error("PSD processing error:", err);
      // "Handle serverless function timeout risk for large PSD files — if using Vercel Hobby tier (10s limit)..."
      // "on Pro tier (60s) mention this in a code comment"
      res.status(500).json({ error: "PSD parsing failed. Note: Processing large PSD files may timeout on serverless environments (Vercel 10s/60s limits). Please try reducing file size." });
    }
  });

  // R2 Storage: Get presigned URL for album image upload
  app.post("/api/r2-upload-url", async (req, res) => {
    try {
      const { albumId, filename, contentType } = req.body;
      if (!albumId || !filename || !contentType) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
        return res.status(500).json({ success: false, message: "R2 credentials are not configured on the server." });
      }

      const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      // Must start with albums/ as per requirements
      const objectKey = `albums/${albumId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      // The public URL assuming the bucket is configured for public access or we just store the key
      // If no public domain is specified, we store the raw presigned URL or just the bucket URL. 
      // Cloudflare R2 public bucket URLs look like https://pub-<id>.r2.dev or a custom domain.
      // We will just return the key so the client can construct the URL if they have a public domain,
      // or we can just return a direct URL if R2 bucket is public.
      // Let's assume the public URL format is: https://<bucket>.r2.cloudflarestorage.com or similar, but typically users set up a custom domain.
      // For now, we will return the endpoint + bucket + key.
      const publicUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${objectKey}`;

      res.json({ success: true, uploadUrl: presignedUrl, objectKey, publicUrl });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ success: false, message: "Failed to generate upload URL" });
    }
  });

  // 404 handler for API routes
  app.all(['/api/*', '/album/api/*'], (req, res) => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.url}`
    });
  });

  // Global error handler for API routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled API error:", err);
    const isApi = req.url.startsWith('/api/') || req.url.startsWith('/album/api/');
    if (isApi) {
      return res.status(500).json({
        success: false,
        message: "Internal server error occurred",
        error: err.message || String(err)
      });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Perform an immediate keep-alive check on server startup
  console.log("[Keep-Alive] Server booting. Initiating startup database keep-alive check...");
  lastCheckedTime = Date.now();
  runDatabaseKeepAliveCheck().catch(err => {
    console.error("[Keep-Alive] Startup keep-alive check failed:", err);
  });

  // Set up continuous polling every 12 hours in case the container remains warm continuously
  setInterval(() => {
    console.log("[Keep-Alive] Running scheduled periodic keep-alive check...");
    runDatabaseKeepAliveCheck().catch(err => {
      console.error("[Keep-Alive] Periodic keep-alive check failed:", err);
    });
  }, STATUS_CHECK_INTERVAL_MS);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
