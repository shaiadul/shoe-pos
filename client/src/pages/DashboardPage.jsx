import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { StatCard, LoadingPage, Badge } from '../components/UI';
import { format, parseISO } from 'date-fns';

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="font-bold text-surface-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {fmt ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fmt } = useSettings();

  useEffect(() => {
    dashboardAPI.get()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;

  const { stats, charts } = data || {};

  const chartData7 = (charts?.last7Days || []).map(d => ({
    date: format(parseISO(d._id), 'EEE'),
    Revenue: Math.round(d.total),
    Orders: d.count,
  }));

  const chartData12 = (charts?.last12Months || []).map(d => ({
    month: new Date(d._id.year, d._id.month - 1).toLocaleDateString('en', { month: 'short' }),
    Revenue: Math.round(d.total),
  }));

  const paymentData = (charts?.paymentBreakdown || []).map((p, i) => ({
    name: p._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: Math.round(p.total),
    count: p.count,
    color: COLORS[i],
  }));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Overview</h2>
          <p className="text-xs text-surface-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-surface-500 font-medium">Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <StatCard title="Today's Revenue" value={fmt(stats?.todayRevenue || 0)}
            icon="৳" color="brand" trend={stats?.revenueGrowth}
            trendLabel={`vs yesterday ${fmt(stats?.yesterdayRevenue || 0)}`} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Today's Sales" value={stats?.todaySales || 0}
            icon="🛍" color="blue" sub="Orders completed today" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Monthly Revenue" value={fmt(stats?.monthRevenue || 0)}
            icon="📈" color="green" trend={stats?.monthGrowth}
            trendLabel={`vs last month`} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Low Stock Items" value={stats?.lowStockCount || 0}
            icon="⚠" color={stats?.lowStockCount > 0 ? 'red' : 'green'} sub="Need restocking" />
        </motion.div>
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 7-day area chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">Revenue — Last 7 Days</h3>
              <p className="text-xs text-surface-400 mt-0.5">Daily sales performance</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData7}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip fmt={fmt} />} />
              <Area type="monotone" dataKey="Revenue" stroke="#ec4899" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#ec4899', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-1">Payment Methods</h3>
          <p className="text-xs text-surface-400 mb-5">This month's breakdown</p>
          {paymentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {paymentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip fmt={fmt} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-surface-600 dark:text-surface-400">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-surface-800 dark:text-surface-200">{fmt(p.value)}</span>
                      <span className="text-surface-400 ml-1">({p.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-surface-400 text-center py-10">No data yet</p>
          )}
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly revenue bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-1">Monthly Revenue</h3>
          <p className="text-xs text-surface-400 mb-5">Last 12 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData12}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip fmt={fmt} />} />
              <Bar dataKey="Revenue" fill="#ec4899" radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-1">Top Products</h3>
          <p className="text-xs text-surface-400 mb-4">By units sold</p>
          <div className="space-y-3">
            {(charts?.topProducts || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full transition-all"
                        style={{ width: `${Math.min((p.totalSold / (charts.topProducts[0]?.totalSold || 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-surface-400 font-mono shrink-0">{p.totalSold} sold</span>
                  </div>
                </div>
              </div>
            ))}
            {!charts?.topProducts?.length && <p className="text-sm text-surface-400 text-center py-6">No sales data yet</p>}
          </div>
        </motion.div>
      </div>

      {/* Bottom stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats?.totalProducts || 0, icon: '👟', color: 'text-brand-500' },
          { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: '👥', color: 'text-blue-500' },
          { label: 'Monthly Orders', value: stats?.monthSales || 0, icon: '🛒', color: 'text-emerald-500' },
          { label: 'Avg. Order', value: fmt(stats?.monthSales > 0 ? (stats?.monthRevenue || 0) / stats?.monthSales : 0), icon: '📊', color: 'text-purple-500' },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-surface-400">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
