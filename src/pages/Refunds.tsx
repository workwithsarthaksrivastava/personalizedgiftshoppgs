import React from 'react';
import { Shield, RotateCcw } from 'lucide-react';

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
              In accordance with Reserve Bank of India (RBI) guidelines and standard merchant regulations, 
              Personalized Gift Shop clearly outlines our refund processing policies below.
            </p>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">1. Eligibility for Refunds</h3>
              <p className="text-sm text-muted leading-relaxed">
                As our products are primarily customized and tailor-made to your specific photographs 
                and specifications, refunds are generally only applicable in the following scenarios:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li><strong className="text-white">Product Defect:</strong> The item arrives severely damaged or completely broken.</li>
                <li><strong className="text-white">Wrong Delivery:</strong> The product delivered does not match your prescribed specifications or a completely different product was sent.</li>
                <li><strong className="text-white">Failed Delivery:</strong> The product fails to reach the designated address after the maximum estimated delivery time, and the tracking indicates failure.</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold text-white">2. Process to Claim a Refund</h3>
              <p className="text-sm text-muted leading-relaxed">
                To request a refund, please follow these steps:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>Contact us within <strong className="text-gold">48 hours</strong> of receiving the delivery.</li>
                <li>Provide visual evidence (clear photos or unboxing videos) of the defect or incorrect product via our WhatsApp support (+91 79797 12803) or Email (Suryafilmsservices@gmail.com).</li>
                <li>Our team will inspect the evidence and verify the claim.</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">3. Refund Processing Timeline</h3>
              <p className="text-sm text-muted leading-relaxed">
                If your refund request is valid and approved by our inspection team:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>Standard processing time to initiate the refund is <strong className="text-gold">3 to 5 business days</strong> after approval.</li>
                <li>The refunded amount will be securely routed back to the <strong className="text-gold">original payment source</strong> (Credit Card, Debit Card, Net Banking, or UPI) used during checkout.</li>
                <li>Depending entirely on your bank or payment gateway, it may take an additional <strong className="text-gold">5 to 7 business days</strong> for the amount to reflect in your account following our initiation.</li>
              </ul>
              <p className="text-sm text-muted leading-relaxed mt-2 p-3 bg-bg/50 rounded-lg border border-border">
                Note: In situations where partial refunds apply due to multi-item orders, only the defective item's proportional amount limits the total refund sum.
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">4. Exceptions</h3>
              <p className="text-sm text-muted leading-relaxed">
                No refunds will be granted for orders where custom details were provided erroneously by the customer (e.g., spelling tracking mistakes, uploading low-resolution photos) once production has commenced.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <p className="text-sm text-muted leading-relaxed">
                This platform is operated by <strong className="text-white">Surya Films Services</strong>.<br/>
                Registered Address: New Market, Chowk, near Bihar Jalpan, Shrirampuri, Bhagwanpur, Muzaffarpur, Bihar, India — 842001
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
