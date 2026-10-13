import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { dashboardApi, productApi } from '../services/api';
import { StockProgressBar } from '../components/StockProgressBar';
import {
  Package,
  IndianRupee,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShoppingCart,
  Plus,
  Receipt,
  AlertCircle,
  Activity,
} from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading store dashboard metrics...</div>;
  }

  const d = stats || {
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    todaySalesAmount: 0,
    todaySalesCount: 0,
    pendingSalesCount: 0,
    pendingPaymentsCount: 0,
    lowStockProducts: [],
    recentSales: [],
  };

  return (
    <div className="space-y-8 py-4">
      {/* Top Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Live Retail Intelligence
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Good Morning, Admin 👋</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Here's what's happening with your shop today. All transactions and warehouse stock changes are synchronized in real-time.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <NavLink
              to="/admin/sales/new"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md hover:shadow-amber-500/25 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Create New Sale</span>
            </NavLink>
            <NavLink
              to="/admin/products/new"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </NavLink>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 opacity-10 text-white pointer-events-none">
          <Activity className="w-80 h-80" />
        </div>
      </div>

      {/* 4 Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{d.totalProducts}</div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{d.totalStock} total warehouse units</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{Number(d.todaySalesAmount || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              <span className="text-amber-700 font-extrabold">{d.todaySalesCount}</span> Orders confirmed today
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-orange-600 tracking-tight">{d.lowStockCount}</div>
            <div className="flex items-center text-xs font-semibold text-orange-600 mt-1">
              <span>⚠ Attention Needed ({d.outOfStockCount} Out)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-rose-600 tracking-tight">{d.pendingPaymentsCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              Orders awaiting manual payment
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Low Stock Warning Box & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Low Stock Attention Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Low Stock & Restocking Requirements</h3>
            </div>
            <NavLink to="/admin/stock" className="text-xs font-bold text-amber-600 hover:underline">
              View All &rarr;
            </NavLink>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {d.lowStockProducts?.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">All inventory stock levels are healthy!</div>
            ) : (
              d.lowStockProducts?.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-800">{p.name}</div>
                    <NavLink
                      to="/admin/stock"
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      Restock +
                    </NavLink>
                  </div>
                  <StockProgressBar available={p.availableQuantity} limit={p.lowStockLimit} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-sm text-slate-900">Recent Customer Sales</h3>
            </div>
            <NavLink to="/admin/sales" className="text-xs font-bold text-amber-600 hover:underline">
              View All &rarr;
            </NavLink>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {d.recentSales?.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">No orders recorded yet.</div>
            ) : (
              d.recentSales?.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-slate-800 font-mono">
                      {s.billNumber} • {s.customerName}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {s.saleDate} • {s.items?.length || 0} items
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-black text-slate-900">₹{Number(s.totalAmount).toFixed(2)}</div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.saleStatus === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'
                      }`}
                    >
                      {s.saleStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

