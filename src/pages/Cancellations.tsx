import React from 'react';
import { XCircle, Shield } from 'lucide-react';

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
              In accordance with standard merchant guidelines and eCommerce regulations, 
              this Cancellation Policy establishes the rules surrounding the termination of orders placed on Personalized Gift Shop.
            </p>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">1. Cancellation Window</h3>
              <p className="text-sm text-muted leading-relaxed">
                Because our products are highly personalized:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>You may request a cancellation <strong className="text-white">only within 2 hours</strong> of placing your order, provided that the designing or printing process has not yet commenced.</li>
                <li>Once the manufacturing, designing, or print production phase begins, we cannot accept any cancellation requests as the raw materials have already been modified based on your custom requirements.</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">2. Process for Cancellation</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>To cancel your order within the eligible window, please urgently contact us via WhatsApp at <strong className="text-gold">+91 79797 12803</strong> or email <strong className="text-gold">Suryafilmsservices@gmail.com</strong>.</li>
                <li>You must provide your <strong className="text-white">Order ID</strong> and the reason for cancellation.</li>
                <li>Our support team will verify the order status and confirm if the cancellation is possible.</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">3. Refund for Cancelled Orders</h3>
              <p className="text-sm text-muted leading-relaxed">
                If your cancellation request is approved within the acceptable time boundaries:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>We will immediately cease production and initiate a full reversal of the transaction.</li>
                <li>The refunded amount will inherently route through the payment aggregator utilized during checkout.</li>
                <li>Please allow <strong className="text-gold">5 to 7 business days</strong> for the amount to reflect in your original funding source (Bank Account, Credit Card, or Mobile Wallet) according to RBI transaction clearance timelines.</li>
              </ul>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-6">
              <h3 className="text-xl font-bold text-white">4. Merchant Initiated Cancellations</h3>
              <p className="text-sm text-muted leading-relaxed">
                Personalized Gift Shop reserves the right to cancel an order under specific circumstances, such as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
                <li>Pricing errors or sudden unavailability of custom raw materials.</li>
                <li>The uploaded photographs or graphics violate our terms of use (e.g., explicit, illegal, or heavily copyrighted material without permission).</li>
                <li>If such a cancellation occurs from our end, a <strong className="text-white">100% full refund</strong> will immediately be initiated with a notification delivered to your registered email address or phone number.</li>
              </ul>
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
