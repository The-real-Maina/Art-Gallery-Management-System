import { useEffect, useMemo, useState } from 'react';
import {
  Users, Search, RefreshCw, ShieldCheck, UserRound, Palette, AlertCircle, LoaderCircle, ArrowLeft, CheckCircle, Ban, PlusCircle, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Modal & Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Default to Administrator (id: 3)
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role_id: 3 });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // ALL ROLES (Used for the dropdown in the table, in case Admin needs to promote a Visitor)
  const allRoles = [
    { id: 1, name: 'Visitor' },
    { id: 2, name: 'Artist' },
    { id: 3, name: 'Administrator' },
    { id: 4, name: 'Gallery Curator' },
    { id: 5, name: 'Tour Guide' },
    { id: 6, name: 'Art Collector' },
    { id: 7, name: 'Booking Officer' }
  ];

  // STAFF ROLES ONLY (Used for the "Create Staff" modal)
  const staffRoles = [
    { id: 3, name: 'Administrator' },
    { id: 4, name: 'Gallery Curator' },
    { id: 5, name: 'Tour Guide' },
    { id: 7, name: 'Booking Officer' }
  ];

  useEffect(() => {
    let ignore = false;

    const loadUsers = async () => {
      try {
        const response = await api.get('/users');
        if (!ignore) {
          setUsers(response.data.users || []);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message || 'Unable to retrieve users.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadUsers();
    return () => { ignore = true; };
  }, [reloadKey]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    setReloadKey(k => k + 1);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      await api.post('/users', newUser);
      setIsModalOpen(false);
      setNewUser({ full_name: '', email: '', password: '', role_id: 3 });
      handleRefresh();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Unified update function for both Role and Status
  const handleUpdateUser = async (userId, field, value) => {
    try {
      setUpdatingId(userId);
      const payload = field === 'role' ? { role_id: value } : { account_status: value };
      
      await api.put(`/users/${userId}/update`, payload);
      
      setUsers(previous => previous.map(user => {
        if (user.user_id === userId) {
          if (field === 'role') {
            const roleName = allRoles.find(r => r.id === value)?.name;
            return { ...user, role_name: roleName };
          } else {
            return { ...user, account_status: value };
          }
        }
        return user;
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user.');
    } finally {
      setUpdatingId(null);
    }
  };

  const roles = useMemo(() => [
    'All Roles', ...new Set(users.map(user => user.role_name))
  ], [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All Roles' || user.role_name === roleFilter;
      const matchesStatus = statusFilter === 'All Statuses' || user.account_status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const getRoleIcon = role => {
    if (role === 'Administrator') return <ShieldCheck size={15} />;
    if (role === 'Artist') return <Palette size={15} />;
    return <UserRound size={15} />;
  };

  const getStatusStyle = status => {
    if (status === 'Active') return 'bg-green-50 text-green-700';
    if (status === 'Suspended') return 'bg-red-50 text-red-700';
    return 'bg-amber-50 text-amber-700';
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#25231f]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e9e5dc] bg-white px-6 py-5 md:px-10">
        <div>
          <Link to="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm text-[#8b806d] hover:text-[#b28a45]">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl font-semibold">User Management</h1>
          <p className="mt-1 text-sm text-[#89857d]">Manage gallery members, staff and account access.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#a47745] px-5 py-3 text-sm font-medium text-white hover:bg-[#805b34] transition">
            <PlusCircle size={16} /> Add New Staff
          </button>
          <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#292720] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-9 md:px-10">
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <StatCard label="Total Users" value={users.length} icon={<Users size={24} />} />
          <StatCard label="Active Accounts" value={users.filter(user => user.account_status === 'Active').length} icon={<CheckCircle size={24} />} />
          <StatCard label="Suspended Accounts" value={users.filter(user => user.account_status === 'Suspended').length} icon={<Ban size={24} />} />
        </div>

        <section className="overflow-hidden rounded-xl border border-[#e9e5dc] bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-[#eeeae2] p-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">Registered Users</h2>
              <p className="mt-1 text-sm text-[#89857d]">Showing {filteredUsers.length} of {users.length} users</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-lg border border-[#e7e2d9] px-3 py-2.5">
                <Search size={17} className="text-[#999184]" />
                <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none sm:w-48" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-lg border border-[#e7e2d9] bg-white px-3 py-2.5 text-sm">
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-[#e7e2d9] bg-white px-3 py-2.5 text-sm">
                {['All Statuses', 'Active', 'Inactive', 'Suspended'].map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 text-[#89857d]">
              <LoaderCircle size={32} className="mb-3 animate-spin" /> Loading users...
            </div>
          ) : error ? (
            <div className="px-6 py-20 text-center text-red-600">
              <AlertCircle size={32} className="mx-auto mb-3" />
              <p>{error}</p>
              <button onClick={handleRefresh} className="mt-4 rounded-lg bg-[#292720] px-5 py-2 text-white">Try Again</button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-[#89857d]">
              <Users size={35} className="mx-auto mb-3 opacity-50" /> No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#89857d]">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeae2]">
                  {filteredUsers.map(user => {
                    const isAdmin = user.role_name === 'Administrator';
                    return (
                      <tr key={user.user_id} className="hover:bg-[#fcfbf8]">
                        <td className="px-6 py-5 font-medium">
                          {user.full_name}
                          <p className="mt-1 text-xs text-[#999184]">ID: #{user.user_id}</p>
                        </td>
                        <td className="px-6 py-5 text-sm text-[#77736c]">{user.email}</td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f0e9] px-3 py-1.5 text-xs text-[#75613d]">
                            {getRoleIcon(user.role_name)} {user.role_name}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusStyle(user.account_status)}`}>
                            {user.account_status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {isAdmin ? (
                            <span className="text-xs text-[#999184]">Protected account</span>
                          ) : (
                            <div className="flex gap-2">
                              {/* Role Selector (Uses ALL ROLES to allow upgrading Visitors) */}
                              <select 
                                value={allRoles.find(r => r.name === user.role_name)?.id || 1} 
                                disabled={updatingId === user.user_id} 
                                onChange={e => handleUpdateUser(user.user_id, 'role', Number(e.target.value))} 
                                className="rounded-lg border border-[#e7e2d9] bg-white px-2 py-1.5 text-xs disabled:opacity-50"
                              >
                                {allRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>

                              {/* Status Selector */}
                              <select 
                                value={user.account_status} 
                                disabled={updatingId === user.user_id} 
                                onChange={e => handleUpdateUser(user.user_id, 'status', e.target.value)} 
                                className="rounded-lg border border-[#e7e2d9] bg-white px-2 py-1.5 text-xs disabled:opacity-50"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                              </select>
                            </div>
                          )}
                          {updatingId === user.user_id && <LoaderCircle size={15} className="ml-2 inline animate-spin" />}
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

      {/* CREATE STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-full p-1">
              <X size={20} />
            </button>
            <h2 className="mb-4 font-serif text-2xl font-semibold">Add New Staff</h2>
            <p className="mb-6 text-sm text-[#89857d]">
              Create a new account for a staff member. 
              <br/><br/>
              <em className="text-xs text-[#a47745]">* Visitors, Artists, and Collectors must self-register on the public site.</em>
            </p>

            {createError && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{createError}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input type="text" required value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="w-full rounded-lg border border-[#e7e2d9] px-4 py-2 text-sm outline-none focus:border-[#a47745]" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full rounded-lg border border-[#e7e2d9] px-4 py-2 text-sm outline-none focus:border-[#a47745]" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input type="text" required minLength={8} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full rounded-lg border border-[#e7e2d9] px-4 py-2 text-sm outline-none focus:border-[#a47745]" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Staff Role</label>
                <select value={newUser.role_id} onChange={e => setNewUser({...newUser, role_id: Number(e.target.value)})} className="w-full rounded-lg border border-[#e7e2d9] bg-white px-4 py-2 text-sm outline-none focus:border-[#a47745]">
                  {/* Uses STAFF ROLES ONLY */}
                  {staffRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={createLoading} className="w-full rounded-lg bg-[#a47745] py-3 text-sm font-medium text-white hover:bg-[#805b34] transition">
                {createLoading ? 'Creating...' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-[#e9e5dc] bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#89857d]">{label}</p>
          <h2 className="mt-2 text-3xl font-semibold">{value}</h2>
        </div>
        <div className="rounded-xl bg-[#f3eee4] p-4 text-[#a27b39]">{icon}</div>
      </div>
    </div>
  );
}

export default UserManagement;