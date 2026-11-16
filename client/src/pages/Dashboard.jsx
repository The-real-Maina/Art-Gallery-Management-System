
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette,
  LayoutDashboard,
  Heart,
  CalendarDays,
  UserRound,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Search,
  Sparkles
} from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem('art_gallery_user') || 'null'
  );

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const firstName = user.full_name?.split(' ')[0] || 'Visitor';

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          <a href="#overview" className="active">
            <LayoutDashboard size={19} /> Overview
          </a>
          <a href="#favourites">
            <Heart size={19} /> My favourites
          </a>
          <a href="#bookings">
            <CalendarDays size={19} /> My bookings
          </a>
          <a href="#profile">
            <UserRound size={19} /> My profile
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.full_name}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="dashboard-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button
            className="dashboard-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div>
            <span className="eyebrow">VISITOR WORKSPACE</span>
            <h2>My Dashboard</h2>
          </div>

          <Link to="/" className="dashboard-home-link">
            Explore gallery <ArrowRight size={16} />
          </Link>
        </header>

        <section className="dashboard-content" id="overview">
          <div className="dashboard-welcome">
            <div>
              <span className="eyebrow">YOUR ART JOURNEY</span>
              <h1>Welcome back, <em>{firstName}.</em></h1>
              <p>
                Discover extraordinary artwork, meet talented artists
                and experience creativity.
              </p>
            </div>

            <div className="welcome-icon">
              <Sparkles size={38} />
            </div>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon"><Heart size={21} /></div>
              <span>Saved artworks</span>
              <strong>0</strong>
              <small>Your favourite pieces</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><CalendarDays size={21} /></div>
              <span>Visit bookings</span>
              <strong>0</strong>
              <small>Your gallery visits</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><Palette size={21} /></div>
              <span>Account type</span>
              <strong className="stat-role">{user.role}</strong>
              <small>Your current membership</small>
            </div>
          </div>

          <section className="dashboard-section" id="favourites">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR COLLECTION</span>
                <h2>Saved artworks</h2>
              </div>
              <Link to="/" className="dashboard-text-link">
                Discover art <ArrowRight size={15} />
              </Link>
            </div>

            <div className="dashboard-empty">
              <Heart size={30} />
              <h3>Your collection starts here</h3>
              <p>
                Save artworks you love and they will appear here.
              </p>
              <Link to="/" className="primary-button">
                Explore artworks <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="dashboard-section" id="bookings">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PLAN YOUR EXPERIENCE</span>
                <h2>My visits</h2>
              </div>
            </div>

            <div className="dashboard-empty">
              <CalendarDays size={30} />
              <h3>No bookings yet</h3>
              <p>
                Your gallery visit reservations will appear here.
              </p>
              <Link to="/" className="primary-button">
                Plan a visit <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="dashboard-section" id="profile">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ACCOUNT INFORMATION</span>
                <h2>My profile</h2>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-avatar">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-details">
                <h3>{user.full_name}</h3>
                <p>{user.email}</p>
                <span>{user.role}</span>
              </div>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>ARTISAN GALLERY</span>
            <span>Discover. Experience. Collect.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
