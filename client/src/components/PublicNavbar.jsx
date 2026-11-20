import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Removed ArrowRight and User from the import
import { Palette, Menu, X, MessageSquare, LogOut, LayoutDashboard } from 'lucide-react'; 

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('art_gallery_user') || 'null');

  // Helper to route based on auth status
  const getDestination = (path) => user ? path : '/login';

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            
            {/* Quick link to Messages */}
            <Link to="/messages" style={{ textDecoration: 'none', color: '#25231f', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={18} strokeWidth={2.5} /> Messages
            </Link>

            {/* USER PROFILE DROPDOWN */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  background: '#faf9f6', border: '1px solid #e8e3da', 
                  padding: '5px 12px 5px 5px', borderRadius: '30px', cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: '#a47745', 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px'
                }}>
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#25231f' }}>
                  {user.full_name.split(' ')[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                  background: 'white', border: '1px solid #e8e3da', borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '200px', zIndex: 100, overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 15px', borderBottom: '1px solid #e8e3da', background: '#faf9f6' }}>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#25231f' }}>{user.full_name}</strong>
                    <span style={{ fontSize: '11px', color: '#777168' }}>{user.role}</span>
                  </div>
                  
                  <Link to="/dashboard" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', textDecoration: 'none', color: '#25231f', fontSize: '13px', borderBottom: '1px solid #f0ede6' }}>
                    <LayoutDashboard size={16} /> My Dashboard
                  </Link>
                  
                  <Link to="/messages" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', textDecoration: 'none', color: '#25231f', fontSize: '13px', borderBottom: '1px solid #f0ede6' }}>
                    <MessageSquare size={16} /> Messages
                  </Link>

                  <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'none', border: 'none', textAlign: 'left', color: '#b24c48', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
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