import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Receipt, Calendar, Clock, User, Phone, 
  MapPin, CheckCircle2, AlertCircle, CreditCard, Download, 
  Printer, ShieldCheck, ShoppingBag, Share2
} from 'lucide-react';
import { saleApi } from '../services/api';
import TaxInvoiceModal from '../components/TaxInvoiceModal';

export default function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState({ open: false, method: 'CASH', ref: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSale = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await saleApi.getSaleById(id);
      setSale(res.data);
    } catch (err) {
      console.error('Failed to load sale details:', err);
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSale();
  }, [id]);

  const handleConfirmSell = async () => {
    if (!window.confirm(`Deduct warehouse inventory and confirm sale ${sale.billNumber}? Customer notifications will be dispatched immediately.`)) return;
    try {
      setActionLoading(true);
      await saleApi.confirmSell(sale.id);
      setSuccessMsg('Sale confirmed! Inventory deducted and customer notification dispatched.');
      fetchSale();
    } catch (err) {
      setError(err.message || 'Failed to confirm sale.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await saleApi.confirmPayment(sale.id, {
        paymentMethod: confirmPaymentModal.method,
        transactionReference: confirmPaymentModal.ref || undefined,
        notes: confirmPaymentModal.notes || undefined
      });
      setSuccessMsg('Payment marked SUCCESS. Customer payment confirmation sent.');
      setConfirmPaymentModal({ open: false, method: 'CASH', ref: '', notes: '' });
      fetchSale();
    } catch (err) {
      setError(err.message || 'Failed to confirm payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(saleApi.getBillPdfUrl(sale.id), '_blank');
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent mb-3"></div>
        <p className="text-slate-500 font-medium">Retrieving sale invoice details...</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'This sale record could not be loaded.'}</p>
        <button
          onClick={() => navigate('/admin/sales')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sales Ledger
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/sales"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sales Ledger
        </Link>

        <div className="flex items-center gap-2">
          {sale.saleStatus === 'PENDING' && (
            <button
              onClick={handleConfirmSell}
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition flex items-center gap-2"
            >
              {actionLoading && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
              Confirm Sale (Sell)
            </button>
          )}

          {sale.saleStatus === 'CONFIRMED' && sale.paymentStatus === 'PENDING' && (
            <button
              onClick={() => setConfirmPaymentModal({ open: true, method: 'CASH', ref: '', notes: '' })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Confirm Payment
            </button>
          )}

          <button
            onClick={() => {
              if (sale.whatsappShareUrl) {
                window.open(sale.whatsappShareUrl, '_blank', 'noopener,noreferrer');
              } else {
                setInvoiceModalOpen(true);
              }
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm shadow-xs transition flex items-center gap-1.5"
            title="Send Bill via WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>

          <button
            onClick={() => setInvoiceModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-sm shadow-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            View Invoice
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Notification Banners */}
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

      {/* Main Order Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-500/10 text-amber-700 rounded-lg">
                <Receipt className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold font-mono text-slate-900">{sale.billNumber}</h1>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {sale.saleDate}
                  </span>
                  {sale.saleTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {sale.saleTime.slice(0, 5)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sale.saleStatus === 'CONFIRMED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> SALE CONFIRMED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                AWAITING SELL CONFIRMATION
              </span>
            )}

            {sale.paymentStatus === 'SUCCESS' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> PAID ({sale.paymentMethod || 'CASH'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                PAYMENT PENDING
              </span>
            )}
          </div>
        </div>

        {/* Customer & Order Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-6 border-b border-slate-200 text-sm">
          {/* Customer Details */}
          <div className="md:pr-6 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" /> Customer Information
            </h3>
            {sale.customerName ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 text-base">{sale.customerName}</div>
                {sale.customerPhone && (
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sale.customerPhone}</span>
                  </div>
                )}
                {sale.customerAddress && (
                  <div className="flex items-start gap-2 text-slate-600 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{sale.customerAddress}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-slate-500 italic">
                Walk-in customer (No customer record attached)
              </div>
            )}
          </div>

          {/* Payment & Audit Info */}
          <div className="md:pl-6 pt-6 md:pt-0 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-400" /> Payment & Fulfillment
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className={`font-semibold ${sale.paymentStatus === 'SUCCESS' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {sale.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{sale.paymentMethod || 'Unselected'}</span>
              </div>
              {sale.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Notes:</span>
                  <p className="text-slate-700 italic">{sale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" /> Purchased Items ({sale.items?.length || 0})
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items && sale.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.productName}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {item.productCategory || 'Hardware'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-600">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{item.subtotal?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Box */}
          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{sale.totalAmount ? sale.totalAmount.toLocaleString('en-IN') : '0.00'}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span>GST / Taxes</span>
                <span className="text-emerald-700 font-medium">Included</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
                <span>Total Amount</span>
                <span className="text-slate-950 font-mono text-lg">₹{sale.totalAmount ? sale.totalAmount.toLocaleString('en-IN') : '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      <TaxInvoiceModal
        saleId={sale.id}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
      />

      {/* Confirm Payment Modal */}
      {confirmPaymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirm Payment</h3>
            <p className="text-sm text-slate-500 mt-1">
              Mark sale <span className="font-mono font-bold text-slate-700">{sale.billNumber}</span> as PAID.
            </p>
            <form onSubmit={handleConfirmPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={confirmPaymentModal.method}
                  onChange={(e) => setConfirmPaymentModal(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                >
                  <option value="CASH">Cash at Counter</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="OTHER">Card / Bank Transfer</option>
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
                  placeholder="Cashier remarks..."
                  value={confirmPaymentModal.notes}
                  onChange={(e) => setConfirmPaymentModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmPaymentModal({ open: false, method: 'CASH', ref: '', notes: '' })}
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
