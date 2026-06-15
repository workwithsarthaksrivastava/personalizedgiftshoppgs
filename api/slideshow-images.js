export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    images: [
      "/shop_slideshow_1.png",
      "/shop_slideshow_2.png",
      "/shop_slideshow_3.png",
      "/shop_slideshow_4.png",
    ]
  });
}
