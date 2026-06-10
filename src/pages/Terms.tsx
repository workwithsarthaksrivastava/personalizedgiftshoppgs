import React from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldAlert, CreditCard, RefreshCw, HelpCircle, AlertCircle, ShoppingBag, Truck, MessageSquare, Terminal } from 'lucide-react';

export default function Terms() {
  return (
    <div className="pt-32 pb-20 px-6 bg-bg text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-gold/10 rounded-full text-gold mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-gold mb-4 font-display">Terms of Service</h1>
          <p className="text-muted text-sm">
            Last Updated: June 10, 2026
          </p>
          <p className="text-muted max-w-2xl mx-auto mt-3 text-sm leading-relaxed">
            Welcome to <span className="text-white font-semibold">Personalized Gift Shop</span> ("Company", "we", "our", or "us"). These Terms and Conditions govern your access to and use of <span className="text-gold font-medium">personalizedgiftshoppgs.vercel.app</span> and the products and services offered through our website.
          </p>
        </div>

        {/* Content Tabs/Sections */}
        <div className="space-y-8">
          
          {/* Card 1: Acceptance */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <ShieldAlert className="w-6 h-6 text-gold" />
              1. Acceptance of Terms
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              By accessing, browsing, or purchasing from our website, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. If you do not agree with any part of these Terms, please discontinue use of the website immediately.
            </p>
          </div>

          {/* Card 2: Services */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <ShoppingBag className="w-6 h-6 text-gold" />
              2. About Our Services
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Personalized Gift Shop offers customized and non-customized gift products including but not limited to:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/80 pl-2">
              <li className="flex items-center gap-2">• Personalized Photo Frames</li>
              <li className="flex items-center gap-2">• Photo Albums</li>
              <li className="flex items-center gap-2">• Sublimation Gifts</li>
              <li className="flex items-center gap-2">• Customized Mugs & Cushions</li>
              <li className="flex items-center gap-2">• T-Shirts</li>
              <li className="flex items-center gap-2">• Ultra-high resolution Prints</li>
              <li className="flex items-center gap-2">• Premium Gift Accessories</li>
            </ul>
            <p className="text-xs text-muted pt-2 italic">
              Note: Product descriptions and live availability may change without prior notice.
            </p>
          </div>

          {/* Card 3: Eligibility & Accounts */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <AlertCircle className="w-6 h-6 text-gold" />
              3. Eligibility
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              To use our services, customize models, or execute transactions, you must be at least 18 years old (or have active parental/guardian consent), provide accurate contact credentials, and use the portal in full compliance with local regulatory laws.
            </p>
          </div>

          {/* Card 4: Orders & Customized Products */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold text-gold border-b border-border pb-4 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-gold" />
              4. Orders, Acceptance & Personalized Products
            </h2>
            <div className="space-y-4 text-sm text-muted">
              <div>
                <h4 className="font-bold text-white mb-1.5">Order Review & Discretion</h4>
                <p className="leading-relaxed">
                  All orders are subject to acceptance and raw inventory availability. We reserve the right to refuse, restrict, or cancel any custom order at our sole discretion. Receipts or system order confirmations do not constitute final validation; we may contact you for design file clarification before beginning fabrication.
                </p>
              </div>
              <div className="border-t border-border/45 pt-4">
                <h4 className="font-bold text-white mb-2">Customer’s Customization Duty</h4>
                <p className="leading-relaxed mb-3">
                  You are responsible for ensuring that uploaded digital artwork or photographs are of sufficient dimensions and resolution. We do not hold liability for physical pixelation, crop clipping, or framing discrepancies resulting from uploading low-grade assets.
                </p>
              </div>
              <div className="border-t border-border/45 pt-4">
                <h4 className="font-bold text-red-400 mb-2">Content Restrictions</h4>
                <p className="leading-relaxed">
                  You are strictly prohibited from uploading print requests containing hate speech, obscenity, copyright infringements without authorized licensing, or illegal visual graphics. We reserve absolute rights to terminate and reject such orders instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Pricing & Payments */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <CreditCard className="w-6 h-6 text-gold" />
              5. Pricing & Payments
            </h2>
            <ul className="list-disc pl-6 space-y-3 text-sm text-muted">
              <li><strong className="text-white">Currencies:</strong> All product listings are declared in Indian Rupees (INR - ₹).</li>
              <li><strong className="text-white">Updates:</strong> Quotations may be dynamically modified without prior notice. Taxes and shipping tolls are added sequentially in the Checkout phase.</li>
              <li><strong className="text-white">Payment Options:</strong> Payments are processed safely through certified third-party services (incorporating credit/debit card processors, UPI systems, Net Banking, and wallet providers). Fabrication starts only after transaction confirmations are compiled.</li>
            </ul>
          </div>

          {/* Card 6: Shipping Logistics */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <Truck className="w-6 h-6 text-gold" />
              6. Shipping and Delivery
            </h2>
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                Delivery timelines are typical estimates of 3-5 business days. Variations may emerge from complex customization processes, weather patterns, courier service breakdowns, or national holidays.
              </p>
              <p>
                Customers are solely responsible for writing correct shipping labels, email IDs, and phone credentials. Any delivery failures occurring due to erroneous details are not our responsibility.
              </p>
            </div>
          </div>

          {/* Card 7: Cancellations & Return Policy */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold text-gold border-b border-border pb-4">
              7. Cancellations, Returns & Refunds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-bg/50 p-5 rounded-2xl border border-border space-y-2">
                <span className="text-amber-400 font-bold block">Cancellation Lock-Ins</span>
                <p className="text-xs text-muted leading-relaxed">
                  Standard items can be canceled freely prior to transit. However, custom prints and personalized wood frames cannot be canceled once fabrication begins (design moves past “Design Under Review”).
                </p>
              </div>
              <div className="bg-bg/50 p-5 rounded-2xl border border-border space-y-2">
                <span className="text-emerald-400 font-bold block">Damages & Defects</span>
                <p className="text-xs text-muted leading-relaxed">
                  Due to their custom tailoring, returns are only accepted for severe transit damages, defects, or incorrect deliveries. Claim requests must be raised within <b>48 hours of delivery</b> alongside photographic evidence.
                </p>
              </div>
            </div>
          </div>

          {/* Card 8: Legal Clauses */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold text-gold border-b border-border pb-4">
              8. Intellectual Property & Liability limits
            </h2>
            <div className="space-y-4 text-sm text-muted leading-relaxed">
              <p>
                <strong className="text-white">IP Ownership:</strong> All custom code, design modules, visual graphics, frames, layout grids, text, vectors, logos, and UI brand graphics of our workshop are protected by international Intellectual Property laws. Unauthorized replication or extraction is prohibited.
              </p>
              <p>
                <strong className="text-white">Prohibited Activities:</strong> Users shall not attempt unauthorized backend breaches, inject scripts, distribute malware, or disrupt the performance of our customization engines.
              </p>
              <p>
                <strong className="text-white">Limitation of Liability:</strong> Personalized Gift Shop, its founders, and employees will not be held liable for any indirect, consequential, or auxiliary damages, nor are we responsible for transit errors or variance in screen calibrations (minor shifts from virtual rendering to printed ink). Our maximum financial commitment is restricted to the specific sum processed for the disputed order.
              </p>
            </div>
          </div>

          {/* Card 9: Governing Law */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <Terminal className="w-6 h-6 text-gold" />
              9. Governing Law
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              These Terms and Conditions shall be governed by and interpreted in accordance with the laws of <strong className="text-white">India</strong>. Any disputes arising from these Terms or use of our gift studio shall be subject to the exclusive jurisdiction of the courts located in <strong className="text-white">Bihar, India</strong>.
            </p>
          </div>

          {/* Contact Section */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4 text-center">
            <HelpCircle className="w-8 h-8 text-gold mx-auto" />
            <h3 className="text-2xl font-bold text-gold">Any doubts on our terms?</h3>
            <p className="text-sm text-muted max-w-xl mx-auto">
              Please connect directly with our support help desk through email or phone lines for rapid clarification:
            </p>
            <div className="p-4 bg-bg/50 rounded-2xl border border-border inline-block text-left text-xs space-y-1.5 font-mono">
              <p className="text-white">📧 <span className="text-muted">Email:</span> <a href="mailto:Suryafilmsservices@gmail.com" className="hover:text-gold text-white underline">Suryafilmsservices@gmail.com</a></p>
              <p className="text-white">📞 <span className="text-muted">Phone:</span> +91 79797 12803 / +91 99344 35453</p>
              <p className="text-white">📍 <span className="text-muted">Address:</span> Bhagwanpur, Muzaffarpur, Bihar, India - 842001</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
