import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, SearchInput, Pagination, Empty, LoadingPage } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

const statusMap = { completed: 'green', pending: 'yellow', refunded: 'blue', cancelled: 'red' };
const pmtMap = { cash: '💵', card: '💳', mobile_banking: '📱', mixed: '🔀' };

export default function OrdersPage() {
  const { fmt, settings } = useSettings();
  const { can } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const r = await orderAPI.getAll({ page: pg, limit: 20, search, status });
      setOrders(r.data.orders);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setPage(pg);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [search, status]);

  const printReceipt = (o) => {
    const doc = new jsPDF({ format: [80, 200], unit: 'mm' });
    let y = 8;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(settings.storeName, 40, y, { align: 'center' }); y += 5;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    if (settings.storeAddress) { doc.text(settings.storeAddress, 40, y, { align: 'center' }); y += 4; }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text(`#${o.orderNumber}`, 5, y);
    doc.text(format(new Date(o.createdAt), 'dd/MM/yy HH:mm'), 75, y, { align: 'right' }); y += 4;
    doc.text(`Customer: ${o.customerName}`, 5, y); y += 4;
    doc.line(5, y, 75, y); y += 4;
    doc.setFont('helvetica', 'normal');
    o.items.forEach(item => {
      doc.text(`${item.name} (${item.size}) x${item.quantity}`, 5, y); y += 3.5;
      doc.text(`  BDT ${item.price}`, 5, y);
      doc.text(`BDT ${item.total.toFixed(0)}`, 75, y, { align: 'right' }); y += 5;
    });
    doc.line(5, y, 75, y); y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 5, y); doc.text(fmt(o.total), 75, y, { align: 'right' }); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(settings.receiptFooter || 'Thank you!', 40, y, { align: 'center' });
    doc.save(`receipt-${o.orderNumber}.pdf`);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="section-title">Orders</h2>
          <p className="text-xs text-surface-400 mt-0.5">{total} orders total</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="w-64"><SearchInput value={search} onChange={setSearch} placeholder="Search order #, customer…" /></div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input w-36">
          <option value="">All Status</option>
          {['completed','pending','refunded','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingPage /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800">
                  <tr>
                    {['Order #','Date','Customer','Items','Payment','Status','Total',''].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <motion.tr key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row cursor-pointer" onClick={() => setSelected(o)}>
                      <td className="table-cell">
                        <span className="font-mono text-xs font-bold text-brand-500">{o.orderNumber}</span>
                      </td>
                      <td className="table-cell text-xs">{format(new Date(o.createdAt), 'dd MMM yy, HH:mm')}</td>
                      <td className="table-cell">
                        <p className="font-medium text-xs text-surface-800 dark:text-surface-200">{o.customerName}</p>
                        {o.cashierName && <p className="text-[10px] text-surface-400">by {o.cashierName}</p>}
                      </td>
                      <td className="table-cell text-center">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td className="table-cell text-center text-base">{pmtMap[o.paymentMethod]}</td>
                      <td className="table-cell">
                        <Badge variant={statusMap[o.status]} dot>{o.status}</Badge>
                      </td>
                      <td className="table-cell font-extrabold text-brand-500">{fmt(o.total)}</td>
                      <td className="table-cell">
                        <button onClick={e => { e.stopPropagation(); printReceipt(o); }}
                          className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-brand-100 hover:text-brand-600 transition-colors">
                          PDF
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && <Empty icon="◎" title="No orders yet" subtitle="Completed sales will appear here" />}
            <Pagination page={page} pages={pages} total={total} onPage={load} />
          </>
        )}
      </div>

      {/* Order detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.orderNumber}`} size="md">
        {selected && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-surface-400 mb-1">Customer</p>
                <p className="font-bold text-surface-800 dark:text-surface-200">{selected.customerName}</p>
              </div>
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-surface-400 mb-1">Date</p>
                <p className="font-bold text-surface-800 dark:text-surface-200">{format(new Date(selected.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-surface-400 mb-1">Payment</p>
                <p className="font-bold text-surface-800 dark:text-surface-200 capitalize">{selected.paymentMethod?.replace('_', ' ')}</p>
              </div>
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-surface-400 mb-1">Cashier</p>
                <p className="font-bold text-surface-800 dark:text-surface-200">{selected.cashierName}</p>
              </div>
            </div>

            <div>
              <p className="label">Items</p>
              <div className="space-y-1.5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👟</span>
                      <div>
                        <p className="font-semibold text-surface-800 dark:text-surface-200">{item.name}</p>
                        <p className="text-surface-400">Size {item.size} · {item.color} · ×{item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-brand-500">{fmt(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-surface-500"><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
              {selected.discountAmount > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Discount</span><span>-{fmt(selected.discountAmount)}</span></div>}
              {selected.taxAmount > 0 && <div className="flex justify-between text-surface-500"><span>{settings.taxName}</span><span>{fmt(selected.taxAmount)}</span></div>}
              <div className="flex justify-between font-extrabold text-sm text-surface-900 dark:text-white border-t border-surface-200 dark:border-surface-700 pt-1.5 mt-1"><span>Total</span><span className="text-brand-500">{fmt(selected.total)}</span></div>
              {selected.paymentDetails?.change > 0 && (
                <div className="flex justify-between text-surface-500"><span>Change</span><span>{fmt(selected.paymentDetails.change)}</span></div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              {can(['admin', 'manager']) && selected.status === 'completed' && (
                <button onClick={async () => { await orderAPI.updateStatus(selected._id, 'refunded'); toast.success('Marked as refunded'); setSelected(null); load(page); }}
                  className="btn-secondary text-xs">Mark Refunded</button>
              )}
              <button onClick={() => printReceipt(selected)} className="btn-primary text-xs">⬇ Download Receipt</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
