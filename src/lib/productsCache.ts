import { supabase } from '../supabase';

let productsPromise: Promise<any[]> | null = null;
let cachedProducts: any[] | null = null;

export const fetchAllProductsCached = async () => {
  if (cachedProducts) return cachedProducts;
  if (productsPromise) return productsPromise;
  
  productsPromise = (async () => {
    try {
      // We only select the columns necessary for listing to avoid large payloads from the 'images' JSONB array
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, original_price, image, description');
        
      if (error) throw error;
      cachedProducts = data || [];
      return cachedProducts;
    } catch (e) {
      productsPromise = null;
      throw e;
    }
  })();
  
  return productsPromise;
};

export const clearProductsCache = () => {
  cachedProducts = null;
  productsPromise = null;
};
