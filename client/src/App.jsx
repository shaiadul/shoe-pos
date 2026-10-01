import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ExpensesPage from './pages/ExpensesPage';

function ThemedToaster() {
  const { dark } = useTheme();
  return (
    <Toaster
      theme={dark ? 'dark' : 'light'}
      position="top-right"
      richColors
      closeButton
      duration={3500}
      toastOptions={{
        style: {
          borderRadius: '14px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '500',
        },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedToaster />
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/pos" element={<POSPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/activity-log" element={<ActivityLogPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
