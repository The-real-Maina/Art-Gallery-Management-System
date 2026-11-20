import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Palette, LayoutDashboard, Users, MessageSquare, MessageCircle, FileText, LogOut, Menu, X,
  Search, Shield, CheckCircle, XCircle, ArrowLeft, LoaderCircle, UserPlus, AlertCircle
} from 'lucide-react';

import api from '../services/api';
import NotificationBell from '../components/NotificationBell';

const STAFF_ROLES = ['Administrator', 'Gallery Curator', 'Tour Guide', 'Booking Officer'];
const ACCOUNT_STATUSES = ['Active', 'Inactive', 'Suspended'];
const EMPTY_FORM = { full_name: '', email: '', password: '', role_id: '' };

const selectStyle = {
  padding: '7px 10px',
  border: '1px solid #e8e3da',
  borderRadius: '6px',
  background: '#faf9f6',
  fontSize: '12px',
  fontWeight: 600,
  color: '#25231f',
  cursor: 'pointer'
};

function UserManagement() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [savingId, setSavingId] = useState(null);

  // Add staff form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  const isAdmin = user?.role === 'Administrator';
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';
  const staffRoleOptions = roles.filter((r) => STAFF_ROLES.includes(r.role_name));

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return undefined;
    }

    let ignore = false;

    const load = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          api.get('/users'),
          api.get('/users/roles')
        ]);
        if (!ignore) {
          setUsers(usersRes.data.users || []);
          setRoles(rolesRes.data.roles || []);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Failed to load users.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [isAdmin, navigate, reloadKey]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  // Sidebar tabs live on the admin dashboard, so jump there with the tab selected
  const goToDashboardTab = (tab) => {
    setMenuOpen(false);
    navigate('/dashboard', { state: { tab } });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    setNotice({ type: '', text: '' });

    if (!form.role_id) {
      setFormError('Please choose a role.');
      return;
    }

    try {
      setFormLoading(true);
      await api.post('/users', {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role_id: Number(form.role_id)
      });
      setNotice({ type: 'success', text: `Account created for ${form.full_name.trim()}. Share the temporary password with them securely.` });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create the account.');
    } finally {
      setFormLoading(false);
    }
  };

  const updateUser = async (target, payload, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setNotice({ type: '', text: '' });

    try {
      setSavingId(target.user_id);
      await api.put(`/users/${target.user_id}/update`, payload);
      setNotice({ type: 'success', text: `${target.full_name} was updated.` });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not update this account.' });
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = (target, status) => {
    updateUser(
      target,
      { account_status: status },
      status === 'Active'
        ? null
        : `Set ${target.full_name} to ${status}? They may lose access to their account.`
    );
  };

  const handleRoleChange = (target, roleId) => {
    const newRole = roles.find((r) => r.role_id === Number(roleId));
    updateUser(
      target,
      { role_id: Number(roleId) },
      `Change ${target.full_name}'s role to ${newRole?.role_name}? Their dashboard and permissions will change.`
    );
  };

  const term = search.toLowerCase();
  const filteredUsers = users.filter((u) =>
    (u.full_name || '').toLowerCase().includes(term) ||
    (u.email || '').toLowerCase().includes(term) ||
    (u.role_name || '').toLowerCase().includes(term)
  );

  if (!isAdmin) return null;

  const thStyle = { padding: '15px 20px', fontSize: '12px', color: '#777168', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' };

  return (
    <div className="dashboard-page admin-dashboard">
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand dashboard-brand">
          <span className="brand-icon"><Palette size={22} /></span>
          <span>ARTISAN<span className="brand-light">.</span></span>
        </Link>

        <div className="sidebar-label">ADMIN WORKSPACE</div>

        <nav className="dashboard-nav">
          <button onClick={() => goToDashboardTab('overview')}><LayoutDashboard size={19} /> Overview</button>
          <button onClick={() => goToDashboardTab('feedback')}><MessageSquare size={19} /> Feedback</button>
          <button onClick={() => goToDashboardTab('inquiries')}><MessageCircle size={19} /> Inquiries</button>
          <button onClick={() => goToDashboardTab('audit')}><FileText size={19} /> Audit Logs</button>
          <button className="active"><Users size={19} /> Manage Users</button>
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
            <span className="eyebrow">ADMIN CONTROL CENTRE</span>
            <h2>Manage Users</h2>
          </div>
          <div className="dashboard-header-actions">
            <NotificationBell />
            <Link to="/dashboard" className="dashboard-home-link">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error"><AlertCircle size={18} /> {error}</div>}

          {notice.text && (
            <div className={`booking-message ${notice.type === 'success' ? 'success' : 'error'}`}>
              {notice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {notice.text}
            </div>
          )}

          <div className="section-heading" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span className="eyebrow">SYSTEM DIRECTORY</span>
              <h2>All Registered Accounts</h2>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ minWidth: '260px' }}>
                <Search size={17} style={{ color: '#a47745' }} />
                <input
                  type="search"
                  placeholder="Search by name, email or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="primary-button" onClick={() => { setShowForm(!showForm); setFormError(''); }} style={{ height: '44px', padding: '0 18px' }}>
                {showForm ? <><X size={16} /> Close</> : <><UserPlus size={16} /> Add staff</>}
              </button>
            </div>
          </div>

          {showForm && (
            <form className="booking-card" onSubmit={handleCreateStaff} style={{ marginBottom: '28px', maxWidth: '800px' }}>
              <div className="booking-form-heading">
                <UserPlus size={26} />
                <div>
                  <h2>Add a staff member</h2>
                  <p>Create an account for gallery staff. Artists, visitors and collectors register themselves.</p>
                </div>
              </div>

              {formError && <div className="booking-message error"><AlertCircle size={18} /> {formError}</div>}

              <div className="dashboard-form-grid">
                <div className="booking-field">
                  <label>Full name</label>
                  <input type="text" required placeholder="e.g., Mercy Chebet" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="booking-field">
                  <label>Email</label>
                  <input type="email" required placeholder="name@artisangallery.co.ke" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="booking-field">
                  <label>Temporary password</label>
                  <input type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="booking-field">
                  <label>Role</label>
                  <select required value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
                    <option value="">-- Select a role --</option>
                    {staffRoleOptions.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" className="primary-button" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create account'}
                </button>
                <button type="button" className="logout-button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }} style={{ width: 'auto', padding: '14px 20px', border: '1px solid #e8e3da', color: '#25231f' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="dashboard-loading">
              <LoaderCircle size={30} className="loading-spinner" />
              <span>Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="dashboard-empty">
              <Users size={30} />
              <h3>No users found</h3>
              <p>No accounts match your search criteria.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e8e3da', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
                <thead style={{ background: '#faf9f6', borderBottom: '1px solid #e8e3da' }}>
                  <tr>
                    <th style={thStyle}>User Details</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = Number(u.user_id) === Number(user.user_id);
                    const isStaff = STAFF_ROLES.includes(u.role_name);
                    const saving = savingId === u.user_id;

                    return (
                      <tr key={u.user_id} style={{ borderBottom: '1px solid #f0ede6', opacity: saving ? 0.6 : 1 }}>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '16px', background: '#a47745', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {(u.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ display: 'block', fontSize: '14px', color: '#25231f' }}>
                                {u.full_name} {isSelf && <span style={{ fontSize: '11px', color: '#a47745', fontWeight: 600 }}>(you)</span>}
                              </strong>
                              <span style={{ fontSize: '12px', color: '#777168' }}>{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '15px 20px' }}>
                          {isStaff && !isSelf ? (
                            <select
                              style={selectStyle}
                              value={u.role_id}
                              disabled={saving}
                              aria-label={`Role for ${u.full_name}`}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                            >
                              {staffRoleOptions.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                            </select>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#a47745', background: '#faf9f6', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e8e3da' }}>
                              <Shield size={14} /> {u.role_name}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '15px 20px' }}>
                          {isSelf ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#3f7d3c' }}>
                              <CheckCircle size={14} /> {u.account_status}
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              {u.account_status === 'Active' ? <CheckCircle size={14} color="#3f7d3c" /> : <XCircle size={14} color="#b24c48" />}
                              <select
                                style={{ ...selectStyle, color: u.account_status === 'Active' ? '#3f7d3c' : '#b24c48' }}
                                value={u.account_status}
                                disabled={saving}
                                aria-label={`Status for ${u.full_name}`}
                                onChange={(e) => handleStatusChange(u, e.target.value)}
                              >
                                {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default UserManagement;