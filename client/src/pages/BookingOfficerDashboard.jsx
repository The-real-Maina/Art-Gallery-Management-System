import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette,
  LayoutDashboard,
  CalendarDays,
  UserRound,
  LogOut,
  Menu,
  X,
  ArrowRight,
  AlertCircle,
  LoaderCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

import api from '../services/api';

function BookingOfficerDashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('art_gallery_user') || 'null');
    } catch {
      return null;
    }
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Officer';

  useEffect(() => {
    if (!user || user.role !== 'Booking Officer') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const loadBookings = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch all bookings (Endpoint from your visitBookingRoutes.js)
        const response = await api.get('/visit-bookings');
        if (!ignore) setBookings(response.data.bookings || []);
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Unable to load visitor bookings.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBookings();
    return () => { ignore = true; };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    try {
      setActionLoadingId(bookingId);
      
      // Send PATCH request to update status
      await api.patch(`/visit-bookings/${bookingId}/status`, { booking_status: newStatus });
      
      // Update local state instantly
      setBookings(prev => 
        prev.map(b => 
          b.booking_id === bookingId ? { ...b, booking_status: newStatus } : b
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';
    const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return String(date);
    return parsedDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time) return 'Time unavailable';
    const parts = String(time).split(':');
    const hours = Number(parts[0]);
    const minutes = parts[1] || '00';
    if (Number.isNaN(hours)) return time;
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  if (!user) return null;

  // Calculate Stats
  const pendingCount = bookings.filter(b => b.booking_status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const totalVisitors = bookings.reduce((sum, b) => sum + (b.number_of_visitors || 0), 0);

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">OFFICER WORKSPACE</div>

        <nav className="dashboard-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => { setActiveTab('bookings'); setMenuOpen(false); }}>
            <CalendarDays size={19} /> Manage Bookings
            {pendingCount > 0 && (
              <span style={{ background: '#b24c48', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: 'auto' }}>
                {pendingCount}
              </span>
            )}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{firstName.charAt(0).toUpperCase()}</div>
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

      {menuOpen && <button className="dashboard-overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h2>Booking Officer Dashboard</h2>
          </div>
          <Link to="/" className="dashboard-home-link">Explore gallery <ArrowRight size={16} /></Link>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error" role="alert"><AlertCircle size={18} /> {error}</div>}
          {loading && <div className="dashboard-loading"><LoaderCircle size={24} /><span>Loading visitor bookings...</span></div>}

          {!loading && activeTab === 'overview' && (
            <>
              <div className="dashboard-welcome">
                <div>
                  <span className="eyebrow">VISITOR MANAGEMENT</span>
                  <h1>Welcome, <em>{firstName}.</em></h1>
                  <p>Review incoming visit reservations and manage the gallery's daily visitor flow.</p>
                </div>
                <div className="welcome-icon"><CalendarDays size={38} /></div>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon"><Clock size={21} /></div>
                  <span>Pending Requests</span>
                  <strong>{pendingCount}</strong>
                  <small>Awaiting confirmation</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><CheckCircle size={21} /></div>
                  <span>Confirmed Visits</span>
                  <strong>{confirmedCount}</strong>
                  <small>Upcoming reservations</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><UserRound size={21} /></div>
                  <span>Total Expected Visitors</span>
                  <strong>{totalVisitors}</strong>
                  <small>Across all bookings</small>
                </div>
              </div>
            </>
          )}

          {!loading && activeTab === 'bookings' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">RESERVATION QUEUE</span>
                  <h2>All Visit Bookings</h2>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="dashboard-empty">
                  <CalendarDays size={30} />
                  <h3>No bookings found</h3>
                  <p>There are currently no visit reservations in the system.</p>
                </div>
              ) : (
                <div className="dashboard-bookings-list">
                  {bookings.map((booking) => (
                    <div className="profile-card" key={booking.booking_id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div className="profile-details" style={{ flex: 1, minWidth: '200px' }}>
                        <h3>Booking #{booking.booking_id} - {booking.full_name || 'Visitor'}</h3>
                        <p><CalendarDays size={14} style={{ display: 'inline', marginRight: '5px' }}/> {formatDate(booking.visit_date)} at {formatTime(booking.visit_time)}</p>
                        <p><UserRound size={14} style={{ display: 'inline', marginRight: '5px' }}/> {booking.number_of_visitors} visitor(s) • {booking.email}</p>
                        {booking.special_requests && (
                          <p style={{ color: '#a47745', fontStyle: 'italic', marginTop: '5px' }}>Note: {booking.special_requests}</p>
                        )}
                        
                        <span className={`booking-status status-${booking.booking_status.toLowerCase()}`} style={{ marginTop: '15px' }}>
                          {booking.booking_status === 'Confirmed' || booking.booking_status === 'Completed' ? <CheckCircle size={16} /> : 
                           booking.booking_status === 'Cancelled' ? <XCircle size={16} /> : <Clock size={16} />}
                          {booking.booking_status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', minWidth: '130px' }}>
                        {booking.booking_status === 'Pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(booking.booking_id, 'Confirmed')}
                            disabled={actionLoadingId === booking.booking_id}
                            style={{ background: '#3f7d3c', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <CheckCircle size={14} /> Confirm
                          </button>
                        )}
                        {booking.booking_status === 'Confirmed' && (
                          <button 
                            onClick={() => handleUpdateStatus(booking.booking_id, 'Completed')}
                            disabled={actionLoadingId === booking.booking_id}
                            style={{ background: '#a47745', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <CheckCircle size={14} /> Mark Completed
                          </button>
                        )}
                        {(booking.booking_status === 'Pending' || booking.booking_status === 'Confirmed') && (
                          <button 
                            onClick={() => handleUpdateStatus(booking.booking_id, 'Cancelled')}
                            disabled={actionLoadingId === booking.booking_id}
                            style={{ background: 'transparent', color: '#b24c48', border: '1px solid #b24c48', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default BookingOfficerDashboard;