import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, CalendarDays, ArrowLeft, ArrowRight, CheckCircle, AlertCircle,
  User, Users, ChevronLeft, Download
} from 'lucide-react';

import api from '../services/api';

const STEPS = [
  { id: 1, label: 'Your Info', icon: User },
  { id: 2, label: 'Visit Details', icon: CalendarDays },
  { id: 3, label: 'Group & Safety', icon: Users },
  { id: 4, label: 'Review', icon: CheckCircle },
];

const INITIAL_FORM = {
  full_name: '', email: '',
  visitor_phone: '', visitor_id_number: '',
  country_city: '', age_group: '', occupation: '', referral_source: '',
  visit_date: '', visit_time: '', visit_type: '', estimated_duration: '',
  exhibition_id: '', guided_tour_interest: false, accessibility_needs: '',
  adults: '1', children: '0', seniors: '0', students: '0',
  emergency_name: '', emergency_phone: '', emergency_relationship: '',
  allergies: '', occasion: '', preferred_language: 'English',
  photo_consent: 'yes', driving: 'no', vehicle_registration: '',
  special_requests: '',
  declaration_accepted: false,
};

const AGE_GROUPS   = ['Under 18', '18–24', '25–34', '35–49', '50–64', '65+'];
const OCCUPATIONS  = ['Student', 'Professional', 'Artist', 'Educator', 'Retired', 'Other'];
const REFERRALS    = ['Social media', 'Friend or family', 'Website', 'Walk-in', 'Other'];
const VISIT_TYPES  = ['Solo', 'Couple', 'Family', 'Group of friends', 'School trip', 'Corporate event'];
const DURATIONS    = ['1 hour', '2 hours', 'Half day', 'Full day'];
const OCCASIONS    = ['None', 'Birthday', 'Anniversary', 'School trip', 'Corporate event', 'Other'];
const LANGUAGES    = ['English', 'Swahili', 'French', 'Other'];

const selectStyle = {
  width: '100%', padding: '14px 16px', border: '1px solid #e8e3da',
  borderRadius: '6px', background: '#faf9f6', color: '#25231f', fontSize: '14px',
};

function VisitBooking() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  const [step, setStep] = useState(1);

  // Pre-fill name and email from the logged-in user when the form is first created
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM,
    full_name: user?.full_name || '',
    email: user?.email || '',
  }));

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [exhibitions, setExhibitions] = useState([]);
  const [exhibitionsLoading, setExhibitionsLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await api.get('/exhibitions/public');
        if (!ignore) setExhibitions(res.data.exhibitions || []);
      } catch { /* swallow */ }
      finally { if (!ignore) setExhibitionsLoading(false); }
    })();
    return () => { ignore = true; };
  }, []);

  const minDate = (() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  })();

  const { adults, children, seniors, students, visit_time } = formData;

  const totalVisitors = useMemo(
    () => [adults, children, seniors, students].reduce((s, v) => s + (Number(v) || 0), 0),
    [adults, children, seniors, students]
  );

  const timeSlot = useMemo(() => {
    if (!visit_time) return '';
    const h = Number(String(visit_time).split(':')[0]);
    if (h < 12) return 'Morning';
    if (h < 16) return 'Afternoon';
    return 'Evening';
  }, [visit_time]);

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!formData.visitor_phone.trim()) e.visitor_phone = 'Phone number is required.';
      else if (!/^\+?[0-9\s\-()]{7,20}$/.test(formData.visitor_phone.trim()))
        e.visitor_phone = 'Enter a valid phone number.';
    }
    if (s === 2) {
      if (!formData.visit_date) e.visit_date = 'Visit date is required.';
      else if (formData.visit_date < minDate) e.visit_date = 'Please select today or a future date.';
      if (!formData.visit_time) e.visit_time = 'Visit time is required.';
      if (!formData.visit_type) e.visit_type = 'Please select a visit type.';
    }
    if (s === 3) {
      if (totalVisitors < 1) e.breakdown = 'Please add at least one visitor.';
      else if (totalVisitors > 100) e.breakdown = 'Maximum 100 visitors per booking.';
      if (!formData.emergency_name.trim()) e.emergency_name = 'Emergency contact name is required.';
      if (!formData.emergency_phone.trim()) e.emergency_phone = 'Emergency contact phone is required.';
    }
    if (s === 4) {
      if (!formData.declaration_accepted) e.declaration_accepted = 'You must accept the declaration to proceed.';
    }
    return e;
  };

  const goNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const e = validateStep(4);
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        number_of_visitors: totalVisitors,
        time_slot: timeSlot,
        exhibition_id: formData.exhibition_id || null,
        guided_tour_interest: formData.guided_tour_interest ? 1 : 0,
        photo_consent: formData.photo_consent === 'yes' ? 1 : 0,
        driving: formData.driving === 'yes' ? 1 : 0,
        declaration_accepted: 1,
        adults:   Number(formData.adults)   || 0,
        children: Number(formData.children) || 0,
        seniors:  Number(formData.seniors)  || 0,
        students: Number(formData.students) || 0,
      };

      const res = await api.post('/visit-bookings', payload);

      setSubmitted({
        booking_id: res.data.booking_id,
        submitted_at: new Date().toISOString(),
        exhibition_title: exhibitions.find(e => String(e.exhibition_id) === String(formData.exhibition_id))?.title || '',
        ...payload,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Unable to submit your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
              Only accounts registered as a <strong>Visitor</strong> can book gallery visits.
            </p>
            <Link to="/" className="primary-button">Return to Gallery</Link>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- SUCCESS / DOWNLOAD SCREEN ---------- */
  if (submitted) {
    return (
      <>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .print-summary, .print-summary * { visibility: visible !important; }
            .print-summary {
              position: absolute; left: 0; top: 0;
              width: 100%; padding: 24px; box-sizing: border-box;
              background: #fff;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="booking-page">
          <header className="booking-header no-print">
            <Link to="/" className="brand">
              <span className="brand-icon"><Palette size={22} /></span>
              <span>ARTISAN<span className="brand-light">.</span></span>
            </Link>
            <Link to="/dashboard" className="dashboard-home-link">My dashboard</Link>
          </header>

          <main className="booking-main">
            <div className="booking-heading no-print" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <CheckCircle size={50} style={{ color: '#3f7d3c' }} />
              </div>
              <span className="eyebrow">BOOKING SUBMITTED</span>
              <h1>Your visit is <em>pending.</em></h1>
              <p>A Booking Officer will confirm shortly. Download the summary below for your records.</p>
            </div>

            <div className="booking-card print-summary" style={{ maxWidth: '780px', margin: '0 auto' }}>
              <div style={{ borderBottom: '2px solid #a47745', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#25231f' }}>
                  Artisan Gallery — Visit Booking
                </h2>
                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#777168' }}>
                  Booking #{submitted.booking_id} • Submitted {new Date(submitted.submitted_at).toLocaleString()}
                </p>
              </div>

              <PrintSection title="Visitor">
                <p><strong>Name:</strong> {submitted.full_name}</p>
                <p><strong>Email:</strong> {submitted.email}</p>
                <p><strong>Phone:</strong> {submitted.visitor_phone}</p>
                {submitted.country_city && <p><strong>City:</strong> {submitted.country_city}</p>}
              </PrintSection>

              <PrintSection title="Visit">
                <p><strong>Date:</strong> {submitted.visit_date} ({submitted.time_slot})</p>
                <p><strong>Time:</strong> {submitted.visit_time}</p>
                <p><strong>Type:</strong> {submitted.visit_type}</p>
                {submitted.estimated_duration && <p><strong>Duration:</strong> {submitted.estimated_duration}</p>}
                {submitted.exhibition_title && <p><strong>Exhibition:</strong> {submitted.exhibition_title}</p>}
                {submitted.guided_tour_interest ? <p><strong>Guided tour:</strong> Requested</p> : null}
                {submitted.accessibility_needs && <p><strong>Accessibility:</strong> {submitted.accessibility_needs}</p>}
              </PrintSection>

              <PrintSection title="Group">
                <p><strong>Total:</strong> {submitted.number_of_visitors} visitor(s)</p>
                <p style={{ fontSize: '13px' }}>
                  Adults: {submitted.adults} • Children: {submitted.children} •
                  Seniors: {submitted.seniors} • Students: {submitted.students}
                </p>
              </PrintSection>

              <PrintSection title="Emergency Contact">
                <p><strong>{submitted.emergency_name}</strong> ({submitted.emergency_relationship || 'Emergency'})</p>
                <p>Phone: {submitted.emergency_phone}</p>
              </PrintSection>

              {submitted.special_requests && (
                <PrintSection title="Special Requests">
                  <p style={{ fontStyle: 'italic' }}>"{submitted.special_requests}"</p>
                </PrintSection>
              )}

              <PrintSection title="Preferences">
                <p style={{ fontSize: '13px' }}>
                  Photo consent: {submitted.photo_consent ? 'Yes' : 'No'} •
                  Driving: {submitted.driving ? 'Yes' : 'No'}
                  {submitted.vehicle_registration && ` • Vehicle: ${submitted.vehicle_registration}`}
                </p>
                <p style={{ fontSize: '13px' }}>Preferred language: {submitted.preferred_language}</p>
              </PrintSection>

              <div style={{ borderTop: '2px dashed #ccc', paddingTop: '15px', textAlign: 'center', fontSize: '12px', color: '#777168' }}>
                <p style={{ margin: 0 }}>Status: <strong>Pending confirmation</strong></p>
                <p style={{ margin: '5px 0 0' }}>Please present this summary at the gallery entrance.</p>
              </div>

              <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '25px', flexWrap: 'wrap' }}>
                <button onClick={() => window.print()} className="primary-button" style={{ flex: 1, minWidth: '180px' }}>
                  <Download size={16} /> Download Summary (PDF)
                </button>
                <Link to="/dashboard" className="primary-button" style={{ flex: 1, minWidth: '180px', textAlign: 'center', background: '#292721' }}>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  /* ---------- MULTI-STEP FORM ---------- */
  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/" className="brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>
        <Link to="/dashboard" className="dashboard-home-link">My dashboard</Link>
      </header>

      <main className="booking-main">
        <Link to="/" className="booking-back-link">
          <ArrowLeft size={17} /> Back to gallery
        </Link>

        <div className="booking-heading">
          <span className="eyebrow">RESERVE YOUR EXPERIENCE</span>
          <h1>Plan your <em>gallery visit.</em></h1>
          <p>Complete the 4 steps below — you'll be able to download a copy after submission.</p>
        </div>

        {/* Progress bar */}
        <div className="booking-card" style={{ maxWidth: '780px', margin: '0 auto 25px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone   = step > s.id;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#3f7d3c' : isActive ? '#a47745' : '#e8e3da',
                      color: (isActive || isDone) ? '#fff' : '#777168',
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  {s.id < STEPS.length && (
                    <div style={{ flex: 1, height: '2px', marginLeft: '8px', background: isDone ? '#3f7d3c' : '#e8e3da' }} />
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ margin: '15px 0 0', fontSize: '13px', textAlign: 'center', color: '#777168' }}>
            Step <strong>{step}</strong> of <strong>{STEPS.length}</strong> — {STEPS.find(s => s.id === step)?.label}
          </p>
        </div>

        <div className="booking-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
          {submitError && (
            <div className="booking-message error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} /> {submitError}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '5px' }}>Your Information</h2>
              <p style={{ color: '#777168', fontSize: '13px', marginBottom: '20px' }}>Tell us who's visiting.</p>

              <div className="booking-field"><label>Full name *</label>
                <input type="text" value={formData.full_name} onChange={e => update('full_name', e.target.value)} />
              </div>
              <div className="booking-field"><label>Email *</label>
                <input type="email" value={formData.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="booking-field"><label>Phone number *</label>
                <input type="tel" placeholder="+254 7XX XXX XXX" value={formData.visitor_phone} onChange={e => update('visitor_phone', e.target.value)} />
                {errors.visitor_phone && <p className="field-error">{errors.visitor_phone}</p>}
              </div>
              <div className="booking-field"><label>National ID / Passport (optional)</label>
                <input type="text" value={formData.visitor_id_number} onChange={e => update('visitor_id_number', e.target.value)} />
              </div>
              <div className="booking-field"><label>Country / City</label>
                <input type="text" placeholder="e.g. Nairobi, Kenya" value={formData.country_city} onChange={e => update('country_city', e.target.value)} />
              </div>
              <div className="booking-field"><label>Age group</label>
                <select style={selectStyle} value={formData.age_group} onChange={e => update('age_group', e.target.value)}>
                  <option value="">Select...</option>
                  {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="booking-field"><label>Occupation</label>
                <select style={selectStyle} value={formData.occupation} onChange={e => update('occupation', e.target.value)}>
                  <option value="">Select...</option>
                  {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="booking-field"><label>How did you hear about us?</label>
                <select style={selectStyle} value={formData.referral_source} onChange={e => update('referral_source', e.target.value)}>
                  <option value="">Select...</option>
                  {REFERRALS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '5px' }}>Visit Details</h2>
              <p style={{ color: '#777168', fontSize: '13px', marginBottom: '20px' }}>When and how would you like to visit?</p>

              <div className="booking-field"><label>Visit date *</label>
                <input type="date" min={minDate} value={formData.visit_date} onChange={e => update('visit_date', e.target.value)} />
                {errors.visit_date && <p className="field-error">{errors.visit_date}</p>}
              </div>
              <div className="booking-field"><label>Preferred time *</label>
                <input type="time" value={formData.visit_time} onChange={e => update('visit_time', e.target.value)} />
                {timeSlot && <p style={{ fontSize: '12px', color: '#a47745', marginTop: '5px' }}>Time slot: <strong>{timeSlot}</strong></p>}
                {errors.visit_time && <p className="field-error">{errors.visit_time}</p>}
              </div>
              <div className="booking-field"><label>Visit type *</label>
                <select style={selectStyle} value={formData.visit_type} onChange={e => update('visit_type', e.target.value)}>
                  <option value="">Select...</option>
                  {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {errors.visit_type && <p className="field-error">{errors.visit_type}</p>}
              </div>
              <div className="booking-field"><label>Estimated duration</label>
                <select style={selectStyle} value={formData.estimated_duration} onChange={e => update('estimated_duration', e.target.value)}>
                  <option value="">Select...</option>
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="booking-field"><label>Exhibition of interest</label>
                <select style={selectStyle} value={formData.exhibition_id} onChange={e => update('exhibition_id', e.target.value)} disabled={exhibitionsLoading}>
                  <option value="">{exhibitionsLoading ? 'Loading...' : '-- None / Not sure --'}</option>
                  {exhibitions.map(ex => <option key={ex.exhibition_id} value={ex.exhibition_id}>{ex.title}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '15px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.guided_tour_interest} onChange={e => update('guided_tour_interest', e.target.checked)} />
                <span style={{ fontSize: '14px' }}>I'm interested in a guided tour</span>
              </label>
              <div className="booking-field"><label>Accessibility needs</label>
                <input type="text" placeholder="e.g. Wheelchair access, sign language guide..." value={formData.accessibility_needs} onChange={e => update('accessibility_needs', e.target.value)} />
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '5px' }}>Group & Safety</h2>
              <p style={{ color: '#777168', fontSize: '13px', marginBottom: '20px' }}>Visitor breakdown and emergency contact.</p>

              <div className="dashboard-form-grid" style={{ marginBottom: '10px' }}>
                <div className="booking-field"><label>Adults</label>
                  <input type="number" min="0" max="100" value={formData.adults} onChange={e => update('adults', e.target.value)} />
                </div>
                <div className="booking-field"><label>Children (under 12)</label>
                  <input type="number" min="0" max="100" value={formData.children} onChange={e => update('children', e.target.value)} />
                </div>
                <div className="booking-field"><label>Seniors (65+)</label>
                  <input type="number" min="0" max="100" value={formData.seniors} onChange={e => update('seniors', e.target.value)} />
                </div>
                <div className="booking-field"><label>Students</label>
                  <input type="number" min="0" max="100" value={formData.students} onChange={e => update('students', e.target.value)} />
                </div>
              </div>
              <p style={{ fontSize: '13px', color: totalVisitors > 0 ? '#3f7d3c' : '#b24c48', marginBottom: '15px' }}>
                Total visitors: <strong>{totalVisitors}</strong>
              </p>
              {errors.breakdown && <p className="field-error" style={{ marginBottom: '15px' }}>{errors.breakdown}</p>}

              <div className="booking-field"><label>Emergency contact name *</label>
                <input type="text" value={formData.emergency_name} onChange={e => update('emergency_name', e.target.value)} />
                {errors.emergency_name && <p className="field-error">{errors.emergency_name}</p>}
              </div>
              <div className="booking-field"><label>Emergency contact phone *</label>
                <input type="tel" value={formData.emergency_phone} onChange={e => update('emergency_phone', e.target.value)} />
                {errors.emergency_phone && <p className="field-error">{errors.emergency_phone}</p>}
              </div>
              <div className="booking-field"><label>Relationship</label>
                <input type="text" placeholder="e.g. Spouse, Parent, Friend" value={formData.emergency_relationship} onChange={e => update('emergency_relationship', e.target.value)} />
              </div>
              <div className="booking-field"><label>Allergies or medical conditions</label>
                <textarea rows="2" value={formData.allergies} onChange={e => update('allergies', e.target.value)} />
              </div>
              <div className="booking-field"><label>Occasion</label>
                <select style={selectStyle} value={formData.occasion} onChange={e => update('occasion', e.target.value)}>
                  <option value="">Select...</option>
                  {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="booking-field"><label>Preferred guide language</label>
                <select style={selectStyle} value={formData.preferred_language} onChange={e => update('preferred_language', e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="booking-field"><label>May we use photos from your visit for promotion?</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="photo_consent" value="yes" checked={formData.photo_consent === 'yes'} onChange={e => update('photo_consent', e.target.value)} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="photo_consent" value="no" checked={formData.photo_consent === 'no'} onChange={e => update('photo_consent', e.target.value)} /> No
                  </label>
                </div>
              </div>

              <div className="booking-field"><label>Will you be driving?</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="driving" value="no" checked={formData.driving === 'no'} onChange={e => update('driving', e.target.value)} /> No
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="driving" value="yes" checked={formData.driving === 'yes'} onChange={e => update('driving', e.target.value)} /> Yes
                  </label>
                </div>
                {formData.driving === 'yes' && (
                  <input type="text" placeholder="Vehicle registration (optional)" value={formData.vehicle_registration} onChange={e => update('vehicle_registration', e.target.value)} style={{ marginTop: '10px' }} />
                )}
              </div>

              <div className="booking-field"><label>Special requests</label>
                <textarea rows="3" placeholder="Any additional information for the gallery..." value={formData.special_requests} onChange={e => update('special_requests', e.target.value)} />
              </div>
            </>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '5px' }}>Review & Confirm</h2>
              <p style={{ color: '#777168', fontSize: '13px', marginBottom: '20px' }}>Please check your details before submitting.</p>

              <div style={{ background: '#faf9f6', padding: '20px', borderRadius: '8px', fontSize: '14px', lineHeight: 1.8 }}>
                <p><strong>Visitor:</strong> {formData.full_name} ({formData.email})</p>
                <p><strong>Phone:</strong> {formData.visitor_phone}</p>
                {formData.country_city && <p><strong>City:</strong> {formData.country_city}</p>}
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e8e3da' }} />
                <p><strong>Date:</strong> {formData.visit_date} — {formData.visit_time} ({timeSlot})</p>
                <p><strong>Type:</strong> {formData.visit_type}</p>
                {formData.estimated_duration && <p><strong>Duration:</strong> {formData.estimated_duration}</p>}
                {formData.exhibition_id && (
                  <p><strong>Exhibition:</strong> {exhibitions.find(e => String(e.exhibition_id) === String(formData.exhibition_id))?.title || 'Selected'}</p>
                )}
                {formData.guided_tour_interest && <p><strong>Guided tour:</strong> Requested</p>}
                {formData.accessibility_needs && <p><strong>Accessibility:</strong> {formData.accessibility_needs}</p>}
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e8e3da' }} />
                <p><strong>Total visitors:</strong> {totalVisitors} ({formData.adults} adults, {formData.children} children, {formData.seniors} seniors, {formData.students} students)</p>
                <p><strong>Emergency:</strong> {formData.emergency_name} — {formData.emergency_phone}</p>
                {formData.allergies && <p><strong>Allergies:</strong> {formData.allergies}</p>}
                {formData.special_requests && <p><strong>Special requests:</strong> {formData.special_requests}</p>}
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '20px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.declaration_accepted} onChange={e => update('declaration_accepted', e.target.checked)} style={{ marginTop: '3px' }} />
                <span style={{ fontSize: '13px', color: '#555' }}>
                  I confirm the information above is accurate, I agree to the gallery's visitor policy, and I understand this booking is subject to confirmation by a Booking Officer.
                </span>
              </label>
              {errors.declaration_accepted && <p className="field-error">{errors.declaration_accepted}</p>}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '25px', flexWrap: 'wrap' }}>
            {step > 1 && (
              <button type="button" onClick={goBack} className="primary-button" style={{ background: 'transparent', color: '#25231f', border: '1px solid #e8e3da', flex: 1, minWidth: '140px' }}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={goNext} className="primary-button" style={{ flex: 2, minWidth: '180px' }}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="primary-button" style={{ flex: 2, minWidth: '200px' }}>
                {loading ? 'Submitting...' : 'Submit Booking'} {!loading && <CheckCircle size={16} />}
              </button>
            )}
          </div>
        </div>

        <p className="booking-note" style={{ textAlign: 'center', marginTop: '20px' }}>
          Your reservation will initially have <strong>Pending</strong> status and will be reviewed by a Booking Officer.
        </p>
      </main>
    </div>
  );
}

function PrintSection({ title, children }) {
  return (
    <section style={{ marginBottom: '18px' }}>
      <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a47745', marginBottom: '8px', letterSpacing: '1px' }}>
        {title}
      </h3>
      <div style={{ fontSize: '14px', color: '#25231f', lineHeight: 1.6 }}>
        {children}
      </div>
    </section>
  );
}

export default VisitBooking;