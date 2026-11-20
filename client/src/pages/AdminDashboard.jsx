import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, Users, MessageSquare, ShieldCheck, LogOut, Menu, X, ArrowUpRight,
  AlertCircle, LoaderCircle, Trash2, MessageCircle, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';

import api from '../services/api';
import NotificationBell from '../components/NotificationBell';

// Turns a raw audit action such as "PATCH /api/tours/bookings/1/status"
// into a sentence an administrator can read at a glance.
const ACTION_RULES = [
  [/^POST \/api\/auth\/login/, 'Signed in'],
  [/^POST \/api\/auth\/register/, 'Registered a new account'],

  [/^POST \/api\/users\/?$/, 'Created a user account'],
  [/^PUT \/api\/users\/\d+\/update/, 'Updated a user account'],
  [/^(PUT|PATCH) \/api\/users\/\d+\/status/, 'Changed a user account status'],
  [/^DELETE \/api\/users\/\d+/, 'Deleted a user account'],

  [/^POST \/api\/tours\/\d+\/book/, 'Booked a guided tour'],
  [/^PATCH \/api\/tours\/bookings\/\d+\/status/, 'Confirmed or declined a tour booking'],
  [/^PATCH \/api\/tours\/bookings\/\d+\/cancel/, 'Cancelled a tour booking'],
  [/^PATCH \/api\/tours\/\d+\/cancel/, 'Cancelled a guided tour'],
  [/^PATCH \/api\/tours\/\d+\/complete/, 'Completed a guided tour'],
  [/^POST \/api\/tours\/?$/, 'Scheduled a guided tour'],
  [/^PUT \/api\/tours\/\d+/, 'Updated a guided tour'],

  [/^POST \/api\/visit-bookings\/?$/, 'Booked a gallery visit'],
  [/^PATCH \/api\/visit-bookings\/\d+\/cancel/, 'Cancelled a gallery visit'],
  [/^PATCH \/api\/visit-bookings\/\d+/, 'Updated a gallery visit booking'],

  [/^POST \/api\/artworks\/?$/, 'Added an artwork'],
  [/^(PUT|PATCH) \/api\/artworks\/\d+/, 'Updated an artwork'],
  [/^DELETE \/api\/artworks\/\d+/, 'Deleted an artwork'],

  [/^POST \/api\/exhibitions\/?$/, 'Created an exhibition'],
  [/^(PUT|PATCH) \/api\/exhibitions\/\d+/, 'Updated an exhibition'],

  [/^POST \/api\/feedback/, 'Submitted feedback'],
  [/^DELETE \/api\/feedback\/\d+/, 'Deleted feedback'],

  [/^POST \/api\/collectors\/inquiries/, 'Sent a purchase inquiry'],
  [/^(PUT|PATCH) \/api\/collectors\/inquiries/, 'Responded to a purchase inquiry'],
  [/^POST \/api\/collectors\/favourites/, 'Saved an artwork to favourites'],
  [/^DELETE \/api\/collectors\/favourites/, 'Removed a favourite artwork'],
];

const describeAction = (action = '') => {
  const rule = ACTION_RULES.find(([pattern]) => pattern.test(action));
  if (rule) return rule[1];

  const [method = '', path = ''] = action.split(' ');
  const verb = { POST: 'Created', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' }[method] || method;
  const resource = path.replace(/^\/api\//, '').split('/')[0].replace(/-/g, ' ');
  return resource ? `${verb} ${resource}` : action;
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | feedback | audit | inquiries

  const [feedbacks, setFeedbacks] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [userCount, setUserCount] = useState(0);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('art_gallery_user') || 'null');
    } catch {
      return null;
    }
  });

  const isAdmin = user?.role === 'Administrator';
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  useEffect(() => {
    if (!isAdmin) navigate('/login', { replace: true });
  }, [isAdmin, navigate]);

  // 1. Fetch Main Admin Data (Feedback, Inquiries, Users)
  useEffect(() => {
    if (!isAdmin) return;
    let ignore = false;

    const loadMainData = async () => {
      const [feedbackRes, inquiryRes, usersRes] = await Promise.allSettled([
        api.get('/feedback'),
        api.get('/collectors/inquiries/all'),
        api.get('/users')
      ]);

      if (ignore) return;

      const failed = [];

      if (feedbackRes.status === 'fulfilled') setFeedbacks(feedbackRes.value.data.feedback || []);
      else failed.push('feedback');

      if (inquiryRes.status === 'fulfilled') setInquiries(inquiryRes.value.data.inquiries || []);
      else failed.push('inquiries');

      if (usersRes.status === 'fulfilled') setUserCount(usersRes.value.data.users?.length || 0);
      else failed.push('users');

      if (failed.length > 0) setError(`Could not load: ${failed.join(', ')}.`);
      else setError('');

      setLoading(false);
    };

    loadMainData();
    return () => { ignore = true; };
  }, [isAdmin]);

  // 2. Fetch Audit Logs (Separated for Pagination)
  useEffect(() => {
    if (!isAdmin) return;
    let ignore = false;

    const loadAuditLogs = async () => {
      setAuditLoading(true);
      try {
        const res = await api.get(`/audit-logs?page=${auditPage}&limit=10`);
        if (!ignore) {
          setAuditLogs(res.data.audit_logs || []);
          setAuditTotalPages(res.data.pagination?.total_pages || 1);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        if (!ignore) setAuditLoading(false);
      }
    };

    loadAuditLogs();
    return () => { ignore = true; };
  }, [isAdmin, auditPage]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      setActionLoadingId(id);
      await api.delete(`/feedback/${id}`);
      setFeedbacks((prev) => prev.filter((f) => f.feedback_id !== id));
    } catch {
      alert('Failed to delete feedback.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatIp = (ip) => {
    if (!ip) return 'Unknown';
    return ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(ip) ? 'This computer' : ip;
  };

  const goToTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const modules = [
    { title: 'User Management', description: 'Add staff, manage members and access roles.', icon: Users, path: '/admin/users' },
    { title: 'Feedback Moderation', description: 'Review and remove visitor feedback.', icon: MessageSquare, tab: 'feedback' },
    { title: 'Purchase Inquiries', description: 'Oversee collector inquiries to artists.', icon: MessageCircle, tab: 'inquiries' },
    { title: 'Audit Logs', description: 'Track system activity and security events.', icon: FileText, tab: 'audit' },
  ];

  if (!isAdmin) return null;

  return (
    <div className="dashboard-page admin-dashboard">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">ADMIN WORKSPACE</div>

        <nav className="dashboard-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => goToTab('overview')}>
            <LayoutDashboard size={19} /> Overview
          </button>
          <button className={activeTab === 'feedback' ? 'active' : ''} onClick={() => goToTab('feedback')}>
            <MessageSquare size={19} /> Feedback
          </button>
          <button className={activeTab === 'inquiries' ? 'active' : ''} onClick={() => goToTab('inquiries')}>
            <MessageCircle size={19} /> Inquiries
          </button>
          <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => goToTab('audit')}>
            <FileText size={19} /> Audit Logs
          </button>
          <Link to="/admin/users" className="dashboard-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px', color: '#bcb9b0', fontSize: '13px' }}>
            <Users size={19} /> Manage Users
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.full_name}</strong>
              <span>{user.role}</span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {menuOpen && <button className="dashboard-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="dashboard-menu-button" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div>
            <span className="eyebrow">SYSTEM ADMINISTRATION</span>
            <h2>Administrator Dashboard</h2>
          </div>

          <div className="dashboard-header-actions">
            <NotificationBell />
          </div>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error"><AlertCircle size={18} /> {error}</div>}

          {loading && (
            <div className="dashboard-loading"><LoaderCircle size={24} className="loading-spinner" /><span>Loading system data...</span></div>
          )}

          {/* OVERVIEW TAB */}
          {!loading && activeTab === 'overview' && (
            <>
              <div className="dashboard-welcome admin-welcome">
                <div>
                  <span className="eyebrow">ADMINISTRATOR WORKSPACE</span>
                  <h1>Welcome, <em>{user.full_name}.</em></h1>
                  <p>Monitor system activity, moderate content and manage gallery staff and accounts from one central workspace.</p>
                </div>
                <div className="welcome-icon"><ShieldCheck size={38} /></div>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon"><Users size={21} /></div>
                  <span>Total Users</span>
                  <strong>{userCount}</strong>
                  <small>Registered accounts</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><MessageSquare size={21} /></div>
                  <span>Feedback Items</span>
                  <strong>{feedbacks.length}</strong>
                  <small>Visitor reviews</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><MessageCircle size={21} /></div>
                  <span>Total Inquiries</span>
                  <strong>{inquiries.length}</strong>
                  <small>Collector requests</small>
                </div>
              </div>

              <div className="admin-overview-label">
                <span className="eyebrow">SYSTEM CONTROL CENTRE</span>
                <h2>Management modules</h2>
                <p>Choose an area to manage.</p>
              </div>

              <div className="admin-module-grid">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const inner = (
                    <>
                      <div className="admin-module-icon"><Icon size={23} /></div>
                      <ArrowUpRight className="admin-module-arrow" size={19} />
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                    </>
                  );

                  return module.path ? (
                    <Link to={module.path} className="admin-module-card" key={module.title}>{inner}</Link>
                  ) : (
                    <button type="button" className="admin-module-card" key={module.title} onClick={() => goToTab(module.tab)} style={{ textAlign: 'left', cursor: 'pointer' }}>{inner}</button>
                  );
                })}
              </div>
            </>
          )}

          {/* FEEDBACK MODERATION TAB */}
          {!loading && activeTab === 'feedback' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div><span className="eyebrow">QUALITY CONTROL</span><h2>Visitor Feedback</h2></div>
              </div>

              {feedbacks.length === 0 ? (
                <div className="dashboard-empty"><MessageSquare size={30} /><h3>No feedback yet</h3><p>Visitors haven't left any reviews.</p></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {feedbacks.map((fb) => (
                    <div className="profile-card" key={fb.feedback_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="profile-details" style={{ flex: 1 }}>
                        <h3>Rating: {fb.rating} / 5</h3>
                        <p style={{ fontStyle: 'italic', margin: '10px 0' }}>"{fb.comment || 'No comment provided.'}"</p>
                        <p style={{ fontSize: '11px', color: '#999' }}>
                          By: {fb.full_name || 'Anonymous'} {fb.exhibition_title ? `• ${fb.exhibition_title}` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteFeedback(fb.feedback_id)} disabled={actionLoadingId === fb.feedback_id} style={{ background: '#feeceb', color: '#b24c48', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Trash2 size={16} /> {actionLoadingId === fb.feedback_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* INQUIRIES TAB */}
          {!loading && activeTab === 'inquiries' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div><span className="eyebrow">SALES OVERSIGHT</span><h2>Purchase Inquiries</h2></div>
              </div>

              {inquiries.length === 0 ? (
                <div className="dashboard-empty"><MessageCircle size={30} /><h3>No inquiries found</h3><p>No collectors have made inquiries yet.</p></div>
              ) : (
                <div className="dashboard-bookings-list">
                  {inquiries.map((inq) => (
                    <div className="profile-card" key={inq.inquiry_id} style={{ padding: '25px' }}>
                      <div className="profile-details">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h3 style={{ margin: 0 }}>{inq.artwork_title}</h3>
                          <span className={`booking-status status-${(inq.inquiry_status || 'Pending').toLowerCase()}`} style={{ margin: 0 }}>
                            {inq.inquiry_status || 'Pending'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#a47745', fontWeight: 'bold' }}>
                          From: {inq.collector_name} • To Artist: {inq.artist_name}
                        </p>

                        <div style={{ background: '#faf9f6', padding: '15px', borderRadius: '6px', margin: '15px 0', borderLeft: '3px solid #ccc' }}>
                          <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>"{inq.message}"</p>
                        </div>

                        {inq.response && (
                          <div style={{ marginTop: '15px', padding: '15px', background: '#eef7ed', borderRadius: '5px', borderLeft: '3px solid #3f7d3c' }}>
                            <strong style={{ fontSize: '12px', color: '#3f7d3c', textTransform: 'uppercase', letterSpacing: '1px' }}>Artist Response:</strong>
                            <p style={{ margin: '5px 0 0', fontSize: '13px', lineHeight: '1.6' }}>{inq.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* AUDIT LOGS TAB */}
          {!loading && activeTab === 'audit' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <div><span className="eyebrow">SECURITY & TRACKING</span><h2>System Audit Logs</h2></div>
              </div>

              {auditLoading ? (
                <div className="dashboard-loading"><LoaderCircle size={24} className="loading-spinner" /><span>Loading logs...</span></div>
              ) : auditLogs.length === 0 ? (
                <div className="dashboard-empty"><FileText size={30} /><h3>No logs available</h3></div>
              ) : (
                <>
                  <div className="dashboard-bookings-list">
                    {auditLogs.map((log) => (
                      <div className="profile-card" key={log.log_id} style={{ padding: '16px 25px' }}>
                        <div className="profile-details" style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px 20px' }}>
                            <strong style={{ fontSize: '14px', color: '#25231f' }}>
                              {log.full_name || 'System'} <span style={{ fontWeight: 500, color: '#68645d' }}>· {describeAction(log.action)}</span>
                            </strong>
                            <span style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</span>
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#98917f' }}>
                            <code style={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>{log.action}</code> · {formatIp(log.ip_address)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PAGINATION CONTROLS */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                    <button
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      disabled={auditPage === 1}
                      className="primary-button" style={{ padding: '8px 12px', background: '#292721', opacity: auditPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Page {auditPage} of {auditTotalPages}</span>
                    <button
                      onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                      disabled={auditPage === auditTotalPages}
                      className="primary-button" style={{ padding: '8px 12px', background: '#292721', opacity: auditPage === auditTotalPages ? 0.5 : 1 }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;