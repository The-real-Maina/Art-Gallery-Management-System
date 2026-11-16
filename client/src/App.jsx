import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Menu,
  X,
  Heart,
  Palette,
  CalendarDays,
  Users
} from 'lucide-react';
import './index.css';

const artworks = [
  {
    id: 1,
    title: 'The Golden Hour',
    artist: 'Amara Okafor',
    category: 'Painting',
    price: 'KES 85,000',
    image: 'photo-1579783902614-a3fb3927b6a5'
  },
  {
    id: 2,
    title: 'Silent Reflections',
    artist: 'David Mwangi',
    category: 'Photography',
    price: 'KES 42,000',
    image: 'photo-1577083552431-6e5fd01aa342'
  },
  {
    id: 3,
    title: 'Fragments of Life',
    artist: 'Nia Kamau',
    category: 'Sculpture',
    price: 'KES 120,000',
    image: 'photo-1578301978693-85fa9c0320b9'
  },
  {
    id: 4,
    title: 'Beyond the Horizon',
    artist: 'Brian Otieno',
    category: 'Painting',
    price: 'KES 65,000',
    image: 'photo-1579783900882-c0d3dad7b119'
  }
];

const exhibitions = [
  {
    title: 'African Expressions',
    date: '20 NOV — 15 DEC 2026',
    description: 'A celebration of contemporary African creativity.',
    image: 'photo-1577083552431-6e5fd01aa342'
  },
  {
    title: 'The Art of Stillness',
    date: '05 DEC — 28 DEC 2026',
    description: 'Discover the beauty hidden in everyday moments.',
    image: 'photo-1579783902614-a3fb3927b6a5'
  }
];

function imageUrl(id, width = 800) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = ['All', 'Painting', 'Photography', 'Sculpture'];

  const filteredArtworks = artworks.filter((artwork) => {
    const matchesCategory =
      activeCategory === 'All' || artwork.category === activeCategory;

    const matchesSearch =
      artwork.title.toLowerCase().includes(search.toLowerCase()) ||
      artwork.artist.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <div className="site-wrapper">
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Palette size={22} />
          </span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#artworks" onClick={() => setMenuOpen(false)}>Artworks</a>
          <a href="#exhibitions" onClick={() => setMenuOpen(false)}>Exhibitions</a>
          <a href="#artists" onClick={() => setMenuOpen(false)}>Artists</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="login-link">
            Log in
          </Link>

          <Link to="/register" className="nav-button">
            Join the gallery <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              <span className="eyebrow-line"></span>
              THE ART OF DISCOVERY
            </span>

            <h1>
              Where art<br />
              meets <em>inspiration.</em>
            </h1>

            <p>
              Explore extraordinary artworks, discover remarkable artists,
              and experience exhibitions that bring creativity to life.
            </p>

            <div className="hero-actions">
              <a href="#artworks" className="primary-button">
                Explore artworks <ArrowRight size={17} />
              </a>

              <a href="#exhibitions" className="text-button">
                Discover exhibitions
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>250+</strong>
                <span>Artworks</span>
              </div>
              <div>
                <strong>48</strong>
                <span>Artists</span>
              </div>
              <div>
                <strong>12</strong>
                <span>Exhibitions</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <img
                src={imageUrl('photo-1579783902614-a3fb3927b6a5', 1100)}
                alt="Featured artwork displayed in a gallery"
              />
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
          <span>DISCOVER</span>
          <span className="strip-dot">✳</span>
          <span>EXPERIENCE</span>
          <span className="strip-dot">✳</span>
          <span>COLLECT</span>
          <span className="strip-dot">✳</span>
          <span>CELEBRATE CREATIVITY</span>
        </section>

        <section className="section artworks-section" id="artworks">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CURATED FOR YOU</span>
              <h2>Explore the <em>collection.</em></h2>
              <p>
                Discover original works from talented contemporary artists.
              </p>
            </div>

            <a href="#artworks" className="view-all">
              View all artworks <ArrowRight size={16} />
            </a>
          </div>

          <div className="collection-tools">
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  className={
                    activeCategory === category
                      ? 'category-tab active'
                      : 'category-tab'
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="search-box">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search artworks or artists..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="artwork-grid">
            {filteredArtworks.map((artwork) => (
              <article className="artwork-card" key={artwork.id}>
                <div className="artwork-image">
                  <img
                    src={imageUrl(artwork.image)}
                    alt={artwork.title}
                  />

                  <button
                    className={
                      favorites.includes(artwork.id)
                        ? 'favorite-button selected'
                        : 'favorite-button'
                    }
                    onClick={() => toggleFavorite(artwork.id)}
                    aria-label="Toggle favourite"
                  >
                    <Heart
                      size={19}
                      fill={
                        favorites.includes(artwork.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>

                  <span className="artwork-category">
                    {artwork.category}
                  </span>
                </div>

                <div className="artwork-info">
                  <div>
                    <h3>{artwork.title}</h3>
                    <p>By {artwork.artist}</p>
                  </div>

                  <strong>{artwork.price}</strong>
                </div>
              </article>
            ))}

            {filteredArtworks.length === 0 && (
              <p className="empty-state">
                No artworks match your search.
              </p>
            )}
          </div>
        </section>

        <section className="exhibition-section" id="exhibitions">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WHAT'S HAPPENING</span>
              <h2>Upcoming <em>exhibitions.</em></h2>
              <p>
                Step into new perspectives and unforgettable experiences.
              </p>
            </div>

            <a href="#exhibitions" className="view-all">
              All exhibitions <ArrowRight size={16} />
            </a>
          </div>

          <div className="exhibition-grid">
            {exhibitions.map((exhibition) => (
              <article className="exhibition-card" key={exhibition.title}>
                <img
                  src={imageUrl(exhibition.image, 1000)}
                  alt={exhibition.title}
                />

                <div className="exhibition-overlay">
                  <span>{exhibition.date}</span>
                  <h3>{exhibition.title}</h3>
                  <p>{exhibition.description}</p>

                  <a href="#booking">
                    Discover exhibition <ArrowRight size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="visit-section" id="booking">
          <div className="visit-icon">
            <CalendarDays size={27} />
          </div>

          <div>
            <span className="eyebrow">YOUR NEXT EXPERIENCE</span>
            <h2>Art is better <em>experienced.</em></h2>
            <p>Plan your visit and explore the gallery in person.</p>
          </div>

          <Link to="/register" className="primary-button">
            Book a visit <ArrowRight size={17} />
          </Link>
        </section>

        <section className="about-section" id="about">
          <div className="about-symbol">
            <Users size={34} />
          </div>

          <div>
            <span className="eyebrow">A COMMUNITY OF CREATIVITY</span>
            <h2>
              More than a gallery.<br />
              <em>A meeting place for art.</em>
            </h2>
          </div>

          <p>
            We connect artists, collectors and art lovers through meaningful
            exhibitions, creative discovery and shared experiences.
          </p>
        </section>
      </main>

      <footer className="footer" id="artists">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Palette size={22} />
          </span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <p>Celebrating creativity. Connecting people through art.</p>

        <span>© 2026 Artisan Gallery. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default App;