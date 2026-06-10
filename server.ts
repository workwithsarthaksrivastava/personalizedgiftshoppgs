import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Helper inside startServer to init supabase client
  const getSupabaseClient = () => {
    const url = (process.env.VITE_SUPABASE_URL || "").trim();
    const key = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    if (!url || !key || url.includes("placeholder")) {
      return null;
    }
    return createClient(url, key);
  };

  // Razorpay order creation endpoint
  app.post("/api/create-razorpay-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay API keys are not configured in environment variables.");
      }

      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paisa)
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
        currency: order.currency
      });

    } catch (error: any) {
      console.error("Razorpay error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to create order" });
    }
  });

  // Razorpay order verification endpoint
  app.post("/api/verify-razorpay-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!key_secret) {
        return res.status(500).json({ success: false, message: "Server misconfigured" });
      }
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
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

      const response = await ai.models.generateContent({
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

      const response = await ai.models.generateContent({
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
