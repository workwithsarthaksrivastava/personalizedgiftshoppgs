import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown, ShieldCheck, Truck, Palette, Award, Package, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const features = [
    { icon: <Award className="w-8 h-8 text-gold" />, title: "Premium Quality", desc: "UV-resistant, scratch-proof, glossy finish" },
    { icon: <Palette className="w-8 h-8 text-gold" />, title: "50+ Frame Designs", desc: "Mix and match to find your perfect look" },
    { icon: <Truck className="w-8 h-8 text-gold" />, title: "Fast Delivery", desc: "Order today, doorstep delivery across India" },
    { icon: <ShieldCheck className="w-8 h-8 text-gold" />, title: "Custom Printing", desc: "Your photo, your design — exactly as imagined" },
    { icon: <Package className="w-8 h-8 text-gold" />, title: "Durable Materials", desc: "Acrylic, Glass, Wood, Metal options available" },
    { icon: <Clock className="w-8 h-8 text-gold" />, title: "Easy Tracking", desc: "Real-time order status updates" },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center px-6">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ 
            backgroundImage: 'url("https://picsum.photos/seed/gifts/1920/1080?blur=4")',
            filter: 'brightness(0.3)'
          }}
        />
        
        <div className="relative z-10 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-hero text-gold leading-tight mb-6"
          >
            Your Memories, Reimagined.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Custom photo frames, UV prints, and personalized gifts crafted for every moment.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              to="/products" 
              className="px-8 py-4 gold-gradient text-bg font-bold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Explore Products <ArrowRight className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="px-8 py-4 border border-gold text-gold font-bold rounded-full hover:bg-gold hover:text-bg transition-all flex items-center justify-center gap-2"
            >
              Know More <ChevronDown className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {['Album Printing', 'Photo Frames', 'UV Printing', 'Sublimation Gifts'].map((service) => (
              <Link 
                key={service}
                to={`/products#${service.toLowerCase().replace(' ', '-')}`}
                className="px-6 py-3 glass rounded-full text-white/90 hover:text-gold hover:border-gold transition-all"
              >
                {service}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">Why Choose Us</h2>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="p-8 glass rounded-2xl flex flex-col items-center text-center gap-4"
              >
                <div className="p-4 bg-gold/10 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-muted text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Highlight Section */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gold mb-4">Premium Pricing</h2>
            <p className="text-muted">Best quality at competitive rates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="glass p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gold mb-6 border-b border-border pb-4">Acrylic Photo Frames</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-muted border-b border-border">
                      <th className="pb-4">Size</th>
                      <th className="pb-4">2MM</th>
                      <th className="pb-4">3MM</th>
                      <th className="pb-4">5MM</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    <tr className="border-b border-border/50"><td className="py-4">8×12</td><td>₹525</td><td>₹700</td><td>₹1000</td></tr>
                    <tr className="border-b border-border/50"><td className="py-4">12×18</td><td>₹1125</td><td>₹1500</td><td>₹2000</td></tr>
                    <tr className="border-b border-border/50"><td className="py-4">16×20</td><td>₹1500</td><td>₹2000</td><td>₹2800</td></tr>
                    <tr><td className="py-4">20×30</td><td>—</td><td>₹3500</td><td>₹4500</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gold mb-6 border-b border-border pb-4">Slim LED Frames</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between"><span>8×12</span><span className="text-gold font-bold">₹1650</span></div>
                  <div className="flex justify-between"><span>12×18</span><span className="text-gold font-bold">₹2100</span></div>
                  <div className="flex justify-between"><span>16×24</span><span className="text-gold font-bold">₹3300</span></div>
                </div>
              </div>
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gold mb-6 border-b border-border pb-4">Wooden Printing</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between"><span>8×12</span><span className="text-gold font-bold">₹1200</span></div>
                  <div className="flex justify-between"><span>12×18</span><span className="text-gold font-bold">₹2000</span></div>
                  <div className="flex justify-between"><span>16×20</span><span className="text-gold font-bold">₹3500</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-6 bg-bg border-y border-border">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
          {['Secure Payments', 'Easy Returns', 'Pan-India Delivery', '100% Customizable', '5000+ Happy Customers'].map((badge) => (
            <span key={badge} className="text-sm font-bold tracking-widest uppercase">{badge}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
