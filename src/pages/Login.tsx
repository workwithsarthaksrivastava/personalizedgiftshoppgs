import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error('You must agree to the Terms of Service and Privacy Policy to proceed');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data?.user && name.trim()) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: data.user.id,
                full_name: name,
                email: email,
                role: 'customer',
              }
            ], { onConflict: 'id' });
          if (profileError) console.error('Error syncing profile:', profileError);
        }
        
        toast.success(`Welcome back, ${name || 'User'}!`);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              full_name: name,
              email: email,
              role: 'customer',
            },
          ]);
          if (profileError) console.error('Error creating profile:', profileError);
        }
        
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md glass p-8 md:p-12 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-gold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted text-sm">
            {isLogin ? 'Sign in to manage your orders' : 'Join us to start creating memories'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Full Name</label>
            <div className="relative">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl pl-12 pr-4 py-3 focus:border-gold outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl pl-12 pr-4 py-3 focus:border-gold outline-none transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl pl-12 pr-12 py-3 focus:border-gold outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input 
              type="checkbox"
              id="agree_terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border text-gold bg-bg accent-gold cursor-pointer shrink-0"
              required
            />
            <label htmlFor="agree_terms" className="text-xs text-muted leading-relaxed cursor-pointer select-none">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="text-gold font-bold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" target="_blank" className="text-gold font-bold hover:underline">
                Privacy Policy
              </Link>.
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <LogIn className="w-5 h-5" />}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-muted">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gold font-bold hover:underline"
          >
            {isLogin ? 'Register Now' : 'Login Here'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
