import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Palette,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  CheckCircle
} from 'lucide-react';
import '../index.css';

function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Login, 2 = OTP
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      setLoading(true);

      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // If Admin or Visitor, they don't require OTP
      if (!response.data.require_otp) {
        const { token, user } = response.data;
        localStorage.setItem('art_gallery_token', token);
        localStorage.setItem('art_gallery_user', JSON.stringify(user));
        navigate('/dashboard', { replace: true });
      } else {
        // Staff requires OTP
        setStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your connection and try again.'
      );
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
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85"
            alt="Art gallery collection"
          />

          <div className="auth-image-overlay">
            <span>ART IS A UNIVERSAL LANGUAGE</span>
            <h2>Discover beauty.<br /><em>Find inspiration.</em></h2>
            <p>Enter a world of creativity, expression and extraordinary art.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-container">
            
            {step === 1 ? (
              <>
                <span className="eyebrow">WELCOME BACK</span>
                <h1>Sign <em>in.</em></h1>
                <p className="auth-description">Welcome back. Sign in to continue your gallery experience.</p>

                <form onSubmit={handleSubmit}>
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
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
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

                  {/* FORGOT PASSWORD LINK */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-5px', marginBottom: '15px' }}>
                    <Link to="/forgot-password" style={{ fontSize: '12px', color: '#a47745', textDecoration: 'none', fontWeight: '500' }}>
                      Forgot password?
                    </Link>
                  </div>

                  {error && <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? (
                      <>Signing in... <LoaderCircle size={17} className="animate-spin" /></>
                    ) : (
                      <>Sign in <ArrowRight size={17} /></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="eyebrow">SECURITY VERIFICATION</span>
                <h1>Enter <em>OTP.</em></h1>
                <p className="auth-description">
                  A 6-digit security code was sent to <strong>{formData.email}</strong>. Enter it below to complete your login.
                </p>

                <form onSubmit={handleVerifyOTP}>
                  <label htmlFor="otp">6-Digit Code</label>
                  <input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ fontSize: '24px', letterSpacing: '10px', textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />

                  {error && <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

                  <button type="submit" className="auth-submit" disabled={loading || otp.length !== 6}>
                    {loading ? (
                      <>Verifying... <LoaderCircle size={17} className="animate-spin" /></>
                    ) : (
                      <><CheckCircle size={17} /> Verify & Sign In</>
                    )}
                  </button>
                </form>

                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: '#777168', marginTop: '15px', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}
                >
                  Back to Login
                </button>
              </>
            )}

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>

            <Link to="/" className="back-home">← Back to gallery</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;