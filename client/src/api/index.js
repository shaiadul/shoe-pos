import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginEndpoint = err.config?.url?.includes('/auth/login');
    const isAlreadyOnLogin = window.location.pathname === '/login';
    if (err.response?.status === 401 && !isLoginEndpoint && !isAlreadyOnLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/register', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  getLowStock: () => api.get('/products/low-stock'),
  getCategories: () => api.get('/products/categories'),
  getBrands: () => api.get('/products/brands'),
};

// Orders
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getTodayStats: () => api.get('/orders/today-stats'),
  getCustomerSales: (customerId, params) => api.get(`/orders/customer/${customerId}`, { params }),
};

// Customers
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (q) => api.get('/customers/search', { params: { q } }),
  payDue: (id, data) => api.post(`/customers/${id}/pay-due`, data),
  getDueSummary: () => api.get('/customers/due-summary'),
};

// Suppliers
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  addPurchase: (id, data) => api.post(`/suppliers/${id}/purchase`, data),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getSalesReport: (params) => api.get('/dashboard/sales-report', { params }),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Activity Audit Log
export const activityAPI = {
  getAll: (params) => api.get('/activity', { params }),
  getStats: () => api.get('/activity/stats'),
};

// Expenses
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: () => api.get('/expenses/summary'),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export default api;
