import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenseAPI } from '../api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Badge, LoadingPage, EmptyState, Pagination, Modal, StatCard, FormError } from '../components/UI';
import { expenseSchema, validateWithZod } from '../utils/validation';
import toast from 'react-hot-toast';
import {
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCalendar,
  HiOutlineArrowDownTray,
  HiOutlineTag,
} from 'react-icons/hi2';

const CATEGORIES = [
  'Rent',
  'Utilities',
  'Salary',
  'Inventory',
  'Maintenance',
  'Marketing',
  'Supplies',
  'Transport',
  'Other',
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile', label: 'Mobile Banking' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  Rent: 'purple',
  Utilities: 'blue',
  Salary: 'green',
  Inventory: 'pink',
  Maintenance: 'yellow',
  Marketing: 'blue',
  Supplies: 'gray',
  Transport: 'purple',
  Other: 'gray',
};

const initialForm = {
  title: '',
  amount: '',
  category: 'Utilities',
  paymentMethod: 'cash',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  receiptNumber: '',
};

export default function ExpensesPage() {
  const { fmt } = useSettings();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await expenseAPI.getAll({
        page,
        limit: 15,
        search: search || undefined,
        category: categoryFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setExpenses(res.data.expenses || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await expenseAPI.getSummary();
      setSummary(res.data.summary);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, categoryFilter, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData(initialForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      notes: expense.notes || '',
      receiptNumber: expense.receiptNumber || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateWithZod(expenseSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      toast.error(validation.firstMessage);
      return;
    }
    setFormErrors({});
    setSubmitting(true);
    try {
      if (editingExpense) {
        await expenseAPI.update(editingExpense._id, formData);
        toast.success('Expense updated');
      } else {
        await expenseAPI.create(formData);
        toast.success('Expense recorded');
      }
      setModalOpen(false);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setFormErrors(err.response.data.fieldErrors);
      }
      toast.error(err.response?.data?.message || 'Error saving expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseAPI.delete(id);
      toast.success('Expense deleted');
      setDeleteConfirmId(null);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Amount', 'Payment Method', 'Receipt #', 'Recorded By', 'Notes'];
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.paymentMethod,
      e.receiptNumber || '',
      e.recordedBy?.name || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Expenses exported to CSV');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-500 text-xl font-bold">
              <HiOutlineBanknotes />
            </span>
            <h2 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">
              Expense Management
            </h2>
          </div>
          <p className="text-xs text-surface-400 mt-1">
            Track overhead costs, inventory purchases, store maintenance, and operational expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Export to CSV"
          >
            <HiOutlineArrowDownTray />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 font-bold"
          >
            <HiOutlinePlus />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Expenses"
          value={fmt(summary?.todayTotal || 0)}
          icon={<HiOutlineBanknotes />}
          color="pink"
        />
        <StatCard
          title="This Month's Expenses"
          value={fmt(summary?.monthTotal || 0)}
          icon={<HiOutlineCalendar />}
          color="purple"
        />
        <StatCard
          title="Monthly Records"
          value={summary?.monthCount?.toString() || '0'}
          icon={<HiOutlineTag />}
          color="blue"
        />
        <StatCard
          title="Top Category (Month)"
          value={summary?.categoryBreakdown?.[0]?._id || 'None'}
          subtitle={summary?.categoryBreakdown?.[0] ? fmt(summary.categoryBreakdown[0].total) : '$0'}
          icon={<HiOutlineBanknotes />}
          color="emerald"
        />
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-xs py-2"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input text-xs py-2 w-36"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 px-2"
            title="Start Date"
          />
          <span className="text-surface-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 px-2"
            title="End Date"
          />
        </div>

        {(search || categoryFilter || startDate || endDate) && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-xs text-brand-500 hover:text-brand-600 font-semibold px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading && expenses.length === 0 ? (
          <LoadingPage />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Record store overhead, maintenance, and operating costs to track overall profitability."
            icon="💸"
            action={
              <button onClick={openCreateModal} className="btn-primary text-xs py-2 px-4">
                Record First Expense
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-500 uppercase font-black tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Expense Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 font-medium">
                {expenses.map((expense) => {
                  const color = CATEGORY_COLORS[expense.category] || 'gray';
                  return (
                    <tr
                      key={expense._id}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-surface-500 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-surface-900 dark:text-white">
                          {expense.title}
                        </div>
                        {expense.notes && (
                          <div className="text-[11px] text-surface-400 truncate max-w-xs">
                            {expense.notes}
                          </div>
                        )}
                        {expense.receiptNumber && (
                          <div className="text-[10px] text-surface-400 font-mono">
                            Ref: #{expense.receiptNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={color} dot>
                          {expense.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-black text-rose-500 text-sm whitespace-nowrap">
                        -{fmt(expense.amount)}
                      </td>
                      <td className="py-3 px-4 capitalize text-surface-600 dark:text-surface-400">
                        {expense.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-surface-500">
                        {expense.recordedBy?.name || 'Staff'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="btn-ghost p-1.5 text-surface-400 hover:text-brand-500 rounded-lg text-sm"
                          title="Edit"
                        >
                          <HiOutlinePencilSquare />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => setDeleteConfirmId(expense._id)}
                            className="btn-ghost p-1.5 text-surface-400 hover:text-red-500 rounded-lg text-sm"
                            title="Delete"
                          >
                            <HiOutlineTrash />
                          </button>
                        )}
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

      {/* Add / Edit Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
              Expense Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Shop Rent, Electricity Bill, Packaging Bags"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (formErrors.title) setFormErrors((err) => ({ ...err, title: undefined }));
              }}
              className={`input text-xs ${formErrors.title ? 'border-rose-500 focus:border-rose-500' : ''}`}
            />
            <FormError message={formErrors.title} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (formErrors.amount) setFormErrors((err) => ({ ...err, amount: undefined }));
                }}
                className={`input text-xs ${formErrors.amount ? 'border-rose-500 focus:border-rose-500' : ''}`}
              />
              <FormError message={formErrors.amount} />
            </div>
            <div>
              <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input text-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <FormError message={formErrors.category} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="input text-xs"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
              Receipt / Invoice Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. REC-2026-081"
              value={formData.receiptNumber}
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-surface-700 dark:text-surface-300 mb-1">
              Notes & Description
            </label>
            <textarea
              rows="2"
              placeholder="Optional details or context..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input text-xs resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-surface-100 dark:border-surface-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary py-2 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2 px-5 text-xs font-bold"
            >
              {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="p-6 space-y-4 text-xs">
          <p className="text-surface-600 dark:text-surface-300">
            Are you sure you want to permanently delete this expense record? This action cannot be undone and will be recorded in the audit trail.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              className="btn-danger py-1.5 px-3 text-xs"
            >
              Delete Expense
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
