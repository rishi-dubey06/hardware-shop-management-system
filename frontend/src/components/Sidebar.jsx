import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  LayoutDashboard,
  ShoppingBag,
  Package,
  PlusCircle,
  AlertTriangle,
  ShoppingCart,
  Clock,
  Receipt,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar = ({ pendingCount = 0, lowStockCount = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md font-bold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    } ${collapsed ? 'justify-center px-0' : ''}`;

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 z-30 transition-all duration-300 min-h-screen ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <NavLink to={isAdmin() ? "/admin/dashboard" : "/products"} className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-extrabold text-sm text-white tracking-wider uppercase block leading-tight">
                XYZ HARDWARE
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                PRO COMMERCE
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition hidden md:block"
          title="Toggle Sidebar"
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs font-medium">
        {/* Main Section */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Main Menu
            </div>
          )}
          {isAdmin() && (
            <NavLink to="/admin/dashboard" className={navClass} title="Dashboard">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          )}
          <NavLink to="/products" className={navClass} title="Product Catalog">
            <ShoppingBag className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Product Catalog</span>}
          </NavLink>
        </div>

        {/* Inventory Section (Admin) */}
        {isAdmin() && (
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Inventory
              </div>
            )}
            <NavLink to="/admin/products" className={navClass} title="All Products">
              <Package className="w-4 h-4 shrink-0" />
              {!collapsed && <span>All Products</span>}
            </NavLink>
            <NavLink to="/admin/products/new" className={navClass} title="Add Product">
              <PlusCircle className="w-4 h-4 shrink-0 text-amber-400" />
              {!collapsed && <span>Add Product</span>}
            </NavLink>
            <NavLink to="/admin/stock" className={navClass} title="Stock & Restock">
              <div className="flex items-center space-x-3 w-full justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  {!collapsed && <span>Stock Management</span>}
                </div>
                {!collapsed && lowStockCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </div>
            </NavLink>
          </div>
        )}

        {/* Commerce Section (Admin) */}
        {isAdmin() && (
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sales & Billing
              </div>
            )}
            <NavLink to="/admin/sales/new" className={navClass} title="Create Sale">
              <ShoppingCart className="w-4 h-4 shrink-0 text-emerald-400" />
              {!collapsed && <span className="text-emerald-300 font-bold">Create Sale</span>}
            </NavLink>
            <NavLink to="/admin/sales/pending" className={navClass} title="Pending Sales">
              <div className="flex items-center space-x-3 w-full justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 shrink-0 text-orange-400" />
                  {!collapsed && <span>Pending Orders</span>}
                </div>
                {!collapsed && pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full">
                    {pendingCount}
                  </span>
                )}
              </div>
            </NavLink>
            <NavLink to="/admin/sales" className={navClass} title="Sales History">
              <Receipt className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sales History</span>}
            </NavLink>
            <NavLink to="/admin/customers" className={navClass} title="Customers">
              <Users className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Customers</span>}
            </NavLink>
          </div>
        )}

        {/* Management & System Section (Admin) */}
        {isAdmin() && (
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                System Audit
              </div>
            )}
            <NavLink to="/admin/notifications" className={navClass} title="Notification Logs">
              <Bell className="w-4 h-4 shrink-0" />
              {!collapsed && <span>WhatsApp/SMS Logs</span>}
            </NavLink>
            <NavLink to="/admin/settings" className={navClass} title="Alert Settings">
              <Settings className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Store Settings</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center p-2 rounded-xl bg-slate-800/60 ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {user ? (user.fullName || user.username || 'A').charAt(0).toUpperCase() : 'G'}
          </div>
          {!collapsed && (
            <div className="truncate flex-1">
              <div className="font-bold text-xs text-white truncate">
                {user ? user.fullName || user.username : 'Guest'}
              </div>
              <div className="text-[10px] text-amber-400 font-medium">
                {isAdmin() ? 'Store Admin' : 'Customer'}
              </div>
            </div>
          )}
          {user && !collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 text-slate-400 hover:text-red-400 transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

