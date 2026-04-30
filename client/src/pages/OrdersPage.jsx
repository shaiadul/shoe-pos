import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, SearchInput, Pagination, Empty, LoadingPage, Select } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

import { 
  HiOutlineCreditCard, 
  HiOutlineBanknotes, 
  HiOutlineDevicePhoneMobile, 
  HiOutlineArrowsRightLeft,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlinePrinter,
  HiOutlineArrowDownTray,
  HiOutlineArchiveBox,
  HiOutlineReceiptRefund
} from 'react-icons/hi2';

const statusMap = { completed: 'green', pending: 'yellow', refunded: 'blue', cancelled: 'red' };
const pmtMap = { 
  cash: <HiOutlineBanknotes />, 
  card: <HiOutlineCreditCard />, 
  mobile_banking: <HiOutlineDevicePhoneMobile />, 
  mixed: <HiOutlineArrowsRightLeft /> 
};

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
          <h2 className="section-title text-2xl font-black tracking-tight">Sales History</h2>
          <p className="text-xs text-surface-400 mt-1 font-medium">{total} orders recorded</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="w-full md:w-64">
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder="Search order #, customer…" 
            icon={<HiOutlineMagnifyingGlass />}
          />
        </div>
        <div className="w-full md:w-40">
          <Select
            value={status}
            onChange={setStatus}
            options={['completed','pending','refunded','cancelled'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            placeholder="All Status"
            icon={<HiOutlineFunnel />}
          />
        </div>
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
                      <td className="table-cell font-black text-brand-500 text-base tracking-tight">{fmt(o.total)}</td>
                      <td className="table-cell">
                        <button onClick={e => { e.stopPropagation(); printReceipt(o); }}
                          className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center">
                          <HiOutlineArrowDownTray />
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
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-xs border border-transparent hover:border-surface-200 dark:hover:border-surface-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xl text-surface-400 shrink-0 overflow-hidden">
                         {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <HiOutlineArchiveBox />}
                      </div>
                      <div>
                        <p className="font-bold text-surface-800 dark:text-surface-200">{item.name}</p>
                        <p className="text-[10px] text-surface-400 font-medium">Size {item.size} · {item.color} · ×{item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-black text-brand-500">{fmt(item.total)}</p>
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
              {can(['admin']) && selected.status === 'completed' && (
                <button onClick={async () => { 
                  if(window.confirm('Mark this order as refunded?')) {
                    await orderAPI.updateStatus(selected._id, 'refunded'); 
                    toast.success('Marked as refunded'); 
                    setSelected(null); 
                    load(page); 
                  }
                }}
                  className="btn-secondary text-xs font-bold text-red-500">Refund Order</button>
              )}
              <button onClick={() => printReceipt(selected)} className="btn-primary text-xs">⬇ Download Receipt</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
