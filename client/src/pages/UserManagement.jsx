
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Palette,
  AlertCircle,
  LoaderCircle,
  ArrowLeft,
  CheckCircle,
  Ban,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem('art_gallery_token');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const response = await axios.get(
        'http://localhost:5000/api/users',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to retrieve users.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const roles = useMemo(() => [
    'All Roles',
    ...new Set(users.map(user => user.role_name))
  ], [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === 'All Roles' ||
        user.role_name === roleFilter;

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        user.account_status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const updateStatus = async (userId, newStatus) => {
    try {
      setUpdatingId(userId);

      await axios.put(
        `http://localhost:5000/api/users/${userId}/status`,
        { account_status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(previous =>
        previous.map(user =>
          user.user_id === userId
            ? { ...user, account_status: newStatus }
            : user
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Could not update account status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
          <Link
            to="/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm text-[#8b806d] hover:text-[#b28a45]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <h1 className="font-serif text-3xl font-semibold">
            User Management
          </h1>

          <p className="mt-1 text-sm text-[#89857d]">
            Manage gallery members, staff and account access.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#292720] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Users
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-9 md:px-10">
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <StatCard
            label="Total Users"
            value={users.length}
            icon={<Users size={24} />}
          />

          <StatCard
            label="Active Accounts"
            value={users.filter(user => user.account_status === 'Active').length}
            icon={<CheckCircle size={24} />}
          />

          <StatCard
            label="Suspended Accounts"
            value={users.filter(user => user.account_status === 'Suspended').length}
            icon={<Ban size={24} />}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-[#e9e5dc] bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-[#eeeae2] p-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">Registered Users</h2>
              <p className="mt-1 text-sm text-[#89857d]">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-lg border border-[#e7e2d9] px-3 py-2.5">
                <Search size={17} className="text-[#999184]" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none sm:w-48"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="rounded-lg border border-[#e7e2d9] bg-white px-3 py-2.5 text-sm"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#e7e2d9] bg-white px-3 py-2.5 text-sm"
              >
                {['All Statuses', 'Active', 'Inactive', 'Suspended'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 text-[#89857d]">
              <LoaderCircle size={32} className="mb-3 animate-spin" />
              Loading users...
            </div>
          ) : error ? (
            <div className="px-6 py-20 text-center text-red-600">
              <AlertCircle size={32} className="mx-auto mb-3" />
              <p>{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 rounded-lg bg-[#292720] px-5 py-2 text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-[#89857d]">
              <Users size={35} className="mx-auto mb-3 opacity-50" />
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
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
                  {filteredUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-[#fcfbf8]">
                      <td className="px-6 py-5 font-medium">
                        {user.full_name}
                        <p className="mt-1 text-xs text-[#999184]">
                          ID: #{user.user_id}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-[#77736c]">
                        {user.email}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f0e9] px-3 py-1.5 text-xs text-[#75613d]">
                          {getRoleIcon(user.role_name)}
                          {user.role_name}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusStyle(user.account_status)}`}>
                          {user.account_status || 'Unknown'}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {user.role_name === 'Administrator' ? (
                          <span className="text-xs text-[#999184]">
                            Protected account
                          </span>
                        ) : (
                          <select
                            value={user.account_status}
                            disabled={updatingId === user.user_id}
                            onChange={e => updateStatus(user.user_id, e.target.value)}
                            className="rounded-lg border border-[#e7e2d9] bg-white px-3 py-2 text-xs disabled:opacity-50"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                        )}

                        {updatingId === user.user_id && (
                          <LoaderCircle size={15} className="ml-2 inline animate-spin" />
                        )}
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

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-[#e9e5dc] bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#89857d]">{label}</p>
          <h2 className="mt-2 text-3xl font-semibold">{value}</h2>
        </div>
        <div className="rounded-xl bg-[#f3eee4] p-4 text-[#a27b39]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
