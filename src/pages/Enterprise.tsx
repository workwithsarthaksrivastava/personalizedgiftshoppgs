import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, MessageSquare, Phone, ArrowUpRight, Check, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Enterprise() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    product: 'Acrylic Photo Frames',
    quantity: '50-100 units',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.company) {
      toast.error('Please fill in all required fields (Name, Company, Phone)');
      return;
    }

    setLoading(true);
    toast.loading('Preparing your custom corporate quote...', { id: 'enterprise-quote' });

    // Structure a highly polished WhatsApp message
    const formattedMessage = `*Enterprise Bulk Order Query* 
-------------------------------
👤 *Contact Name*: ${formData.name}
🏢 *Company/Org*: ${formData.company}
📞 *Phone/WA*: ${formData.phone}
✉️ *Email*: ${formData.email || 'N/A'}
📦 *Product of Interest*: ${formData.product}
📊 *Estimated Qty*: ${formData.quantity}

📝 *Customization Request/Notes*:
"${formData.notes || 'No specific requests mentioned, please contact us for custom styling assistance.'}"

-------------------------------
_Submitted via Personalized Gift Shop Enterprise Portal_`;

    const encodedMessage = encodeURIComponent(formattedMessage);
    const whatsappUrl = `https://wa.me/917979712803?text=${encodedMessage}`;

    setTimeout(() => {
      setLoading(false);
      toast.success('Quote compiled! Redirecting you to WhatsApp...', { id: 'enterprise-quote' });
      
      // Redirect to WhatsApp
      window.open(whatsappUrl, '_blank');
    }, 1200);
  };

  const sampleClients = [
    { name: 'Corporate Gifts', icon: <Building2 className="w-5 h-5 text-gold" />, desc: 'Custom branding & embossed corporate layouts for premium business gifting.' },
    { name: 'Wedding Favors', icon: <Sparkles className="w-5 h-5 text-gold" />, desc: 'Personalized premium wood plaque stands & luxury UV photo print souvenirs.' },
    { name: 'Merchandising', icon: <MessageSquare className="w-5 h-5 text-gold" />, desc: 'Bulk sublimation photo mugs & personalized metallic keepsakes for retail.' },
  ];

  return (
    <div className="pt-32 pb-24 px-6 bg-bg min-h-screen">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> Corporate & Bulk Partnerships
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
            Elevate Gifting at <span className="text-gold">Scale</span>
          </h1>
          <p className="text-sm md:text-base text-muted font-light leading-relaxed">
            Get high-fidelity custom photo frames, dynamic UV acrylic prints, and sublimation gifts handcrafted in bulk for your company, corporate events, weddings, or branding drives.
          </p>
        </div>

        {/* Info Grid & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Side: Enterprise Benefits & Key Highlights */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Why Partner With Us?</h2>
              <p className="text-xs text-muted leading-relaxed font-light">
                We are Muzaffarpur's premier service for premium UV printing and custom gifts, delivering flawless craftsmanship at scale with state-of-the-art machinery.
              </p>
            </div>

            <div className="space-y-4">
              {sampleClients.map((benefit, idx) => (
                <div key={idx} className="glass p-5 rounded-2xl border border-white/5 space-y-2 hover:border-gold/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                      {benefit.icon}
                    </div>
                    <h3 className="font-bold text-sm text-white">{benefit.name}</h3>
                  </div>
                  <p className="text-xs text-muted font-light leading-relaxed pl-12">{benefit.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Guarantees bar */}
            <div className="p-5 bg-gold/[0.02] border border-gold/15 rounded-3xl space-y-3.5">
              <h4 className="text-[11px] font-bold uppercase text-gold tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Bulk Order Service Agreements
              </h4>
              <ul className="text-xs text-white/80 space-y-2 font-light">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Discounted wholesale pricing tiers matching your quantity specs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Interactive proofing & customized digital mockups before bulk casting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Express priority shipping across India with extreme protective packing.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side: High-End Bulk Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="glass p-8 md:p-10 rounded-[32px] border border-white/10 relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-44 h-44 bg-gold/5 blur-3xl rounded-full" />
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Request an Enterprise Quote</h3>
                <p className="text-xs text-muted font-light leading-relaxed">
                  Provide your organization and requirement details below. Submitting will instantly compile your quote specs and hand off directly to our owner on WhatsApp for personal attention.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">Name *</label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 placeholder-white/25 font-light"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">Company / Inst *</label>
                    <input
                      required
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Google India / Apex Group"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 placeholder-white/25 font-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">WhatsApp or Phone *</label>
                    <input
                      required
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 99999 88888"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 placeholder-white/25 font-light"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">Email address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. partner@company.com"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 placeholder-white/25 font-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">Product of Interest</label>
                    <select
                      name="product"
                      value={formData.product}
                      onChange={handleChange}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 cursor-pointer font-light"
                    >
                      <option value="Acrylic Photo Frames">Premium Acrylic Photo Frames</option>
                      <option value="UV Custom Plaques">Custom UV Printed Plaques</option>
                      <option value="Sublimation Mugs & Gifts">Sublimation Mugs & Keychains</option>
                      <option value="Wooden LED Nightlights">Wooden Glow LED Base Stands</option>
                      <option value="Hardbound Premium Album-Books">Luxury Layflat Photo Albums</option>
                      <option value="Assorted Multi-Category Gifts">Multiple / Assorted Products</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">Estimate Quantity</label>
                    <select
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 cursor-pointer font-light"
                    >
                      <option value="25-50 units">25 to 50 items</option>
                      <option value="50-100 units">50 to 100 items</option>
                      <option value="100-250 units">100 to 250 items</option>
                      <option value="250-500 units">250 to 500 items</option>
                      <option value="500-1000 units">500 to 1,000 items</option>
                      <option value="1000+ units">More than 1,000 items</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 block">Message & Customization details</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe any particular sizing needs, logo placements, delivery deadlines, or questions you have..."
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 placeholder-white/25 resize-none font-light"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gold text-bg font-black rounded-xl hover:scale-[1.02] active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 mt-2 shadow-lg hover:shadow-gold/10"
                >
                  <span>Submit Inquiry and Redirect to WhatsApp</span>
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </form>

              {/* Secure partner badge */}
              <div className="flex items-center justify-center gap-2.5 text-white/40 text-[10px] font-medium pt-3 text-center border-t border-white/5">
                <p>⚡ High-priority dispatch and instant reply guarantees for active bulk accounts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
