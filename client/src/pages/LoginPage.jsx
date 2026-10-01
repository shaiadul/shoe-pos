import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { FormError } from "../components/UI";
import { loginSchema, validateWithZod } from "../utils/validation";
import toast from "react-hot-toast";
import { HiOutlineShoppingBag, HiOutlineArchiveBox } from "react-icons/hi2";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "admin@solemate.com",
    password: "admin123",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setGeneralError("");
    const validation = validateWithZod(loginSchema, form);
    if (!validation.success) {
      setErrors(validation.errors);
      setGeneralError(validation.firstMessage);
      toast.error(validation.firstMessage);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
      const errorMsg = err.response?.data?.message || "Login failed. Please verify your credentials.";
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (email, password) => {
    setGeneralError("");
    setErrors({});
    setForm({ email, password });
  };

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
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(236,72,153,0.8) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-purple-500/10" />

        {/* Floating shoe emoji */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [-3, 3, -3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] select-none text-brand-500/20"
        >
          <HiOutlineShoppingBag />
        </motion.div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-brand-500/30">
              <HiOutlineArchiveBox />
            </div>
            <span className="font-extrabold text-white text-xl tracking-tight">
              SoleMate POS
            </span>
          </div>
          <p className="text-surface-500 text-sm font-mono">
            Point of Sale · v2.0
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tighter">
              The smartest
              <br />
              shoe store POS
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                ever built.
              </span>
            </h2>
          </motion.div>
          <p className="text-surface-400 text-base max-w-sm leading-relaxed font-medium">
            Manage inventory, process sales, track customers, and grow your
            business — all from one elegant, high-performance dashboard.
          </p>
          <div className="flex gap-6 pt-2">
            {["Fast Checkout", "Live Analytics", "Multi-role"].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-1.5 text-xs text-surface-500"
              >
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
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-xl">
              👟
            </div>
            <span className="font-extrabold text-surface-900 dark:text-white text-xl">
              SoleMate POS
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white mb-1.5">
              Sign in
            </h1>
            <p className="text-surface-500 text-sm">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handle} className="space-y-4">
            {generalError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 shadow-sm"
              >
                <span className="text-base leading-none">⚠️</span>
                <span className="flex-1">{generalError}</span>
              </motion.div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  if (errors.email) setErrors((err) => ({ ...err, email: undefined }));
                }}
                className={`input ${errors.email ? 'border-rose-500 focus:border-rose-500' : ''}`}
                placeholder="you@solemate.com"
              />
              <FormError message={errors.email} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, password: e.target.value }));
                    if (errors.password) setErrors((err) => ({ ...err, password: undefined }));
                  }}
                  className={`input pr-10 ${errors.password ? 'border-rose-500 focus:border-rose-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm"
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              <FormError message={errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-4 text-lg shadow-[0_20px_50px_rgba(236,72,153,0.3)] hover:shadow-[0_20px_50px_rgba(236,72,153,0.5)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 rounded-[1.25rem]"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <span className="text-xl">→</span>
                </span>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-surface-400 uppercase font-bold tracking-widest text-center mb-3">
              Demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Admin",
                  email: "admin@solemate.com",
                  pass: "admin123",
                  color:
                    "text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800",
                },
                {
                  label: "Staff",
                  email: "staff@solemate.com",
                  pass: "staff123",
                  color:
                    "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => demoLogin(a.email, a.pass)}
                  className={`py-2 rounded-xl border bg-white dark:bg-surface-900 text-xs font-bold transition-all hover:scale-105 ${a.color}`}
                >
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
