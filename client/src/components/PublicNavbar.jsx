import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palette, ArrowRight, Menu, X } from 'lucide-react';

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('art_gallery_user') || 'null');

  // Helper to route based on auth status
  const getDestination = (path) => user ? path : '/login';

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar" style={{ background: 'white', borderBottom: '1px solid #e8e3da' }}>
      <Link to="/" className="brand">
        <span className="brand-icon"><Palette size={22} /></span>
        <span>ARTISAN<span className="brand-light">.</span></span>
      </Link>

      {/* Desktop Links */}
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to={getDestination('/artworks')} onClick={() => setMenuOpen(false)}>Artworks</Link>
        <Link to={getDestination('/exhibitions')} onClick={() => setMenuOpen(false)}>Exhibitions</Link>
        <Link to={getDestination('/artists')} onClick={() => setMenuOpen(false)}>Artists</Link>
        <Link to={getDestination('/contact')} onClick={() => setMenuOpen(false)}>Contact</Link>
        <Link to={getDestination('/gallery-details')} onClick={() => setMenuOpen(false)}>The Gallery</Link>
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <Link to="/dashboard" className="primary-button" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              My Dashboard <ArrowRight size={16} />
            </Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#777168', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link">Log in</Link>
            <Link to="/register" className="nav-button">Join the gallery</Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  );
}