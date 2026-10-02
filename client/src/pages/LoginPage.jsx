import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { FormError } from "../components/UI";
import { loginSchema, validateWithZod } from "../utils/validation";
import { toast } from "sonner";
import { HiOutlineShoppingBag, HiOutlineArchiveBox, HiOutlineKey, HiOutlineShieldCheck } from "react-icons/hi2";

export default function LoginPage() {
  const demoAdminEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || "";
  const demoAdminPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "";
  const demoStaffEmail = import.meta.env.VITE_DEMO_STAFF_EMAIL || "";
  const demoStaffPassword = import.meta.env.VITE_DEMO_STAFF_PASSWORD || "";
  const showDemoCredentials = Boolean(demoAdminEmail || demoStaffEmail);

  const [form, setForm] = useState({
    email: demoAdminEmail,
    password: demoAdminPassword,
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e?.preventDefault();
    setGeneralError("");
    const validation = validateWithZod(loginSchema, form);
    if (!validation.success) {
      setErrors(validation.errors);
      setGeneralError(validation.firstMessage);
      toast.error("Validation Error", { description: validation.firstMessage });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!", { description: `Logged in as ${form.email}` });
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
      const errorMsg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Unable to reach server. Please ensure the backend is running."
          : "Login failed. Please verify your credentials.");
      setGeneralError(errorMsg);
      toast.error("Authentication Failed", { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    if (!demoAdminEmail) return;
    setGeneralError("");
    setErrors({});
    setForm({ email: demoAdminEmail, password: demoAdminPassword });
    toast.info("Admin credentials applied", {
      description: demoAdminEmail,
    });
  };

  const demoLogin = (email, password, label) => {
    setGeneralError("");
    setErrors({});
    setForm({ email, password });
    toast.info(`${label} credentials loaded`, {
      description: email,
    });
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

          {/* Demo Credentials Card (Only rendered when configured via VITE_DEMO_* env variables) */}
          {showDemoCredentials && (
            <div className="mt-8 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-800 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
                    <HiOutlineShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold tracking-tight text-surface-900 dark:text-white uppercase">
                    Demo Quick Access
                  </span>
                </div>
                {demoAdminEmail && (
                  <button
                    type="button"
                    onClick={fillAdmin}
                    className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline underline-offset-2 flex items-center gap-1 transition-colors"
                  >
                    <HiOutlineKey className="w-3.5 h-3.5" />
                    Auto-fill Admin
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-surface-950 p-2.5 rounded-xl border border-surface-200/70 dark:border-surface-800/70 mb-3 font-mono">
                <div>
                  <span className="text-surface-400 block text-[10px] uppercase font-sans font-semibold">Email</span>
                  <span className="text-surface-900 dark:text-surface-100 font-bold select-all">{demoAdminEmail || 'Configured via .env'}</span>
                </div>
                <div>
                  <span className="text-surface-400 block text-[10px] uppercase font-sans font-semibold">Password</span>
                  <span className="text-surface-900 dark:text-surface-100 font-bold select-all">{demoAdminPassword ? '••••••••' : 'Configured via .env'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  demoAdminEmail && {
                    label: "Admin Login",
                    email: demoAdminEmail,
                    pass: demoAdminPassword,
                    color: "text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30",
                  },
                  demoStaffEmail && {
                    label: "Staff Login",
                    email: demoStaffEmail,
                    pass: demoStaffPassword,
                    color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30",
                  },
                ].filter(Boolean).map((a) => (
                  <button
                    type="button"
                    key={a.label}
                    onClick={() => demoLogin(a.email, a.pass, a.label)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 ${a.color}`}
                  >
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
