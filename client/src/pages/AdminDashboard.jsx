
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette,
  LayoutDashboard,
  Users,
  Image,
  CalendarDays,
  Layers,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  ArrowUpRight,
  UserRound
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem('art_gallery_user') || 'null'
  );

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login');
  };

  if (!user || user.role !== 'Administrator') {
    return null;
  }

  const firstName = user.full_name?.split(' ')[0] || 'Administrator';

  const modules = [
    {
      title: 'User Management',
      description: 'Manage gallery members, staff and access roles.',
      icon: Users,
      path: '/admin/users'
    },
    {
      title: 'Artwork Management',
      description: 'Review and manage artwork across the gallery.',
      icon: Image,
      path: '#artworks'
    },
    {
      title: 'Exhibitions',
      description: 'Oversee gallery exhibitions and collections.',
      icon: Layers,
      path: '#exhibitions'
    },
    {
      title: 'Visit Bookings',
      description: 'Monitor reservations and visitor activity.',
      icon: CalendarDays,
      path: '#bookings'
    },
    {
      title: 'Reports & Analytics',
      description: 'Review operational data and gallery performance.',
      icon: BarChart3,
      path: '#reports'
    },
    {
      title: 'System Settings',
      description: 'Manage system configuration and administration.',
      icon: Settings,
      path: '#settings'
    }
  ];

  return (
    <div className="dashboard-page admin-dashboard">
      <aside className="dashboard-sidebar">
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">ADMINISTRATION</div>

        <nav className="dashboard-nav">
          <a href="#overview" className="active">
            <LayoutDashboard size={19} /> Overview
          </a>

          <Link to="/admin/users">
            <Users size={19} /> Users
          </Link>

          <a href="#artworks">
            <Image size={19} /> Artworks
          </a>

          <a href="#exhibitions">
            <Layers size={19} /> Exhibitions
          </a>

          <a href="#bookings">
            <CalendarDays size={19} /> Bookings
          </a>

          <a href="#reports">
            <BarChart3 size={19} /> Reports
          </a>

          <a href="#settings">
            <Settings size={19} /> Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.full_name}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">SYSTEM ADMINISTRATION</span>
            <h2>Admin Overview</h2>
          </div>

          <div className="admin-header-user">
            <ShieldCheck size={19} />
            <span>Administrator</span>
          </div>
        </header>

        <section className="dashboard-content" id="overview">
          <div className="dashboard-welcome admin-welcome">
            <div>
              <span className="eyebrow">ADMINISTRATOR WORKSPACE</span>
              <h1>Welcome, <em>{firstName}.</em></h1>
              <p>
                Manage gallery operations, oversee users and maintain
                the platform from one central workspace.
              </p>
            </div>

            <div className="welcome-icon">
              <ShieldCheck size={38} />
            </div>
          </div>

          <div className="admin-overview-label">
            <span className="eyebrow">SYSTEM CONTROL CENTRE</span>
            <h2>Management modules</h2>
            <p>Choose an area to manage.</p>
          </div>

          <div className="admin-module-grid">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  to={module.path}
                  className="admin-module-card"
                  key={module.title}
                >
                  <div className="admin-module-icon">
                    <Icon size={23} />
                  </div>

                  <ArrowUpRight
                    className="admin-module-arrow"
                    size={19}
                  />

                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </Link>
              );
            })}
          </div>

          <section className="dashboard-section" id="users">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ACCESS CONTROL</span>
                <h2>User administration</h2>
              </div>
            </div>

            <div className="admin-notice">
              <UserRound size={24} />
              <div>
                <h3>User management</h3>
                <p>
                  View registered users, search accounts and filter
                  gallery members by their assigned roles.
                </p>
                <Link
                  to="/admin/users"
                  className="inline-block mt-3 font-semibold text-[#a27b39] hover:underline"
                >
                  Open User Management →
                </Link>
              </div>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>ARTISAN GALLERY</span>
            <span>Administrator Control Centre</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
