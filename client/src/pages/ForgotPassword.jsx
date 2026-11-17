import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Palette, ArrowRight, LoaderCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import '../index.css';

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setSuccessMsg('Password reset successfully!');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
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
          <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85" alt="Art gallery collection" />
          <div className="auth-image-overlay">
            <span>ACCOUNT RECOVERY</span>
            <h2>Find your way<br /><em>back to art.</em></h2>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-container">
            
            {successMsg ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={50} style={{ color: '#3f7d3c', margin: '0 auto 20px' }} />
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '15px' }}>Password Reset!</h2>
                <p style={{ color: '#777168', marginBottom: '30px' }}>{successMsg} Redirecting to login...</p>
                <LoaderCircle size={24} className="animate-spin" style={{ margin: '0 auto' }} />
              </div>
            ) : (
              <>
                <span className="eyebrow">RESET PASSWORD</span>
                <h1>{step === 1 ? 'Forgot ' : 'Secure '}<em>{step === 1 ? 'password?' : 'account.'}</em></h1>
                <p className="auth-description">
                  {step === 1 
                    ? "Enter your email address and we'll send you an OTP to reset your password." 
                    : "Enter the OTP sent to the terminal and choose a new password."}
                </p>

                {step === 1 ? (
                  <form onSubmit={handleRequestOTP}>
                    <label>Email address</label>
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                    />

                    {error && <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

                    <button type="submit" className="auth-submit" disabled={loading}>
                      {loading ? <>Sending OTP... <LoaderCircle size={17} className="animate-spin" /></> : <>Request OTP <ArrowRight size={17} /></>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <label>6-Digit OTP</label>
                    <input 
                      type="text" 
                      placeholder="123456" 
                      maxLength={6}
                      value={otp} 
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                      style={{ fontSize: '20px', letterSpacing: '5px', textAlign: 'center' }}
                      required 
                    />

                    <label>New Password</label>
                    <input 
                      type="password" 
                      placeholder="At least 8 characters" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      minLength={8}
                      required 
                    />

                    <label>Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="Repeat your new password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                    />

                    {error && <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

                    <button type="submit" className="auth-submit" disabled={loading || otp.length !== 6}>
                      {loading ? <>Resetting... <LoaderCircle size={17} className="animate-spin" /></> : <>Reset Password <CheckCircle size={17} /></>}
                    </button>
                  </form>
                )}
              </>
            )}

            {!successMsg && (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '25px', color: '#777168', fontSize: '13px', textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;