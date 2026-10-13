import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ArrowRight,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const Home = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="space-y-12 py-6">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Commercial Hardware Management Suite
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            High-Precision Inventory, Sales & Counter Billing
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Engineered for modern retail & wholesale hardware stores. Real-time warehouse synchronization, automated WhatsApp and SMS customer alerts, two-phase sales, and instant tax invoice generation.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <NavLink
              to="/products"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-amber-500/25 transition flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>

            {isAdmin() ? (
              <NavLink
                to="/admin/dashboard"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-xs transition flex items-center space-x-2"
              >
                <span>Store Dashboard</span>
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-xs transition flex items-center space-x-2"
              >
                <span>Store Sign In</span>
              </NavLink>
            )}
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
          <Wrench className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Value Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Two-Phase SELL System</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Create pending sales and quote draft bills without affecting warehouse stock. Click SELL to atomically decrement inventory and disarm out-of-stock conditions.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Live WhatsApp & SMS Alerts</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automated customer notifications dispatched on purchase confirmation and payment receipts. Safety threshold alerts protect warehouse replenishment.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Enterprise Audit & Invoicing</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Programmatic OpenPDF tax invoices, printable cash receipts, customer CRM ledgers, and full role-based security protecting inventory assets.
          </p>
        </div>
      </section>

      {/* Store Location & Information */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">XYZ Hardware Flagship Store</h4>
            <p className="text-xs text-slate-500">Shop #12, Central Hardware Market, Sector 18, Greater Noida, UP</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Phone className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-800">+91 98765 43210</span>
        </div>
      </section>
    </div>
  );
};

export default Home;

