import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@solemate.com', password: 'admin123' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-1/2 bg-surface-950 dark:bg-black flex-col justify-between p-14 relative overflow-hidden"
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(236,72,153,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(236,72,153,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Floating shoe emoji */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [-3, 3, -3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] select-none"
        >
          👟
        </motion.div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-xl shadow-lg shadow-brand-500/50">👟</div>
            <span className="font-extrabold text-white text-xl tracking-tight">SoleMate POS</span>
          </div>
          <p className="text-surface-500 text-sm font-mono">Point of Sale · v2.0</p>
        </div>

        <div className="relative z-10 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              The smartest<br />shoe store POS<br />
              <span className="text-brand-400">ever built.</span>
            </h2>
          </motion.div>
          <p className="text-surface-400 text-sm max-w-sm">
            Manage inventory, process sales, track customers, and grow your business — all from one elegant dashboard.
          </p>
          <div className="flex gap-6 pt-2">
            {['Fast Checkout', 'Live Analytics', 'Multi-role'].map(feat => (
              <div key={feat} className="flex items-center gap-1.5 text-xs text-surface-500">
                <span className="text-brand-500">✓</span> {feat}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-xl">👟</div>
            <span className="font-extrabold text-surface-900 dark:text-white text-xl">SoleMate POS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white mb-1.5">Sign in</h1>
            <p className="text-surface-500 text-sm">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input" placeholder="you@solemate.com"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pr-10" placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm">
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-surface-400 uppercase font-bold tracking-widest text-center mb-3">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@solemate.com', pass: 'admin123', color: 'text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800' },
                { label: 'Manager', email: 'manager@solemate.com', pass: 'manager123', color: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
                { label: 'Staff', email: 'staff@solemate.com', pass: 'staff123', color: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
              ].map(a => (
                <button key={a.label} onClick={() => demoLogin(a.email, a.pass)}
                  className={`py-2 rounded-xl border bg-white dark:bg-surface-900 text-xs font-bold transition-all hover:scale-105 ${a.color}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
