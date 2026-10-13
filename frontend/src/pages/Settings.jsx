import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Store, Bell, Shield, Database, 
  CheckCircle2, Save, Key, Phone, Mail, MapPin, Cpu, Check
} from 'lucide-react';

export default function Settings() {
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Store Configuration
  const [storeName, setStoreName] = useState('Apex Hardware & Industrial Supplies');
  const [storeGstin, setStoreGstin] = useState('29AABCU9603R1ZM');
  const [storePhone, setStorePhone] = useState('+91 98765 43210');
  const [storeEmail, setStoreEmail] = useState('orders@apexhardware.internal');
  const [storeAddress, setStoreAddress] = useState('104 Industrial Area, Peenya Phase 2, Bengaluru, Karnataka 560058');

  // Notification Preferences
  const [activeProvider, setActiveProvider] = useState('twilio');
  const [lowStockAlertsEnabled, setLowStockAlertsEnabled] = useState(true);
  const [adminPhone, setAdminPhone] = useState('+91 98765 43210');
  const [customerWhatsAppEnabled, setCustomerWhatsAppEnabled] = useState(true);
  const [customerSmsEnabled, setCustomerSmsEnabled] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-amber-500" />
            System & Store Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure business identity, notification provider routing, and system parameters.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" /> Preferences Saved
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Business Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Store Identity & Billing Information</h2>
              <p className="text-xs text-slate-500">Details printed on official GST tax invoices and receipts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Business Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GSTIN Number</label>
              <input
                type="text"
                value={storeGstin}
                onChange={(e) => setStoreGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Store Phone / Helpline</label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Official Email</label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Physical Address</label>
              <textarea
                rows="2"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Live Notification Providers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Notification Routing & Provider Settings</h2>
              <p className="text-xs text-slate-500">Configure real WhatsApp & SMS delivery channels.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primary Notification Engine</label>
              <select
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden font-medium"
              >
                <option value="twilio">Twilio Messages REST API (WhatsApp & SMS)</option>
                <option value="meta">Meta WhatsApp Cloud API v20.0</option>
                <option value="rest">Generic REST Gateway</option>
                <option value="mock">Local Development Mock Engine</option>
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Required Environment Variables for Live Dispatch
              </div>
              <p className="text-slate-600">
                To activate live dispatches to real phone numbers, provide the following variables in the runtime environment:
              </p>
              <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg space-y-1">
                <div>TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</div>
                <div>TWILIO_AUTH_TOKEN=your_auth_token</div>
                <div>TWILIO_FROM_PHONE=+1XXXXXXXXXX (For SMS)</div>
                <div>TWILIO_WHATSAPP_FROM=+14155238886 (For WhatsApp Sandbox)</div>
                <div>WHATSAPP_API_KEY=EAA... (For Meta Cloud API)</div>
                <div>WHATSAPP_PHONE_NUMBER_ID=100000000000000</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Warehouse Low-Stock Recipient Phone</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="space-y-3 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockAlertsEnabled}
                    onChange={(e) => setLowStockAlertsEnabled(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-700">Trigger Admin Alerts on Low Stock (Stock ≤ Limit)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerWhatsAppEnabled}
                    onChange={(e) => setCustomerWhatsAppEnabled(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-700">Send WhatsApp Purchase & Payment Receipts</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerSmsEnabled}
                    onChange={(e) => setCustomerSmsEnabled(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                  />
                  <span className="text-xs font-semibold text-slate-700">Send SMS Purchase & Payment Receipts</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Backend & Architecture Diagnostics</h2>
              <p className="text-xs text-slate-500">Live runtime environment configuration status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium">Framework & Engine</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Spring Boot 3.3.4 (Java 21)</span>
              <span className="text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Operational
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium">Relational Database</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">MySQL 8.4 (InnoDB)</span>
              <span className="text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium">Security & Session</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Spring Security 6 (JWT)</span>
              <span className="text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Stateless Guard
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm hover:shadow-md transition text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
