import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../api';
import { Modal, Badge, Empty, LoadingPage, ConfirmDialog, SearchInput, Select } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineUser, 
  HiOutlineEnvelope, 
  HiOutlinePhone, 
  HiOutlineBuildingStorefront,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineUsers,
  HiOutlineLockClosed
} from 'react-icons/hi2';

const empty = () => ({ name: '', email: '', password: '', role: 'staff', phone: '', store: 'Main Store' });
const roleColors = { admin: 'pink', staff: 'green' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await authAPI.getUsers(); setUsers(r.data.users); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await authAPI.updateUser(editing._id, { name: form.name, role: form.role, phone: form.phone, store: form.store, isActive: form.isActive });
      else await authAPI.createUser(form);
      toast.success(editing ? 'User updated!' : 'User created!');
      setShowForm(false); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await authAPI.deleteUser(id); toast.success('User deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const toggleActive = async (u) => {
    try {
      await authAPI.updateUser(u._id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="section-title">Users</h2>
          <p className="text-xs text-surface-400 mt-0.5">{users.length} team members</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty()); setShowForm(true); }} className="btn-primary">+ Add User</button>
      </div>

      {loading ? <LoadingPage /> : (
        <>
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <div className="w-full md:w-64">
              <SearchInput
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((u, i) => (
            <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0 shadow-sm
                  ${u.role === 'admin' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' :
                    u.role === 'manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-surface-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-surface-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant={roleColors[u.role]}>{u.role}</Badge>
                    {!u.isActive && <Badge variant="red">Inactive</Badge>}
                    {u._id === me._id && <Badge variant="pink">You</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-surface-500 mb-4">
                {u.phone && <p>📱 {u.phone}</p>}
                <p>🏪 {u.store}</p>
                {u.lastLogin && <p>🕐 Last: {format(new Date(u.lastLogin), 'dd MMM, HH:mm')}</p>}
              </div>

              {u._id !== me._id && (
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditing(u); setForm(u); setShowForm(true); }}
                    className="flex-1 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(u)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors
                      ${u.isActive ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-yellow-100 hover:text-yellow-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setDeleting(u._id)}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-semibold text-surface-600 hover:bg-red-100 hover:text-red-600 transition-colors">
                    ✕
                  </button>
                </div>
              )}
            </motion.div>
            ))}
          </div>
        </>
      )}

      {!loading && users.length === 0 && <Empty icon={<HiOutlineUsers />} title="No users yet" subtitle="Start building your team" />}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Add User'} size="sm">
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          {!editing && (
            <>
              <div>
                <label className="label">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role *</label>
              <Select 
                value={form.role} 
                onChange={val => setForm(f => ({ ...f, role: val }))}
                options={[
                  { value: 'staff', label: 'Staff' },
                  { value: 'admin', label: 'Admin' }
                ]}
                icon={<HiOutlineShieldCheck />}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Store</label>
            <input value={form.store || 'Main Store'} onChange={e => setForm(f => ({ ...f, store: e.target.value }))} className="input" />
          </div>
          <div className="flex gap-2 justify-end pt-1 border-t border-surface-100 dark:border-surface-800">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Update' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)}
        title="Delete User" message="This will permanently delete the user account." confirmText="Delete" danger />
    </div>
  );
}
