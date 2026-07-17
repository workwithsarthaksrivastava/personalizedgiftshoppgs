import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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
    return res.json(parsed);
  } catch (err) {
    console.warn("AI Search Assistant fallback activated due to API error.", err);
    return res.json({
      searchQuery: "",
      category: null,
      minPrice: 0,
      maxPrice: 0,
      inStockOnly: false,
      aiInsight: "Exploring our complete customizable inventory for you!"
    });
  }
}
