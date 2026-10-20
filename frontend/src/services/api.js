import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawBase ? (rawBase.startsWith('http') ? rawBase : `https://${rawBase}`) : '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If unauthorized and on protected page, redirect
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ---------------- AUTH API ----------------
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// ---------------- PRODUCTS API ----------------
export const productApi = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),

  // Admin Product Operations
  getAdminProducts: (params = {}) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateStock: (id, data) => api.post(`/admin/products/${id}/stock`, data),
  updateLowStockSettings: (id, data) => api.put(`/admin/products/${id}/low-stock-settings`, data),
  getLowStockProducts: () => api.get('/admin/products/low-stock'),

  // Image Upload
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ---------------- CUSTOMERS API ----------------
export const customerApi = {
  getCustomers: (params = {}) => api.get('/admin/customers', { params }),
  getCustomerById: (id) => api.get(`/admin/customers/${id}`),
  createCustomer: (data) => api.post('/admin/customers', data),
  getCustomerSales: (id) => api.get(`/admin/customers/${id}/sales`),
};

// ---------------- SALES & BILLING API ----------------
export const saleApi = {
  getSales: (params = {}) => api.get('/admin/sales', { params }),
  getPendingSales: (params = {}) => api.get('/admin/sales/pending', { params }),
  getSaleById: (id) => api.get(`/admin/sales/${id}`),
  createSale: (data) => api.post('/admin/sales', data),
  confirmSell: (id) => api.post(`/admin/sales/${id}/sell`),
  confirmPayment: (id, data) => api.post(`/admin/sales/${id}/confirm-payment`, data),
  getBill: (id) => api.get(`/admin/sales/${id}/bill`),
  getBillPdfUrl: (id) => `${API_BASE_URL}/api/admin/sales/${id}/bill/pdf`,
};

// ---------------- DASHBOARD API ----------------
export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard'),
};

// ---------------- NOTIFICATIONS API ----------------
export const notificationApi = {
  getLogs: () => api.get('/api/admin/notifications/logs'.replace('/api', '')), // -> /admin/notifications/logs
};

export default api;
