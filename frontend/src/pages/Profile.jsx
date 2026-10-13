import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Key, LogOut, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-md">
          {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 capitalize">{user?.username || 'System Administrator'}</h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 w-fit mx-auto sm:mx-0">
              <Shield className="w-3.5 h-3.5" />
              {isAdmin() ? 'ADMINISTRATOR' : 'CUSTOMER'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin() 
              ? 'Full administrative authority over hardware inventory, billing, payments, and dispatch audit logs.' 
              : 'Customer portal access for catalog browsing and order inquiries.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition border border-rose-200"
            >
              <LogOut className="w-4 h-4" /> Sign Out Session
            </button>
          </div>
        </div>
      </div>

      {/* Permissions & Security Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Role Privileges */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            Granted System Privileges
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Warehouse inventory addition, modification & delta adjustment
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Two-Phase SELL confirmation & atomic stock deduction
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Payment status confirmation (Cash, UPI, Cards)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              GST Tax Invoice and PDF generation with download
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              WhatsApp & SMS automated notifications dispatch audit
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Low-stock alert threshold limit configuration
            </li>
          </ul>
        </div>

        {/* Security Session */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            Active Session Security
          </h2>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 block font-medium">Session Token Type</span>
              <span className="font-semibold text-slate-800">Stateless Bearer JWT (HMAC-SHA256)</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 block font-medium">Status</span>
              <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated & Valid
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 block font-medium">Token Storage</span>
              <span className="font-mono text-[11px] text-slate-600">localStorage / Authorization Header</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
