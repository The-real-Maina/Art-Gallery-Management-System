import { useNavigate } from 'react-router-dom';
import { Palette, ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

// Static placeholders for the landing page teaser (since guests can't fetch real data yet)
const teaserArtworks = [
  { id: 1, title: 'Colours of Expression', artist: 'Elena Rostova', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=85', category: 'Contemporary' },
  { id: 2, title: 'Silent Whispers', artist: 'Kofi Mensah', img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=85', category: 'Abstract' },
  { id: 3, title: 'The Golden Hour', artist: 'Amara Okafor', img: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=800&q=85', category: 'Landscape' },
  { id: 4, title: 'Roots & Wings', artist: 'Jared Maina', img: 'https://images.unsplash.com/photo-1580136608260-4eb11f4b24fe?auto=format&fit=crop&w=800&q=85', category: 'Sculpture' }
];

const teaserExhibitions = [
  { id: 1, title: 'African Expressions', date: '20 NOV — 15 DEC', img: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=85' },
  { id: 2, title: 'The Art of Stillness', date: '05 DEC — 28 DEC', img: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=85' }
];

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('art_gallery_user') || 'null');

  // Gated Access: If not logged in, go to login. If logged in, go to the page.
  const handleGatedNavigation = (path) => {
    if (user) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="site-wrapper" style={{ background: '#faf9f6' }}>
      
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow"><span className="eyebrow-line"></span>THE ART OF DISCOVERY</span>
          <h1>Where art<br />meets <em>inspiration.</em></h1>
          <p>Explore extraordinary artworks, discover remarkable artists, and experience exhibitions that bring creativity to life.</p>
          <div className="hero-actions">
            <button onClick={() => handleGatedNavigation('/artworks')} className="primary-button" style={{ border: 'none' }}>
              Explore Artworks <ArrowRight size={17} />
            </button>
            <button onClick={() => handleGatedNavigation('/exhibitions')} className="text-button" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Discover exhibitions
            </button>
          </div>
          <div className="hero-stats">
            <div><strong>500+</strong><span>Artworks</span></div>
            <div><strong>45</strong><span>Artists</span></div>
            <div><strong>12</strong><span>Exhibitions</span></div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1100&q=85" alt="Featured artwork" />
          </div>
          <div className="image-caption">
            <span>FEATURED ARTWORK</span>
            <strong>Colours of Expression</strong>
            <small>Contemporary collection · 2026</small>
          </div>
          <div className="hero-decoration">A</div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="trust-strip">
        <span>DISCOVER</span><span className="strip-dot">✳</span>
        <span>EXPERIENCE</span><span className="strip-dot">✳</span>
        <span>COLLECT</span><span className="strip-dot">✳</span>
        <span>CELEBRATE CREATIVITY</span>
      </section>

      {/* TEASER COLLECTION */}
      <section className="section artworks-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CURATED FOR YOU</span>
            <h2>Explore the <em>collection.</em></h2>
          </div>
          <button onClick={() => handleGatedNavigation('/artworks')} className="view-all" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            View all artworks <ArrowRight size={15} />
          </button>
        </div>

        <div className="artwork-grid">
          {teaserArtworks.map((art) => (
            <article 
              className="artwork-card" 
              key={art.id} 
              onClick={() => handleGatedNavigation('/artworks')}
              style={{ cursor: 'pointer' }}
            >
              <div className="artwork-image">
                <img src={art.img} alt={art.title} loading="lazy" />
                <span className="artwork-category">{art.category}</span>
              </div>
              <div className="artwork-info">
                <div>
                  <h3>{art.title}</h3>
                  <p>By {art.artist}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* EXHIBITIONS PREVIEW */}
      <section className="exhibition-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WHAT'S HAPPENING</span>
            <h2>Upcoming <em>exhibitions.</em></h2>
          </div>
        </div>

        <div className="exhibition-grid">
          {teaserExhibitions.map((ex) => (
            <article 
              className="exhibition-card" 
              key={ex.id} 
              onClick={() => handleGatedNavigation('/exhibitions')}
              style={{ cursor: 'pointer' }}
            >
              <img src={ex.img} alt={ex.title} />
              <div className="exhibition-overlay">
                <span>{ex.date}</span>
                <h3>{ex.title}</h3>
                <p>Experience a stunning collection of contemporary African art curated for the modern collector.</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', fontSize: '11px', fontWeight: '700', marginTop: '12px', color: 'white' }}>
                  Discover exhibition <ArrowRight size={16} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* VISIT BANNER */}
      <section className="visit-section">
        <div className="visit-icon"><CalendarDays size={27} /></div>
        <div>
          <span className="eyebrow">YOUR NEXT EXPERIENCE</span>
          <h2>Art is better <em>experienced.</em></h2>
          <p>Plan your visit and explore the gallery in person.</p>
        </div>
        <button onClick={() => handleGatedNavigation('/book-visit')} className="primary-button" style={{ border: 'none', marginLeft: 'auto' }}>
          Book a visit <ArrowRight size={17} />
        </button>
      </section>

      {/* ABOUT BANNER */}
      <section className="about-section" style={{ marginBottom: 0 }}>
        <div className="about-symbol"><Sparkles size={34} /></div>
        <div>
          <span className="eyebrow">A COMMUNITY OF CREATIVITY</span>
          <h2>More than a gallery.<br /><em>A meeting place for art.</em></h2>
        </div>
        <div>
          <p style={{ marginBottom: '20px', color: '#777168', fontSize: '13px', lineHeight: '2' }}>We connect artists, collectors and art lovers through meaningful exhibitions, creative discovery and shared experiences.</p>
          <button onClick={() => handleGatedNavigation('/gallery-details')} className="text-button" style={{ fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Learn more about our history <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{ marginTop: '0' }}>
        <div className="brand"><span className="brand-icon"><Palette size={22} /></span><span>ARTISAN<span className="brand-light">.</span></span></div>
        <p>Celebrating creativity. Connecting people through art.</p>
        <span>© 2026 Artisan Gallery. All rights reserved.</span>
      </footer>

    </div>
  );
}

export default Home;