import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../api';

const SettingsContext = createContext(null);

const DEFAULTS = {
  storeName: 'SoleMate POS',
  storePhone: '',
  storeEmail: '',
  storeAddress: '',
  currencySymbol: '৳',
  taxRate: 0,
  taxName: 'VAT',
  currency: 'BDT',
  lowStockThreshold: 5,
  receiptFooter: 'Thank you for shopping with us!',
  requireCustomer: false,
  autoPrintReceipt: false,
  allowNegativeStock: false,
  loyaltyPointsPerAmount: 100,
  loyaltyDiscountPerPoint: 1
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      settingsAPI.get().then(r => {
        setSettings(prev => ({ ...prev, ...r.data.settings }));
      }).catch(() => {});
    }
  }, []);

  const fmt = (amount) => `${settings.currencySymbol}${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

  return (
    <SettingsContext.Provider value={{ settings, setSettings, fmt }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
