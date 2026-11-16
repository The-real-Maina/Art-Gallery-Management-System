
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Palette,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle
} from 'lucide-react';
import '../index.css';

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

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

      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password
        }
      );

      if (response.data.success) {
        alert('Account created successfully! You can now sign in.');
        navigate('/login');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed. Please check your connection and try again.'
      );
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
            <p>
              Connect with artists, discover collections and experience creativity.
            </p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-container">
            <span className="eyebrow">BECOME PART OF OUR COMMUNITY</span>

            <h1>Create <em>account.</em></h1>

            <p className="auth-description">
              Create your account to explore everything the gallery offers.
            </p>

            <form onSubmit={handleSubmit}>
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
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }
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

              {error && (
                <p style={{
                  color: '#c0392b',
                  fontSize: '13px',
                  marginTop: '12px'
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    Creating account...
                    <LoaderCircle size={17} className="animate-spin" />
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>

            <Link to="/" className="back-home">
              ← Back to gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
