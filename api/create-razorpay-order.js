import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { amount, currency = "INR", receipt } = req.body;

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

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Razorpay Vercel API Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create order" });
  }
}
