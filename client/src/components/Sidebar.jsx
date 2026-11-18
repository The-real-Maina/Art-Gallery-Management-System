import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Palette, LayoutDashboard, Heart, CalendarDays, UserRound, LogOut, 
  Compass, MapPin, Star, MessageCircle, Users, MessageSquare, FileText, PlusCircle,
  Image as ImageIcon, Mail, LogIn
} from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, menuOpen, setMenuOpen, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(' ')[0] || 'Guest';

  const isVisitor = user?.role === 'Visitor';
  const isCollector = user?.role === 'Art Collector';
  const isAdmin = user?.role === 'Administrator';
  const isCurator = user?.role === 'Gallery Curator';
  const isBooking = user?.role === 'Booking Officer';
  const isGuide = user?.role === 'Tour Guide';

  // Route to /dashboard if clicking a workspace tab from a public page
  const handleTabChange = (tab) => {
    if (setActiveTab) setActiveTab(tab);
    if (setMenuOpen) setMenuOpen(false);
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  const closeMenu = () => {
    if (setMenuOpen) setMenuOpen(false);
  };

  return (
    <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      
      {/* HEADER: Logo toggles the sidebar */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="brand dashboard-brand" 
          style={{ cursor: 'pointer', padding: 0, margin: 0 }}
          title="Toggle Sidebar"
        >
          <span className="brand-icon"><Palette size={22} /></span>
          {!isCollapsed && <span className="brand-text">ARTISAN<span className="brand-light">.</span></span>}
        </div>
      </div>

      {/* WORKSPACE TABS */}
      {user && (
        <>
          <div className="sidebar-label" style={{ display: isCollapsed ? 'none' : 'block' }}>WORKSPACE</div>
          <nav className="dashboard-nav">
            
            {/* VISITOR / COLLECTOR */}
            {(isVisitor || isCollector) && (
              <>
                <button className={activeTab === 'overview' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('overview')} title="Overview">
                  <LayoutDashboard size={19} /> {!isCollapsed && <span>Overview</span>}
                </button>
                <button className={activeTab === 'exhibitions' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('exhibitions')} title="Exhibitions">
                  <Compass size={19} /> {!isCollapsed && <span>Exhibitions</span>}
                </button>
                {isVisitor && (
                  <button className={activeTab === 'guided-tours' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('guided-tours')} title="Guided Tours">
                    <MapPin size={19} /> {!isCollapsed && <span>Guided Tours</span>}
                  </button>
                )}
                {isVisitor && (
                  <button className={activeTab === 'my-feedback' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('my-feedback')} title="My Feedback">
                    <Star size={19} /> {!isCollapsed && <span>My Feedback</span>}
                  </button>
                )}
                {isCollector && (
                  <button className={activeTab === 'favourites' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('favourites')} title="My favourites">
                    <Heart size={19} /> {!isCollapsed && <span>My favourites</span>}
                  </button>
                )}
                {isCollector && (
                  <button className={activeTab === 'inquiries' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('inquiries')} title="My inquiries">
                    <MessageCircle size={19} /> {!isCollapsed && <span>My inquiries</span>}
                  </button>
                )}
                {isVisitor && (
                  <button className={activeTab === 'visits' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('visits')} title="My visits">
                    <CalendarDays size={19} /> {!isCollapsed && <span>My visits</span>}
                  </button>
                )}
                <button className={activeTab === 'profile' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('profile')} title="My profile">
                  <UserRound size={19} /> {!isCollapsed && <span>My profile</span>}
                </button>
              </>
            )}

            {/* ADMINISTRATOR */}
            {isAdmin && (
              <>
                <button className={activeTab === 'overview' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('overview')} title="Overview">
                  <LayoutDashboard size={19} /> {!isCollapsed && <span>Overview</span>}
                </button>
                <button className={activeTab === 'feedback' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('feedback')} title="Feedback">
                  <MessageSquare size={19} /> {!isCollapsed && <span>Feedback</span>}
                </button>
                <button className={activeTab === 'inquiries' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('inquiries')} title="Inquiries">
                  <MessageCircle size={19} /> {!isCollapsed && <span>Inquiries</span>}
                </button>
                <button className={activeTab === 'audit' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('audit')} title="Audit Logs">
                  <FileText size={19} /> {!isCollapsed && <span>Audit Logs</span>}
                </button>
                
                <div style={{ height: '1px', background: '#3a3831', margin: '10px 0' }} />
                
                <Link to="/admin/users" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: location.pathname === '/admin/users' ? '#d6b879' : '#bcb9b0', fontSize: '13px', textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start', background: location.pathname === '/admin/users' ? '#34322d' : 'transparent', borderRadius: '7px' }} title="Manage Users">
                  <Users size={19} /> {!isCollapsed && <span>Manage Users</span>}
                </Link>
              </>
            )}

            {/* CURATOR */}
            {isCurator && (
              <>
                <button className={activeTab === 'overview' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('overview')} title="Overview">
                  <LayoutDashboard size={19} /> {!isCollapsed && <span>Overview</span>}
                </button>
                <button className={activeTab === 'review' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('review')} title="Review Artworks">
                  <Star size={19} /> {!isCollapsed && <span>Review Artworks</span>}
                </button>
                <button className={activeTab === 'exhibitions' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('exhibitions')} title="Manage Exhibitions">
                  <Compass size={19} /> {!isCollapsed && <span>Exhibitions</span>}
                </button>
              </>
            )}

            {/* BOOKING OFFICER */}
            {isBooking && (
              <>
                <button className={activeTab === 'overview' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('overview')} title="Overview">
                  <LayoutDashboard size={19} /> {!isCollapsed && <span>Overview</span>}
                </button>
                <button className={activeTab === 'bookings' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('bookings')} title="Manage Bookings">
                  <CalendarDays size={19} /> {!isCollapsed && <span>Manage Bookings</span>}
                </button>
              </>
            )}

            {/* TOUR GUIDE */}
            {isGuide && (
              <>
                <button className={activeTab === 'overview' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('overview')} title="Overview">
                  <LayoutDashboard size={19} /> {!isCollapsed && <span>Overview</span>}
                </button>
                <button className={activeTab === 'my-tours' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('my-tours')} title="My Tours">
                  <MapPin size={19} /> {!isCollapsed && <span>My Tours</span>}
                </button>
                <button className={activeTab === 'tour-form' && location.pathname === '/dashboard' ? 'active' : ''} onClick={() => handleTabChange('tour-form')} title="Schedule Tour">
                  <PlusCircle size={19} /> {!isCollapsed && <span>Schedule Tour</span>}
                </button>
              </>
            )}
          </nav>
        </>
      )}

      {/* DISCOVER GALLERY (ONLY FOR VISITORS & COLLECTORS) */}
      {(isVisitor || isCollector) && (
        <>
          <div className="sidebar-label" style={{ display: isCollapsed ? 'none' : 'block', marginTop: '25px' }}>DISCOVER GALLERY</div>
          <nav className="dashboard-nav">
            <Link to="/artworks" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: location.pathname === '/artworks' ? '#d6b879' : '#bcb9b0', fontSize: '13px', textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start', background: location.pathname === '/artworks' ? '#34322d' : 'transparent', borderRadius: '7px' }} title="All Artworks">
              <ImageIcon size={19} /> {!isCollapsed && <span>All Artworks</span>}
            </Link>
            <Link to="/exhibitions" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: location.pathname === '/exhibitions' ? '#d6b879' : '#bcb9b0', fontSize: '13px', textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start', background: location.pathname === '/exhibitions' ? '#34322d' : 'transparent', borderRadius: '7px' }} title="Exhibitions">
              <Compass size={19} /> {!isCollapsed && <span>Exhibitions</span>}
            </Link>
            <Link to="/artists" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: location.pathname === '/artists' ? '#d6b879' : '#bcb9b0', fontSize: '13px', textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start', background: location.pathname === '/artists' ? '#34322d' : 'transparent', borderRadius: '7px' }} title="Meet the Artists">
              <Users size={19} /> {!isCollapsed && <span>Meet the Artists</span>}
            </Link>
            <Link to="/contact" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: location.pathname === '/contact' ? '#d6b879' : '#bcb9b0', fontSize: '13px', textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start', background: location.pathname === '/contact' ? '#34322d' : 'transparent', borderRadius: '7px' }} title="Contact & Inquiries">
              <Mail size={19} /> {!isCollapsed && <span>Contact & Inquiries</span>}
            </Link>
            <Link to="/gallery-details" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: location.pathname === '/gallery-details' ? '#d6b879' : '#bcb9b0', fontSize: '13px', textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start', background: location.pathname === '/gallery-details' ? '#34322d' : 'transparent', borderRadius: '7px' }} title="The Gallery">
              <Palette size={19} /> {!isCollapsed && <span>The Gallery</span>}
            </Link>
          </nav>
        </>
      )}

      {/* BOTTOM SECTION: User Info OR Login */}
      <div className="sidebar-bottom" style={{ padding: isCollapsed ? '20px 10px' : '20px' }}>
        {user ? (
          <>
            <div className="sidebar-user" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
              <div className="user-avatar" title={user.full_name}>{firstName.charAt(0).toUpperCase()}</div>
              {!isCollapsed && (
                <div><strong>{user.full_name}</strong><span>{user.role}</span></div>
              )}
            </div>
            <button className="logout-button" onClick={onLogout} title="Sign out" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '12px' }}>
              <LogOut size={18} /> {!isCollapsed && <span>Sign out</span>}
            </button>
          </>
        ) : (
          <Link to="/login" className="primary-button" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isCollapsed ? '12px' : '15px', fontSize: '13px' }}>
            <LogIn size={18} /> {!isCollapsed && <span style={{ marginLeft: '8px' }}>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}