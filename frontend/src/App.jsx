import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { productApi } from './services/api';
import { Wrench, Shield } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminProducts from './pages/AdminProducts';
import ProductFormPage from './pages/ProductFormPage';
import StockManagement from './pages/StockManagement';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import SaleDetails from './pages/SaleDetails';
import CreateSale from './pages/CreateSale';
import PendingSales from './pages/PendingSales';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Public Layout
function PublicLayout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase block text-white">XYZ HARDWARE</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block -mt-1">PRO INDUSTRIAL</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/products" className="text-slate-300 hover:text-white transition">Catalog</Link>
            {user && isAdmin() && (
              <Link to="/admin/dashboard" className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Dashboard
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/admin/profile" className="text-slate-300 hover:text-white text-xs bg-slate-800 px-2.5 py-1 rounded-md">
                  {user.username}
                </Link>
                <button
                  onClick={logout}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 px-2.5 py-1 rounded-md transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg font-bold text-xs shadow-xs transition"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 XYZ Hardware & Industrial Supplies. All rights reserved.</p>
          <p className="mt-1 text-slate-500">Enterprise inventory management, automated 2-phase SELL billing, and live notifications.</p>
        </div>
      </footer>
    </div>
  );
}

// Admin Layout
function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    productApi.getLowStockProducts()
      .then(res => setLowStockItems(res.data || []))
      .catch(() => {});
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/products" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased">
      {/* Collapsible / Desktop Sidebar */}
      <Sidebar lowStockCount={lowStockItems.length} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} 
          lowStockItems={lowStockItems}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Products & Inventory */}
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/edit/:id" element={<ProductFormPage />} />
            <Route path="stock" element={<StockManagement />} />
            
            {/* Customers CRM */}
            <Route path="customers" element={<Customers />} />
            
            {/* Sales & Billing */}
            <Route path="sales" element={<Sales />} />
            <Route path="sales/create" element={<CreateSale />} />
            <Route path="sales/pending" element={<PendingSales />} />
            <Route path="sales/:id" element={<SaleDetails />} />
            
            {/* Payments & Reconciliations */}
            <Route path="payments" element={<Payments />} />
            
            {/* Notifications & Audits */}
            <Route path="notifications" element={<Notifications />} />
            
            {/* Store & System Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-2xl mb-4">
                  404
                </div>
                <h1 className="text-2xl font-bold">Page Not Found</h1>
                <p className="text-sm text-slate-400 mt-2 max-w-sm">
                  The requested resource could not be found. Check the URL or return to safety.
                </p>
                <Link
                  to="/"
                  className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  Return to Home
                </Link>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
