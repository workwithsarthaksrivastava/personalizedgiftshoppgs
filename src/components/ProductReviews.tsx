import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Star, Send, User, Upload, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  images?: string[];
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const getUserDisplayName = (user: any) => user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous';
  
  // Submit state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > 2) {
      toast.error('You can only upload up to 2 images');
      return;
    }
    setImages(prev => [...prev, ...acceptedFiles].slice(0, 2));
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': []},
    maxFiles: 2
  });

  useEffect(() => {
    fetchSession();
    fetchReviews();
  }, [productId]);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    // We optionally mock "hasPurchased" or actually check orders if it makes sense.
    // For simplicity, we can let any logged-in user review, but mark them as "Verified Buyer" in UI, 
    // or we could check the `orders` table. Since we don't have user routing, we will assume true for now
    // if authenticated for demonstration, or we can check the orders table.
    if (session?.user) {
      if (!(supabase as any).supabaseUrl.includes('placeholder')) {
         const { data, error } = await supabase
           .from('orders')
           .select('id')
           .eq('customer_id', session.user.id)
           // ideally we'd check if this product is in the order, but we can't easily query JSON column `items` like that.
           .limit(1);
         if (data && data.length > 0) {
           setHasPurchased(true);
         }
      }
    }
  };

  const fetchReviews = async () => {
    if ((supabase as any).supabaseUrl.includes('placeholder')) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setReviews(data);
        if (user) {
          const existing = data.find(r => r.user_id === user.id);
          setUserReview(existing || null);
          if (user.email === 'workwithsarthaksrivastava@gmail.com') setIsAdmin(true);
        }
      }
    } catch (e) {
      // table might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId);
    if (error) {
        toast.error('Failed to delete review');
    } else {
        toast.success('Review deleted');
        setReviews(reviews.filter(r => r.id !== reviewId));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to leave a review.');
      return;
    }
    if (userReview) {
        toast.error('You have already reviewed this product.');
        return;
    }
    if (!hasPurchased) {
        toast.error('You can only review products you have purchased.');
        return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    if ((supabase as any).supabaseUrl.includes('placeholder')) {
      // Setup mock review 
      const newReview: Review = {
        id: Math.random().toString(),
        user_id: user?.id || 'mock-id',
        user_name: getUserDisplayName(user),
        rating,
        comment,
        created_at: new Date().toISOString()
      };
      setReviews([newReview, ...reviews]);
      setRating(0);
      setComment('');
      toast.success('Review submitted successfully!');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('product_reviews').insert([{
        product_id: productId,
        user_id: user.id,
        user_name: getUserDisplayName(user),
        rating,
        comment
      }]);

      if (error) {
        // Fallback for missing table
        if (error.code === '42P01') {
          toast.info('Reviews table not created yet. Showing review locally.');
          const newReview: Review = {
            id: Math.random().toString(),
            user_id: user?.id || 'mock-id',
            user_name: getUserDisplayName(user),
            rating,
            comment,
            created_at: new Date().toISOString()
          };
          setReviews([newReview, ...reviews]);
          setRating(0);
          setComment('');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Review submitted successfully!');
        setRating(0);
        setComment('');
        fetchReviews();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  return (
    <div className="mt-20 pt-10 border-t border-white/10">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Rating Summary */}
        <div className="w-full md:w-1/3 space-y-6">
          <div>
            <h3 className="text-2xl font-display font-bold text-gold mb-2">Customer Reviews</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                {averageRating}
              </span>
              <div className="flex flex-col">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={cn(
                        "w-4 h-4", 
                        star <= Number(averageRating) ? "fill-gold text-gold" : "text-white/20"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-xs text-muted mt-1">{reviews.length} reviews</span>
              </div>
            </div>
          </div>

          {/* Write a review form */}
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h4 className="font-bold mb-4">Write a Review</h4>
            {!user ? (
               <div className="text-sm text-muted mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
                 Please <a href="/auth" className="text-gold underline underline-offset-2 font-bold">log in</a> to share your feedback.
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "w-6 h-6",
                          (hoverRating || rating) >= star ? "fill-gold text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "text-white/20"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold resize-none h-28 placeholder:text-muted/50"
                />
                
                <div {...getRootProps()} className={cn(
                    "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer",
                    isDragActive ? "border-gold bg-gold/10" : "border-white/10"
                )}>
                    <input {...getInputProps()} />
                    {images.length > 0 ? (
                        <div className="flex gap-2 justify-center">
                            {images.map((f, i) => (
                                <div key={i} className="relative">
                                    <span className="text-xs text-white">{f.name}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter((_, idx) => idx !== i)) }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5"><X className="w-3 h-3 text-white"/></button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted">Click or drag up to 2 images here</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 gold-gradient text-bg font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Post Review
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Review List */}
        <div className="w-full md:w-2/3">
          {loading ? (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="glass p-6 rounded-2xl border border-white/5 animate-pulse flex flex-col gap-4">
                   <div className="h-4 w-32 bg-white/10 rounded" />
                   <div className="h-4 w-full bg-white/10 rounded" />
                   <div className="h-4 w-2/3 bg-white/10 rounded" />
                 </div>
               ))}
             </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] glass rounded-3xl border border-white/5 bg-white/[0.02]">
              <Star className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-muted font-bold text-center">No reviews yet.</p>
              <p className="text-xs text-muted/50 text-center mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {reviews.map((review) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                          <User className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-wide">{review.user_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={cn(
                                    "w-3 h-3",
                                    star <= review.rating ? "fill-gold text-gold" : "text-white/20"
                                  )} 
                                />
                              ))}
                            </div>
                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted whitespace-nowrap">
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {isAdmin && (
                        <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed font-light">
                      {review.comment}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
