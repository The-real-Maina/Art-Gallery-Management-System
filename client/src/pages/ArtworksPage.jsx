import { useEffect, useState } from 'react';
import { Palette, Search, Heart, MessageCircle, LoaderCircle, Filter, CheckCircle, X } from 'lucide-react';
import api from '../services/api';
import PublicNavbar from '../components/PublicNavbar';
import Lightbox from '../components/Lightbox';

function ArtworksPage() {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  const [artworks, setArtworks] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [artistFilter, setArtistFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const [inquiryArtwork, setInquiryArtwork] = useState(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artRes, favRes] = await Promise.all([
          api.get('/artworks/public'),
          user?.role === 'Art Collector' ? api.get('/collectors/favourites') : Promise.resolve({ data: { favourites: [] } })
        ]);
        setArtworks(artRes.data.artworks || []);
        setFavourites(favRes.data.favourites || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]); // Added user?.role here to fix ESLint warning

  const handleToggleFavourite = async (e, artworkId) => {
    e.stopPropagation();
    if (!user) return alert('Please log in to save artworks.');
    if (user.role !== 'Art Collector') return alert('Only Art Collectors can save favourites.');

    const existingFav = favourites.find(f => f.artwork_id === artworkId);
    try {
      if (existingFav) await api.delete(`/collectors/favourites/${existingFav.favourite_id}`);
      else await api.post('/collectors/favourites', { artwork_id: artworkId });
      
      const response = await api.get('/collectors/favourites');
      setFavourites(response.data.favourites || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Could not update favourites.');
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    setInquiryLoading(true);
    try {
      await api.post('/collectors/inquiries', { artwork_id: inquiryArtwork.artwork_id, message: inquiryMessage });
      setInquirySuccess('Inquiry sent! The gallery will contact you soon.');
      setTimeout(() => { setInquiryArtwork(null); setInquiryMessage(''); setInquirySuccess(''); }, 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send inquiry.');
    } finally {
      setInquiryLoading(false);
    }
  };

  const categories = ['All', ...new Set(artworks.map((a) => a.category).filter(Boolean))];
  const uniqueArtists = ['All', ...new Set(artworks.map(a => a.artist_name).filter(Boolean))];

  const filteredArtworks = artworks.filter((a) => {
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    const matchesArtist = artistFilter === 'All' || a.artist_name === artistFilter;
    const term = search.toLowerCase();
    const matchesSearch = (a.title || '').toLowerCase().includes(term) || (a.artist_name || '').toLowerCase().includes(term);
    return matchesCategory && matchesArtist && matchesSearch;
  });

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', paddingBottom: '80px' }}>
      <PublicNavbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <div className="section-heading" style={{ marginBottom: '30px' }}>
          <div>
            <span className="eyebrow">CURATED FOR YOU</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', margin: '10px 0' }}>Explore the <em>collection.</em></h1>
          </div>
        </div>

        <div className="collection-tools" style={{ marginBottom: '40px' }}>
          <div className="category-tabs">
            {categories.map((c) => <button key={c} className={activeCategory === c ? 'category-tab active' : 'category-tab'} onClick={() => setActiveCategory(c)}>{c}</button>)}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ padding: '0 10px' }}>
              <Filter size={17} style={{ color: '#a47745' }} />
              <select value={artistFilter} onChange={(e) => setArtistFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', padding: '10px 5px', color: '#25231f', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                {uniqueArtists.map(artist => <option key={artist} value={artist}>{artist === 'All' ? 'All Artists' : artist}</option>)}
              </select>
            </div>
            <div className="search-box">
              <Search size={17} />
              <input type="search" placeholder="Search artworks..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><LoaderCircle size={30} className="animate-spin" style={{ margin: '0 auto', color: '#a47745' }} /></div>
        ) : filteredArtworks.length === 0 ? (
          <div className="dashboard-empty"><Palette size={30} /><h3>No artworks found</h3></div>
        ) : (
          <div className="artwork-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filteredArtworks.map((artwork, index) => {
              const isFav = favourites.some(f => f.artwork_id === artwork.artwork_id);
              return (
                <article className="artwork-card" key={artwork.artwork_id} onClick={() => setLightboxIndex(index)} style={{ cursor: 'pointer' }}>
                  <div className="artwork-image">
                    <img src={artwork.image_url} alt={artwork.title} loading="lazy" />
                    <button className={`favorite-button ${isFav ? 'selected' : ''}`} onClick={(e) => handleToggleFavourite(e, artwork.artwork_id)}>
                      <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                    </button>
                    <span className="artwork-category">{artwork.category || 'Artwork'}</span>
                  </div>
                  <div className="artwork-info">
                    <div><h3>{artwork.title}</h3><p>By {artwork.artist_name}</p></div>
                    <strong>KES {Number(artwork.price).toLocaleString()}</strong>
                  </div>
                  {user?.role === 'Art Collector' && (
                    <button onClick={(e) => { e.stopPropagation(); setInquiryArtwork(artwork); }} className="text-button" style={{ marginTop: '10px', color: '#a47745', width: '100%', justifyContent: 'center', border: '1px solid #e8e3da', padding: '8px', background: 'transparent' }}>
                      <MessageCircle size={15} /> Inquire to Purchase
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {inquiryArtwork && (
        <div className="dashboard-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="booking-card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setInquiryArtwork(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '10px' }}>Inquire about artwork</h2>
            <p style={{ color: '#777168', marginBottom: '20px', fontSize: '14px' }}>You are inquiring about <strong>{inquiryArtwork.title}</strong>.</p>
            {inquirySuccess ? (
              <div className="booking-message success"><CheckCircle size={18} /> {inquirySuccess}</div>
            ) : (
              <form onSubmit={handleSendInquiry}>
                <div className="booking-field">
                  <label>Message to Gallery</label>
                  <textarea rows="4" required placeholder="I am interested in purchasing this artwork..." value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} />
                </div>
                <button type="submit" className="primary-button" disabled={inquiryLoading} style={{ width: '100%' }}>{inquiryLoading ? 'Sending...' : 'Send Inquiry'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {lightboxIndex !== null && <Lightbox artworks={filteredArtworks} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />}
    </div>
  );
}

export default ArtworksPage;