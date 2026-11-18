import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Lightbox({ artworks, index, onClose, onNavigate }) {
  const art = artworks[index];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(index - 1);
      if (e.key === 'ArrowRight') onNavigate(index + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, onClose, onNavigate]);

  if (!art) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(5px)'
      }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px', borderRadius: '50%' }}>
        <X size={24} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
        disabled={index === 0}
        style={{ position: 'absolute', left: 20, color: '#fff', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '15px', borderRadius: '50%', opacity: index === 0 ? 0.3 : 1 }}
      >
        <ChevronLeft size={30} />
      </button>

      <div onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '90vw', maxHeight: '90vh' }}>
        <img src={art.image_url} alt={art.title} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
        <h3 style={{ color: '#fff', marginTop: 20, fontFamily: 'Playfair Display, serif', fontSize: '28px' }}>{art.title}</h3>
        <p style={{ color: '#ccc', fontSize: '15px', marginTop: '5px' }}>by {art.artist_name} • {art.medium || 'Mixed Media'} • {art.creation_year}</p>
        <p style={{ color: '#a47745', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>KES {Number(art.price).toLocaleString()}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
        disabled={index === artworks.length - 1}
        style={{ position: 'absolute', right: 20, color: '#fff', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '15px', borderRadius: '50%', opacity: index === artworks.length - 1 ? 0.3 : 1 }}
      >
        <ChevronRight size={30} />
      </button>
    </div>
  );
}