import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { activityAPI } from '../api';
import { Badge, LoadingPage, EmptyState, Pagination, Modal, StatCard } from '../components/UI';
import { toast } from 'sonner';
import {
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCommandLine,
  HiOutlineEye,
  HiOutlineDocumentMagnifyingGlass,
} from 'react-icons/hi2';

const ACTION_COLORS = {
  LOGIN: 'green',
  LOGIN_FAILED: 'red',
  LOGOUT: 'gray',
  ORDER_CREATED: 'pink',
  ORDER_REFUNDED: 'red',
  ORDER_CANCELLED: 'yellow',
  PRODUCT_CREATED: 'blue',
  PRODUCT_UPDATED: 'purple',
  PRODUCT_DELETED: 'red',
  STOCK_UPDATED: 'blue',
  CUSTOMER_CREATED: 'green',
  CUSTOMER_UPDATED: 'purple',
  CUSTOMER_DELETED: 'red',
  CUSTOMER_DUE_PAID: 'green',
  SUPPLIER_CREATED: 'blue',
  SUPPLIER_UPDATED: 'purple',
  SUPPLIER_DELETED: 'red',
  SUPPLIER_PURCHASE: 'pink',
  USER_CREATED: 'green',
  USER_UPDATED: 'purple',
  USER_DELETED: 'red',
  SETTINGS_UPDATED: 'yellow',
  EXPENSE_CREATED: 'yellow',
  EXPENSE_UPDATED: 'purple',
  EXPENSE_DELETED: 'red',
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await activityAPI.getAll({
        page,
        limit: 20,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        search: search || undefined,
      });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await activityAPI.getStats();
      setStats(res.data.stats);
    } catch {
      // stats optional
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setEntityFilter('');
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-500 text-xl font-bold">
              <HiOutlineShieldCheck />
            </span>
            <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">
              Audit & Activity Trail
            </h2>
          </div>
          <p className="text-xs text-surface-400 mt-1">
            Real-time security log of all POS transactions, inventory modifications, and user events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Refresh logs"
          >
            <HiOutlineArrowPath className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Activities (Last 7 Days)"
            value={stats.last7DaysCount?.toLocaleString() || '0'}
            icon={<HiOutlineClock />}
            color="brand"
          />
          <StatCard
            title="Total Logged Events"
            value={total.toLocaleString()}
            icon={<HiOutlineCommandLine />}
            color="blue"
          />
          <StatCard
            title="Active Operations"
            value={stats.actionBreakdown?.length?.toString() || '0'}
            icon={<HiOutlineShieldCheck />}
            color="emerald"
          />
          <StatCard
            title="Active Operators"
            value={stats.userBreakdown?.length?.toString() || '0'}
            icon={<HiOutlineUser />}
            color="purple"
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search descriptions, users, IPs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs py-2"
            />
            <span className="absolute left-3 top-2.5 text-surface-400 text-sm">
              <HiOutlineDocumentMagnifyingGlass />
            </span>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="input text-xs py-2 w-44"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">User Logins</option>
            <option value="LOGIN_FAILED">Failed Logins</option>
            <option value="ORDER_CREATED">Orders Created</option>
            <option value="ORDER_REFUNDED">Orders Refunded</option>
            <option value="PRODUCT_CREATED">Product Created</option>
            <option value="PRODUCT_UPDATED">Product Updated</option>
            <option value="STOCK_UPDATED">Stock Adjustments</option>
            <option value="CUSTOMER_DUE_PAID">Due Payments</option>
            <option value="EXPENSE_CREATED">Expenses Created</option>
            <option value="USER_CREATED">Staff Management</option>
            <option value="SETTINGS_UPDATED">Settings Changed</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="input text-xs py-2 w-36"
          >
            <option value="">All Entities</option>
            <option value="Order">Orders</option>
            <option value="Product">Products</option>
            <option value="Customer">Customers</option>
            <option value="Supplier">Suppliers</option>
            <option value="Expense">Expenses</option>
            <option value="User">Staff</option>
            <option value="Auth">Security/Auth</option>
          </select>

          {(search || actionFilter || entityFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        {loading && logs.length === 0 ? (
          <LoadingPage />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No activity logs found"
            description="Audit events will automatically populate as actions are performed on the POS."
            icon="🛡️"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-500 uppercase font-black tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">IP / Client</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 font-medium">
                {logs.map((log) => {
                  const color = ACTION_COLORS[log.action] || 'gray';
                  const date = new Date(log.createdAt);
                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Badge variant={color} dot>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-surface-800 dark:text-surface-200 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-[10px]">
                            {log.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                          <span className="font-semibold text-surface-700 dark:text-surface-300">
                            {log.userName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.entityType ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-semibold">
                            {log.entityType}
                          </span>
                        ) : (
                          <span className="text-surface-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-surface-400">
                        {log.ip || 'Local'}
                      </td>
                      <td className="py-3 px-4 text-surface-500 whitespace-nowrap">
                        <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-surface-400">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn-ghost p-1.5 text-surface-400 hover:text-brand-500 rounded-lg text-sm"
                          title="View metadata"
                        >
                          <HiOutlineEye />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="p-4 border-t border-surface-100 dark:border-surface-800">
            <Pagination
              currentPage={page}
              totalPages={pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Details"
        size="md"
      >
        {selectedLog && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
              <div className="space-y-1">
                <Badge variant={ACTION_COLORS[selectedLog.action] || 'gray'} dot>
                  {selectedLog.action}
                </Badge>
                <p className="font-bold text-sm text-surface-900 dark:text-white mt-2">
                  {selectedLog.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-surface-600 dark:text-surface-300">
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">User</span>
                <span className="font-semibold text-surface-800 dark:text-surface-100">{selectedLog.userName}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Entity Type</span>
                <span className="font-semibold text-surface-800 dark:text-surface-100">{selectedLog.entityType || 'None'}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Client IP</span>
                <span className="font-mono text-surface-800 dark:text-surface-100">{selectedLog.ip || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[10px] uppercase font-bold">Date & Time</span>
                <span className="text-surface-800 dark:text-surface-100">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="mt-4">
                <span className="text-surface-400 block text-[10px] uppercase font-bold mb-1.5">
                  Payload & Context Metadata
                </span>
                <pre className="p-3 bg-surface-950 text-surface-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-surface-800">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-secondary py-1.5 px-4 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
