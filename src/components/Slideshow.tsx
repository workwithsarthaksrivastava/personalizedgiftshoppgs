import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultImages = [
  '/welcome.png',
  '/enterprise.png',
  '/wholesale.png',
];

export default function Slideshow() {
  const [images, setImages] = useState<string[]>(defaultImages);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/slideshow-images');
        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images.length > 0) {
            setImages(data.images);
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic slideshow:', err);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl aspect-[21/9] md:aspect-[3/1] bg-surface">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </AnimatePresence>
      
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10 transition-colors">
            <ChevronLeft />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10 transition-colors">
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  );
}
