import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard', '/pos': 'Point of Sale', '/products': 'Products',
  '/orders': 'Orders', '/customers': 'Customers', '/suppliers': 'Suppliers',
  '/reports': 'Reports', '/settings': 'Settings', '/users': 'Users',
};

export default function Topbar({ onMenuToggle }) {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'SoleMate POS';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="h-14 flex items-center px-4 gap-4 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 shrink-0">
      {/* Menu button (mobile) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-lg"
      >
        ☰
      </button>

      {/* Page title */}
      <h1 className="font-extrabold text-surface-900 dark:text-white text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Date/time */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 font-mono bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-lg">
          <span>{dateStr}</span>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <span className="text-brand-500 font-semibold">{timeStr}</span>
        </div>

        {/* Quick POS link */}
        {location.pathname !== '/pos' && (
          <Link to="/pos" className="hidden sm:flex btn-primary py-1.5 px-3 text-xs">
            <span>⊕</span> POS
          </Link>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-base"
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? '☀' : '☾'}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-brand-500/40">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
