import React from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
    toast.success("Message sent! We'll get back to you soon.");
    reset();
  };

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gold mb-4">Contact Us</h1>
          <p className="text-xl text-white font-bold mb-2">Personalized Gift Shop Muzaffarpur</p>
          <p className="text-md text-white/90 mb-4">Customized Gifts, Photo Frames, Albums, Sublimation Products & Corporate Gifts</p>
          <p className="text-sm text-muted max-w-2xl mx-auto mb-6">
            Personalized Gift Shop Muzaffarpur is a gifting and customization business operated by Surya Films Services.
          </p>
        </div>

        <div className="glass p-8 mb-12 rounded-3xl max-w-4xl mx-auto border border-gold/20">
          <h2 className="text-2xl font-bold text-gold mb-4">Business Identity Details</h2>
          <div className="space-y-2 text-sm text-white/90">
            <p><strong className="text-white">Business Name:</strong> Personalized Gift Shop Muzaffarpur</p>
            <p><strong className="text-white">Email:</strong> <a href="mailto:suryafilmsservices@gmail.com" className="text-gold">suryafilmsservices@gmail.com</a></p>
            <p><strong className="text-white">Phone:</strong> +91 79797 12803</p>
            <p><strong className="text-white">Address:</strong> New Market, Chowk, Near Bihar Jalpan, Shrirampuri, Bhagwanpur, Muzaffarpur, Bihar – 842001, India</p>
            <p><strong className="text-white">Website:</strong> www.personalizedgiftshop.in</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="glass p-6 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-gold/10 rounded-xl text-gold"><Phone className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold mb-1">Call Us</h4>
                  <p className="text-sm text-muted">+91 79797 12803</p>
                  <p className="text-sm text-muted">+91 99344 35453</p>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-gold/10 rounded-xl text-gold"><Mail className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold mb-1">Email Us</h4>
                  <p className="text-sm text-muted">suryafilmsservices@gmail.com</p>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl flex items-start gap-4 sm:col-span-2">
                <div className="p-3 bg-gold/10 rounded-xl text-gold"><MapPin className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold mb-1">Visit Us</h4>
                  <p className="text-sm text-muted">
                    New Market, Chowk, Near Bihar Jalpan,<br/>Shrirampuri, Bhagwanpur,<br/>Muzaffarpur, Bihar – 842001, India
                  </p>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl flex items-start gap-4 sm:col-span-2">
                <div className="p-3 bg-gold/10 rounded-xl text-gold"><Clock className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold mb-1">Business Hours</h4>
                  <p className="text-sm text-muted">Mon–Sat: 9:00 AM – 8:00 PM</p>
                  <p className="text-sm text-muted">Sunday: 10:00 AM – 5:00 PM</p>
                  <p className="text-sm text-muted mt-2"><strong>Response Time:</strong> We typically respond to customer inquiries within 24–48 business hours.</p>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl flex items-start gap-4 sm:col-span-2">
                <div className="p-3 bg-gold/10 rounded-xl text-gold"><MessageCircle className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold mb-1">Order Support</h4>
                  <p className="text-sm text-muted">
                    For order inquiries, customization requests, refunds, cancellations, shipping updates, and payment-related concerns, please contact us via phone or email.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gold/5 border border-gold/20 rounded-3xl">
              <h3 className="text-2xl font-display font-bold text-gold mb-4 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" /> Quick Connect
              </h3>
              <p className="text-muted mb-6">Chat with us directly on WhatsApp for instant support and custom design discussions.</p>
              <a 
                href="https://wa.me/917979712803?text=Hello!%20I'm%20interested%20in%20your%20personalized%20gift%20services." 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-bold rounded-full hover:scale-105 transition-transform"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass p-8 md:p-12 rounded-3xl">
            <h3 className="text-3xl font-display font-bold text-gold mb-8">Send a Message</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Full Name*</label>
                  <input 
                    {...register('name', { required: true })}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                    placeholder="John Doe"
                  />
                  {errors.name && <span className="text-xs text-red-400">Required</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Phone Number*</label>
                  <input 
                    {...register('phone', { required: true })}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                    placeholder="+91 00000 00000"
                  />
                  {errors.phone && <span className="text-xs text-red-400">Required</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
                <input 
                  {...register('email')}
                  type="email"
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Service Needed</label>
                <select 
                  {...register('service')}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors appearance-none"
                >
                  <option value="Album">Album Printing</option>
                  <option value="Frame">Photo Frames</option>
                  <option value="UV">UV Printing</option>
                  <option value="Sublimation">Sublimation Gifts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Message*</label>
                <textarea 
                  {...register('message', { required: true, minLength: 20 })}
                  rows={4}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors resize-none"
                  placeholder="Tell us about your requirements..."
                />
                {errors.message && <span className="text-xs text-red-400">Min 20 characters required</span>}
              </div>

              <button 
                type="submit"
                className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                Send Message <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-16 text-center text-sm text-muted">
          Last Updated: 13 June 2026
        </div>
      </div>
    </div>
  );
}
