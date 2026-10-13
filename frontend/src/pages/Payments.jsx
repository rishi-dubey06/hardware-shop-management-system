import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Filter, RefreshCw, CheckCircle2, 
  AlertCircle, DollarSign, ArrowUpRight, Clock, FileText 
} from 'lucide-react';
import { saleApi } from '../services/api';
import TaxInvoiceModal from '../components/TaxInvoiceModal';

export default function Payments() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'PENDING', 'SUCCESS'
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [confirmModal, setConfirmModal] = useState({ open: false, sale: null, method: 'CASH', ref: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSaleIdForInvoice, setSelectedSaleIdForInvoice] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        size: 20,
        sort: 'createdAt,desc',
      };
      if (statusFilter) {
        params.paymentStatus = statusFilter;
      }

      const res = await saleApi.getSales(params);
      const pageData = res.data;
      setSales(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
      setTotalElements(pageData.totalElements || 0);
    } catch (err) {
      console.error('Failed to load payments:', err);
      setError(err.message || 'Unable to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!confirmModal.sale) return;

    try {
      setActionLoading(true);
      await saleApi.confirmPayment(confirmModal.sale.id, {
        paymentMethod: confirmModal.method,
        transactionReference: confirmModal.ref || undefined,
        notes: confirmModal.notes || undefined
      });
      setSuccessMsg(`Payment confirmed SUCCESS for Bill ${confirmModal.sale.billNumber}! Receipt alerts dispatched.`);
      setConfirmModal({ open: false, sale: null, method: 'CASH', ref: '', notes: '' });
      fetchPayments();
    } catch (err) {
      setError(err.message || 'Failed to confirm payment.');
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations from current page or rough totals
  const totalCollected = sales
    .filter(s => s.paymentStatus === 'SUCCESS')
    .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  const pendingAmount = sales
    .filter(s => s.paymentStatus === 'PENDING')
    .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  const pendingCount = sales.filter(s => s.paymentStatus === 'PENDING').length;

  const filteredSales = sales.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.billNumber?.toLowerCase().includes(term) ||
      s.customerName?.toLowerCase().includes(term) ||
      s.customerPhone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Payment Management & Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track collections, reconcile cash & UPI balances, and record manual settlements.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold ml-4">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold ml-4">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected on Page</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">₹{totalCollected.toLocaleString('en-IN')}</div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">Reconciled</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Outstanding</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">₹{pendingAmount.toLocaleString('en-IN')}</div>
            <div className="text-xs text-amber-600 font-medium mt-0.5">{pendingCount} orders pending</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recorded</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalElements} Records</div>
            <div className="text-xs text-slate-500 mt-0.5">Across all dates</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill Number, customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          >
            <option value="">All Payment Statuses</option>
            <option value="PENDING">PENDING (Unpaid)</option>
            <option value="SUCCESS">SUCCESS (Paid)</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading payments...</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">No payment records found</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {sale.billNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {sale.saleDate} {sale.saleTime ? `• ${sale.saleTime.slice(0, 5)}` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{sale.customerName || 'Walk-in'}</div>
                      <div className="text-xs text-slate-500">{sale.customerPhone || '—'}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{sale.totalAmount ? sale.totalAmount.toLocaleString('en-IN') : '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      {sale.paymentStatus === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {sale.paymentMethod || 'NONE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sale.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => setConfirmModal({ open: true, sale, method: 'CASH', ref: '', notes: '' })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
                          >
                            Confirm Payment
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSaleIdForInvoice(sale.id)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="View Bill"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page {currentPage + 1} of {totalPages || 1} ({totalElements} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {confirmModal.open && confirmModal.sale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
            <p className="text-sm text-slate-500 mt-1">
              Confirm settlement of ₹{confirmModal.sale.totalAmount?.toLocaleString('en-IN')} for bill <span className="font-mono font-bold text-slate-700">{confirmModal.sale.billNumber}</span>.
            </p>

            <form onSubmit={handleConfirmPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={confirmModal.method}
                  onChange={(e) => setConfirmModal(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                >
                  <option value="CASH">Cash at Counter</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="OTHER">Card / Cheque / Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Ref / UTR (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-1029384756"
                  value={confirmModal.ref}
                  onChange={(e) => setConfirmModal(prev => ({ ...prev, ref: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Cashier remarks..."
                  value={confirmModal.notes}
                  onChange={(e) => setConfirmModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, sale: null, method: 'CASH', ref: '', notes: '' })}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm"
                >
                  Confirm & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedSaleIdForInvoice && (
        <TaxInvoiceModal
          saleId={selectedSaleIdForInvoice}
          isOpen={true}
          onClose={() => setSelectedSaleIdForInvoice(null)}
        />
      )}
    </div>
  );
}
