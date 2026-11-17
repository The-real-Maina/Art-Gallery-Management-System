import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, MapPin, CalendarDays, Clock, Users, LogOut, Menu, X, ArrowRight, AlertCircle, LoaderCircle, PlusCircle, Edit, Ban
} from 'lucide-react';

import api from '../services/api';

function TourGuideDashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, my-tours, tour-form
  
  const [tours, setTours] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Form state
  const [tourData, setTourData] = useState({
    title: '', description: '', exhibition_id: '', tour_date: '', start_time: '', duration_minutes: '60', max_participants: '20'
  });
  const [editingTourId, setEditingTourId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Guide';

  useEffect(() => {
    if (!user || user.role !== 'Tour Guide') navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const loadData = async () => {
      try {
        const [toursRes, exRes] = await Promise.all([
          api.get('/tours/my-tours'),
          api.get('/exhibitions/public')
        ]);
        
        if (!ignore) {
          setTours(toursRes.data.tours || []);
          setExhibitions(exRes.data.exhibitions || []);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load data.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();
    return () => { ignore = true; };
  }, [user, reloadKey]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  const handleEditClick = (tour) => {
    setTourData({
      title: tour.title,
      description: tour.description || '',
      exhibition_id: tour.exhibition_id || '',
      tour_date: String(tour.tour_date).slice(0, 10),
      start_time: String(tour.start_time).slice(0, 5),
      duration_minutes: tour.duration_minutes,
      max_participants: tour.max_participants
    });
    setEditingTourId(tour.tour_id);
    setActiveTab('tour-form');
  };

  const handleCancelTour = async (tourId) => {
    if (!window.confirm('Are you sure you want to cancel this tour? All current bookings will be cancelled.')) return;
    try {
      setActionLoadingId(tourId);
      await api.patch(`/tours/${tourId}/cancel`);
      setReloadKey(k => k + 1); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel tour.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitTour = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage('');

    try {
      const formattedStartTime = tourData.start_time.length === 5 ? `${tourData.start_time}:00` : tourData.start_time;
      const payload = {
        ...tourData,
        start_time: formattedStartTime,
        duration_minutes: Number(tourData.duration_minutes),
        max_participants: Number(tourData.max_participants),
        exhibition_id: tourData.exhibition_id ? Number(tourData.exhibition_id) : null
      };

      if (editingTourId) {
        await api.put(`/tours/${editingTourId}`, payload);
        setFormMessage('Tour updated successfully!');
      } else {
        await api.post('/tours', payload);
        setFormMessage('Tour scheduled successfully!');
      }
      
      setTourData({ title: '', description: '', exhibition_id: '', tour_date: '', start_time: '', duration_minutes: '60', max_participants: '20' });
      setEditingTourId(null);
      setReloadKey(k => k + 1);
      
      setTimeout(() => { setActiveTab('my-tours'); setFormMessage(''); }, 1500);
    } catch (err) {
      setFormMessage(err.response?.data?.message || 'Failed to save tour.');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date TBA';
    return new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time) return 'Time TBA';
    const [h, m] = String(time).split(':');
    const period = Number(h) >= 12 ? 'PM' : 'AM';
    return `${Number(h) % 12 || 12}:${m || '00'} ${period}`;
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">TOUR GUIDE WORKSPACE</div>

        <nav className="dashboard-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={activeTab === 'my-tours' ? 'active' : ''} onClick={() => { setActiveTab('my-tours'); setMenuOpen(false); }}>
            <MapPin size={19} /> My Tours
          </button>
          <button className={activeTab === 'tour-form' ? 'active' : ''} onClick={() => { setEditingTourId(null); setTourData({ title: '', description: '', exhibition_id: '', tour_date: '', start_time: '', duration_minutes: '60', max_participants: '20' }); setActiveTab('tour-form'); setMenuOpen(false); }}>
            <PlusCircle size={19} /> Schedule Tour
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div><strong>{user.full_name}</strong><span>{user.role}</span></div>
          </div>
          <button className="logout-button" onClick={handleLogout}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      {menuOpen && <button className="dashboard-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <div><span className="eyebrow">YOUR WORKSPACE</span><h2>Tour Guide Dashboard</h2></div>
          <Link to="/" className="dashboard-home-link">Explore gallery <ArrowRight size={16} /></Link>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error"><AlertCircle size={18} /> {error}</div>}
          {loading && <div className="dashboard-loading"><LoaderCircle size={24} /><span>Loading your tours...</span></div>}

          {!loading && activeTab === 'overview' && (
            <>
              <div className="dashboard-welcome">
                <div>
                  <span className="eyebrow">GUIDED EXPERIENCES</span>
                  <h1>Welcome, <em>{firstName}.</em></h1>
                  <p>Manage your schedule, create new tours, and welcome visitors to the gallery.</p>
                </div>
                <div className="welcome-icon"><MapPin size={38} /></div>
              </div>
              <div className="dashboard-stats">
                <div className="stat-card"><div className="stat-icon"><CalendarDays size={21} /></div><span>Scheduled Tours</span><strong>{tours.length}</strong><small>Upcoming experiences</small></div>
                <div className="stat-card"><div className="stat-icon"><Users size={21} /></div><span>Total Capacity</span><strong>{tours.reduce((sum, t) => sum + Number(t.max_participants || 0), 0)}</strong><small>Max visitors available</small></div>
              </div>
            </>
          )}

          {!loading && activeTab === 'my-tours' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div><span className="eyebrow">YOUR SCHEDULE</span><h2>Upcoming Tours</h2></div>
                <button onClick={() => { setEditingTourId(null); setTourData({ title: '', description: '', exhibition_id: '', tour_date: '', start_time: '', duration_minutes: '60', max_participants: '20' }); setActiveTab('tour-form'); }} className="primary-button header-book-btn"><PlusCircle size={16} /> New Tour</button>
              </div>

              {tours.length === 0 ? (
                <div className="dashboard-empty">
                  <MapPin size={30} /><h3>No tours scheduled</h3>
                  <button onClick={() => setActiveTab('tour-form')} className="primary-button">Schedule Tour <ArrowRight size={16} /></button>
                </div>
              ) : (
                <div className="dashboard-bookings-list">
                  {tours.map((tour) => {
                    const isCancelled = tour.status === 'Cancelled';
                    const booked = Number(tour.booked_seats || 0);
                    return (
                      <div className="profile-card" key={tour.tour_id} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', opacity: isCancelled ? 0.6 : 1 }}>
                        <div className="profile-details" style={{ flex: 1 }}>
                          <h3>{tour.title}</h3>
                          <p><CalendarDays size={14} style={{ display: 'inline', marginRight: '5px' }}/> {formatDate(tour.tour_date)}</p>
                          <p><Clock size={14} style={{ display: 'inline', marginRight: '5px' }}/> {formatTime(tour.start_time)} ({tour.duration_minutes} mins)</p>
                          <p style={{ marginTop: '10px', color: '#777168' }}>{tour.description}</p>
                          <span className={`booking-status status-${isCancelled ? 'cancelled' : 'confirmed'}`} style={{ marginTop: '15px' }}>
                            <Users size={16} /> {booked} / {tour.max_participants} booked
                          </span>
                          {isCancelled && <span style={{ marginLeft: '10px', color: '#b24c48', fontWeight: 'bold', fontSize: '12px' }}>CANCELLED</span>}
                        </div>
                        
                        {!isCancelled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => handleEditClick(tour)} className="primary-button" style={{ padding: '8px 12px', fontSize: '11px', background: '#a47745' }}>
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => handleCancelTour(tour.tour_id)} disabled={actionLoadingId === tour.tour_id} className="logout-button" style={{ padding: '8px 12px', fontSize: '11px', border: '1px solid #b24c48', borderRadius: '5px', color: '#b24c48', width: 'auto' }}>
                              <Ban size={14} /> {actionLoadingId === tour.tour_id ? '...' : 'Cancel'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!loading && activeTab === 'tour-form' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{editingTourId ? 'EDIT EXPERIENCE' : 'NEW EXPERIENCE'}</span>
                  <h2>{editingTourId ? 'Update Guided Tour' : 'Schedule a Guided Tour'}</h2>
                </div>
              </div>

              <form className="booking-card" onSubmit={handleSubmitTour} style={{ maxWidth: '800px' }}>
                {formMessage && <div className={`booking-message ${formMessage.includes('success') ? 'success' : 'error'}`}>{formMessage}</div>}

                <div className="booking-field">
                  <label>Tour Title</label>
                  <input type="text" required placeholder="e.g., Modern African Art Walkthrough" value={tourData.title} onChange={e => setTourData({...tourData, title: e.target.value})} />
                </div>

                <div className="booking-field">
                  <label>Description</label>
                  <textarea rows="3" required placeholder="What will visitors experience?" value={tourData.description} onChange={e => setTourData({...tourData, description: e.target.value})} />
                </div>

                <div className="booking-field">
                  <label>Link to Exhibition (Optional)</label>
                  <select value={tourData.exhibition_id} onChange={e => setTourData({...tourData, exhibition_id: e.target.value})} style={{ width: '100%', padding: '14px 16px', border: '1px solid #e8e3da', borderRadius: '6px', background: '#faf9f6', color: '#25231f', fontSize: '14px' }}>
                    <option value="">-- None --</option>
                    {exhibitions.map(ex => <option key={ex.exhibition_id} value={ex.exhibition_id}>{ex.title}</option>)}
                  </select>
                </div>

                <div className="dashboard-form-grid">
                  <div className="booking-field">
                    <label>Date</label>
                    <input type="date" required value={tourData.tour_date} onChange={e => setTourData({...tourData, tour_date: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Start Time</label>
                    <input type="time" required value={tourData.start_time} onChange={e => setTourData({...tourData, start_time: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Duration (minutes)</label>
                    <input type="number" min="15" max="480" required value={tourData.duration_minutes} onChange={e => setTourData({...tourData, duration_minutes: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Max Participants</label>
                    <input type="number" min="1" max="200" required value={tourData.max_participants} onChange={e => setTourData({...tourData, max_participants: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="primary-button" disabled={formLoading}>
                    {formLoading ? 'Saving...' : editingTourId ? 'Save Changes' : 'Schedule Tour'}
                  </button>
                  {editingTourId && (
                    <button type="button" className="logout-button" onClick={() => setActiveTab('my-tours')} style={{ width: 'auto', padding: '14px 20px', border: '1px solid #e8e3da' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default TourGuideDashboard;