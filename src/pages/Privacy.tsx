import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, FileText, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex p-3 bg-gold/10 rounded-full text-gold mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-gold mb-4">Privacy Policy</h1>
          <p className="text-muted">
            Last Updated: June 10, 2026
          </p>
          <p className="text-muted max-w-2xl mx-auto mt-2">
            Welcome to <span className="text-white font-medium">Personalized Gift Shop</span> (operated under the legal entity <span className="text-gold font-medium">Surya Films Services</span>). This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit <span className="text-gold font-medium">personalizedgiftshoppgs.vercel.app</span> and use our services.
          </p>
        </div>

        {/* content in grid or single block with card-like structures */}
        <div className="space-y-8">
          
          {/* Card 1: Information We Collect */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-3xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <FileText className="w-6 h-6 text-gold" />
              1. Information We Collect
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Personal Information</h3>
              <p className="text-sm text-muted leading-relaxed">
                We may collect the following information when you place an order, contact us, or use our services:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/80">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Full Name</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Email Address</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Phone Number</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Shipping & Billing Address</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Payment Information (secure third-party gateways)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Uploaded Photos, Images, or Design Files for personalization</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold shrink-0" /> Messages or customization instructions</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="text-xl font-bold text-white">Automatically Collected Information</h3>
              <p className="text-sm text-muted leading-relaxed">
                When you visit our website, we may automatically collect standard details such as IP address, browser type, device information, operating system, pages visited, date and time of access, and referral URLs to help analyze traffic and optimize shop performance.
              </p>
            </div>
          </div>

          {/* Card 2: How We Use Your Information */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-3xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <CheckCircle className="w-6 h-6 text-gold" />
              2. How We Use Your Information
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              We process and utilize your data strictly in pursuit of delivering stellar personalized products:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Process and fulfill customized product orders",
                "Create customized photo frames, albums, and sublimations",
                "Coordinate shipping, delivery, and tracking board updates",
                "Communicate regarding order approvals & support requests",
                "Enhance overall website speed and user customization interface",
                "Comply with legal obligations and prevent transaction fraud"
              ].map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-bg/40 rounded-xl border border-border/40">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{index + 1}</span>
                  <span className="text-sm text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Uploaded Content Security */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-3xl font-bold text-gold flex items-center gap-3 border-b border-border pb-4">
              <Lock className="w-6 h-6 text-gold" />
              3. Uploaded Content
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              When you upload photographs, custom artwork, corporate logos, or any other files for customization at our workshop:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
              <li><strong className="text-white">Content Ownership:</strong> You retain complete ownership and intellectual rights of your content.</li>
              <li><strong className="text-white">Sole Use:</strong> You grant us permission to use the uploaded content solely for producing, printing, and delivering your specific personalized products.</li>
              <li><strong className="text-white">No Exploitation:</strong> We never sell, distribute, or commercially exploit your uploaded creative photographs or design files without your prior explicit consent.</li>
            </ul>
          </div>

          {/* Card 4: Payments & Cookies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold text-gold border-b border-border pb-2">4. Payment Security</h3>
              <p className="text-sm text-muted leading-relaxed">
                Payments are processed securely through Razorpay. We do not store credit/debit card details on our servers. All transactions are securely routed through certified payment providers, and these processors handle your data strictly in compliance with standard security protocols.
              </p>
            </div>
            
            <div className="glass p-8 rounded-3xl space-y-4">
              <h3 className="text-xl font-bold text-gold border-b border-border pb-2">5. Cookies & Tracking</h3>
              <p className="text-sm text-muted leading-relaxed">
                We utilize cookies to improve user experience, elevate website responsiveness, maintain your persistent cart state between browser tabs, and analyze basic traffic. You hold the right to disable web cookies via your native browser preferences.
              </p>
            </div>
          </div>

          {/* Card 5: Information Disclosure & Security */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-3xl font-bold text-gold border-b border-border pb-4">
              6. Data Sharing & Security
            </h2>
            <div className="space-y-4 text-sm text-muted leading-relaxed">
              <p>
                <strong className="text-white">Data Sharing:</strong> We do not sell customer information. Information may be shared only with shipping partners and payment processors (such as Razorpay) strictly for order fulfillment.
              </p>
              <p>
                <strong className="text-white">Robust Data Protection:</strong> We implement practical electronic protections and secure connections to prevent loss, misuse, or alteration. Please do recognize that complete online packet transmission is subject to web factors.
              </p>
              <p>
                <strong className="text-white">Retention Limits:</strong> We hold personal identifiers, like purchase ledger profiles, only as required to resolve queries, complete shipping tasks, or verify guarantees. Custom photo assets may be cleaned up periodically from production queues.
              </p>
            </div>
          </div>

          {/* Card 6: Your Rights */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-4">
            <h2 className="text-3xl font-bold text-gold border-b border-border pb-4">
              7. Your Rights
            </h2>
            <p className="text-sm text-muted leading-relaxed font-light">
              You maintain full permissions to inspect the personal logs we register for your account. You possess the rights to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-bg/40 p-4 rounded-2xl border border-border/80">
                <span className="block text-gold font-bold mb-1">Access</span>
                <span className="text-xs text-muted">Request summary files of raw records held</span>
              </div>
              <div className="bg-bg/40 p-4 rounded-2xl border border-border/80">
                <span className="block text-gold font-bold mb-1">Correct</span>
                <span className="text-xs text-muted">Acknowledge name or delivery mistakes</span>
              </div>
              <div className="bg-bg/40 p-4 rounded-2xl border border-border/80">
                <span className="block text-gold font-bold mb-1">Erase</span>
                <span className="text-xs text-muted">Purge personal images from backup systems</span>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="glass p-8 md:p-10 rounded-3xl space-y-6">
            <h2 className="text-3xl font-bold text-gold border-b border-border pb-4 w-full">8. Contact Information</h2>
            <div className="space-y-2 text-sm text-white/90">
              <p className="font-bold text-white">Personalized Gift Shop Muzaffarpur (Surya Films Services)</p>
              <p>Email: <a href="mailto:Suryafilmsservices@gmail.com" className="text-gold">Suryafilmsservices@gmail.com</a></p>
              <p>Phone: +91 79797 12803</p>
              <p>Address: New Market, Chowk, near Bihar Jalpan, Shrirampuri, Bhagwanpur, Muzaffarpur, Bihar, India — 842001</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
