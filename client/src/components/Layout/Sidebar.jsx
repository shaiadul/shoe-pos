import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { tr } from 'date-fns/locale';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/pos', icon: '🛒', label: 'Point of Sale', highlight: true },
  { to: '/products', icon: '👟', label: 'Inventory' },
  { to: '/orders', icon: '🧾', label: 'Sales History' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/suppliers', icon: '🚚', label: 'Suppliers' },
  { to: '/reports', icon: '📈', label: 'Analytics' },
  { to: '/users', icon: '🛡️', label: 'Staff Management' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  return (
    <>
      <AnimatePresence>
        {/* {open && ( */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={onClose}
          />
        {/* )} */}
      </AnimatePresence>

      <motion.aside
        initial={false}
        // animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-[260px] z-30 flex flex-col
                   bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800
                   lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8 border-b border-surface-100 dark:border-surface-800">
          <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center text-2xl shadow-xl shadow-brand-500/40">
            👟
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg text-surface-950 dark:text-white leading-none tracking-tight truncate">{settings.storeName}</p>
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mt-1 opacity-80">Enterprise POS</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-surface-400 hover:text-surface-600 text-2xl">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${item.highlight ? 'border border-dashed border-brand-300 dark:border-brand-800' : ''}`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Live
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900">
            <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-600 dark:text-brand-300 shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-surface-800 dark:text-surface-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-surface-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-surface-400 hover:text-red-500 transition-colors text-lg ml-auto"
              title="Logout"
            >⏻</button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
