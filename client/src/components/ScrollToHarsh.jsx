// src/components/ScrollToHash.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    // If there is no hash, scroll to the top of the page on route change
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    // If there is a hash (e.g., #artworks), wait a tiny bit for the DOM to render, then scroll
    const id = hash.replace('#', '');
    const element = document.getElementById(id);
    
    if (element) {
      // Small timeout ensures the element is fully rendered before scrolling
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      }, 100); 
    }
  }, [hash, pathname]);

  return null;
}

export default ScrollToHash;