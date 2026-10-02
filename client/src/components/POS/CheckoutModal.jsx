import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineBanknotes, 
  HiOutlineCreditCard, 
  HiOutlineDevicePhoneMobile, 
  HiOutlineTicket, 
  HiOutlineArrowsRightLeft,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: <HiOutlineBanknotes className="text-xl" /> },
  { id: 'card', label: 'Card / POS', icon: <HiOutlineCreditCard className="text-xl" /> },
  { id: 'mobile_banking', label: 'bKash / Nagad', icon: <HiOutlineDevicePhoneMobile className="text-xl" /> },
  { id: 'partial', label: 'Partial Pay', icon: <HiOutlineArrowsRightLeft className="text-xl" />, needsCustomer: true },
  { id: 'due', label: 'Full Due', icon: <HiOutlineTicket className="text-xl" />, needsCustomer: true },
];

export default function CheckoutModal({
  open,
  onClose,
  total,
  cart,
  customer,
  paymentMethod,
  setPaymentMethod,
  cashPaid,
  setCashPaid,
  partialPaid,
  setPartialPaid,
  cashChange,
  partialDue,
  processingOrder,
  onConfirmCheckout,
  canCheckout,
  fmt,
}) {
  if (!open) return null;

  const needsCustomer = ['due', 'partial'].includes(paymentMethod);
  const roundedTotal = Math.ceil(total);

  // Quick cash tender helper buttons
  const quickCashOptions = [
    { label: 'Exact', value: roundedTotal },
    { label: `+৳100`, value: roundedTotal + 100 },
    { label: `+৳500`, value: roundedTotal + 500 },
    { label: `+৳1,000`, value: roundedTotal + 1000 },
    { label: `৳${Math.ceil(roundedTotal / 500) * 500 || 500}`, value: Math.ceil(roundedTotal / 500) * 500 || 500 },
    { label: `৳${Math.ceil(roundedTotal / 1000) * 1000 || 1000}`, value: Math.ceil(roundedTotal / 1000) * 1000 || 1000 },
  ].filter((v, idx, arr) => arr.findIndex((t) => t.value === v.value) === idx);

  const modalJSX = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-200 dark:border-surface-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-150 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-850/60">
          <div>
            <h3 className="font-black text-base text-surface-900 dark:text-white">
              Complete Sale Payment
            </h3>
            <p className="text-xs text-surface-400">
              Select payment method & collect customer funds
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 pos-scroll">
          {/* Order Quick Total Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-purple-500/10 border border-brand-500/25 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-extrabold text-surface-500 uppercase tracking-wider">
                Total Payable Amount
              </p>
              <p className="text-3xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight tabular-nums mt-0.5">
                {fmt(total)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-surface-700 dark:text-surface-200 block">
                {cart.reduce((s, i) => s + i.quantity, 0)} items in sale
              </span>
              <span className="text-[11px] text-surface-400 mt-0.5 block">
                {customer ? customer.name : 'Walk-in Customer'}
              </span>
            </div>
          </div>

          {/* Customer alert if needed */}
          {needsCustomer && !customer && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
              <HiOutlineExclamationTriangle className="text-lg shrink-0 text-amber-600" />
              <span>
                <strong>Customer Required:</strong> Please attach a customer account to issue credit or partial payment.
              </span>
            </div>
          )}

          {/* Payment Method Selector Grid */}
          <div>
            <label className="text-xs font-extrabold text-surface-700 dark:text-surface-200 uppercase tracking-wider block mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 select-none ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/25 font-bold shadow-sm scale-102'
                        : 'border-surface-200 dark:border-surface-700/80 hover:border-surface-300 text-surface-600 dark:text-surface-400 bg-white dark:bg-surface-800'
                    }`}
                  >
                    <span className={isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400'}>
                      {m.icon}
                    </span>
                    <span className="text-[11px] leading-tight font-bold">
                      {m.label}
                    </span>
                    {m.needsCustomer && (
                      <span className="text-[8px] font-extrabold text-amber-500 uppercase px-1 py-0.2 rounded bg-amber-500/10">
                        Credit
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tender Interface */}
          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-850/60 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-surface-700 dark:text-surface-200">
                  Cash Received from Customer
                </label>
                <span className="text-xs font-mono text-surface-400 font-bold">
                  Total: {fmt(total)}
                </span>
              </div>

              {/* Cash Input */}
              <div className="relative">
                <input
                  type="number"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  placeholder={total.toFixed(0)}
                  className="input text-center text-2xl font-black font-mono tracking-wider py-3.5 rounded-xl border-surface-300 dark:border-surface-700"
                  autoFocus
                />
              </div>

              {/* Quick Cash helper buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setCashPaid(String(opt.value))}
                    className="px-3 py-1.5 rounded-xl text-xs font-black font-mono bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-400 hover:bg-brand-50/30 text-surface-700 dark:text-surface-200 transition-all active:scale-95 shadow-2xs"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Change calculation display */}
              {cashChange > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-400 flex items-center justify-between font-mono"
                >
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Change to Return:
                  </span>
                  <span className="text-2xl font-black tabular-nums">{fmt(cashChange)}</span>
                </motion.div>
              )}

              {parseFloat(cashPaid) > 0 && parseFloat(cashPaid) < total && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex justify-between font-mono">
                  <span>Short amount:</span>
                  <span>{fmt(total - parseFloat(cashPaid))}</span>
                </div>
              )}
            </div>
          )}

          {/* Partial Payment Interface */}
          {paymentMethod === 'partial' && (
            <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-850/60 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <label className="text-xs font-extrabold text-surface-700 dark:text-surface-200">
                Amount Paid Today (Advance / Cash)
              </label>
              <input
                type="number"
                min="1"
                max={total - 1}
                value={partialPaid}
                onChange={(e) => setPartialPaid(e.target.value)}
                placeholder="Enter paid amount"
                className="input text-center text-xl font-black font-mono py-2.5 rounded-xl"
                autoFocus
              />

              {parseFloat(partialPaid) > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex justify-between text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    <span>Paid Today:</span>
                    <span>{fmt(parseFloat(partialPaid))}</span>
                  </div>
                  {partialDue > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex justify-between text-xs font-black text-rose-700 dark:text-rose-400 font-mono">
                      <span>Remaining Customer Due:</span>
                      <span>{fmt(partialDue)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full Due Notice */}
          {paymentMethod === 'due' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs text-rose-800 dark:text-rose-300">
              <div className="flex justify-between font-black text-sm font-mono">
                <span>Total Due Amount to Record:</span>
                <span>{fmt(total)}</span>
              </div>
              <p className="text-[11px] text-surface-500 font-medium">
                This full invoice amount will be added to the customer's outstanding balance report.
              </p>
            </div>
          )}

          {/* Customer Attachment Info */}
          {customer && (
            <div className="p-3 rounded-2xl bg-surface-50 dark:bg-surface-850/60 border border-surface-200/70 dark:border-surface-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 text-sm">
                  <HiOutlineUser />
                </span>
                <div>
                  <span className="font-black text-surface-900 dark:text-white block">
                    {customer.name}
                  </span>
                  <span className="text-surface-400 font-mono text-[10px]">{customer.phone}</span>
                </div>
              </div>
              {customer.dueBalance > 0 && (
                <span className="text-rose-500 font-black font-mono text-[11px]">
                  Existing Due: {fmt(customer.dueBalance)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-150 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-850/60 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center py-3 text-xs font-bold rounded-xl"
          >
            Cancel (Esc)
          </button>
          <button
            type="button"
            onClick={onConfirmCheckout}
            disabled={processingOrder || !canCheckout}
            className="btn-primary flex-1 justify-center py-3 text-sm font-black rounded-xl shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingOrder ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Completing Sale…</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <HiOutlineCheck className="w-4 h-4" />
                <span>Confirm & Print ({fmt(total)})</span>
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
}
