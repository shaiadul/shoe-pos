import { useState, useEffect } from 'react';
import { settingsAPI } from '../api';
import { LoadingPage } from '../components/UI';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';

export default function SettingsPage() {
  const { setSettings } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI.get().then(r => setForm(r.data.settings)).catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await settingsAPI.update(form);
      setSettings(r.data.settings);
      toast.success('Settings saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (!form) return <LoadingPage />;

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
        className="input" placeholder={placeholder} />
    </div>
  );

  const toggle = (label, key, hint = '') => (
    <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
      <div>
        <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{label}</p>
        {hint && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors relative ${form[key] ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}`}
        onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="section-title">Settings</h2>
        <p className="text-xs text-surface-400 mt-0.5">Configure your store preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm border-b border-surface-100 dark:border-surface-800 pb-3">🏪 Store Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {field('Store Name', 'storeName', 'text', 'SoleMate POS')}
            {field('Store Phone', 'storePhone', 'text', '+880...')}
            {field('Store Email', 'storeEmail', 'email', 'info@store.com')}
          </div>
          {field('Store Address', 'storeAddress', 'text', 'Full address')}
          <div>
            <label className="label">Receipt Footer Message</label>
            <textarea value={form.receiptFooter || ''} onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))}
              className="input resize-none" rows={2} />
          </div>
        </div>

        {/* Currency & Tax */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm border-b border-surface-100 dark:border-surface-800 pb-3">💰 Currency & Tax</h3>
          <div className="grid grid-cols-2 gap-4">
            {field('Currency Code', 'currency', 'text', 'BDT')}
            {field('Currency Symbol', 'currencySymbol', 'text', '৳')}
            {field('Tax Rate (%)', 'taxRate', 'number')}
            {field('Tax Name', 'taxName', 'text', 'VAT')}
          </div>
        </div>

        {/* Inventory */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm border-b border-surface-100 dark:border-surface-800 pb-3">📦 Inventory</h3>
          {field('Low Stock Alert Threshold', 'lowStockThreshold', 'number')}
          {toggle('Allow Negative Stock', 'allowNegativeStock', 'Allow sales even when stock is 0')}
        </div>

        {/* Loyalty */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm border-b border-surface-100 dark:border-surface-800 pb-3">⭐ Loyalty Program</h3>
          <div className="grid grid-cols-2 gap-4">
            {field('Points per Amount', 'loyaltyPointsPerAmount', 'number')}
            {field('Discount per Point', 'loyaltyDiscountPerPoint', 'number')}
          </div>
          <p className="text-xs text-surface-400">e.g. 1 point per ৳100 spent, 1 point = ৳1 discount</p>
        </div>

        {/* POS Behaviour */}
        <div className="card p-5 space-y-3">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm border-b border-surface-100 dark:border-surface-800 pb-3">⚙️ POS Behaviour</h3>
          {toggle('Require Customer for Sale', 'requireCustomer', 'Always select a customer before checkout')}
          {toggle('Auto-print Receipt', 'autoPrintReceipt', 'Automatically open print dialog after sale')}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary shadow-lg shadow-brand-500/30 disabled:opacity-60">
            {saving ? 'Saving…' : '✓ Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
