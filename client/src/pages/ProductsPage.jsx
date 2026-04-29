import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { productAPI, supplierAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, SearchInput, Pagination, Empty, LoadingPage, ConfirmDialog, Select } from '../components/UI';
import toast from 'react-hot-toast';
import { 
  HiOutlineSquares2X2, 
  HiOutlineTableCells, 
  HiOutlinePlus, 
  HiOutlinePencilSquare, 
  HiOutlineDocumentDuplicate, 
  HiOutlineTrash,
  HiOutlineArchiveBox,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel
} from 'react-icons/hi2';

const CATEGORIES = ['Sneakers', 'Formal', 'Casual', 'Sports', 'Boots', 'Sandals', 'Heels', 'Kids', 'Other'];
const SIZES = ['35','36','37','38','39','40','41','42','43','44','45','46'];
const COLORS = ['Black','White','Red','Blue','Grey','Brown','Navy','Green','Yellow','Pink','Orange'];

const empty = () => ({
  name: '', brand: '', category: 'Sneakers', description: '', price: '', costPrice: '',
  discount: 0, tax: 0, images: [''], lowStockThreshold: 5, featured: false,
  variants: [{ size: '40', color: 'Black', stock: 0, sku: '', barcode: '' }],
  tags: [],
});

export default function ProductsPage() {
  const { fmt } = useSettings();
  const { can } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const r = await productAPI.getAll({ page: pg, limit: 16, search, category, lowStock: lowStock ? 'true' : '' });
      setProducts(r.data.products);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setPage(pg);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [search, category, lowStock]);
  useEffect(() => { supplierAPI.getAll({ limit: 100 }).then(r => setSuppliers(r.data.suppliers)).catch(() => {}); }, []);

  const openEdit = (p) => { setEditing(p); setForm({ ...p, images: p.images?.length ? p.images : [''] }); setShowForm(true); };
  const openCreate = () => { setEditing(null); setForm(empty()); setShowForm(true); };
  const duplicate = (p) => { 
    setEditing(null); 
    setForm({ ...p, _id: undefined, name: `${p.name} (Copy)`, variants: p.variants.map(v => ({ ...v, stock: 0 })) }); 
    setShowForm(true); 
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const setVariant = (i, key, val) => {
    setForm(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [key]: val } : v) }));
  };
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { size: '40', color: 'Black', stock: 0, sku: '', barcode: '' }] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.variants.length) return toast.error('Add at least one variant');
    setSaving(true);
    try {
      if (editing) await productAPI.update(editing._id, form);
      else await productAPI.create(form);
      toast.success(editing ? 'Product updated!' : 'Product created!');
      closeForm();
      load(page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      load(page);
    } catch { toast.error('Delete failed'); }
  };

  const statusBadge = (p) => {
    if (p.totalStock === 0) return <Badge variant="red" dot>Out of Stock</Badge>;
    if (p.totalStock <= p.lowStockThreshold) return <Badge variant="yellow" dot>Low Stock</Badge>;
    return <Badge variant="green" dot>In Stock</Badge>;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h2 className="section-title">Products</h2>
          <p className="text-xs text-surface-400 mt-0.5">{total} products total</p>
        </div>
        {can(['admin']) && (
          <button onClick={openCreate} className="btn-primary shadow-brand-500/20">+ Add Product</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-full md:w-72">
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder="Search shoes, brands…" 
            icon={<HiOutlineMagnifyingGlass />} 
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            placeholder="All Categories"
            icon={<HiOutlineFunnel />}
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-surface-600 dark:text-surface-400 cursor-pointer">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)}
            className="w-3.5 h-3.5 accent-brand-500" />
          Low Stock Only
        </label>
        <div className="ml-auto flex gap-1 border border-surface-200 dark:border-surface-700 rounded-xl p-0.5">
          {[
            { id: 'grid', icon: <HiOutlineSquares2X2 /> },
            { id: 'table', icon: <HiOutlineTableCells /> }
          ].map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${viewMode === m.id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-surface-400 hover:text-brand-500'}`}>
              {m.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      {loading ? <LoadingPage /> : viewMode === 'grid' ? (
        <>
          {products.length === 0 ? (
            <Empty icon={<HiOutlineArchiveBox />} title="No products yet" subtitle="Add your first shoe product"
              action={can(['admin']) && <button onClick={openCreate} className="btn-primary">+ Add Product</button>} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="aspect-[4/3] bg-surface-100 dark:bg-surface-800 relative overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl text-surface-300">
                        <HiOutlineArchiveBox />
                      </div>
                    )}
                    {p.discount > 0 && (
                      <div className="absolute top-3 left-3 bg-brand-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">-{p.discount}%</div>
                    )}
                    <div className="absolute top-3 right-3">{statusBadge(p)}</div>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-surface-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-surface-400">{p.brand} · {p.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="font-extrabold text-brand-500 text-sm">{fmt(p.price * (1 - p.discount / 100))}</p>
                        {p.discount > 0 && <p className="text-[10px] text-surface-400 line-through">{fmt(p.price)}</p>}
                      </div>
                      <p className="text-xs text-surface-400">{p.totalStock} units</p>
                    </div>
                    {can(['admin']) && (
                      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <button onClick={() => openEdit(p)} className="flex-1 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-400 hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center gap-1.5"><HiOutlinePencilSquare className="text-sm" /> Edit</button>
                        <button onClick={() => duplicate(p)} className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"><HiOutlineDocumentDuplicate className="text-sm" /></button>
                        <button onClick={() => setDeleting(p._id)} className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><HiOutlineTrash className="text-sm" /></button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800">
                <tr>
                  {['Product','Brand','Category','Price','Stock','Status','Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-base overflow-hidden shrink-0 text-surface-400">
                          {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <HiOutlineArchiveBox />}
                        </div>
                        <div><p className="font-semibold text-xs text-surface-800 dark:text-surface-200">{p.name}</p></div>
                      </div>
                    </td>
                    <td className="table-cell">{p.brand}</td>
                    <td className="table-cell"><Badge variant="gray">{p.category}</Badge></td>
                    <td className="table-cell font-semibold text-brand-500">{fmt(p.price * (1 - p.discount / 100))}</td>
                    <td className="table-cell font-mono">{p.totalStock}</td>
                    <td className="table-cell">{statusBadge(p)}</td>
                    <td className="table-cell">
                      {can(['admin', 'manager']) && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-brand-100 hover:text-brand-600 transition-colors">Edit</button>
                          <button onClick={() => setDeleting(p._id)} className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-red-100 hover:text-red-600 transition-colors">Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} total={total} onPage={load} />
        </div>
      )}

      {viewMode === 'grid' && pages > 1 && (
        <div className="card"><Pagination page={page} pages={pages} total={total} onPage={load} /></div>
      )}

      {/* Product form modal */}
      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSave} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Product Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Air Max 270" />
            </div>
            <div>
              <label className="label">Brand *</label>
              <input required value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="input" placeholder="Nike" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Selling Price *</label>
              <input required type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" placeholder="5500" />
            </div>
            <div>
              <label className="label">Cost Price</label>
              <input type="number" min={0} value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} className="input" placeholder="3200" />
            </div>
            <div>
              <label className="label">Discount (%)</label>
              <input type="number" min={0} max={100} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Supplier</label>
              <select value={form.supplier || ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value || undefined }))} className="input">
                <option value="">No supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" rows={2} placeholder="Short product description…" />
            </div>
            <div className="col-span-2">
              <label className="label">Image URL</label>
              <input value={form.images?.[0] || ''} onChange={e => setForm(f => ({ ...f, images: [e.target.value] }))} className="input" placeholder="https://..." />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Variants (Size + Color + Stock) *</label>
              <button type="button" onClick={addVariant} className="text-xs text-brand-500 font-bold hover:text-brand-700">+ Add Variant</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {form.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 p-2.5 bg-surface-50 dark:bg-surface-800 rounded-xl">
                  <select value={v.size} onChange={e => setVariant(i, 'size', e.target.value)} className="input text-xs py-1.5">
                    {SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={v.color} onChange={e => setVariant(i, 'color', e.target.value)} className="input text-xs py-1.5">
                    {COLORS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="number" min={0} value={v.stock} onChange={e => setVariant(i, 'stock', +e.target.value)}
                    className="input text-xs py-1.5" placeholder="Stock" />
                  <input value={v.sku} onChange={e => setVariant(i, 'sku', e.target.value)}
                    className="input text-xs py-1.5" placeholder="SKU" />
                  <button type="button" onClick={() => removeVariant(i)}
                    className="py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-surface-100 dark:border-surface-800">
            <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)}
        title="Delete Product" message="Are you sure? This product will be removed from the system." confirmText="Delete" danger />
    </div>
  );
}
