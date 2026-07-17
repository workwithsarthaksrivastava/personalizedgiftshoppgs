import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAlbumViewer = location.pathname.startsWith('/album/');
  
  if (isAlbumViewer) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
