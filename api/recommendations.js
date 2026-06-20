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
    const { currentProduct, candidates } = req.body;
    
    if (!currentProduct || !candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.json({ recommendedIds: [], stylistTip: "Stylist Tip: Complete your custom gift set with these matching items in the same collection!" });
    }

    if (!process.env.GEMINI_API_KEY) {
      const sameCategory = candidates.filter((p) => p.category === currentProduct.category).slice(0, 3);
      const selected = sameCategory.length > 0 ? sameCategory : candidates.slice(0, 3);
      return res.json({
        recommendedIds: selected.map((p) => p.id),
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
${candidates.map((p) => `- Candidates [Product ID: "${p.id}"]: Name: "${p.name}", Category: "${p.category}", Price: ₹${p.price}`).join('\n')}

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
    return res.json(result);
  } catch (error) {
    console.warn("AI Recommendation fallback activated due to API error.", error);
    // Fallback gracefully on error
    const { currentProduct, candidates } = req.body;
    const sameCategory = (candidates || []).filter((p) => p.category === currentProduct?.category).slice(0, 3);
    const selected = sameCategory.length > 0 ? sameCategory : (candidates || []).slice(0, 3);
    return res.json({
      recommendedIds: selected.map((p) => p.id),
      stylistTip: "Stylist Tip: Complete your custom gift set with these matching items in the same collection!"
    });
  }
}
