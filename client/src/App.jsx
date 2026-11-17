import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Menu,
  X,
  Heart,
  Palette,
  CalendarDays,
  Users,
  LoaderCircle,
  AlertCircle,
  MessageCircle,
  CheckCircle,
  Globe
} from 'lucide-react';

import api from './services/api';
import NotificationBell from './components/NotificationBell';
import './index.css';

function imageUrl(id, width = 800) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Strictly validate the user object and clear stale data
  const [user] = useState(() => {
    try {
      const stored = localStorage.getItem('art_gallery_user');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (parsed && parsed.role) {
        return parsed;
      }
      
      // If parsed but missing role, it's invalid. Clear it.
      localStorage.removeItem('art_gallery_user');
      localStorage.removeItem('art_gallery_token');
      return null;
    } catch {
      localStorage.removeItem('art_gallery_user');
      localStorage.removeItem('art_gallery_token');
      return null;
    }
  });

  const [favourites, setFavourites] = useState([]);
  const [isFavouriteLoading, setIsFavouriteLoading] = useState(false);

  const [inquiryArtwork, setInquiryArtwork] = useState(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState('');

  const [artworks, setArtworks] = useState([]);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [artworkError, setArtworkError] = useState('');

  const [exhibitions, setExhibitions] = useState([]);
  const [loadingExhibitions, setLoadingExhibitions] = useState(true);

  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchArtworks = async () => {
      try {
        setLoadingArtworks(true);
        setArtworkError('');
        const response = await api.get('/artworks/public');
        if (isMounted) setArtworks(response.data.artworks || []);
      } catch {
        if (isMounted) setArtworkError('Unable to load artworks.');
      } finally {
        if (isMounted) setLoadingArtworks(false);
      }
    };

    const fetchExhibitions = async () => {
      try {
        setLoadingExhibitions(true);
        const response = await api.get('/exhibitions/public');
        if (isMounted) setExhibitions(response.data.exhibitions || []);
      } catch (err) {
        console.error('Failed to load exhibitions:', err);
      } finally {
        if (isMounted) setLoadingExhibitions(false);
      }
    };

    const fetchArtists = async () => {
      try {
        setLoadingArtists(true);
        const response = await api.get('/artists/public');
        if (isMounted) setArtists(response.data.artists || []);
      } catch (err) {
        console.error('Failed to load artists:', err);
      } finally {
        if (isMounted) setLoadingArtists(false);
      }
    };

    const fetchFavourites = async () => {
      if (user?.role !== 'Art Collector') return;
      try {
        const response = await api.get('/collectors/favourites');
        if (isMounted) setFavourites(response.data.favourites || []);
      } catch (err) {
        console.error('Failed to fetch favourites:', err);
      }
    };

    fetchArtworks();
    fetchExhibitions();
    fetchArtists();
    fetchFavourites();

    return () => { isMounted = false; };
  }, [user]);

  const handleToggleFavourite = async (artworkId) => {
    if (!user) return alert('Please log in to save artworks.');
    if (user.role !== 'Art Collector') return alert('Only Art Collectors can save favourites.');

    setIsFavouriteLoading(true);
    const existingFav = favourites.find(f => f.artwork_id === artworkId);

    try {
      if (existingFav) {
        await api.delete(`/collectors/favourites/${existingFav.favourite_id}`);
      } else {
        await api.post('/collectors/favourites', { artwork_id: artworkId });
      }
      const response = await api.get('/collectors/favourites');
      setFavourites(response.data.favourites || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Could not update favourites.');
    } finally {
      setIsFavouriteLoading(false);
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquirySuccess('');

    try {
      await api.post('/collectors/inquiries', {
        artwork_id: inquiryArtwork.artwork_id,
        message: inquiryMessage
      });
      setInquirySuccess('Inquiry sent! The gallery will contact you soon.');
      setTimeout(() => {
        setInquiryArtwork(null);
        setInquiryMessage('');
        setInquirySuccess('');
      }, 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send inquiry.');
    } finally {
      setInquiryLoading(false);
    }
  };

  const categories = ['All', ...new Set(artworks.map((a) => a.category).filter(Boolean))];
  const filteredArtworks = artworks.filter((a) => {
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    const term = search.toLowerCase();
    return matchesCategory && ((a.title || '').toLowerCase().includes(term) || (a.artist_name || '').toLowerCase().includes(term));
  });

  const formatPrice = (price) => price ? `KES ${Number(price).toLocaleString('en-KE')}` : 'Price on request';
  const formatDate = (start, end) => {
    if (!start || !end) return 'Dates TBA';
    return `${new Date(start).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }).toUpperCase()} — ${new Date(end).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}`;
  };

  return (
    <div className="site-wrapper">
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#artworks" onClick={() => setMenuOpen(false)}>Artworks</a>
          <a href="#exhibitions" onClick={() => setMenuOpen(false)}>Exhibitions</a>
          <a href="#artists" onClick={() => setMenuOpen(false)}>Artists</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        
        {/* FIXED NAVBAR LOGIC */}
        <div className="nav-actions">
          {user ? (
            <>
              <NotificationBell />
              <Link to="/dashboard" className="login-link">My Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">Log in</Link>
              <Link to="/register" className="nav-button">Join the gallery <ArrowRight size={15} /></Link>
            </>
          )}
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow"><span className="eyebrow-line"></span>THE ART OF DISCOVERY</span>
            <h1>Where art<br />meets <em>inspiration.</em></h1>
            <p>Explore extraordinary artworks, discover remarkable artists, and experience exhibitions that bring creativity to life.</p>
            <div className="hero-actions">
              <a href="#artworks" className="primary-button">Explore artworks <ArrowRight size={17} /></a>
              <a href="#exhibitions" className="text-button">Discover exhibitions</a>
            </div>
            <div className="hero-stats">
              <div><strong>{artworks.length}</strong><span>Artworks</span></div>
              <div><strong>{artists.length}</strong><span>Artists</span></div>
              <div><strong>{exhibitions.length}</strong><span>Exhibitions</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <img src={imageUrl('photo-1579783902614-a3fb3927b6a5', 1100)} alt="Featured artwork" />
            </div>
            <div className="image-caption">
              <span>FEATURED ARTWORK</span>
              <strong>Colours of Expression</strong>
              <small>Contemporary collection · 2026</small>
            </div>
            <div className="hero-decoration">A</div>
          </div>
        </section>

        <section className="trust-strip">
          <span>DISCOVER</span><span className="strip-dot">✳</span>
          <span>EXPERIENCE</span><span className="strip-dot">✳</span>
          <span>COLLECT</span><span className="strip-dot">✳</span>
          <span>CELEBRATE CREATIVITY</span>
        </section>

        {/* ARTWORKS */}
        <section className="section artworks-section" id="artworks">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CURATED FOR YOU</span>
              <h2>Explore the <em>collection.</em></h2>
            </div>
          </div>

          <div className="collection-tools">
            <div className="category-tabs">
              {categories.map((c) => <button key={c} className={activeCategory === c ? 'category-tab active' : 'category-tab'} onClick={() => setActiveCategory(c)}>{c}</button>)}
            </div>
            <div className="search-box">
              <Search size={17} />
              <input type="search" placeholder="Search artworks..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loadingArtworks ? (
            <div className="empty-state"><LoaderCircle size={28} className="loading-spinner" /><p>Loading...</p></div>
          ) : artworkError ? (
            <div className="empty-state"><AlertCircle size={28} /><p>{artworkError}</p></div>
          ) : (
            <div className="artwork-grid">
              {filteredArtworks.map((artwork) => {
                const isFav = favourites.some(f => f.artwork_id === artwork.artwork_id);
                return (
                  <article className="artwork-card" key={artwork.artwork_id}>
                    <div className="artwork-image">
                      <img src={artwork.image_url} alt={artwork.title} loading="lazy" />
                      <button
                        className={`favorite-button ${isFav ? 'selected' : ''}`}
                        onClick={() => handleToggleFavourite(artwork.artwork_id)}
                        disabled={isFavouriteLoading}
                      >
                        <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                      </button>
                      <span className="artwork-category">{artwork.category || 'Artwork'}</span>
                    </div>
                    <div className="artwork-info">
                      <div>
                        <h3>{artwork.title}</h3>
                        <p>By {artwork.artist_name || 'Unknown artist'}</p>
                      </div>
                      <strong>{formatPrice(artwork.price)}</strong>
                    </div>

                    {user?.role === 'Art Collector' && (
                      <button
                        onClick={() => setInquiryArtwork(artwork)}
                        className="text-button"
                        style={{ marginTop: '10px', color: '#a47745', width: '100%', justifyContent: 'center', border: '1px solid #e8e3da', padding: '8px', background: 'transparent' }}
                      >
                        <MessageCircle size={15} /> Inquire to Purchase
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* EXHIBITIONS */}
        <section className="exhibition-section" id="exhibitions">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WHAT'S HAPPENING</span>
              <h2>Upcoming <em>exhibitions.</em></h2>
            </div>
          </div>

          {loadingExhibitions ? (
            <div className="empty-state"><LoaderCircle size={28} className="loading-spinner" /><p>Loading...</p></div>
          ) : (
            <div className="exhibition-grid">
              {exhibitions.map((exhibition) => (
                <article className="exhibition-card" key={exhibition.exhibition_id}>
                  <img src={exhibition.cover_image || imageUrl('photo-1577083552431-6e5fd01aa342', 1000)} alt={exhibition.title} />
                  <div className="exhibition-overlay">
                    <span>{formatDate(exhibition.start_date, exhibition.end_date)}</span>
                    <h3>{exhibition.title}</h3>
                    <p>{exhibition.description}</p>
                    <a href="#booking">Discover exhibition <ArrowRight size={16} /></a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ARTISTS SECTION */}
        <section className="section artists-section" id="artists">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE CREATORS</span>
              <h2>Meet the <em>artists.</em></h2>
              <p>The brilliant minds behind the masterpieces in our collection.</p>
            </div>
          </div>

          {loadingArtists ? (
            <div className="empty-state"><LoaderCircle size={28} className="loading-spinner" /><p>Loading artists...</p></div>
          ) : artists.length > 0 ? (
            <div className="artists-grid">
              {artists.map((artist) => (
                <div className="artist-card" key={artist.artist_id || artist.user_id}>
                  <div className="artist-avatar">
                    {artist.full_name ? artist.full_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <h3>{artist.full_name || 'Gallery Artist'}</h3>
                  <p className="artist-bio">{artist.biography || 'A talented contemporary artist showcasing works at Artisan Gallery.'}</p>

                  <div className="artist-links">
                    {artist.website && (
                      <a href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`} target="_blank" rel="noreferrer" title="Portfolio Website">
                        <Globe size={16} /> Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={35} />
              <h3>No artists to display</h3>
              <p>Artist profiles will appear here once they join the gallery.</p>
            </div>
          )}
        </section>

        {/* VISIT SECTION */}
        <section className="visit-section" id="booking">
          <div className="visit-icon"><CalendarDays size={27} /></div>
          <div>
            <span className="eyebrow">YOUR NEXT EXPERIENCE</span>
            <h2>Art is better <em>experienced.</em></h2>
            <p>Plan your visit and explore the gallery in person.</p>
          </div>
          <Link to="/book-visit" className="primary-button">Book a visit <ArrowRight size={17} /></Link>
        </section>

        {/* ABOUT */}
        <section className="about-section" id="about">
          <div className="about-symbol"><Users size={34} /></div>
          <div>
            <span className="eyebrow">A COMMUNITY OF CREATIVITY</span>
            <h2>More than a gallery.<br /><em>A meeting place for art.</em></h2>
          </div>
          <p>We connect artists, collectors and art lovers through meaningful exhibitions, creative discovery and shared experiences.</p>
        </section>
      </main>

      <footer className="footer" id="footer">
        <Link to="/" className="brand"><span className="brand-icon"><Palette size={22} /></span><span>ARTISAN<span className="brand-light">.</span></span></Link>
        <p>Celebrating creativity. Connecting people through art.</p>
        <span>© 2026 Artisan Gallery. All rights reserved.</span>
      </footer>

      {/* INQUIRY MODAL */}
      {inquiryArtwork && (
        <div className="dashboard-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="booking-card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setInquiryArtwork(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '10px' }}>Inquire about artwork</h2>
            <p style={{ color: '#777168', marginBottom: '20px', fontSize: '14px' }}>You are inquiring about <strong>{inquiryArtwork.title}</strong> by {inquiryArtwork.artist_name}.</p>

            {inquirySuccess && (
              <div className="booking-message success" style={{ marginBottom: '20px' }}><CheckCircle size={18} /> {inquirySuccess}</div>
            )}

            {!inquirySuccess && (
              <form onSubmit={handleSendInquiry}>
                <div className="booking-field">
                  <label>Message to Gallery</label>
                  <textarea rows="4" required placeholder="I am interested in purchasing this artwork. Please contact me with more details." value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} />
                </div>
                <button type="submit" className="primary-button" disabled={inquiryLoading} style={{ width: '100%' }}>
                  {inquiryLoading ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;