import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, Image as ImageIcon, CalendarDays, LogOut, Menu, X, ArrowRight, AlertCircle, LoaderCircle, CheckCircle, XCircle, Clock, Edit, Settings, PlusCircle, Trash2
} from 'lucide-react';

import api from '../services/api';

function CuratorDashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, review, exhibitions
  
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Exhibition Form State
  const [exhibitionData, setExhibitionData] = useState({ title: '', description: '', location: '', start_date: '', end_date: '', cover_image: '' });
  const [editingExhibitionId, setEditingExhibitionId] = useState(null);
  const [exhibitionLoading, setExhibitionLoading] = useState(false);
  const [exhibitionMessage, setExhibitionMessage] = useState('');

  // Manage Artworks State
  const [managingExhibition, setManagingExhibition] = useState(null);
  const [exhibitionArtworks, setExhibitionArtworks] = useState([]);
  const [loadingExhibitionArtworks, setLoadingExhibitionArtworks] = useState(false);
  const [artworkToAdd, setArtworkToAdd] = useState('');

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Curator';

  useEffect(() => {
    if (!user || user.role !== 'Gallery Curator') navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const loadData = async () => {
      try {
        const [artRes, exRes] = await Promise.all([
          api.get('/artworks'),
          api.get('/exhibitions')
        ]);
        if (!ignore) {
          setArtworks(artRes.data.artworks || []);
          setExhibitions(exRes.data.exhibitions || []);
          setError('');
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

  const handleReviewArtwork = async (artworkId, status) => {
    try {
      setActionLoadingId(artworkId);
      await api.patch(`/artworks/${artworkId}/review`, { approval_status: status }); 
      setArtworks(prev => prev.map(art => art.artwork_id === artworkId ? { ...art, approval_status: status } : art));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update artwork status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditExhibitionClick = (ex) => {
    setExhibitionData({
      title: ex.title, description: ex.description || '', location: ex.location || '',
      start_date: String(ex.start_date).slice(0, 10), end_date: String(ex.end_date).slice(0, 10),
      cover_image: ex.cover_image || ''
    });
    setEditingExhibitionId(ex.exhibition_id);
  };

  const handleCancelEditExhibition = () => {
    setEditingExhibitionId(null);
    setExhibitionData({ title: '', description: '', location: '', start_date: '', end_date: '', cover_image: '' });
    setExhibitionMessage('');
  };

  const handleCreateExhibition = async (e) => {
    e.preventDefault();
    setExhibitionLoading(true);
    setExhibitionMessage('');

    try {
      if (editingExhibitionId) {
        await api.put(`/exhibitions/${editingExhibitionId}`, exhibitionData);
        setExhibitionMessage('Exhibition updated successfully!');
      } else {
        await api.post('/exhibitions', exhibitionData);
        setExhibitionMessage('Exhibition created successfully!');
      }
      
      setExhibitionData({ title: '', description: '', location: '', start_date: '', end_date: '', cover_image: '' });
      setEditingExhibitionId(null);
      setReloadKey(k => k + 1);
      setTimeout(() => setExhibitionMessage(''), 3000);
    } catch (err) {
      setExhibitionMessage(err.response?.data?.message || 'Failed to save exhibition.');
    } finally {
      setExhibitionLoading(false);
    }
  };

  const handleManageArtworks = async (ex) => {
    setManagingExhibition(ex);
    setLoadingExhibitionArtworks(true);
    try {
      const res = await api.get(`/exhibitions/${ex.exhibition_id}/artworks`);
      setExhibitionArtworks(res.data.artworks || []);
    } catch {
      // FIXED: Removed unused 'err' variable
      alert('Failed to load exhibition artworks.');
      setManagingExhibition(null);
    } finally {
      setLoadingExhibitionArtworks(false);
    }
  };

  const handleAddArtworkToExhibition = async () => {
    if (!artworkToAdd) return;
    try {
      await api.post(`/exhibitions/${managingExhibition.exhibition_id}/artworks`, { artwork_id: artworkToAdd });
      const addedArtwork = artworks.find(a => a.artwork_id === Number(artworkToAdd));
      setExhibitionArtworks(prev => [...prev, addedArtwork]);
      setArtworkToAdd('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add artwork.');
    }
  };

  const handleRemoveArtworkFromExhibition = async (artworkId) => {
    try {
      await api.delete(`/exhibitions/${managingExhibition.exhibition_id}/artworks/${artworkId}`);
      setExhibitionArtworks(prev => prev.filter(a => a.artwork_id !== artworkId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove artwork.');
    }
  };

  if (!user) return null;

  const pendingArtworks = artworks.filter(a => a.approval_status === 'Pending');
  const reviewedArtworks = artworks.filter(a => a.approval_status !== 'Pending');
  const approvedArtworks = artworks.filter(a => a.approval_status === 'Approved');

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">CURATOR WORKSPACE</div>

        <nav className="dashboard-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={activeTab === 'review' ? 'active' : ''} onClick={() => { setActiveTab('review'); setMenuOpen(false); }}>
            <ImageIcon size={19} /> Review Artworks
            {pendingArtworks.length > 0 && <span style={{ background: '#b24c48', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: 'auto' }}>{pendingArtworks.length}</span>}
          </button>
          <button className={activeTab === 'exhibitions' ? 'active' : ''} onClick={() => { setActiveTab('exhibitions'); setMenuOpen(false); }}>
            <CalendarDays size={19} /> Manage Exhibitions
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
          <div><span className="eyebrow">YOUR WORKSPACE</span><h2>Curator Dashboard</h2></div>
          <Link to="/" className="dashboard-home-link">Explore gallery <ArrowRight size={16} /></Link>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error"><AlertCircle size={18} /> {error}</div>}
          {loading && <div className="dashboard-loading"><LoaderCircle size={24} /><span>Loading gallery data...</span></div>}

          {!loading && activeTab === 'overview' && (
            <>
              <div className="dashboard-welcome">
                <div><span className="eyebrow">GALLERY OVERSIGHT</span><h1>Welcome, <em>{firstName}.</em></h1><p>Review pending artwork submissions and manage the upcoming exhibition schedule.</p></div>
                <div className="welcome-icon"><Palette size={38} /></div>
              </div>
              <div className="dashboard-stats">
                <div className="stat-card"><div className="stat-icon"><Clock size={21} /></div><span>Pending Reviews</span><strong>{pendingArtworks.length}</strong><small>Awaiting your approval</small></div>
                <div className="stat-card"><div className="stat-icon"><CheckCircle size={21} /></div><span>Total Approved</span><strong>{reviewedArtworks.filter(a => a.approval_status === 'Approved').length}</strong><small>Live on the gallery</small></div>
                <div className="stat-card"><div className="stat-icon"><CalendarDays size={21} /></div><span>Exhibitions</span><strong>{exhibitions.length}</strong><small>Scheduled events</small></div>
              </div>
            </>
          )}

          {!loading && activeTab === 'review' && (
            <section className="dashboard-section">
              <div className="section-heading"><div><span className="eyebrow">QUALITY CONTROL</span><h2>Artwork Submissions</h2></div></div>
              {artworks.length === 0 ? (
                <div className="dashboard-empty"><ImageIcon size={30} /><h3>No artworks yet</h3><p>Artists haven't submitted any artworks.</p></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {artworks.map((art) => {
                    const currentStatus = art.approval_status || 'Pending';
                    return (
                      <div className="profile-card" key={art.artwork_id} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <img src={art.image_url} alt={art.title} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div className="profile-details" style={{ flex: 1 }}>
                          <h3>{art.title}</h3>
                          <p>By {art.artist_name} • {art.category}</p>
                          <p>KES {Number(art.price).toLocaleString()}</p>
                          <span className={`booking-status status-${currentStatus.toLowerCase()}`}>
                            {currentStatus === 'Approved' ? <CheckCircle size={16} /> : currentStatus === 'Rejected' ? <XCircle size={16} /> : <Clock size={16} />} {currentStatus}
                          </span>
                        </div>
                        {currentStatus === 'Pending' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleReviewArtwork(art.artwork_id, 'Approved')} disabled={actionLoadingId === art.artwork_id} style={{ background: '#3f7d3c', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16} /> Approve</button>
                            <button onClick={() => handleReviewArtwork(art.artwork_id, 'Rejected')} disabled={actionLoadingId === art.artwork_id} style={{ background: '#b24c48', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><XCircle size={16} /> Reject</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!loading && activeTab === 'exhibitions' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">EVENT MANAGEMENT</span>
                  <h2>{editingExhibitionId ? 'Edit Exhibition' : 'Create Exhibition'}</h2>
                </div>
              </div>

              <form className="booking-card" onSubmit={handleCreateExhibition} style={{ maxWidth: '800px', marginBottom: '40px' }}>
                {exhibitionMessage && <div className={`booking-message ${exhibitionMessage.includes('success') ? 'success' : 'error'}`}>{exhibitionMessage}</div>}
                
                <div className="dashboard-form-grid">
                  <div className="booking-field"><label>Exhibition Title</label><input type="text" required value={exhibitionData.title} onChange={e => setExhibitionData({...exhibitionData, title: e.target.value})} /></div>
                  <div className="booking-field"><label>Location</label><input type="text" required value={exhibitionData.location} onChange={e => setExhibitionData({...exhibitionData, location: e.target.value})} /></div>
                  <div className="booking-field"><label>Cover Image URL</label><input type="url" placeholder="https://..." value={exhibitionData.cover_image} onChange={e => setExhibitionData({...exhibitionData, cover_image: e.target.value})} /></div>
                  <div className="booking-field"><label>Start Date</label><input type="date" required value={exhibitionData.start_date} onChange={e => setExhibitionData({...exhibitionData, start_date: e.target.value})} /></div>
                  <div className="booking-field"><label>End Date</label><input type="date" required value={exhibitionData.end_date} onChange={e => setExhibitionData({...exhibitionData, end_date: e.target.value})} /></div>
                </div>
                <div className="booking-field"><label>Description</label><textarea rows="3" required value={exhibitionData.description} onChange={e => setExhibitionData({...exhibitionData, description: e.target.value})} /></div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="primary-button" disabled={exhibitionLoading}>{exhibitionLoading ? 'Saving...' : editingExhibitionId ? 'Update Exhibition' : 'Create Exhibition'}</button>
                  {editingExhibitionId && <button type="button" onClick={handleCancelEditExhibition} className="logout-button" style={{ width: 'auto', padding: '14px 20px', border: '1px solid #e8e3da' }}>Cancel Edit</button>}
                </div>
              </form>

              <div className="section-heading"><div><span className="eyebrow">CURRENT SCHEDULE</span><h2>Existing Exhibitions</h2></div></div>
              
              <div className="dashboard-bookings-list">
                {exhibitions.map((ex) => (
                  <div className="profile-card" key={ex.exhibition_id} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src={ex.cover_image || 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=150&q=85'} alt={ex.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div className="profile-details" style={{ flex: 1 }}>
                      <h3>{ex.title}</h3>
                      <p>{new Date(ex.start_date).toLocaleDateString()} - {new Date(ex.end_date).toLocaleDateString()}</p>
                      <p>{ex.description}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => handleEditExhibitionClick(ex)} className="primary-button" style={{ padding: '8px 12px', fontSize: '11px', background: '#a47745' }}><Edit size={14} /> Edit</button>
                      <button onClick={() => handleManageArtworks(ex)} className="primary-button" style={{ padding: '8px 12px', fontSize: '11px', background: '#292721' }}><Settings size={14} /> Artworks</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>

      {/* MANAGE ARTWORKS MODAL */}
      {managingExhibition && (
        <div className="dashboard-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="booking-card" style={{ width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setManagingExhibition(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '10px' }}>Manage Artworks</h2>
            <p style={{ color: '#777168', marginBottom: '20px', fontSize: '14px' }}>For: <strong>{managingExhibition.title}</strong></p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <select value={artworkToAdd} onChange={e => setArtworkToAdd(e.target.value)} className="booking-field" style={{ flex: 1, padding: '10px', margin: 0 }}>
                <option value="">-- Select Approved Artwork --</option>
                {approvedArtworks.filter(a => !exhibitionArtworks.find(ea => ea.artwork_id === a.artwork_id)).map(a => (
                  <option key={a.artwork_id} value={a.artwork_id}>{a.title} by {a.artist_name}</option>
                ))}
              </select>
              <button onClick={handleAddArtworkToExhibition} disabled={!artworkToAdd} className="primary-button" style={{ padding: '10px 15px', fontSize: '12px' }}><PlusCircle size={14} /> Add</button>
            </div>

            {loadingExhibitionArtworks ? (
              <div style={{ textAlign: 'center', padding: '20px' }}><LoaderCircle className="animate-spin" size={24} /></div>
            ) : exhibitionArtworks.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>No artworks in this exhibition yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {exhibitionArtworks.map(art => (
                  <div key={art.artwork_id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: '#faf9f6', borderRadius: '6px' }}>
                    <img src={art.image_url} alt={art.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{art.title}</strong>
                      <span style={{ fontSize: '11px', color: '#777168' }}>{art.artist_name}</span>
                    </div>
                    <button onClick={() => handleRemoveArtworkFromExhibition(art.artwork_id)} style={{ background: '#feeceb', color: '#b24c48', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CuratorDashboard;