import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette, CalendarDays, Clock, Users, MapPin, ArrowRight, AlertCircle,
  LoaderCircle, CheckCircle, Compass
} from 'lucide-react';

import api from '../services/api';

const formatDate = (date) => {
  if (!date) return 'Date TBA';
  return new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
};

const formatTime = (time) => {
  if (!time) return 'Time TBA';
  const [h, m] = String(time).split(':');
  const period = Number(h) >= 12 ? 'PM' : 'AM';
  return `${Number(h) % 12 || 12}:${m || '00'} ${period}`;
};

function ToursPage() {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });
  const isVisitor = user?.role === 'Visitor';

  const [tours, setTours] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [participants, setParticipants] = useState({}); // tour_id -> number
  const [bookingTourId, setBookingTourId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const requests = [api.get('/tours/public')];
        if (isVisitor) requests.push(api.get('/tours/my-bookings'));
        const [toursRes, bookingsRes] = await Promise.all(requests);

        if (!ignore) {
          setTours(toursRes.data.tours || []);
          setMyBookings(bookingsRes?.data?.bookings || []);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load tours.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [isVisitor, reloadKey]);

  const activeBookingFor = (tourId) =>
    myBookings.find((b) => b.tour_id === tourId && ['Pending', 'Confirmed'].includes(b.booking_status));

  const handleBook = async (tour) => {
    const count = Number(participants[tour.tour_id] || 1);
    setNotice({ type: '', text: '' });

    try {
      setBookingTourId(tour.tour_id);
      await api.post(`/tours/${tour.tour_id}/book`, { number_of_participants: count });
      setNotice({ type: 'success', text: `Booking request sent for "${tour.title}". The guide will confirm it shortly.` });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Unable to book this tour.' });
    } finally {
      setBookingTourId(null);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Cancel this tour booking?')) return;
    setNotice({ type: '', text: '' });

    try {
      setCancellingId(booking.tour_booking_id);
      await api.patch(`/tours/bookings/${booking.tour_booking_id}/cancel`);
      setNotice({ type: 'success', text: 'Your booking was cancelled.' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Unable to cancel booking.' });
    } finally {
      setCancellingId(null);
    }
  };

  const renderBookControl = (tour, seatsLeft) => {
    if (!user) {
      return <Link to="/login" className="text-button">Log in to book <ArrowRight size={15} /></Link>;
    }
    if (!isVisitor) {
      return <span className="tour-note">Tour booking is available to visitor accounts.</span>;
    }

    const existing = activeBookingFor(tour.tour_id);
    if (existing) {
      return (
        <span className={`booking-status status-${existing.booking_status.toLowerCase()}`} style={{ margin: 0 }}>
          <CheckCircle size={15} /> You booked {existing.number_of_participants} ({existing.booking_status})
        </span>
      );
    }
    if (seatsLeft <= 0) {
      return <span className="tour-note">This tour is fully booked.</span>;
    }

    const maxPick = Math.min(10, seatsLeft);
    return (
      <div className="tour-book-row">
        <select
          aria-label="Number of participants"
          value={participants[tour.tour_id] || 1}
          onChange={(e) => setParticipants({ ...participants, [tour.tour_id]: Number(e.target.value) })}
        >
          {Array.from({ length: maxPick }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
          ))}
        </select>
        <button className="primary-button" disabled={bookingTourId === tour.tour_id} onClick={() => handleBook(tour)}>
          {bookingTourId === tour.tour_id ? 'Booking...' : 'Book tour'}
        </button>
      </div>
    );
  };

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/" className="brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <div className="nav-actions">
          {user
            ? <Link to="/dashboard" className="login-link">My Dashboard</Link>
            : <Link to="/login" className="login-link">Log in</Link>}
        </div>
      </header>

      <main className="tours-main">
        <div className="booking-heading">
          <span className="eyebrow"><span className="eyebrow-line"></span>GUIDED EXPERIENCES</span>
          <h1>Join a <em>guided tour.</em></h1>
          <p>Walk the gallery with one of our guides. Pick a tour, choose how many people are coming and send your booking request.</p>
        </div>

        {notice.text && (
          <div className={`booking-message ${notice.type === 'success' ? 'success' : 'error'}`}>
            {notice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {notice.text}
          </div>
        )}

        {loading ? (
          <div className="empty-state"><LoaderCircle size={28} className="loading-spinner" /><p>Loading tours...</p></div>
        ) : error ? (
          <div className="empty-state"><AlertCircle size={28} /><p>{error}</p></div>
        ) : tours.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px dashed #e8e3da' }}>
            <Compass size={48} style={{ color: '#a47745', opacity: 0.8 }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px' }}>No tours scheduled</h3>
            <p>Our guides are preparing the next experiences. Check back soon.</p>
          </div>
        ) : (
          <div className="tour-grid">
            {tours.map((tour) => {
              const seatsLeft = Number(tour.max_participants) - Number(tour.booked_seats || 0);
              return (
                <article className="tour-card" key={tour.tour_id}>
                  <h3>{tour.title}</h3>
                  <div className="tour-card-meta">
                    <span><CalendarDays size={15} /> {formatDate(tour.tour_date)}</span>
                    <span><Clock size={15} /> {formatTime(tour.start_time)} · {tour.duration_minutes} mins</span>
                    <span><Users size={15} /> {seatsLeft > 0 ? `${seatsLeft} of ${tour.max_participants} spaces left` : 'Fully booked'}</span>
                    {tour.exhibition_title && <span><MapPin size={15} /> {tour.exhibition_title}</span>}
                  </div>
                  {tour.description && <p className="tour-card-description">{tour.description}</p>}
                  <p className="tour-card-guide">Led by {tour.guide_name}</p>
                  <div className="tour-card-footer">{renderBookControl(tour, seatsLeft)}</div>
                </article>
              );
            })}
          </div>
        )}

        {isVisitor && !loading && myBookings.length > 0 && (
          <section className="tour-mybookings">
            <h2>Your tour bookings</h2>
            <div className="dashboard-bookings-list">
              {myBookings.map((b) => {
                const cancellable = ['Pending', 'Confirmed'].includes(b.booking_status) && b.tour_status === 'Scheduled';
                return (
                  <div className="tour-booking-row tour-mybooking-row" key={b.tour_booking_id}>
                    <div className="tour-booking-who">
                      <strong>{b.tour_title}</strong>
                      <span>{formatDate(b.tour_date)} · {formatTime(b.start_time)} · {b.number_of_participants} participant{b.number_of_participants > 1 ? 's' : ''} · Guide: {b.guide_name}</span>
                    </div>
                    <span className={`booking-status status-${b.booking_status.toLowerCase()}`} style={{ margin: 0 }}>{b.booking_status}</span>
                    {cancellable && (
                      <div className="tour-booking-actions">
                        <button className="tour-action-decline" disabled={cancellingId === b.tour_booking_id} onClick={() => handleCancelBooking(b)}>
                          {cancellingId === b.tour_booking_id ? '...' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ToursPage;