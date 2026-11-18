import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Palette, Clock, MapPin, Mail, Users, Image as ImageIcon, LoaderCircle, Menu, ArrowRight } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

function GalleryDetails() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('art_gallery_user') || 'null');

  const [stats, setStats] = useState({ artworks: 0, artists: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [artRes, artistRes] = await Promise.all([
          api.get('/artworks/public'),
          api.get('/artists/public')
        ]);
        setStats({
          artworks: artRes.data.artworks?.length || 0,
          artists: artistRes.data.artists?.length || 0
        });
      } catch (err) {
        console.error('Failed to load gallery stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-page">
      <Sidebar 
        user={user} 
        activeTab="" 
        setActiveTab={() => {}} 
        menuOpen={menuOpen} 
        setMenuOpen={setMenuOpen} 
        onLogout={handleLogout} 
      />

      {menuOpen && <button className="dashboard-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={22} />
          </button>
          <div>
            <span className="eyebrow">ABOUT US</span>
            <h2>The Gallery</h2>
          </div>
        </header>

        <section className="dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* HERO SECTION */}
          <div style={{ textAlign: 'center', marginBottom: '60px', marginTop: '20px' }}>
            <span className="eyebrow">ABOUT ARTISAN</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', margin: '15px 0' }}>
              Where creativity finds its <em>home.</em>
            </h1>
            <p style={{ fontSize: '18px', color: '#777168', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              Artisan Gallery is a premier destination for contemporary art, dedicated to connecting visionary artists with passionate collectors. We believe that art is not just meant to be seen, but experienced.
            </p>
          </div>

          {/* DYNAMIC STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '70px' }}>
            <div className="profile-card" style={{ textAlign: 'center', padding: '30px', background: '#faf9f6' }}>
              <ImageIcon size={32} style={{ color: '#a47745', margin: '0 auto 15px' }} />
              <h3 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', margin: '0 0 5px' }}>
                {loading ? <LoaderCircle className="animate-spin" size={30} style={{ margin: '0 auto' }}/> : stats.artworks}
              </h3>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777168', fontWeight: 'bold' }}>Curated Artworks</p>
            </div>

            <div className="profile-card" style={{ textAlign: 'center', padding: '30px', background: '#faf9f6' }}>
              <Users size={32} style={{ color: '#a47745', margin: '0 auto 15px' }} />
              <h3 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', margin: '0 0 5px' }}>
                {loading ? <LoaderCircle className="animate-spin" size={30} style={{ margin: '0 auto' }}/> : stats.artists}
              </h3>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777168', fontWeight: 'bold' }}>Featured Artists</p>
            </div>

            <div className="profile-card" style={{ textAlign: 'center', padding: '30px', background: '#faf9f6' }}>
              <Palette size={32} style={{ color: '#a47745', margin: '0 auto 15px' }} />
              <h3 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', margin: '0 0 5px' }}>100%</h3>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777168', fontWeight: 'bold' }}>African Excellence</p>
            </div>
          </div>

          {/* OUR STORY & MISSION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginBottom: '70px' }}>
            <div>
              <span className="eyebrow">OUR MISSION</span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', margin: '10px 0 20px' }}>Empowering artists, inspiring collectors.</h2>
              <p style={{ color: '#555', lineHeight: 1.8, fontSize: '15px' }}>
                Founded with a vision to redefine the art landscape, Artisan Gallery provides a platform for both established and emerging talents. We carefully curate every exhibition and collection to ensure that our visitors experience the highest standard of artistic expression.
              </p>
              <p style={{ color: '#555', lineHeight: 1.8, fontSize: '15px', marginTop: '15px' }}>
                Whether you are a seasoned collector looking for your next masterpiece, or a first-time visitor looking to be inspired, our doors are open to you.
              </p>
            </div>
            
            <div style={{ borderRadius: '12px', overflow: 'hidden', height: '100%', minHeight: '300px' }}>
               <img src="https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=85" alt="Gallery Interior" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          {/* VISITOR INFORMATION */}
          <div className="dashboard-section">
            <div className="section-heading" style={{ marginBottom: '30px' }}>
              <div>
                <span className="eyebrow">PLAN YOUR VISIT</span>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px' }}>Visitor Information</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div className="profile-card" style={{ padding: '30px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <MapPin size={24} style={{ color: '#a47745', flexShrink: 0 }} />
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Location</h3>
                  <p style={{ margin: 0, color: '#777168', fontSize: '14px' }}>123 Artisan Avenue,<br/>Westlands, Nairobi, Kenya</p>
                </div>
              </div>

              <div className="profile-card" style={{ padding: '30px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <Clock size={24} style={{ color: '#a47745', flexShrink: 0 }} />
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Opening Hours</h3>
                  <p style={{ margin: 0, color: '#777168', fontSize: '14px' }}>Tue - Sun: 9:00 AM - 6:00 PM<br/>Closed on Mondays</p>
                </div>
              </div>

              <div className="profile-card" style={{ padding: '30px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <Mail size={24} style={{ color: '#a47745', flexShrink: 0 }} />
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Contact Us</h3>
                  <p style={{ margin: 0, color: '#777168', fontSize: '14px' }}>hello@artisangallery.com<br/>+254 700 000 000</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '20px' }}>Ready to experience art?</h2>
            <Link to="/book-visit" className="primary-button" style={{ padding: '15px 30px', fontSize: '16px' }}>
              Book a Gallery Visit <ArrowRight size={16} />
            </Link>
          </div>

        </section>
      </main>
    </div>
  );
}

export default GalleryDetails;