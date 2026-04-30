import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { LoadingPage, StatCard } from '../components/UI';
import toast from 'react-hot-toast';
import { HiOutlineBanknotes, HiOutlineShoppingCart, HiOutlinePresentationChartLine, HiOutlineTrophy } from 'react-icons/hi2';

const CustomTooltip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="font-bold text-surface-500 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {fmt ? fmt(p.value) : p.value}</p>)}
    </div>
  );
};

export default function ReportsPage() {
  const { fmt } = useSettings();
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [reportRes, dashRes] = await Promise.all([
        dashboardAPI.getSalesReport({ period }),
        dashboardAPI.get(),
      ]);
      setReport(reportRes.data.report);
      setSummary(dashRes.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [period]);

  const exportCSV = () => {
    const rows = [['Period', 'Revenue', 'Orders', 'Items', 'Avg Order']];
    report.forEach(r => rows.push([r._id, r.revenue.toFixed(0), r.orders, r.items || 0, r.avgOrder?.toFixed(0) || 0]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sales-report-${period}.csv`; a.click();
    toast.success('Report exported!');
  };

  const totalRevenue = report.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = report.reduce((s, r) => s + r.orders, 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="text-xs text-surface-400 mt-0.5">Sales analytics & performance</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border border-surface-200 dark:border-surface-700 rounded-xl p-1">
            {['daily', 'monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${period === p ? 'bg-brand-500 text-white' : 'text-surface-500 hover:text-brand-500'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-secondary text-xs">⬇ Export CSV</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Period Revenue" value={fmt(totalRevenue)} icon={<HiOutlineBanknotes />} color="brand" />
        <StatCard title="Total Orders" value={totalOrders} icon={<HiOutlineShoppingCart />} color="blue" />
        <StatCard title="Avg. Order Value" value={fmt(avgOrder)} icon={<HiOutlinePresentationChartLine />} color="green" />
        <StatCard title="Best Day Revenue" value={fmt(Math.max(...report.map(r => r.revenue), 0))} icon={<HiOutlineTrophy />} color="orange" />
      </div>

      {loading ? <LoadingPage /> : (
        <>
          {/* Revenue chart */}
          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-5">Revenue — {period === 'daily' ? 'Daily' : 'Monthly'} Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={report.map(r => ({ period: r._id, Revenue: Math.round(r.revenue), Orders: r.orders }))}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip fmt={fmt} />} />
                <Area type="monotone" dataKey="Revenue" stroke="#ec4899" strokeWidth={2.5} fill="url(#rGrad)" dot={false} activeDot={{ r: 5, fill: '#ec4899' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders chart */}
          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-5">Orders Count</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={report.map(r => ({ period: r._id, Orders: r.orders }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">Detailed Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800">
                  <tr>{['Period','Revenue','Orders','Items','Avg. Order'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell font-mono font-semibold">{r._id}</td>
                      <td className="table-cell font-bold text-brand-500">{fmt(r.revenue)}</td>
                      <td className="table-cell">{r.orders}</td>
                      <td className="table-cell">{r.items || 0}</td>
                      <td className="table-cell">{fmt(r.avgOrder || 0)}</td>
                    </tr>
                  ))}
                  {report.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-sm text-surface-400">No data for this period</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
