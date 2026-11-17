import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, Heart, CalendarDays, UserRound, LogOut, Menu, X, ArrowRight, Sparkles, Clock, CheckCircle, XCircle, AlertCircle, LoaderCircle, Compass, PlusCircle, MessageCircle, MapPin, Users, Star
} from 'lucide-react';

import api from '../services/api';
import NotificationBell from '../components/NotificationBell';

function Dashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [visitorTours, setVisitorTours] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [availableTours, setAvailableTours] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [bookingTourId, setBookingTourId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Feedback Modal State
  const [feedbackModalBooking, setFeedbackModalBooking] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('art_gallery_user') || 'null');
    } catch {
      return null;
    }
  });

  const isVisitor = user?.role === 'Visitor';
  const isCollector = user?.role === 'Art Collector';
  const firstName = user?.full_name?.split(' ')[0] || 'Visitor';

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // Fetch all dashboard data
  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const loadDashboard = async () => {
      try {
        const requests = [
          api.get('/exhibitions/public'),
          api.get('/tours/public')
        ];

        if (isVisitor) {
          requests.push(api.get('/visit-bookings/my-bookings'));
          requests.push(api.get('/tours/my-bookings'));
          requests.push(api.get('/feedback/my-feedback'));
        }

        if (isCollector) {
          requests.push(api.get('/collectors/favourites'));
          requests.push(api.get('/collectors/inquiries'));
        }

        const responses = await Promise.all(requests);
        if (ignore) return;

        let responseIndex = 0;
        setExhibitions(responses[responseIndex++].data.exhibitions || []);
        setAvailableTours(responses[responseIndex++].data.tours || []);

        if (isVisitor) {
          setBookings(responses[responseIndex++].data.bookings || []);
          setVisitorTours(responses[responseIndex++].data.bookings || []);
          setMyFeedback(responses[responseIndex++].data.feedback || []);
        }

        if (isCollector) {
          setFavourites(responses[responseIndex++].data.favourites || []);
          setInquiries(responses[responseIndex++].data.inquiries || []);
        }

        setError('');
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load your dashboard information.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();
    return () => { ignore = true; };
  }, [user, isVisitor, isCollector, reloadKey]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this visit?')) return;
    try {
      setCancellingId(bookingId);
      await api.patch(`/visit-bookings/${bookingId}/cancel`);
      setBookings((current) => current.map((b) => b.booking_id === bookingId ? { ...b, booking_status: 'Cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleBookTour = async (tourId) => {
    if (!window.confirm('Reserve a spot for this guided tour?')) return;

    try {
      setBookingTourId(tourId);
      await api.post(`/tours/${tourId}/book`, { number_of_participants: 1 });
      alert('Tour booked successfully! The tour guide will expect you.');
      setLoading(true);
      setReloadKey(k => k + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to book this tour.');
    } finally {
      setBookingTourId(null);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModalBooking) return;

    try {
      setFeedbackSubmitting(true);
      await api.post('/feedback', {
        booking_id: feedbackModalBooking.booking_id,
        rating: feedbackRating,
        comment: feedbackComment.trim() || null
      });
      
      alert('Thank you! Your feedback has been submitted.');
      setFeedbackModalBooking(null);
      setFeedbackRating(5);
      setFeedbackComment('');
      
      // Refresh to show the new feedback
      setLoading(true);
      setReloadKey(k => k + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';
    const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return String(date);
    return parsedDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
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

  const formatExhibitionDate = (start, end) => {
    if (!start || !end) return 'Dates TBA';
    try {
      const startStr = new Date(start).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
      const endStr = new Date(end).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr.toUpperCase()} — ${endStr.toUpperCase()}`;
    } catch { return 'Dates TBA'; }
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="dashboard-nav">
          <a href="#overview" className="active" onClick={() => setMenuOpen(false)}><LayoutDashboard size={19} /> Overview</a>
          <a href="#exhibitions" onClick={() => setMenuOpen(false)}><Compass size={19} /> Exhibitions</a>
          {isVisitor && <a href="#guided-tours" onClick={() => setMenuOpen(false)}><MapPin size={19} /> Guided Tours</a>}
          {isVisitor && <a href="#my-feedback" onClick={() => setMenuOpen(false)}><Star size={19} /> My Feedback</a>}
          {isCollector && <a href="#favourites" onClick={() => setMenuOpen(false)}><Heart size={19} /> My favourites</a>}
          {isCollector && <a href="#inquiries" onClick={() => setMenuOpen(false)}><MessageCircle size={19} /> My inquiries</a>}
          {isVisitor && <a href="#bookings" onClick={() => setMenuOpen(false)}><CalendarDays size={19} /> My visits</a>}
          <a href="#profile" onClick={() => setMenuOpen(false)}><UserRound size={19} /> My profile</a>
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
          <div><span className="eyebrow">YOUR WORKSPACE</span><h2>My Dashboard</h2></div>
          <div className="dashboard-header-actions">
            <NotificationBell />
            <Link to="/book-visit" className="primary-button header-book-btn"><PlusCircle size={16} /> Book a visit</Link>
            <Link to="/" className="dashboard-home-link">Explore gallery <ArrowRight size={16} /></Link>
          </div>
        </header>

        <section className="dashboard-content" id="overview">
          <div className="dashboard-welcome">
            <div><span className="eyebrow">YOUR ART JOURNEY</span><h1>Welcome back, <em>{firstName}.</em></h1><p>Discover extraordinary artwork, meet talented artists and experience creativity.</p></div>
            <div className="welcome-icon"><Sparkles size={38} /></div>
          </div>

          {error && <div className="dashboard-error"><AlertCircle size={18} /> {error}</div>}

          <div className="dashboard-stats">
            {isCollector && (
              <div className="stat-card"><div className="stat-icon"><Heart size={21} /></div><span>Saved artworks</span><strong>{loading ? '...' : favourites.length}</strong><small>Your favourite pieces</small></div>
            )}
            {isCollector && (
              <div className="stat-card"><div className="stat-icon"><MessageCircle size={21} /></div><span>Purchase Inquiries</span><strong>{loading ? '...' : inquiries.length}</strong><small>Messages sent</small></div>
            )}
            {isVisitor && (
              <div className="stat-card"><div className="stat-icon"><CalendarDays size={21} /></div><span>Visit bookings</span><strong>{loading ? '...' : bookings.length}</strong><small>Your gallery visits</small></div>
            )}
            {isVisitor && (
              <div className="stat-card"><div className="stat-icon"><Star size={21} /></div><span>Feedback Given</span><strong>{loading ? '...' : myFeedback.length}</strong><small>Reviews submitted</small></div>
            )}
            <div className="stat-card"><div className="stat-icon"><Palette size={21} /></div><span>Account type</span><strong className="stat-role">{user.role}</strong><small>Your current membership</small></div>
          </div>

          {loading && <div className="dashboard-loading"><LoaderCircle size={24} /><span>Loading your information...</span></div>}

          {/* EXHIBITIONS */}
          <section className="dashboard-section" id="exhibitions">
            <div className="section-heading">
              <div><span className="eyebrow">WHAT'S HAPPENING</span><h2>Upcoming exhibitions</h2></div>
              <Link to="/#exhibitions" className="dashboard-text-link">View on main site <ArrowRight size={15} /></Link>
            </div>
            <div className="dashboard-exhibitions-grid">
              {!loading && exhibitions.map((ex) => (
                <div className="dashboard-exhibition-card" key={ex.exhibition_id}>
                  <img src={ex.cover_image || 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=800&q=85'} alt={ex.title} />
                  <div className="dashboard-exhibition-info">
                    <span className="dashboard-exhibition-date">{formatExhibitionDate(ex.start_date, ex.end_date)}</span>
                    <h3>{ex.title}</h3>
                    <p>{ex.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* GUIDED TOURS */}
          {isVisitor && (
            <section className="dashboard-section" id="guided-tours">
              <div className="section-heading">
                <div><span className="eyebrow">EXPLORE WITH AN EXPERT</span><h2>Available Guided Tours</h2></div>
              </div>

              {!loading && availableTours.length === 0 ? (
                <div className="dashboard-empty">
                  <MapPin size={30} /><h3>No tours scheduled</h3><p>Check back later for guided tours of the gallery.</p>
                </div>
              ) : (
                <div className="dashboard-bookings-list">
                  {availableTours.map((tour) => {
                    const seatsLeft = tour.max_participants - (tour.booked_seats || 0);
                    return (
                      <div className="profile-card" key={tour.tour_id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div className="profile-details" style={{ flex: 1, minWidth: '200px' }}>
                          <h3>{tour.title}</h3>
                          <p><CalendarDays size={14} style={{ display: 'inline', marginRight: '5px' }}/> {formatDate(tour.tour_date)}</p>
                          <p><Clock size={14} style={{ display: 'inline', marginRight: '5px' }}/> {formatTime(tour.start_time)} ({tour.duration_minutes} mins)</p>
                          <p><Users size={14} style={{ display: 'inline', marginRight: '5px' }}/> Guide: {tour.guide_name}</p>
                          {tour.exhibition_title && <p style={{ color: '#a47745', fontWeight: 'bold' }}>Exhibition: {tour.exhibition_title}</p>}
                          <p style={{ marginTop: '10px', color: '#777168', fontSize: '13px' }}>{tour.description}</p>

                          <span className={`booking-status status-${seatsLeft > 0 ? 'confirmed' : 'cancelled'}`} style={{ marginTop: '15px' }}>
                            <Users size={16} /> {seatsLeft > 0 ? `${seatsLeft} of ${tour.max_participants} seats left` : 'Fully Booked'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '10px' }}>
                          <button
                            onClick={() => handleBookTour(tour.tour_id)}
                            disabled={bookingTourId === tour.tour_id || seatsLeft <= 0}
                            className="primary-button"
                            style={{ padding: '10px 20px', fontSize: '12px' }}
                          >
                            {bookingTourId === tour.tour_id ? 'Booking...' : seatsLeft <= 0 ? 'Fully Booked' : 'Book Tour'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {visitorTours.length > 0 && (
                <>
                  <div className="section-heading" style={{ marginTop: '40px' }}>
                    <div><span className="eyebrow">YOUR RESERVATIONS</span><h2>My Tour Bookings</h2></div>
                  </div>
                  <div className="dashboard-bookings-list">
                    {visitorTours.map((tb) => (
                      <div className="profile-card" key={tb.tour_booking_id}>
                        <div className="profile-details">
                          <h3>{tb.tour_title}</h3>
                          <p><CalendarDays size={14} style={{ display: 'inline', marginRight: '5px' }}/> {formatDate(tb.tour_date)} at {formatTime(tb.start_time)}</p>
                          <p>Guide: {tb.guide_name}</p>
                          <span className={`booking-status status-${(tb.booking_status || 'Pending').toLowerCase()}`}>
                            {tb.booking_status === 'Confirmed' ? <CheckCircle size={17} /> : <Clock size={17} />}
                            {tb.booking_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* FAVOURITES */}
          {isCollector && (
            <section className="dashboard-section" id="favourites">
              <div className="section-heading">
                <div><span className="eyebrow">YOUR COLLECTION</span><h2>Saved artworks</h2></div>
                <Link to="/" className="dashboard-text-link">Discover art <ArrowRight size={15} /></Link>
              </div>
              {!loading && favourites.length === 0 ? (
                <div className="dashboard-empty"><Heart size={30} /><h3>Your collection starts here</h3><Link to="/" className="primary-button">Explore artworks</Link></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {favourites.map((f) => (
                    <div className="profile-card" key={f.favourite_id}>
                      <div className="profile-details">
                        <h3>{f.title}</h3><p>{f.artist_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* INQUIRIES */}
          {isCollector && (
            <section className="dashboard-section" id="inquiries">
              <div className="section-heading"><div><span className="eyebrow">PURCHASE REQUESTS</span><h2>My inquiries</h2></div></div>
              {!loading && inquiries.length === 0 ? (
                <div className="dashboard-empty"><MessageCircle size={30} /><h3>No inquiries sent</h3></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {inquiries.map((inq) => (
                    <div className="profile-card" key={inq.inquiry_id}>
                      <div className="profile-details">
                        <h3>{inq.artwork_title}</h3>
                        <p style={{ fontStyle: 'italic', margin: '10px 0' }}>"{inq.message}"</p>
                        <span className={`booking-status status-${(inq.inquiry_status || 'Pending').toLowerCase()}`}>{inq.inquiry_status || 'Pending'}</span>
                        {inq.response && (
                          <div style={{ marginTop: '15px', padding: '15px', background: '#f4f2eb', borderRadius: '5px', borderLeft: '3px solid #a47745' }}>
                            <strong style={{ fontSize: '12px', color: '#a47745', textTransform: 'uppercase' }}>Gallery Response:</strong>
                            <p style={{ margin: '5px 0 0', fontSize: '13px' }}>{inq.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* BOOKINGS */}
          {isVisitor && (
            <section className="dashboard-section" id="bookings">
              <div className="section-heading"><div><span className="eyebrow">PLAN YOUR EXPERIENCE</span><h2>My visits</h2></div></div>
              {!loading && bookings.length === 0 ? (
                <div className="dashboard-empty"><CalendarDays size={30} /><h3>No bookings yet</h3><Link to="/book-visit" className="primary-button">Plan a visit</Link></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {bookings.map((b) => {
                    const hasFeedback = myFeedback.some(f => f.booking_id === b.booking_id);
                    return (
                      <div className="profile-card" key={b.booking_id}>
                        <div className="profile-details" style={{ flex: 1 }}>
                          <h3>Gallery Visit #{b.booking_id}</h3>
                          <p><CalendarDays size={15} /> {formatDate(b.visit_date)}</p>
                          <p><Clock size={15} /> {formatTime(b.visit_time)}</p>
                          <p>{b.number_of_visitors} visitor(s)</p>
                          <span className="booking-status">
                            {['Confirmed', 'Completed'].includes(b.booking_status) ? <CheckCircle size={17} /> : b.booking_status === 'Cancelled' ? <XCircle size={17} /> : <Clock size={17} />}
                            {b.booking_status}
                          </span>
                          {['Pending', 'Confirmed'].includes(b.booking_status) && (
                            <button className="logout-button" disabled={cancellingId === b.booking_id} onClick={() => handleCancelBooking(b.booking_id)}>
                              {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel booking'}
                            </button>
                          )}
                        </div>
                        
                        {/* Leave Feedback Button */}
                        {b.booking_status === 'Completed' && !hasFeedback && (
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
                            <button 
                              onClick={() => setFeedbackModalBooking(b)}
                              className="primary-button"
                              style={{ padding: '10px 15px', fontSize: '12px', whiteSpace: 'nowrap' }}
                            >
                              <Star size={14} /> Leave Feedback
                            </button>
                          </div>
                        )}
                        {b.booking_status === 'Completed' && hasFeedback && (
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '20px', color: '#3f7d3c', fontSize: '12px', fontWeight: 'bold' }}>
                            <CheckCircle size={16} style={{ marginRight: '5px' }} /> Feedback Sent
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* MY FEEDBACK */}
          {isVisitor && (
            <section className="dashboard-section" id="my-feedback">
              <div className="section-heading">
                <div><span className="eyebrow">YOUR REVIEWS</span><h2>My Feedback</h2></div>
              </div>
              
              {!loading && myFeedback.length === 0 ? (
                <div className="dashboard-empty">
                  <Star size={30} />
                  <h3>No feedback yet</h3>
                  <p>Complete a visit and leave a review to help us improve.</p>
                </div>
              ) : (
                <div className="dashboard-bookings-list">
                  {myFeedback.map((fb) => (
                    <div className="profile-card" key={fb.feedback_id}>
                      <div className="profile-details">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div>
                            <h3 style={{ margin: 0 }}>{fb.exhibition_title || `Gallery Visit #${fb.booking_id}`}</h3>
                            <span style={{ fontSize: '11px', color: '#999' }}>{formatDate(fb.created_at)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={16} fill={fb.rating >= star ? '#f5b301' : 'none'} color={fb.rating >= star ? '#f5b301' : '#ccc'} />
                            ))}
                          </div>
                        </div>
                        <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>"{fb.comment || 'No comment provided.'}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* PROFILE */}
          <section className="dashboard-section" id="profile">
            <div className="section-heading"><div><span className="eyebrow">ACCOUNT INFORMATION</span><h2>My profile</h2></div></div>
            <div className="profile-card">
              <div className="profile-avatar">{firstName.charAt(0).toUpperCase()}</div>
              <div className="profile-details"><h3>{user.full_name}</h3><p>{user.email}</p><span>{user.role}</span></div>
            </div>
          </section>

          <footer className="dashboard-footer"><span>ARTISAN GALLERY</span><span>Discover. Experience. Collect.</span></footer>
        </section>
      </main>

      {/* FEEDBACK MODAL */}
      {feedbackModalBooking && (
        <div className="dashboard-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="booking-card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setFeedbackModalBooking(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '10px' }}>Leave Feedback</h2>
            <p style={{ color: '#777168', marginBottom: '20px', fontSize: '14px' }}>
              How was your visit on <strong>{formatDate(feedbackModalBooking.visit_date)}</strong>?
            </p>

            <form onSubmit={handleSubmitFeedback}>
              <div className="booking-field" style={{ alignItems: 'center', marginBottom: '20px' }}>
                <label style={{ textAlign: 'center', marginBottom: '10px' }}>Your Rating</label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={32}
                      fill={feedbackRating >= star ? '#f5b301' : 'none'}
                      color={feedbackRating >= star ? '#f5b301' : '#ccc'}
                      onClick={() => setFeedbackRating(star)}
                      style={{ transition: 'transform 0.1s' }}
                    />
                  ))}
                </div>
              </div>

              <div className="booking-field">
                <label>Comments (Optional)</label>
                <textarea 
                  rows="4" 
                  placeholder="Tell us about your experience..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
              </div>

              <button type="submit" className="primary-button" disabled={feedbackSubmitting} style={{ width: '100%' }}>
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;