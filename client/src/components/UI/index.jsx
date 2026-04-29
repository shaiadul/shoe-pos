import { motion, AnimatePresence } from 'framer-motion';

/* ── Modal ─────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-7xl' };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`${sizes[size]} w-full bg-white dark:bg-surface-900 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 dark:border-surface-800/50`}
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-surface-100 dark:border-surface-800">
              <h2 className="font-black text-surface-950 dark:text-white text-xl tracking-tight">{title}</h2>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl flex items-center justify-center text-surface-400 hover:text-surface-950 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-all text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[80vh]">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Badge ─────────────────────────────────────────── */
const badgeVariants = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  pink: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400',
  gray: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
};

export function Badge({ variant = 'gray', children, dot }) {
  return (
    <span className={`badge ${badgeVariants[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />}
      {children}
    </span>
  );
}

/* ── Spinner ───────────────────────────────────────── */
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return <div className={`${s} rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin`} />;
}

/* ── Loading overlay ───────────────────────────────── */
export function LoadingPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-surface-400 font-medium animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────── */
export function Empty({ icon = '◎', title = 'No data found', subtitle = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4 opacity-30">{icon}</div>
      <p className="font-bold text-surface-600 dark:text-surface-400 text-lg mb-1">{title}</p>
      {subtitle && <p className="text-sm text-surface-400 mb-4">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ── Pagination ────────────────────────────────────── */
export function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  const items = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      items.push(i);
    } else if (items[items.length - 1] !== '…') {
      items.push('…');
    }
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-800">
      <p className="text-xs text-surface-400">Page {page} of {pages} · {total} total</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ‹ Prev
        </button>
        {items.map((item, i) => item === '…' ? (
          <span key={i} className="px-1 text-xs text-surface-400">…</span>
        ) : (
          <button key={i} onClick={() => onPage(item)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${item === page ? 'bg-brand-500 text-white' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
            {item}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next ›
        </button>
      </div>
    </div>
  );
}

/* ── Confirm dialog ────────────────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6">
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Stat card ─────────────────────────────────────── */
export function StatCard({ title, value, icon, trend, trendLabel, color = 'brand', sub }) {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-500',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-500',
  };
  const isPositive = parseFloat(trend) >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="card p-6 flex flex-col gap-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-surface-900 transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${colors[color]}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-surface-950 dark:text-white tracking-tight">{value}</p>
        <p className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest mt-1">{title}</p>
        {sub && <p className="text-xs text-surface-400 mt-1 font-medium">{sub}</p>}
        {trendLabel && <p className="text-xs text-surface-400 mt-1 font-medium italic opacity-70">{trendLabel}</p>}
      </div>
    </motion.div>
  );
}

/* ── Search Input ──────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search…', icon }) {
  return (
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 transition-colors group-focus-within:text-brand-500">
        {icon || '⌕'}
      </span>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-11 pr-11 bg-surface-50/50 border-surface-200/60 focus:bg-white"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all text-sm">×</button>
      )}
    </div>
  );
}

/* ── Select ────────────────────────────────────────── */
export function Select({ value, onChange, options, placeholder, className = '', icon }) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input appearance-none cursor-pointer pr-10 ${icon ? 'pl-10' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none text-xs">
        ▼
      </span>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────── */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function SkeletonGrid({ count = 8, className = '' }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-3 space-y-3 border-none shadow-sm">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="pt-2 border-t border-surface-50 dark:border-surface-800 flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
