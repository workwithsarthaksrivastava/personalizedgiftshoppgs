import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, MapPin, Lock, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [navigate]);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-gold mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 glass p-6 rounded-2xl flex flex-col items-center">
            <div className="w-32 h-32 bg-gold/20 rounded-full flex items-center justify-center mb-4 relative">
              <User className="w-16 h-16 text-gold" />
              <button className="absolute bottom-2 right-2 bg-gold text-bg p-2 rounded-full">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</h2>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-gold"/> Personal Details</h3>
              <p className="text-muted">Username: {user?.user_metadata?.full_name || 'Not set'}</p>
              <button className="mt-2 text-gold underline text-sm">Edit Details</button>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-gold"/> Manage Addresses</h3>
              <p className="text-muted text-sm">No saved addresses.</p>
              <button className="mt-2 text-gold underline text-sm">Add Address</button>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-gold"/> Security</h3>
              <button className="text-gold underline text-sm">Change Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
