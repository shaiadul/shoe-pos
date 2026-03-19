import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { customerAPI, orderAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { Modal, Badge, SearchInput, Pagination, Empty, LoadingPage, ConfirmDialog } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const empty = () => ({ name: '', email: '', phone: '', address: '', city: '', notes: '', discount: 0 });

export default function CustomersPage() {
  const { fmt } = useSettings();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasDue, setHasDue] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [dueSummary, setDueSummary] = useState(null);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Customer detail + sales
  const [viewCustomer, setViewCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders | due

  // Due payment modal
  const [showPayDue, setShowPayDue] = useState(false);
  const [payDueCustomer, setPayDueCustomer] = useState(null);
  const [payDueAmount, setPayDueAmount] = useState('');
  const [payDueNote, setPayDueNote] = useState('');
  const [payingDue, setPayingDue] = useState(false);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const r = await customerAPI.getAll({ page: pg, limit: 20, search, hasDue: hasDue ? 'true' : '' });
      setCustomers(r.data.customers);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setPage(pg);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const loadDueSummary = async () => {
    try { const r = await customerAPI.getDueSummary(); setDueSummary(r.data); } catch {}
  };

  useEffect(() => { load(1); loadDueSummary(); }, [search, hasDue]);

  const openView = async (c) => {
    setViewCustomer(c);
    setActiveTab('orders');
    setLoadingOrders(true);
    try {
      const r = await orderAPI.getCustomerSales(c._id, { limit: 20 });
      setCustomerOrders(r.data.orders || []);
      setSalesSummary(r.data.summary);
    } catch { } finally { setLoadingOrders(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await customerAPI.update(editing._id, form);
      else await customerAPI.create(form);
      toast.success(editing ? 'Customer updated!' : 'Customer added!');
      setShowForm(false); setEditing(null); load(page); loadDueSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await customerAPI.delete(id); toast.success('Customer deleted'); load(page); loadDueSummary(); }
    catch { toast.error('Delete failed'); }
  };

  const openPayDue = (c, e) => {
    e?.stopPropagation();
    setPayDueCustomer(c);
    setPayDueAmount(c.dueBalance.toString());
    setPayDueNote('');
    setShowPayDue(true);
  };

  const handlePayDue = async () => {
    if (!payDueAmount || parseFloat(payDueAmount) <= 0) return toast.error('Enter a valid amount');
    if (parseFloat(payDueAmount) > payDueCustomer.dueBalance) return toast.error('Cannot exceed due balance');
    setPayingDue(true);
    try {
      const r = await customerAPI.payDue(payDueCustomer._id, { amount: parseFloat(payDueAmount), note: payDueNote, receivedBy: 'Staff' });
      toast.success(`Due payment of ${fmt(parseFloat(payDueAmount))} recorded!`);
      setShowPayDue(false);
      load(page); loadDueSummary();
      // Update viewCustomer if open
      if (viewCustomer?._id === payDueCustomer._id) {
        setViewCustomer(r.data.customer);
        openView(r.data.customer);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
    finally { setPayingDue(false); }
  };

  const tierColor = (spent) => { if (spent >= 50000) return 'text-yellow-500'; if (spent >= 20000) return 'text-surface-400'; return 'text-amber-600'; };
  const tierLabel = (spent) => { if (spent >= 50000) return '🥇 Gold'; if (spent >= 20000) return '🥈 Silver'; return '🥉 Bronze'; };

  const pmtIcon = { cash: '💵', card: '💳', mobile_banking: '📱', due: '📋', partial: '🔀' };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="section-title">Customers</h2>
          <p className="text-xs text-surface-400 mt-0.5">{total} customers</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty()); setShowForm(true); }} className="btn-primary">+ Add Customer</button>
      </div>

      {/* Due summary banner */}
      {dueSummary?.summary?.totalDue > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-xl">⚠</div>
            <div>
              <p className="font-extrabold text-red-700 dark:text-red-400 text-lg">{fmt(dueSummary.summary.totalDue)}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Total outstanding due from {dueSummary.summary.count} customers</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap ml-auto">
            {dueSummary.topDebtors?.map(d => (
              <div key={d._id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-xl text-xs">
                <span className="font-bold text-red-700 dark:text-red-300">{d.name.split(' ')[0]}</span>
                <span className="text-red-500 font-semibold">{fmt(d.dueBalance)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="w-64"><SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, email…" /></div>
        <label className="flex items-center gap-2 text-xs font-semibold text-surface-600 dark:text-surface-400 cursor-pointer px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-red-300 transition-colors">
          <input type="checkbox" checked={hasDue} onChange={e => setHasDue(e.target.checked)} className="w-3.5 h-3.5 accent-red-500" />
          Has Due Balance
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <LoadingPage /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800">
                  <tr>{['Customer','Phone','City','Purchases','Total Spent','Due Balance','Loyalty','Tier',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row cursor-pointer" onClick={() => openView(c)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand-600 dark:text-brand-400 shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-surface-800 dark:text-surface-200">{c.name}</p>
                            {c.email && <p className="text-[10px] text-surface-400">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs">{c.phone || '—'}</td>
                      <td className="table-cell">{c.city || '—'}</td>
                      <td className="table-cell text-center font-bold">{c.totalPurchases}</td>
                      <td className="table-cell font-bold text-brand-500">{fmt(c.totalSpent)}</td>
                      <td className="table-cell">
                        {c.dueBalance > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-red-600 dark:text-red-400">{fmt(c.dueBalance)}</span>
                            <button onClick={e => openPayDue(c, e)}
                              className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold hover:bg-red-200 transition-colors">
                              Pay
                            </button>
                          </div>
                        ) : <span className="text-xs text-emerald-500 font-semibold">✓ Clear</span>}
                      </td>
                      <td className="table-cell"><span className="font-bold text-purple-500">✦ {c.loyaltyPoints}</span></td>
                      <td className="table-cell"><span className={`text-xs font-bold ${tierColor(c.totalSpent)}`}>{tierLabel(c.totalSpent)}</span></td>
                      <td className="table-cell" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(c); setForm(c); setShowForm(true); }}
                            className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-brand-100 hover:text-brand-600 transition-colors">Edit</button>
                          <button onClick={() => setDeleting(c._id)}
                            className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-red-100 hover:text-red-600 transition-colors">Del</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customers.length === 0 && <Empty icon="👥" title="No customers found" subtitle={hasDue ? 'No customers with outstanding dues' : 'Add your first customer'} />}
            <Pagination page={page} pages={pages} total={total} onPage={load} />
          </>
        )}
      </div>

      {/* Customer detail modal */}
      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Profile" size="lg">
        {viewCustomer && (
          <div className="p-5 space-y-4">
            {/* Profile header */}
            <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-brand-500/30">
                {viewCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-surface-900 dark:text-white text-lg">{viewCustomer.name}</p>
                <p className="text-sm text-surface-500">{viewCustomer.phone} {viewCustomer.city && `· ${viewCustomer.city}`}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold text-purple-500">✦ {viewCustomer.loyaltyPoints} pts</span>
                  <span className={`text-xs font-bold ${tierColor(viewCustomer.totalSpent)}`}>{tierLabel(viewCustomer.totalSpent)}</span>
                </div>
              </div>
              {viewCustomer.dueBalance > 0 && (
                <button onClick={() => openPayDue(viewCustomer)}
                  className="btn-danger text-xs">
                  Collect Due {fmt(viewCustomer.dueBalance)}
                </button>
              )}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Total Orders', value: salesSummary?.totalOrders ?? viewCustomer.totalPurchases, color: 'text-brand-500' },
                { label: 'Total Paid', value: fmt(salesSummary?.totalSpent ?? viewCustomer.totalSpent), color: 'text-emerald-500' },
                { label: 'Total Due Given', value: fmt(salesSummary?.totalDue ?? viewCustomer.totalDue), color: 'text-orange-500' },
                { label: 'Remaining Due', value: fmt(viewCustomer.dueBalance), color: viewCustomer.dueBalance > 0 ? 'text-red-500' : 'text-emerald-500' },
              ].map((s, i) => (
                <div key={i} className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-surface-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-surface-100 dark:border-surface-800">
              {['orders', 'due_history'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold transition-colors capitalize border-b-2 -mb-px ${activeTab === tab ? 'border-brand-500 text-brand-500' : 'border-transparent text-surface-400 hover:text-surface-600'}`}>
                  {tab === 'orders' ? `Orders (${salesSummary?.totalOrders ?? 0})` : `Due Payments (${viewCustomer.duePayments?.length ?? 0})`}
                </button>
              ))}
            </div>

            {/* Orders tab */}
            {activeTab === 'orders' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {loadingOrders ? <p className="text-xs text-center py-4 text-surface-400">Loading…</p> : (
                  <>
                    {customerOrders.map(o => (
                      <div key={o._id} className="flex items-center justify-between p-2.5 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span>{pmtIcon[o.paymentMethod] || '💰'}</span>
                          <div>
                            <p className="font-mono font-bold text-brand-500">{o.orderNumber}</p>
                            <p className="text-surface-400">{format(new Date(o.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-surface-800 dark:text-surface-200">{fmt(o.total)}</p>
                          {o.dueAmount > 0 && <p className="text-red-500 font-semibold">Due: {fmt(o.dueAmount)}</p>}
                          {o.paidAmount < o.total && o.dueAmount === 0 && <p className="text-emerald-500 text-[10px]">Paid: {fmt(o.paidAmount)}</p>}
                        </div>
                      </div>
                    ))}
                    {customerOrders.length === 0 && <p className="text-xs text-center py-4 text-surface-400">No orders yet</p>}
                  </>
                )}
              </div>
            )}

            {/* Due history tab */}
            {activeTab === 'due_history' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {viewCustomer.duePayments?.length > 0 ? (
                  [...viewCustomer.duePayments].reverse().map((dp, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">Payment received</p>
                        <p className="text-surface-400">{format(new Date(dp.paidAt), 'dd MMM yyyy, HH:mm')} · {dp.receivedBy}</p>
                        {dp.note && <p className="text-surface-400 italic">{dp.note}</p>}
                      </div>
                      <p className="font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(dp.amount)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center py-4 text-surface-400">No due payments recorded</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Pay Due Modal */}
      <Modal open={showPayDue} onClose={() => setShowPayDue(false)} title="Collect Due Payment" size="sm">
        {payDueCustomer && (
          <div className="p-5 space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{payDueCustomer.name}</p>
              <p className="text-2xl font-extrabold text-red-700 dark:text-red-400 mt-1">{fmt(payDueCustomer.dueBalance)} <span className="text-sm font-medium">outstanding due</span></p>
            </div>
            <div>
              <label className="label">Amount to collect *</label>
              <input type="number" min={1} max={payDueCustomer.dueBalance} value={payDueAmount}
                onChange={e => setPayDueAmount(e.target.value)} className="input text-center text-xl font-bold" />
              {parseFloat(payDueAmount) > 0 && parseFloat(payDueAmount) <= payDueCustomer.dueBalance && (
                <p className="text-xs text-surface-400 text-center mt-1">
                  Remaining after payment: <span className="font-bold text-red-500">{fmt(payDueCustomer.dueBalance - parseFloat(payDueAmount))}</span>
                </p>
              )}
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input value={payDueNote} onChange={e => setPayDueNote(e.target.value)} className="input" placeholder="e.g. Cash payment on 18 March" />
            </div>
            <div className="flex gap-2 pt-1 border-t border-surface-100 dark:border-surface-800">
              <button onClick={() => setShowPayDue(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handlePayDue} disabled={payingDue || !payDueAmount || parseFloat(payDueAmount) <= 0}
                className="btn-primary flex-1 justify-center disabled:opacity-60 shadow-lg shadow-brand-500/30">
                {payingDue ? 'Processing…' : `✓ Collect ${fmt(parseFloat(payDueAmount) || 0)}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="sm">
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">City</label>
              <input value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Address</label>
            <input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Discount (%)</label>
            <input type="number" min={0} max={100} value={form.discount || 0} onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))} className="input" />
          </div>
          <div className="flex gap-2 justify-end pt-1 border-t border-surface-100 dark:border-surface-800">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Update' : 'Add Customer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)}
        title="Delete Customer" message="This will remove the customer. Orders will be kept." confirmText="Delete" danger />
    </div>
  );
}
