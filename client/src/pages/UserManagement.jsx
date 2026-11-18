import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Search, Shield, CheckCircle, XCircle, ArrowLeft, LoaderCircle, Menu } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

function UserManagement() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Get admin user info for the sidebar and auth guard
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('art_gallery_user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    // Protect route: Only admin can view
    if (!user || user.role !== 'Administrator') {
      navigate('/dashboard', { replace: true });
      return;
    }

    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        if (isMounted) setUsers(res.data.users || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load users.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('art_gallery_token');
    localStorage.removeItem('art_gallery_user');
    navigate('/login', { replace: true });
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role_name.toLowerCase().includes(search.toLowerCase())
  );

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
            <span className="eyebrow">ADMIN CONTROL CENTRE</span>
            <h2>Manage Users</h2>
          </div>
          <Link to="/dashboard" className="dashboard-home-link">
            Back to Dashboard <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
          </Link>
        </header>

        <section className="dashboard-content">
          {error && <div className="dashboard-error" style={{ marginBottom: '20px', padding: '15px', background: '#feeceb', color: '#b24c48', borderRadius: '5px', display: 'flex', gap: '10px', alignItems: 'center' }}><XCircle size={18} /> {error}</div>}
          
          <div className="section-heading" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span className="eyebrow">SYSTEM DIRECTORY</span>
              <h2>All Registered Accounts</h2>
            </div>
            
            <div className="search-box" style={{ minWidth: '280px' }}>
              <Search size={17} style={{ color: '#a47745' }} />
              <input 
                type="search" 
                placeholder="Search by name, email or role..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <LoaderCircle size={30} className="animate-spin" />
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead style={{ background: '#faf9f6', borderBottom: '1px solid #e8e3da' }}>
                  <tr>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: '#777168', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>User Details</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: '#777168', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Role</th>
                    <th style={{ padding: '15px 20px', fontSize: '12px', color: '#777168', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid #f0ede6' }}>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '16px', background: '#a47745', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#25231f' }}>{u.full_name}</strong>
                            <span style={{ fontSize: '12px', color: '#777168' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#a47745', background: '#faf9f6', padding: '6px 12px', borderRadius: '20px', border: '1px solid #e8e3da' }}>
                          <Shield size={14} /> {u.role_name}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: u.account_status === 'Active' ? '#3f7d3c' : '#b24c48' }}>
                          {u.account_status === 'Active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {u.account_status}
                        </span>
                      </td>
                    </tr>
                  ))}
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