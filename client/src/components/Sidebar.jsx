import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, Heart, CalendarDays, UserRound, LogOut,
  Compass, MapPin, Star, MessageCircle, Users, MessageSquare, FileText, PlusCircle,
  Image as ImageIcon, Mail, LogIn, ChevronRight
} from 'lucide-react';

/* ------------------------------------------------------------------
   Nav item components live OUTSIDE Sidebar so React doesn't recreate
   them on every render (fixes react-hooks/static-components).
   ------------------------------------------------------------------ */

// Workspace tab button (stays on /dashboard, switches tab)
function NavTab({ icon: Icon, label, title, active, collapsed, onSelect }) {
  return (
    <button
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onSelect}
      title={title || label}
    >
      <Icon size={19} /> {!collapsed && <span>{label}</span>}
      {!collapsed && <ChevronRight size={16} className="hover-arrow" />}
    </button>
  );
}

// Route link (Messages, Manage Users, Discover pages)
function NavRoute({ to, icon: Icon, label, title, active, collapsed, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`nav-item ${active ? 'active' : ''}`}
      title={title || label}
    >
      <Icon size={19} /> {!collapsed && <span>{label}</span>}
      {!collapsed && <ChevronRight size={16} className="hover-arrow" />}
    </Link>
  );
}

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

  const onDashboard = location.pathname === '/dashboard';

  // Route to /dashboard if clicking a workspace tab from a public page
  const handleTabChange = (tab) => {
    if (setActiveTab) setActiveTab(tab);
    if (setMenuOpen) setMenuOpen(false);
    if (!onDashboard) navigate('/dashboard');
  };

  const closeMenu = () => {
    if (setMenuOpen) setMenuOpen(false);
  };

  // Helpers that return the shared props, so JSX below stays short
  const tabProps = (id) => ({
    active: activeTab === id && onDashboard,
    collapsed: isCollapsed,
    onSelect: () => handleTabChange(id),
  });

  const routeProps = (to) => ({
    to,
    active: location.pathname === to,
    collapsed: isCollapsed,
    onNavigate: closeMenu,
  });

  return (
    <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

      {/* HEADER: Logo toggles the sidebar */}
      <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
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

      {/* SCROLLABLE MIDDLE: header and user block stay pinned */}
      <div className="sidebar-scroll">

        {/* WORKSPACE TABS */}
        {user && (
          <>
            <div className="sidebar-label" style={{ display: isCollapsed ? 'none' : 'block' }}>WORKSPACE</div>
            <nav className="dashboard-nav">

              {/* VISITOR / COLLECTOR */}
              {(isVisitor || isCollector) && (
                <>
                  <NavTab icon={LayoutDashboard} label="Overview" {...tabProps('overview')} />
                  <NavRoute icon={MessageSquare} label="Messages" {...routeProps('/messages')} />
                  <NavTab icon={Compass} label="Exhibitions" {...tabProps('exhibitions')} />
                  {isVisitor && <NavTab icon={MapPin} label="Guided Tours" {...tabProps('guided-tours')} />}
                  {isVisitor && <NavTab icon={Star} label="My Feedback" {...tabProps('my-feedback')} />}
                  {isCollector && <NavTab icon={Heart} label="My favourites" {...tabProps('favourites')} />}
                  {isCollector && <NavTab icon={MessageCircle} label="My inquiries" {...tabProps('inquiries')} />}
                  {isVisitor && <NavTab icon={CalendarDays} label="My visits" {...tabProps('visits')} />}
                  <NavTab icon={UserRound} label="My profile" {...tabProps('profile')} />
                </>
              )}

              {/* ADMINISTRATOR */}
              {isAdmin && (
                <>
                  <NavTab icon={LayoutDashboard} label="Overview" {...tabProps('overview')} />
                  <NavTab icon={MessageSquare} label="Feedback" {...tabProps('feedback')} />
                  <NavTab icon={MessageCircle} label="Inquiries" {...tabProps('inquiries')} />
                  <NavTab icon={FileText} label="Audit Logs" {...tabProps('audit')} />

                  <div className="sidebar-divider" />

                  <NavRoute icon={Users} label="Manage Users" {...routeProps('/admin/users')} />
                </>
              )}

              {/* CURATOR */}
              {isCurator && (
                <>
                  <NavTab icon={LayoutDashboard} label="Overview" {...tabProps('overview')} />
                  <NavTab icon={Star} label="Review Artworks" {...tabProps('review')} />
                  <NavTab icon={Compass} label="Exhibitions" title="Manage Exhibitions" {...tabProps('exhibitions')} />
                </>
              )}

              {/* BOOKING OFFICER */}
              {isBooking && (
                <>
                  <NavTab icon={LayoutDashboard} label="Overview" {...tabProps('overview')} />
                  <NavTab icon={CalendarDays} label="Manage Bookings" {...tabProps('bookings')} />
                </>
              )}

              {/* TOUR GUIDE */}
              {isGuide && (
                <>
                  <NavTab icon={LayoutDashboard} label="Overview" {...tabProps('overview')} />
                  <NavTab icon={MapPin} label="My Tours" {...tabProps('my-tours')} />
                  <NavTab icon={PlusCircle} label="Schedule Tour" {...tabProps('tour-form')} />
                </>
              )}
            </nav>
          </>
        )}

        {/* DISCOVER GALLERY (ONLY FOR VISITORS & COLLECTORS) */}
        {(isVisitor || isCollector) && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-label" style={{ display: isCollapsed ? 'none' : 'block' }}>DISCOVER GALLERY</div>
            <nav className="dashboard-nav">
              <NavRoute icon={ImageIcon} label="All Artworks" {...routeProps('/artworks')} />
              <NavRoute icon={Compass} label="Browse Exhibitions" {...routeProps('/exhibitions')} />
              <NavRoute icon={Users} label="Meet the Artists" {...routeProps('/artists')} />
              <NavRoute icon={Mail} label="Contact" title="Contact & Inquiries" {...routeProps('/contact')} />
              <NavRoute icon={Palette} label="The Gallery" {...routeProps('/gallery-details')} />
            </nav>
          </>
        )}
      </div>

      {/* BOTTOM SECTION: User Info OR Login (pinned) */}
      <div className="sidebar-bottom" style={{ padding: isCollapsed ? '12px 10px' : '12px 14px' }}>
        {user ? (
          <>
            <div className="sidebar-user" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
              <div className="user-avatar" title={user.full_name}>{firstName.charAt(0).toUpperCase()}</div>
              {!isCollapsed && (
                <div><strong>{user.full_name}</strong><span>{user.role}</span></div>
              )}
            </div>
            <button
              className="logout-button"
              onClick={onLogout}
              title="Sign out"
              style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 8px' }}
            >
              <LogOut size={18} /> {!isCollapsed && <span>Sign out</span>}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="primary-button"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isCollapsed ? '12px' : '15px', fontSize: '13px' }}
          >
            <LogIn size={18} /> {!isCollapsed && <span style={{ marginLeft: '8px' }}>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}