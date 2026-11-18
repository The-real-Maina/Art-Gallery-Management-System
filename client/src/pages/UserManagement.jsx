import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, LoaderCircle, Compass, Filter } from 'lucide-react';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

function Home() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);
  
  // Filter State
  const [artistFilter, setArtistFilter] = useState('All');

  useEffect(() => {
    const loadArtworks = async () => {
      try {
        const res = await api.get('/artworks/public');
        setArtworks(res.data.artworks || []);
      } catch (err) {
        console.error('Failed to load artworks', err);
      } finally {
        setLoading(false);
      }
    };
    loadArtworks();
  }, []);

  const uniqueArtists = ['All', ...new Set(artworks.map(a => a.artist_name))];
  const filteredArtworks = artistFilter === 'All' 
    ? artworks 
    : artworks.filter(a => a.artist_name === artistFilter);

  const user = JSON.parse(localStorage.getItem('art_gallery_user') || 'null');

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* HEADER */}
      <header style={{ padding: '25px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e3da', background: 'white' }}>
        <Link to="/" className="brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <div>
          {user ? (
            <Link to="/dashboard" className="primary-button" style={{ padding: '10px 20px' }}>Go to Dashboard</Link>
          ) : (
            <div style={{ display: 'flex', gap: '15px' }}>
              <Link to="/login" style={{ padding: '10px 20px', color: '#25231f', fontWeight: 'bold' }}>Sign In</Link>
              <Link to="/register" className="primary-button" style={{ padding: '10px 20px' }}>Create Account</Link>
            </div>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '80px 20px', background: '#25231f', color: 'white' }}>
        <span className="eyebrow" style={{ color: '#a47745' }}>WELCOME TO ARTISAN</span>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '56px', margin: '15px 0' }}>Discover Extraordinary <em style={{ color: '#a47745' }}>Art.</em></h1>
        <p style={{ color: '#bcb9b0', maxWidth: '600px', margin: '0 auto 30px' }}>Explore our curated collection of contemporary masterpieces from Africa's finest artists.</p>
        <Link to="/book-visit" className="primary-button" style={{ padding: '14px 30px', fontSize: '16px' }}>Plan a Gallery Visit</Link>
      </section>

      {/* ARTWORK GALLERY SECTION */}
      <section style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }} id="artworks">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="eyebrow">EXPLORE THE COLLECTION</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', margin: 0 }}>Featured Artworks</h2>
          </div>
          
          {/* ARTIST FILTER */}
          {artworks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e8e3da' }}>
              <Filter size={18} style={{ color: '#a47745' }} />
              <select 
                value={artistFilter} 
                onChange={e => setArtistFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: '#25231f', fontWeight: 'bold' }}
              >
                {uniqueArtists.map(artist => <option key={artist} value={artist}>{artist}</option>)}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <LoaderCircle size={40} className="animate-spin" style={{ color: '#a47745', margin: '0 auto' }} />
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="dashboard-empty" style={{ background: 'white', borderRadius: '12px', padding: '60px' }}>
            <Compass size={48} style={{ color: '#a47745', margin: '0 auto 15px' }} />
            <h3>No artworks found</h3>
            <p>There are currently no artworks to display for this filter.</p>
          </div>
        ) : (
          /* THE GALLERY GRID */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {filteredArtworks.map((art, index) => (
              <div 
                key={art.artwork_id} 
                onClick={() => setLightboxIndex(index)}
                style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e8e3da', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '300px', overflow: 'hidden' }}>
                  <img src={art.image_url} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', margin: '0 0 5px 0' }}>{art.title}</h3>
                  <p style={{ color: '#a47745', fontWeight: 'bold', fontSize: '14px', margin: '0 0 15px 0' }}>{art.artist_name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0ede6', paddingTop: '15px' }}>
                    <span style={{ fontSize: '13px', color: '#777168' }}>{art.category}</span>
                    <span style={{ fontWeight: 'bold', color: '#25231f' }}>KES {Number(art.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LIGHTBOX OVERLAY */}
      {lightboxIndex !== null && (
        <Lightbox 
          artworks={filteredArtworks} 
          index={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
          onNavigate={setLightboxIndex} 
        />
      )}
    </div>
  );
}

export default Home;