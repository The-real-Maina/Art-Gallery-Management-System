import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, Image as ImageIcon, PlusCircle, UserRound, LogOut, Menu, X, ArrowRight, AlertCircle, LoaderCircle, CheckCircle, XCircle, Clock, MessageCircle, Send, Edit, Trash2
} from 'lucide-react';

import api from '../services/api';

function ArtistDashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, artworks, artwork-form, inquiries, profile
  
  const [artworks, setArtworks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [inquiries, setInquiries] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Artwork Form state
  const [uploadData, setUploadData] = useState({
    title: '', category: '', medium: '', creation_year: '', price: '', image_url: '', description: ''
  });
  const [editingArtworkId, setEditingArtworkId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Profile Form state
  const [profileData, setProfileData] = useState({ biography: '', specialization: '', website: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Inquiry Reply state
  const [replyText, setReplyText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Artist';

  useEffect(() => {
    if (!user || user.role !== 'Artist') navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const loadData = async () => {
      try {
        const [artRes, inqRes] = await Promise.all([
          api.get('/artworks/my-artworks'),
          api.get('/collectors/artist/inquiries')
        ]);
        
        if (!ignore) {
          setArtworks(artRes.data.artworks || []);
          setInquiries(inqRes.data.inquiries || []);
        }

        try {
          const profRes = await api.get('/artists/my-profile');
          if (!ignore && profRes.data.profile) {
            setProfile(profRes.data.profile);
            setProfileData({
              biography: profRes.data.profile.biography || '',
              specialization: profRes.data.profile.specialization || '',
              website: profRes.data.profile.website || ''
            });
          }
        } catch (profErr) {
          if (profErr.response?.status !== 404) console.error('Error fetching profile:', profErr);
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load dashboard data.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();
    return () => { ignore = true; };
  }, [user, reloadKey]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  const handleEditClick = (art) => {
    setUploadData({
      title: art.title, category: art.category || '', medium: art.medium || '',
      creation_year: art.creation_year || '', price: art.price || '',
      image_url: art.image_url || '', description: art.description || ''
    });
    setEditingArtworkId(art.artwork_id);
    setActiveTab('artwork-form');
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm('Are you sure you want to delete this artwork? This cannot be undone.')) return;
    try {
      setActionLoadingId(artworkId);
      await api.delete(`/artworks/${artworkId}`);
      setReloadKey(k => k + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete artwork.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadMessage('');

    try {
      if (editingArtworkId) {
        await api.put(`/artworks/${editingArtworkId}`, uploadData);
        setUploadMessage('Artwork updated and resubmitted for approval!');
      } else {
        await api.post('/artworks', uploadData);
        setUploadMessage('Artwork submitted successfully! It is pending review.');
      }
      
      setUploadData({ title: '', category: '', medium: '', creation_year: '', price: '', image_url: '', description: '' });
      setEditingArtworkId(null);
      setReloadKey(k => k + 1);
      
      setTimeout(() => { setActiveTab('artworks'); setUploadMessage(''); }, 2000);
    } catch (err) {
      setUploadMessage(err.response?.data?.message || 'Failed to save artwork.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');

    try {
      if (profile) await api.put('/artists/my-profile', profileData);
      else await api.post('/artists', profileData);
      
      setProfileMessage('Profile saved successfully!');
      setProfile(profileData);
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendReply = async (inquiryId) => {
    if (!replyText.trim()) return alert('Please type a reply message.');
    setReplyLoading(true);
    try {
      await api.patch(`/collectors/artist/inquiries/${inquiryId}`, { inquiry_status: 'Responded', response: replyText });
      setInquiries(prev => prev.map(inq => inq.inquiry_id === inquiryId ? { ...inq, inquiry_status: 'Responded', response: replyText } : inq));
      setReplyingToId(null);
      setReplyText('');
      alert('Reply sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setReplyLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={16} />;
      case 'Rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (!user) return null;

  const pendingInquiries = inquiries.filter(i => i.inquiry_status === 'Pending').length;

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">ARTIST WORKSPACE</div>

        <nav className="dashboard-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={activeTab === 'artworks' ? 'active' : ''} onClick={() => { setActiveTab('artworks'); setMenuOpen(false); }}>
            <ImageIcon size={19} /> My Artworks
          </button>
          <button className={activeTab === 'artwork-form' ? 'active' : ''} onClick={() => { setEditingArtworkId(null); setUploadData({ title: '', category: '', medium: '', creation_year: '', price: '', image_url: '', description: '' }); setActiveTab('artwork-form'); setMenuOpen(false); }}>
            <PlusCircle size={19} /> Upload Artwork
          </button>
          <button className={activeTab === 'inquiries' ? 'active' : ''} onClick={() => { setActiveTab('inquiries'); setMenuOpen(false); }}>
            <MessageCircle size={19} /> Inquiries
            {pendingInquiries > 0 && <span style={{ background: '#b24c48', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: 'auto' }}>{pendingInquiries}</span>}
          </button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}>
            <UserRound size={19} /> My Profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div><strong>{user.full_name}</strong><span>{user.role}</span></div>
          </div>
          <button className="logout-button" onClick={handleLogout}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      {menuOpen && <button className="dashboard-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <div><span className="eyebrow">YOUR WORKSPACE</span><h2>Artist Dashboard</h2></div>
          <Link to="/" className="dashboard-home-link">Explore gallery <ArrowRight size={16} /></Link>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error"><AlertCircle size={18} /> {error}</div>}
          {loading && <div className="dashboard-loading"><LoaderCircle size={24} /><span>Loading your workspace...</span></div>}

          {!loading && activeTab === 'overview' && (
            <>
              <div className="dashboard-welcome">
                <div><span className="eyebrow">ARTIST STUDIO</span><h1>Welcome, <em>{firstName}.</em></h1><p>Manage your portfolio, submit new artworks, and track their approval status.</p></div>
                <div className="welcome-icon"><Palette size={38} /></div>
              </div>
              <div className="dashboard-stats">
                <div className="stat-card"><div className="stat-icon"><ImageIcon size={21} /></div><span>Total Uploads</span><strong>{artworks.length}</strong><small>Artworks in your portfolio</small></div>
                <div className="stat-card"><div className="stat-icon"><CheckCircle size={21} /></div><span>Approved</span><strong>{artworks.filter(a => a.approval_status === 'Approved').length}</strong><small>Currently on display</small></div>
                <div className="stat-card"><div className="stat-icon"><MessageCircle size={21} /></div><span>Pending Inquiries</span><strong>{pendingInquiries}</strong><small>Collectors waiting for a reply</small></div>
              </div>
            </>
          )}

          {!loading && activeTab === 'artworks' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div><span className="eyebrow">YOUR PORTFOLIO</span><h2>My Artworks</h2></div>
                <button onClick={() => { setEditingArtworkId(null); setUploadData({ title: '', category: '', medium: '', creation_year: '', price: '', image_url: '', description: '' }); setActiveTab('artwork-form'); }} className="primary-button header-book-btn"><PlusCircle size={16} /> Add New</button>
              </div>

              {artworks.length === 0 ? (
                <div className="dashboard-empty"><ImageIcon size={30} /><h3>No artworks yet</h3><p>Start building your portfolio by uploading your first piece.</p></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {artworks.map((art) => {
                    const isEditable = ['Pending', 'Rejected'].includes(art.approval_status);
                    return (
                      <div className="profile-card" key={art.artwork_id} style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <img src={art.image_url} alt={art.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div className="profile-details" style={{ flex: 1 }}>
                          <h3>{art.title}</h3>
                          <p>{art.category} • KES {Number(art.price).toLocaleString()}</p>
                          <span className={`booking-status status-${art.approval_status?.toLowerCase()}`}>
                            {getStatusIcon(art.approval_status)} {art.approval_status || 'Pending'}
                          </span>
                        </div>
                        
                        {isEditable && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleEditClick(art)} className="primary-button" style={{ padding: '8px 12px', fontSize: '11px', background: '#a47745' }}>
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => handleDeleteArtwork(art.artwork_id)} disabled={actionLoadingId === art.artwork_id} style={{ background: '#feeceb', color: '#b24c48', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 'bold' }}>
                              <Trash2 size={14} /> {actionLoadingId === art.artwork_id ? '...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!loading && activeTab === 'artwork-form' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{editingArtworkId ? 'EDIT ARTWORK' : 'GROW YOUR PORTFOLIO'}</span>
                  <h2>{editingArtworkId ? 'Update Artwork' : 'Upload New Artwork'}</h2>
                </div>
              </div>

              <form className="booking-card" onSubmit={handleUploadSubmit} style={{ maxWidth: '800px' }}>
                {uploadMessage && <div className={`booking-message ${uploadMessage.includes('success') ? 'success' : 'error'}`}>{uploadMessage}</div>}

                <div className="dashboard-form-grid">
                  <div className="booking-field">
                    <label>Artwork Title</label>
                    <input type="text" required value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Category</label>
                    <input type="text" required placeholder="e.g., Painting, Sculpture" value={uploadData.category} onChange={e => setUploadData({...uploadData, category: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Medium (Optional)</label>
                    <input type="text" placeholder="e.g., Oil on canvas" value={uploadData.medium} onChange={e => setUploadData({...uploadData, medium: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Year Created (Optional)</label>
                    <input type="number" placeholder="e.g., 2026" value={uploadData.creation_year} onChange={e => setUploadData({...uploadData, creation_year: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Price (KES)</label>
                    <input type="number" required min="0" value={uploadData.price} onChange={e => setUploadData({...uploadData, price: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Image URL</label>
                    <input type="url" required placeholder="https://..." value={uploadData.image_url} onChange={e => setUploadData({...uploadData, image_url: e.target.value})} />
                  </div>
                </div>

                <div className="booking-field">
                  <label>Description</label>
                  <textarea rows="4" required value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="primary-button" disabled={uploadLoading}>
                    {uploadLoading ? 'Saving...' : editingArtworkId ? 'Save Changes' : 'Submit for Review'}
                  </button>
                  {editingArtworkId && (
                    <button type="button" className="logout-button" onClick={() => setActiveTab('artworks')} style={{ width: 'auto', padding: '14px 20px', border: '1px solid #e8e3da' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}

          {!loading && activeTab === 'inquiries' && (
            <section className="dashboard-section">
              <div className="section-heading"><div><span className="eyebrow">PURCHASE REQUESTS</span><h2>Collector Inquiries</h2></div></div>
              {inquiries.length === 0 ? (
                <div className="dashboard-empty"><MessageCircle size={30} /><h3>No inquiries yet</h3><p>When a collector is interested in your work, they'll appear here.</p></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {inquiries.map((inq) => (
                    <div className="profile-card" key={inq.inquiry_id} style={{ padding: '25px' }}>
                      <div className="profile-details">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h3 style={{ margin: 0 }}>{inq.artwork_title}</h3>
                          <span className={`booking-status status-${(inq.inquiry_status || 'Pending').toLowerCase()}`} style={{ margin: 0 }}>
                            {inq.inquiry_status === 'Responded' ? <CheckCircle size={16} /> : <Clock size={16} />} {inq.inquiry_status || 'Pending'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#a47745', fontWeight: 'bold' }}>From: {inq.collector_name}</p>
                        <div style={{ background: '#faf9f6', padding: '15px', borderRadius: '6px', margin: '15px 0', borderLeft: '3px solid #ccc' }}>
                          <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>"{inq.message}"</p>
                        </div>

                        {inq.response ? (
                          <div style={{ marginTop: '15px', padding: '15px', background: '#eef7ed', borderRadius: '5px', borderLeft: '3px solid #3f7d3c' }}>
                            <strong style={{ fontSize: '12px', color: '#3f7d3c', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Reply:</strong>
                            <p style={{ margin: '5px 0 0', fontSize: '13px', lineHeight: '1.6' }}>{inq.response}</p>
                          </div>
                        ) : (
                          replyingToId === inq.inquiry_id ? (
                            <div style={{ marginTop: '15px' }}>
                              <textarea rows="3" className="booking-field" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} placeholder="Type your reply to the collector here..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="primary-button" onClick={() => handleSendReply(inq.inquiry_id)} disabled={replyLoading}><Send size={14} /> {replyLoading ? 'Sending...' : 'Send Reply'}</button>
                                <button className="logout-button" onClick={() => { setReplyingToId(null); setReplyText(''); }} style={{ padding: '10px 15px', width: 'auto' }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button className="primary-button" onClick={() => setReplyingToId(inq.inquiry_id)} style={{ marginTop: '10px' }}><MessageCircle size={14} /> Reply to Inquiry</button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {!loading && activeTab === 'profile' && (
            <section className="dashboard-section">
              <div className="section-heading"><div><span className="eyebrow">PUBLIC IDENTITY</span><h2>Artist Profile</h2></div></div>
              <form className="booking-card" onSubmit={handleProfileSubmit} style={{ maxWidth: '800px' }}>
                {profileMessage && <div className={`booking-message ${profileMessage.includes('success') ? 'success' : 'error'}`}>{profileMessage}</div>}
                <div className="dashboard-form-grid">
                  <div className="booking-field">
                    <label>Specialization</label>
                    <input type="text" placeholder="e.g., Oil Paintings, Sculpture" value={profileData.specialization} onChange={e => setProfileData({...profileData, specialization: e.target.value})} />
                  </div>
                  <div className="booking-field">
                    <label>Website / Portfolio Link</label>
                    <input type="url" placeholder="https://..." value={profileData.website} onChange={e => setProfileData({...profileData, website: e.target.value})} />
                  </div>
                </div>
                <div className="booking-field">
                  <label>Artist Bio</label>
                  <textarea rows="5" placeholder="Tell collectors about your artistic journey..." value={profileData.biography} onChange={e => setProfileData({...profileData, biography: e.target.value})} />
                </div>
                <button type="submit" className="primary-button" disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save Profile'}</button>
              </form>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default ArtistDashboard;