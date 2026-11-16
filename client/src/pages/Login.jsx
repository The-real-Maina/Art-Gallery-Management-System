
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

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      setLoading(true);

      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          email: formData.email,
          password: formData.password
        }
      );

      if (response.data.success) {
        const { token, user } = response.data;

        localStorage.setItem('art_gallery_token', token);
        localStorage.setItem(
          'art_gallery_user',
          JSON.stringify(user)
        );

        navigate('/dashboard', { replace: true });
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

  return (
    <div className="auth-page">
      <Link to="/" className="brand auth-brand">
        <span className="brand-icon">
          <Palette size={22} />
        </span>
        <span>
          ARTISAN<span className="brand-light">.</span>
        </span>
      </Link>

      <div className="auth-layout">
        <div className="auth-image-panel">
          <img
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85"
            alt="Art gallery collection"
          />

          <div className="auth-image-overlay">
            <span>ART IS A UNIVERSAL LANGUAGE</span>

            <h2>
              Discover beauty.<br />
              <em>Find inspiration.</em>
            </h2>

            <p>
              Enter a world of creativity, expression and extraordinary art.
            </p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-container">
            <span className="eyebrow">WELCOME BACK</span>

            <h1>
              Sign <em>in.</em>
            </h1>

            <p className="auth-description">
              Welcome back. Sign in to continue your gallery experience.
            </p>

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
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {error && (
                <p
                  style={{
                    color: '#c0392b',
                    fontSize: '13px',
                    marginTop: '12px'
                  }}
                >
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
                    Signing in...
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
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

export default Login;
