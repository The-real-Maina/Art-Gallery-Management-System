import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Palette,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  CheckCircle,
  User,
  Briefcase
} from 'lucide-react';
import '../index.css';

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Form, 2 = OTP
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_name: 'Visitor' // Default selection
  });

  const [otp, setOtp] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/register', {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role_name: formData.role_name // Send chosen role to backend
      });

      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: otp
      });

      localStorage.setItem('art_gallery_token', res.data.token);
      localStorage.setItem('art_gallery_user', JSON.stringify(res.data.user));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="brand auth-brand">
        <span className="brand-icon"><Palette size={22} /></span>
        <span>ARTISAN<span className="brand-light">.</span></span>
      </Link>

      <div className="auth-layout">
        <div className="auth-image-panel">
          <img
            src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=85"
            alt="Contemporary art exhibition"
          />

          <div className="auth-image-overlay">
            <span>YOUR CREATIVE JOURNEY STARTS HERE</span>
            <h2>Join a world of<br /><em>art and discovery.</em></h2>
            <p>Connect with artists, discover collections and experience creativity.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-container">
            
            {step === 1 ? (
              <>
                <span className="eyebrow">BECOME PART OF OUR COMMUNITY</span>
                <h1>Create <em>account.</em></h1>
                <p className="auth-description">Create your account to explore everything the gallery offers.</p>

                <form onSubmit={handleSubmit}>
                  
                  {/* ROLE SELECTOR */}
                  <label>I am creating an account as a:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div 
                      onClick={() => setFormData({...formData, role_name: 'Visitor'})}
                      style={{ padding: '12px', border: `2px solid ${formData.role_name === 'Visitor' ? '#a47745' : '#e8e3da'}`, borderRadius: '6px', textAlign: 'center', cursor: 'pointer', background: formData.role_name === 'Visitor' ? '#faf9f6' : 'white', transition: 'all 0.2s' }}
                    >
                      <User size={20} style={{ margin: '0 auto 5px', color: formData.role_name === 'Visitor' ? '#a47745' : '#777168' }} />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.role_name === 'Visitor' ? '#25231f' : '#777168' }}>Visitor</span>
                    </div>
                    
                    <div 
                      onClick={() => setFormData({...formData, role_name: 'Art Collector'})}
                      style={{ padding: '12px', border: `2px solid ${formData.role_name === 'Art Collector' ? '#a47745' : '#e8e3da'}`, borderRadius: '6px', textAlign: 'center', cursor: 'pointer', background: formData.role_name === 'Art Collector' ? '#faf9f6' : 'white', transition: 'all 0.2s' }}
                    >
                      <Briefcase size={20} style={{ margin: '0 auto 5px', color: formData.role_name === 'Art Collector' ? '#a47745' : '#777168' }} />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.role_name === 'Art Collector' ? '#25231f' : '#777168' }}>Collector</span>
                    </div>

                    <div 
                      onClick={() => setFormData({...formData, role_name: 'Artist'})}
                      style={{ padding: '12px', border: `2px solid ${formData.role_name === 'Artist' ? '#a47745' : '#e8e3da'}`, borderRadius: '6px', textAlign: 'center', cursor: 'pointer', background: formData.role_name === 'Artist' ? '#faf9f6' : 'white', transition: 'all 0.2s' }}
                    >
                      <Palette size={20} style={{ margin: '0 auto 5px', color: formData.role_name === 'Artist' ? '#a47745' : '#777168' }} />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.role_name === 'Artist' ? '#25231f' : '#777168' }}>Artist</span>
                    </div>
                  </div>

                  <label htmlFor="full_name">Full name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />

                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                  <label htmlFor="password">Password</label>
                  <div className="password-field">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />

                  <label className="terms-option">
                    <input type="checkbox" required />
                    I agree to the terms and conditions.
                  </label>

                  {error && <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? (
                      <>Creating account... <LoaderCircle size={17} className="animate-spin" /></>
                    ) : (
                      <>Create account <ArrowRight size={17} /></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="eyebrow">VERIFY YOUR EMAIL</span>
                <h1>Check your <em>inbox.</em></h1>
                <p className="auth-description">
                  We sent a 6-digit verification code to <strong>{formData.email}</strong>. Enter it below to activate your account.
                </p>

                <form onSubmit={handleVerifyOTP}>
                  <label htmlFor="otp">6-Digit Code</label>
                  <input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                    style={{ fontSize: '24px', letterSpacing: '10px', textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />

                  {error && <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

                  <button type="submit" className="auth-submit" disabled={loading || otp.length !== 6}>
                    {loading ? (
                      <>Verifying... <LoaderCircle size={17} className="animate-spin" /></>
                    ) : (
                      <><CheckCircle size={17} /> Verify & Enter</>
                    )}
                  </button>
                </form>
              </>
            )}

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

            <Link to="/" className="back-home">← Back to gallery</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;