import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Col 1 */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
              <Sun className="text-bg w-5 h-5" />
            </div>
            <span className="font-display text-xl font-bold text-gold">Personalized Gift Shop</span>
          </Link>
          <p className="text-muted text-sm italic">
            "Aapki Yadon Ko Milta Hai Naya Roop"
          </p>
          <p className="text-muted text-sm">
            Premium custom photo frames, UV prints, and personalized gifts crafted for every moment.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-display text-lg font-bold text-gold mb-6">Quick Links</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            <li><Link to="/" className="hover:text-gold transition-colors">Home</Link></li>
            <li><Link to="/products" className="hover:text-gold transition-colors">Products</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            <li><Link to="/track" className="hover:text-gold transition-colors">Track Order</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="font-display text-lg font-bold text-gold mb-6">Contact Info</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            <li>+91 79 7971 2803</li>
            <li>+91 99 3443 5453</li>
            <li>Suryafilmsservices@gmail.com</li>
            <li className="leading-relaxed">
              New Market, Chowk, near Bihar Jalpan,<br />
              Shrirampuri, Bhagwanpur, Muzaffarpur,<br />
              Bihar — 842001
            </li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="font-display text-lg font-bold text-gold mb-6">Follow Us</h4>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:text-bg transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:text-bg transition-all">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:text-bg transition-all">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://wa.me/917979712803" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:text-bg transition-all">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted">
        <p>© 2025 Personalized Gift Shop · All Rights Reserved</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>

      {/* WhatsApp Float */}
      <a
        href="https://wa.me/917979712803"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40"
      >
        <MessageCircle className="text-white w-8 h-8" />
      </a>
    </footer>
  );
}
