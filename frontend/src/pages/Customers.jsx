import React, { useState, useEffect } from 'react';
import { customerApi } from '../services/api';
import { Search, Plus, User, Receipt, Phone, MapPin, Mail, X } from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phoneNumber: '', address: '', email: '' });
  const [savingCust, setSavingCust] = useState(false);

  // Purchase History Modal
  const [historyCust, setHistoryCust] = useState(null);
  const [historySales, setHistorySales] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [query, page]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getCustomers({ page, size: 15, query });
      if (res.success && res.data) {
        setCustomers(res.data.content || []);
        setPageData({
          totalPages: res.data.totalPages || 1,
          totalElements: res.data.totalElements || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSavingCust(true);
    try {
      const res = await customerApi.createCustomer(newCust);
      if (res.success) {
        setAddModalOpen(false);
        setNewCust({ name: '', phoneNumber: '', address: '', email: '' });
        loadCustomers();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingCust(false);
    }
  };

  const openHistory = async (c) => {
    setHistoryCust(c);
    setLoadingHistory(true);
    try {
      const res = await customerApi.getCustomerSales(c.id);
      if (res.success && res.data) {
        setHistorySales(res.data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer CRM & Purchase Ledger</h1>
          <p className="text-xs text-slate-500">Contact information, delivery destinations, and verified historical purchases.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search customer by name or phone..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading customer CRM directory...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          No customer records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{c.name}</h3>
                    <div className="flex items-center text-xs text-slate-400 font-mono mt-0.5">
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      <span>{c.phoneNumber}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  CRM ACTIVE
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-start space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{c.address}</span>
                </div>
                {c.email && (
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>{c.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center justify-end">
                <button
                  onClick={() => openHistory(c)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Order History</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">New Customer Record</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number (for WhatsApp/SMS) *</label>
                <input
                  type="text"
                  required
                  value={newCust.phoneNumber}
                  onChange={(e) => setNewCust({ ...newCust, phoneNumber: e.target.value })}
                  placeholder="+9198XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Billing & Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="Street / Area, City, State"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCust}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {savingCust ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {historyCust && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Purchase Ledger: {historyCust.name}
              </h3>
              <button onClick={() => setHistoryCust(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400">Loading purchase ledger...</div>
            ) : historySales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No past purchases found for this customer.
              </div>
            ) : (
              <div className="space-y-3">
                {historySales.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span className="font-mono">{s.billNumber} • {s.saleDate}</span>
                      <span className="text-amber-600 text-sm">₹{Number(s.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="text-slate-600">
                      {s.items?.map((it) => `${it.productName} (×${it.quantity})`).join(', ')}
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.saleStatus === 'CONFIRMED' ? 'badge-confirmed' : 'badge-pending'
                        }`}
                      >
                        {s.saleStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.paymentStatus === 'SUCCESS' ? 'badge-payment-success' : 'badge-payment-pending'
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

