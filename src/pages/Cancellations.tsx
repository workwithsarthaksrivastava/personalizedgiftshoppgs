import React from 'react';
import { XCircle } from 'lucide-react';

export default function Cancellations() {
  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-gold/10 rounded-full text-gold mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-gold mb-4">Cancellation Policy</h1>
          <p className="text-muted">
            Last Updated: June 13, 2026
          </p>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <p className="text-sm text-muted leading-relaxed">
              At <strong className="text-white">Personalized Gift Shop Muzaffarpur</strong>, we understand that customers may need to cancel orders. Our cancellation policy is as follows:
            </p>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">1. Cancellation Before Production</h3>
              <p className="text-sm text-muted leading-relaxed">
                Orders can be cancelled before the customization, design approval, or production process begins. Eligible cancellations will receive a full refund after deduction of any applicable payment processing charges.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">2. Cancellation After Production Starts</h3>
              <p className="text-sm text-muted leading-relaxed">
                Once the customization, printing, or production process has started, the order cannot be cancelled due to the personalized nature of our products.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">3. Shipped Orders</h3>
              <p className="text-sm text-muted leading-relaxed">
                Orders that have already been shipped cannot be cancelled. Customers may refer to our <a href="/refunds" className="text-gold hover:underline">Refund Policy</a> for further information.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">4. How to Request a Cancellation</h3>
              <p className="text-sm text-muted leading-relaxed">
                To request an order cancellation, please contact us with your order details:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li><strong className="text-white">Email:</strong> <a href="mailto:Suryafilmsservices@gmail.com" className="text-gold hover:underline">Suryafilmsservices@gmail.com</a></li>
                <li><strong className="text-white">Phone:</strong> +91 79797 12803</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">5. Cancellation Approval</h3>
              <p className="text-sm text-muted leading-relaxed">
                Cancellation requests are subject to verification and approval by Personalized Gift Shop Muzaffarpur. We reserve the right to refuse cancellation requests that do not meet the conditions stated in this policy.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-gold border-b border-border pb-2 w-full">6. Contact Information</h3>
              <div className="space-y-2 text-sm text-white/90 pt-2">
                <p className="font-bold text-white">Personalized Gift Shop Muzaffarpur (Surya Films Services)</p>
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
