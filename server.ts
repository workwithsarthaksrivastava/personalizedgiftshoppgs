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

  // --- Server-Side Album Fallback Database ---
  const albumsDir = path.join(process.cwd(), "data", "albums");
  if (!fs.existsSync(albumsDir)) {
    fs.mkdirSync(albumsDir, { recursive: true });
  }

  // 15-day album auto-deletion routine
  const cleanupExpiredAlbums = async () => {
    try {
      console.log("[Cleanup] Starting 15-day album auto-deletion routine...");
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const fifteenDaysAgoMs = fifteenDaysAgo.getTime();

      // 1. Clean up local files
      if (fs.existsSync(albumsDir)) {
        const files = fs.readdirSync(albumsDir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const filePath = path.join(albumsDir, file);
            try {
              const fileContent = fs.readFileSync(filePath, "utf-8");
              const parsed = JSON.parse(fileContent);
              
              const createdAtStr = parsed.created_at;
              const createdAtMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
              
              if (createdAtMs && createdAtMs < fifteenDaysAgoMs) {
                console.log(`[Cleanup] Deleting expired local album file: ${file} (created at ${createdAtStr})`);
                fs.unlinkSync(filePath);
              }
            } catch (err) {
              const stats = fs.statSync(filePath);
              if (stats.mtimeMs < fifteenDaysAgoMs) {
                console.log(`[Cleanup] Deleting expired local album file by stat: ${file}`);
                fs.unlinkSync(filePath);
              }
            }
          }
        }
      }

      // 2. Clean up Supabase rows
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        console.log(`[Cleanup] Checking for Supabase albums older than ${fifteenDaysAgo.toISOString()}`);
        const { error } = await supabaseClient
          .from("albums")
          .delete()
          .lt("created_at", fifteenDaysAgo.toISOString());

        if (error) {
          console.error("[Cleanup] Error during Supabase album cleanup:", error.message);
        } else {
          console.log("[Cleanup] Supabase album cleanup successful.");
        }
      }
    } catch (err) {
      console.error("[Cleanup] Unhandled error during album cleanup:", err);
    }
  };

  // Get album by ID
  app.get("/api/albums/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const filePath = path.join(albumsDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return res.json({ success: true, data: JSON.parse(fileContent) });
      }

      // If not found in local file system, see if we can get it from Supabase
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from("albums")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          return res.status(404).json({ success: false, message: "Album not found in file system or database" });
        }
        return res.json({ success: true, data });
      } else {
        return res.status(404).json({ success: false, message: "Album not found on server" });
      }
    } catch (err: any) {
      console.error("Error reading album:", err);
      return res.status(500).json({ success: false, message: "Internal server error reading album", error: err.message });
    }
  });

  // Save/Update album
  app.post("/api/albums", async (req, res) => {
    try {
      const payload = req.body;
      let id = payload.id;

      // Generate stable ID if none provided or starts with local_ / preview
      if (!id || id === "preview" || id.startsWith("local_")) {
        id = `album_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      const albumData = {
        ...payload,
        id,
        created_at: payload.created_at || new Date().toISOString()
      };

      const filePath = path.join(albumsDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(albumData, null, 2), "utf-8");

      // Also try to sync with Supabase if configured
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        try {
          const dbPayload = {
            title: albumData.title,
            template: albumData.template,
            audio_url: albumData.audio_url,
            cover_url: albumData.cover_url,
            orientation: albumData.orientation,
            page_marking: albumData.page_marking,
            spreads: albumData.spreads
          };
          
          // If the original id is a valid uuid, we can update or insert with it
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          if (isValidUUID) {
            await supabaseClient.from("albums").upsert({ id, ...dbPayload });
          } else {
            // Try to upsert the custom text ID directly (in case they updated the table schema in Supabase SQL editor)
            const { error: textUpsertError } = await supabaseClient.from("albums").upsert({ id, ...dbPayload });
            if (textUpsertError) {
              console.log("Supabase direct custom ID upsert failed (likely uuid type column), falling back to letting Supabase generate a UUID:", textUpsertError.message);
              // Fallback: Let Supabase auto-generate its own UUID
              const { data, error } = await supabaseClient.from("albums").insert([dbPayload]).select("id").single();
              if (data && !error) {
                const newId = data.id;
                const newFilePath = path.join(albumsDir, `${newId}.json`);
                const updatedAlbumData = { ...albumData, id: newId };
                fs.writeFileSync(newFilePath, JSON.stringify(updatedAlbumData, null, 2), "utf-8");
                // delete the old temporary file if it existed under the old generated ID
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
                id = newId;
                albumData.id = newId;
              }
            }
          }
        } catch (dbErr) {
          console.warn("Could not sync album to Supabase, but saved locally on server filesystem:", dbErr);
        }
      }

      return res.json({ success: true, data: albumData });
    } catch (err: any) {
      console.error("Error saving album:", err);
      return res.status(500).json({ success: false, message: "Internal server error saving album", error: err.message });
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
  
  // Run immediate 15-day album cleanup on startup
  cleanupExpiredAlbums().catch(err => {
    console.error("[Cleanup] Startup album cleanup failed:", err);
  });

  // Set up continuous polling every 12 hours in case the container remains warm continuously
  setInterval(() => {
    console.log("[Keep-Alive] Running scheduled periodic keep-alive check...");
    runDatabaseKeepAliveCheck().catch(err => {
      console.error("[Keep-Alive] Periodic keep-alive check failed:", err);
    });
    console.log("[Cleanup] Running scheduled 15-day album cleanup...");
    cleanupExpiredAlbums().catch(err => {
      console.error("[Cleanup] Periodic album cleanup failed:", err);
    });
  }, STATUS_CHECK_INTERVAL_MS);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
