import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Receipt, Plus, Search, Filter, Eye, CheckCircle2, 
  CreditCard, FileText, ArrowRight, RefreshCw, AlertCircle, Calendar
} from 'lucide-react';
import { saleApi } from '../services/api';
import TaxInvoiceModal from '../components/TaxInvoiceModal';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [selectedSaleIdForInvoice, setSelectedSaleIdForInvoice] = useState(null);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState({ open: false, sale: null, method: 'CASH', ref: '', notes: '' });
  const [sellModal, setSellModal] = useState({ open: false, sale: null, loading: false });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        size: 15,
        sort: 'createdAt,desc'
      };
      if (saleStatusFilter) params.saleStatus = saleStatusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;

      const res = await saleApi.getSales(params);
      const pageData = res.data;
      setSales(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
      setTotalElements(pageData.totalElements || 0);
    } catch (err) {
      console.error('Failed to load sales:', err);
      setError(err.message || 'Unable to retrieve sales records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [currentPage, saleStatusFilter, paymentStatusFilter]);

  const handleSellConfirm = async () => {
    if (!sellModal.sale) return;
    try {
      setSellModal(prev => ({ ...prev, loading: true }));
      await saleApi.confirmSell(sellModal.sale.id);
      setSuccessMsg(`Sale ${sellModal.sale.billNumber} confirmed successfully! Inventory deducted and customer notification sent.`);
      setSellModal({ open: false, sale: null, loading: false });
      fetchSales();
    } catch (err) {
      setError(err.message || 'Failed to confirm sale.');
      setSellModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePaymentConfirm = async (e) => {
    e.preventDefault();
    if (!confirmPaymentModal.sale) return;
    try {
      setActionLoading(true);
      await saleApi.confirmPayment(confirmPaymentModal.sale.id, {
        paymentMethod: confirmPaymentModal.method,
        transactionReference: confirmPaymentModal.ref || undefined,
        notes: confirmPaymentModal.notes || undefined
      });
      setSuccessMsg(`Payment confirmed SUCCESS for Bill ${confirmPaymentModal.sale.billNumber}. Notification dispatched.`);
      setConfirmPaymentModal({ open: false, sale: null, method: 'CASH', ref: '', notes: '' });
      fetchSales();
    } catch (err) {
      setError(err.message || 'Payment confirmation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = (saleId, billNumber) => {
    const url = saleApi.getBillPdfUrl(saleId);
    window.open(url, '_blank');
  };

  // Filter in memory for quick text search
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
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-500" />
            Sales & Invoicing Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete transaction register with 2-phase SELL execution, live stock deductions, and payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSales}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
            title="Refresh sales list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/sales/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg shadow-sm hover:shadow-md transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Sale
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 text-sm font-bold ml-4">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 text-sm font-bold ml-4">✕</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill Number (e.g. BILL-...), customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={saleStatusFilter}
              onChange={(e) => { setSaleStatusFilter(e.target.value); setCurrentPage(0); }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            >
              <option value="">All Sale Statuses</option>
              <option value="PENDING">PENDING (Awaiting SELL)</option>
              <option value="CONFIRMED">CONFIRMED (Sold)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(0); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          >
            <option value="">All Payment Statuses</option>
            <option value="PENDING">Payment Pending</option>
            <option value="SUCCESS">Payment Confirmed</option>
            <option value="FAILED">Payment Failed</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Bill No & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Sale Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading sales register...</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">No sales transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your filters or create a new sale.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 font-mono flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {sale.billNumber}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sale.saleDate} {sale.saleTime ? `• ${sale.saleTime.slice(0, 5)}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{sale.customerName || 'Walk-in Customer'}</div>
                      <div className="text-xs text-slate-500">{sale.customerPhone || '—'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                        {sale.items?.length || 0} line items
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{sale.totalAmount ? sale.totalAmount.toLocaleString('en-IN') : '0.00'}
                    </td>

                    <td className="py-3 px-4">
                      {sale.saleStatus === 'CONFIRMED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                        </span>
                      )}
                      {sale.saleStatus === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          PENDING
                        </span>
                      )}
                      {sale.saleStatus === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          CANCELLED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {sale.paymentStatus === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PAID ({sale.paymentMethod || 'CASH'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            UNPAID
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Pending Sale, offer SELL Confirmation */}
                        {sale.saleStatus === 'PENDING' && (
                          <button
                            onClick={() => setSellModal({ open: true, sale, loading: false })}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition"
                            title="Confirm Sale & Deduct Inventory"
                          >
                            SELL
                          </button>
                        )}

                        {/* If Confirmed and payment pending, offer Confirm Payment */}
                        {sale.saleStatus === 'CONFIRMED' && sale.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => setConfirmPaymentModal({ open: true, sale, method: 'CASH', ref: '', notes: '' })}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1"
                            title="Confirm Payment"
                          >
                            <CreditCard className="w-3 h-3" /> Pay
                          </button>
                        )}

                        {/* View Tax Invoice Modal */}
                        <button
                          onClick={() => setSelectedSaleIdForInvoice(sale.id)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="View Tax Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Download PDF directly */}
                        <button
                          onClick={() => handleDownloadPdf(sale.id, sale.billNumber)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Download Invoice PDF"
                        >
                          <ArrowRight className="w-4 h-4 -rotate-45" />
                        </button>

                        {/* Detail Link */}
                        <Link
                          to={`/admin/sales/${sale.id}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredSales.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalElements}</span> recorded sales
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              Previous
            </button>
            <span className="px-2">
              Page {currentPage + 1} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {selectedSaleIdForInvoice && (
        <TaxInvoiceModal
          saleId={selectedSaleIdForInvoice}
          isOpen={true}
          onClose={() => setSelectedSaleIdForInvoice(null)}
        />
      )}

      {/* Confirm SELL Modal */}
      {sellModal.open && sellModal.sale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Sale (Sell Action)</h3>
            <p className="text-sm text-slate-600 mt-2">
              Executing this action will immediately:
            </p>
            <ul className="text-xs text-slate-600 list-disc list-inside mt-2 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <li>Validate warehouse inventory for all items</li>
              <li>Atomically deduct quantities from current stock</li>
              <li>Transition sale status to <strong className="text-emerald-700">CONFIRMED</strong></li>
              <li>Dispatch WhatsApp & SMS purchase confirmations</li>
              <li>Check low-stock alert thresholds for restock notification</li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Bill Number:</span>
              <span className="font-mono font-bold text-slate-800">{sellModal.sale.billNumber}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-500">Total Payable:</span>
              <span className="font-bold text-slate-900">₹{sellModal.sale.totalAmount?.toLocaleString('en-IN')}</span>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSellModal({ open: false, sale: null, loading: false })}
                disabled={sellModal.loading}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSellConfirm}
                disabled={sellModal.loading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-lg shadow-sm transition flex items-center gap-2"
              >
                {sellModal.loading && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                Confirm & Sell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {confirmPaymentModal.open && confirmPaymentModal.sale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Payment Receipt</h3>
            <p className="text-sm text-slate-500 mt-1">
              Mark invoice <span className="font-mono font-semibold text-slate-700">{confirmPaymentModal.sale.billNumber}</span> as PAID and dispatch instant payment receipt alerts.
            </p>

            <form onSubmit={handlePaymentConfirm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={confirmPaymentModal.method}
                  onChange={(e) => setConfirmPaymentModal(prev => ({ ...prev, method: e.target.value }))}
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
                  placeholder="e.g. UPI-928172949102"
                  value={confirmPaymentModal.ref}
                  onChange={(e) => setConfirmPaymentModal(prev => ({ ...prev, ref: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional cashier remarks..."
                  value={confirmPaymentModal.notes}
                  onChange={(e) => setConfirmPaymentModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmPaymentModal({ open: false, sale: null, method: 'CASH', ref: '', notes: '' })}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
