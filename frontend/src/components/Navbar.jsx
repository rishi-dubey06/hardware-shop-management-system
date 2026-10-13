import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Search,
  Code,
  Bell,
  Lock,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';

export const Navbar = ({ onMobileMenuToggle, lowStockItems = [] }) => {
  const { user, logout, isAdmin } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/products?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        {/* Left: Mobile Toggle & Page Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 text-slate-500 hover:text-slate-800 md:hidden rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-700 hidden sm:inline">XYZ Hardware Store</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-amber-600 font-bold capitalize">Live System</span>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div className="hidden lg:flex items-center max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search products, orders, categories..."
              className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
              Enter
            </span>
          </div>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center space-x-3">
          {/* Swagger API Link */}
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-amber-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Swagger API</span>
          </a>

          {/* Low Stock Alert Bell */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            title="Low Stock Alerts"
          >
            <Bell className="w-5 h-5" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full animate-ping" />
            )}
          </button>

          {/* User Profile / Login */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {(user.fullName || user.username || 'A').charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Notification Drawer */}
      {panelOpen && (
        <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transition-all">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Low Stock Warehouse Alerts</h3>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 text-xs">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">All warehouse stock levels are healthy!</div>
            ) : (
              lowStockItems.map((p) => (
                <div key={p.id} className="p-3 hover:bg-slate-50 transition rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{p.name}</span>
                    <span className="text-amber-600">{p.availableQuantity} left</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Threshold: {p.lowStockLimit} units • Category: {p.category || 'General'}
                  </div>
                </div>
              ))
            )}
          </div>

          {isAdmin() && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <NavLink
                to="/admin/stock"
                onClick={() => setPanelOpen(false)}
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                Manage Restocking &rarr;
              </NavLink>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;

