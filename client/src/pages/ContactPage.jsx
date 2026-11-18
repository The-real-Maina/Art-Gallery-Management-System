import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', paddingBottom: '80px' }}>
      <PublicNavbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px' }}>
        <div className="section-heading" style={{ marginBottom: '40px' }}>
          <div>
            <span className="eyebrow">GET IN TOUCH</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', margin: '10px 0' }}>Contact & <em>Inquiries.</em></h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          
          <div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', border: '1px solid #e8e3da', marginBottom: '20px' }}>
              <MapPin size={24} style={{ color: '#a47745', marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Visit Us</h3>
              <p style={{ margin: 0, color: '#777168', fontSize: '14px' }}>123 Artisan Avenue,<br/>Westlands, Nairobi, Kenya</p>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', border: '1px solid #e8e3da', marginBottom: '20px' }}>
              <Mail size={24} style={{ color: '#a47745', marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Email Us</h3>
              <p style={{ margin: 0, color: '#777168', fontSize: '14px' }}>hello@artisangallery.com</p>
            </div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', border: '1px solid #e8e3da' }}>
              <Phone size={24} style={{ color: '#a47745', marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Call Us</h3>
              <p style={{ margin: 0, color: '#777168', fontSize: '14px' }}>+254 700 000 000</p>
            </div>
          </div>

          <div className="booking-card" style={{ padding: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', marginBottom: '20px' }}>Send a Message</h2>
            {submitted ? (
              <div style={{ background: '#eef7ed', color: '#3f7d3c', padding: '20px', borderRadius: '6px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px' }}>Message Sent!</h3>
                <p style={{ margin: 0 }}>Thank you for reaching out. The gallery team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="booking-field">
                  <label>Your Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="booking-field">
                  <label>Email Address</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="booking-field">
                  <label>Message</label>
                  <textarea rows="5" required placeholder="How can we help you?" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
                </div>
                <button type="submit" className="primary-button" style={{ width: '100%' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ContactPage;