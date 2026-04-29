import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supplierAPI, productAPI } from '../api';
import { Modal, Badge, SearchInput, Pagination, Empty, LoadingPage, ConfirmDialog } from '../components/UI';
import toast from 'react-hot-toast';
import { 
  HiOutlineTruck, 
  HiOutlinePhone, 
  HiOutlineEnvelope, 
  HiOutlineMapPin, 
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineBuildingOffice2,
  HiOutlineArchiveBox
} from 'react-icons/hi2';
import { useSettings } from '../context/SettingsContext';

const empty = () => ({ name: '', company: '', email: '', phone: '', address: '', city: '', country: 'Bangladesh', brands: [], notes: '' });

export default function SuppliersPage() {
  const { fmt } = useSettings();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [viewSupplier, setViewSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const r = await supplierAPI.getAll({ page: pg, limit: 20, search });
      setSuppliers(r.data.suppliers);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setPage(pg);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [search]);

  const openView = async (s) => {
    setViewSupplier(s);
    try {
      const r = await supplierAPI.getOne(s._id);
      setSupplierProducts(r.data.products || []);
    } catch {}
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await supplierAPI.update(editing._id, form);
      else await supplierAPI.create(form);
      toast.success(editing ? 'Supplier updated!' : 'Supplier added!');
      setShowForm(false); setEditing(null); load(page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await supplierAPI.delete(id); toast.success('Supplier deleted'); load(page); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="section-title">Suppliers</h2>
          <p className="text-xs text-surface-400 mt-0.5">{total} suppliers</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty()); setShowForm(true); }} className="btn-primary">+ Add Supplier</button>
      </div>

      <div className="w-full md:w-72">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by name, company…" 
          icon={<HiOutlineMagnifyingGlass />}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingPage /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800">
                  <tr>{['Supplier','Company','Contact','City','Brands','Purchases',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {suppliers.map((s, i) => (
                    <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row cursor-pointer" onClick={() => openView(s)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-xs text-surface-800 dark:text-surface-200">{s.name}</p>
                        </div>
                      </td>
                      <td className="table-cell text-xs text-surface-500">{s.company || '—'}</td>
                      <td className="table-cell">
                        <p className="text-xs font-mono">{s.phone || '—'}</p>
                        {s.email && <p className="text-[10px] text-surface-400">{s.email}</p>}
                      </td>
                      <td className="table-cell">{s.city || '—'}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {s.brands?.slice(0, 3).map(b => <Badge key={b} variant="gray">{b}</Badge>)}
                          {s.brands?.length > 3 && <Badge variant="gray">+{s.brands.length - 3}</Badge>}
                        </div>
                      </td>
                      <td className="table-cell font-bold text-brand-500">{fmt(s.totalPurchased)}</td>
                      <td className="table-cell" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(s); setForm({ ...s, brands: s.brands || [] }); setShowForm(true); }}
                            className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-brand-100 hover:text-brand-600 transition-colors">Edit</button>
                          <button onClick={() => setDeleting(s._id)}
                            className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-red-100 hover:text-red-600 transition-colors">Del</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {suppliers.length === 0 && <Empty icon="⬠" title="No suppliers yet" subtitle="Add your first supplier" />}
            <Pagination page={page} pages={pages} total={total} onPage={load} />
          </>
        )}
      </div>

      {/* Supplier detail */}
      <Modal open={!!viewSupplier} onClose={() => setViewSupplier(null)} title="Supplier Details" size="md">
        {viewSupplier && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[2rem] shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/20">
                <HiOutlineTruck />
              </div>
              <div>
                <p className="font-black text-surface-900 dark:text-white text-xl tracking-tight">{viewSupplier.name}</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{viewSupplier.company}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-surface-400 font-medium">
                   <span className="flex items-center gap-1"><HiOutlinePhone className="text-blue-500" /> {viewSupplier.phone}</span>
                   <span className="flex items-center gap-1"><HiOutlineMapPin className="text-blue-500" /> {viewSupplier.city}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="label">Brands Supplied</p>
              <div className="flex flex-wrap gap-1.5">
                {viewSupplier.brands?.map(b => <Badge key={b} variant="blue">{b}</Badge>)}
              </div>
            </div>
            <div>
              <p className="label">Products ({supplierProducts.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {supplierProducts.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs border border-transparent hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-lg text-surface-300 overflow-hidden">
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <HiOutlineArchiveBox />}
                      </div>
                      <span className="font-bold text-surface-800 dark:text-surface-200">{p.name}</span>
                    </div>
                    <span className="font-black text-brand-500">{fmt(p.price)}</span>
                  </div>
                ))}
                {supplierProducts.length === 0 && <p className="text-xs text-surface-400 py-2 text-center">No products linked</p>}
              </div>
            </div>
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
              <p className="text-2xl font-extrabold text-brand-500">{fmt(viewSupplier.totalPurchased)}</p>
              <p className="text-xs text-surface-400 mt-0.5">Total purchased</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="sm">
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {[
            { label: 'Contact Name *', key: 'name', req: true },
            { label: 'Company', key: 'company' },
            { label: 'Phone', key: 'phone' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'City', key: 'city' },
            { label: 'Address', key: 'address' },
          ].map(field => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input required={field.req} type={field.type || 'text'} value={form[field.key] || ''}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="input" />
            </div>
          ))}
          <div>
            <label className="label">Brands (comma-separated)</label>
            <input value={form.brands?.join(', ') || ''}
              onChange={e => setForm(f => ({ ...f, brands: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              className="input" placeholder="Nike, Adidas, Puma" />
          </div>
          <div className="flex gap-2 justify-end pt-1 border-t border-surface-100 dark:border-surface-800">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Update' : 'Add Supplier'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)}
        title="Delete Supplier" message="Remove this supplier from the system?" confirmText="Delete" danger />
    </div>
  );
}
