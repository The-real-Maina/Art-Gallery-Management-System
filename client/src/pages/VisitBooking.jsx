import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette,
  CalendarDays,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import api from '../services/api';

function VisitBooking() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    visit_date: '',
    visit_time: '',
    number_of_visitors: '1',
    special_requests: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('art_gallery_user') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!localStorage.getItem('art_gallery_token') || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'Visitor') {
      setError('Only Visitor accounts can make visit bookings. Please contact the gallery if you believe this is an error.');
      return;
    }

    if (!formData.visit_date) {
      setError('Please select a visit date.');
      return;
    }

    if (formData.visit_date < minDate) {
      setError('Please select today or a future date.');
      return;
    }

    const visitors = Number(formData.number_of_visitors);
    if (!Number.isInteger(visitors) || visitors < 1 || visitors > 100) {
      setError('Visitor count must be between 1 and 100.');
      return;
    }

    try {
      setLoading(true);

      // Format time to include seconds (e.g., 14:30 becomes 14:30:00) 
      // Just in case the database TIME column requires it.
      const timeString = formData.visit_time;
      const formattedTime = timeString.length === 5 ? `${timeString}:00` : timeString;

      const payload = {
        // Send exactly 'YYYY-MM-DD' to satisfy the strict backend check
        visit_date: formData.visit_date, 
        visit_time: formattedTime,
        number_of_visitors: visitors,
        special_requests: formData.special_requests || null,
      };

      console.log("Sending to backend:", payload);

      const response = await api.post('/visit-bookings', payload);

      setSuccess(`Your booking #${response.data.booking_id} has been submitted successfully.`);
      
      setFormData({
        visit_date: '',
        visit_time: '',
        number_of_visitors: '1',
        special_requests: ''
      });
    } catch (err) {
      console.error("Backend Error details:", err.response?.data);
      
      setError(
        err.response?.data?.message || 
        'Unable to submit your booking. Please check your date and time and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; 
  }

  if (user.role !== 'Visitor') {
    return (
      <div className="booking-page">
        <header className="booking-header">
          <Link to="/" className="brand">
            <span className="brand-icon"><Palette size={22} /></span>
            <span>ARTISAN<span className="brand-light">.</span></span>
          </Link>
        </header>
        <main className="booking-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="booking-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
            <AlertCircle size={40} style={{ color: '#b24c48', margin: '0 auto 15px' }} />
            <h2>Access Restricted</h2>
            <p style={{ margin: '15px 0 25px', color: '#777168' }}>
              Only accounts registered as a <strong>Visitor</strong> can book gallery visits. Your current account type is <strong>{user.role}</strong>.
            </p>
            <Link to="/" className="primary-button">Return to Gallery</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/" className="brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <Link to="/dashboard" className="dashboard-home-link">
          My dashboard
        </Link>
      </header>

      <main className="booking-main">
        <Link to="/" className="booking-back-link">
          <ArrowLeft size={17} /> Back to gallery
        </Link>

        <div className="booking-heading">
          <span className="eyebrow">YOUR NEXT EXPERIENCE</span>
          <h1>Plan your <em>gallery visit.</em></h1>
          <p>Complete the form below to reserve your place at the gallery.</p>
        </div>

        <form className="booking-card" onSubmit={handleSubmit}>
          <div className="booking-form-heading">
            <CalendarDays size={25} />
            <div>
              <h2>Visit reservation</h2>
              <p>Enter your preferred visit details.</p>
            </div>
          </div>

          {error && (
            <div className="booking-message error">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="booking-message success">
              <CheckCircle size={18} /> <span>{success}</span>
            </div>
          )}

          <div className="booking-field">
            <label htmlFor="visit_date">Visit date</label>
            <input
              id="visit_date"
              type="date"
              name="visit_date"
              min={minDate}
              value={formData.visit_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="visit_time">Preferred visit time</label>
            <input
              id="visit_time"
              type="time"
              name="visit_time"
              value={formData.visit_time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="number_of_visitors">Number of visitors</label>
            <input
              id="number_of_visitors"
              type="number"
              name="number_of_visitors"
              min="1"
              max="100"
              value={formData.number_of_visitors}
              onChange={handleChange}
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="special_requests">Special requests (optional)</label>
            <textarea
              id="special_requests"
              name="special_requests"
              rows="4"
              placeholder="Any additional information for the gallery..."
              value={formData.special_requests}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="primary-button booking-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit booking'}
            {!loading && <CalendarDays size={17} />}
          </button>

          <p className="booking-note">Your reservation will initially have Pending status.</p>
        </form>
      </main>
    </div>
  );
}

export default VisitBooking;