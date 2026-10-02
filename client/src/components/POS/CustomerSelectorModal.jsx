import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineUser, 
  HiOutlineUserPlus, 
  HiOutlineMagnifyingGlass, 
  HiOutlineXMark, 
  HiOutlineTag, 
  HiOutlineExclamationTriangle,
  HiOutlineCheck
} from 'react-icons/hi2';

export default function CustomerSelectorModal({
  open,
  onClose,
  customer,
  onSelectCustomer,
  onRemoveCustomer,
  customerSearch,
  setCustomerSearch,
  customerResults,
  onAddNewCustomer,
  savingCustomer,
  fmt,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', city: '' });

  if (!open) return null;

  const handleSubmitNew = (e) => {
    e.preventDefault();
    onAddNewCustomer(form, () => {
      setForm({ name: '', phone: '', city: '' });
      setShowAddForm(false);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-500 text-lg">
              <HiOutlineUser />
            </span>
            <div>
              <h3 className="font-bold text-sm text-surface-900 dark:text-white">
                {showAddForm ? 'Add New Customer' : 'Select Customer'}
              </h3>
              <p className="text-[11px] text-surface-400">
                {showAddForm
                  ? 'Enter basic information to register'
                  : 'Assign sale to track loyalty & dues'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!showAddForm ? (
            <>
              {/* Currently Selected Customer */}
              {customer ? (
                <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                      Currently Attached:
                    </span>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                      {customer.name}
                    </h4>
                    <p className="text-xs text-surface-500">{customer.phone || 'No phone provided'}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <HiOutlineTag className="w-3 h-3" /> {customer.loyaltyPoints || 0} pts
                      </span>
                      {customer.dueBalance > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <HiOutlineExclamationTriangle className="w-3 h-3" /> Due:{' '}
                          {fmt(customer.dueBalance)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveCustomer}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-surface-900 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 transition-colors"
                  >
                    Detach
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-xs text-surface-500 flex items-center justify-between">
                  <span>Current customer: <strong className="text-surface-700 dark:text-surface-300">Walk-in Customer</strong></span>
                </div>
              )}

              {/* Customer Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or phone number…"
                  className="input pl-9 pr-4 py-2.5 text-xs"
                  autoFocus
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
                  <HiOutlineMagnifyingGlass />
                </span>
              </div>

              {/* Search Results */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {customerResults.map((c) => {
                  const isSelected = customer?._id === c._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => onSelectCustomer(c)}
                      className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                          : 'border-surface-100 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/60'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                          {c.name}
                          {isSelected && <HiOutlineCheck className="w-3.5 h-3.5 text-brand-500" />}
                        </p>
                        <p className="text-[11px] text-surface-400 font-mono mt-0.5">
                          {c.phone || 'No phone'} {c.city ? `· ${c.city}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">
                          {c.loyaltyPoints || 0} pts
                        </span>
                        {c.dueBalance > 0 && (
                          <span className="text-[10px] font-bold text-rose-500 block">
                            Due: {fmt(c.dueBalance)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {customerSearch && customerResults.length === 0 && (
                  <div className="p-6 text-center text-surface-400 text-xs">
                    <p>No customer found for "{customerSearch}".</p>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          phone: /^\d+$/.test(customerSearch) ? customerSearch : '',
                          name: !/^\d+$/.test(customerSearch) ? customerSearch : '',
                        }));
                        setShowAddForm(true);
                      }}
                      className="mt-2 text-brand-600 dark:text-brand-400 font-bold underline underline-offset-2"
                    >
                      + Create customer "{customerSearch}"
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary w-full justify-center py-2.5 text-xs rounded-xl"
                >
                  <HiOutlineUserPlus className="text-sm" />
                  <span>+ Create New Customer</span>
                </button>
              </div>
            </>
          ) : (
            /* Quick Add Customer Form */
            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div>
                <label className="label">Customer Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tanvir Ahmed"
                  className="input"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="017xxxxxxxx"
                    className="input font-mono"
                  />
                </div>
                <div>
                  <label className="label">City / Area</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Dhaka"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary flex-1 justify-center py-2.5 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="btn-primary flex-1 justify-center py-2.5 text-xs rounded-xl"
                >
                  {savingCustomer ? 'Saving…' : 'Save & Select'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
