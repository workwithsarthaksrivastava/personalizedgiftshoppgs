import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function Refunds() {
  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-gold/10 rounded-full text-gold mb-4">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-gold mb-4">Refund Policy</h1>
          <p className="text-muted">
            Last Updated: June 13, 2026
          </p>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <p className="text-sm text-muted leading-relaxed">
              At Personalized Gift Shop Muzaffarpur, we strive to deliver high-quality personalized products. Due to the customized nature of our products, refunds are subject to the following terms:
            </p>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">1. Customized Products</h3>
              <p className="text-sm text-muted leading-relaxed">
                Customized and personalized products are made according to customer specifications and therefore are generally <strong className="text-white">not eligible for refunds, returns, or exchanges</strong> once production has begun.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">2. Damaged or Defective Products</h3>
              <p className="text-sm text-muted leading-relaxed">
                If you receive a damaged, defective, or incorrect product, please contact us within <strong className="text-white">48 hours of delivery</strong> with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>Order number</li>
                <li>Clear photos of the product</li>
                <li>Description of the issue</li>
              </ul>
              <p className="text-sm text-muted leading-relaxed pt-2">
                After verification, we may offer:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>Replacement of the product</li>
                <li>Partial refund</li>
                <li>Full refund (where applicable)</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">3. Order Cancellation Before Production</h3>
              <p className="text-sm text-muted leading-relaxed">
                Orders may be eligible for a refund if cancellation is requested before the customization or production process begins.
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">4. Non-Refundable Situations</h3>
              <p className="text-sm text-muted leading-relaxed">
                Refunds will not be provided for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>Customer-provided incorrect information</li>
                <li>Spelling errors approved by the customer</li>
                <li>Minor color variations due to screen settings</li>
                <li>Change of mind after production has started</li>
                <li>Delivery delays caused by courier partners</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">5. Refund Processing</h3>
              <p className="text-sm text-muted leading-relaxed">
                Approved refunds will be processed to the original payment method within <strong className="text-white">5–10 business days</strong>.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-gold border-b border-border pb-2 w-full">6. Contact Us</h3>
              <div className="space-y-2 text-sm text-white/90 pt-2">
                <p className="font-bold text-white">Personalized Gift Shop Muzaffarpur, a brand operated by Surya Films Services</p>
                <p>Email: <a href="mailto:Suryafilmsservices@gmail.com" className="text-gold hover:underline">Suryafilmsservices@gmail.com</a></p>
                <p>Phone: +91 79797 12803</p>
                <p>Address: New Market, Chowk, near Bihar Jalpan, Shrirampuri, Bhagwanpur, Muzaffarpur, Bihar, India — 842001</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
