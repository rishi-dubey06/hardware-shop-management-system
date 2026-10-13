import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { saleApi } from '../services/api';
import { TaxInvoiceModal } from '../components/TaxInvoiceModal';
import { Clock, CheckCircle2, Check, Printer, AlertTriangle } from 'lucide-react';

export const PendingSales = () => {
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sell Confirmation Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [selling, setSelling] = useState(false);

  // Bill Modal
  const [activeBill, setActiveBill] = useState(null);

  useEffect(() => {
    loadPendingSales();
  }, []);

  const loadPendingSales = async () => {
    setLoading(true);
    try {
      const res = await saleApi.getPendingSales({ page: 0, size: 30 });
      if (res.success && res.data) {
        setPendingSales(res.data.content || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSell = async () => {
    if (!selectedSale) return;
    setSelling(true);
    try {
      const res = await saleApi.confirmSell(selectedSale.id);
      if (res.success) {
        const saleId = selectedSale.id;
        setSelectedSale(null);
        loadPendingSales();

        // Load bill
        const billRes = await saleApi.getBill(saleId);
        if (billRes.success && billRes.data) {
          setActiveBill(billRes.data);
        }
      } else {
        alert(res.message || 'Sale confirmation failed');
      }
    } catch (err) {
      alert(err.message || 'Insufficient stock or system error');
    } finally {
      setSelling(false);
    }
  };

  const openBill = async (saleId) => {
    try {
      const res = await saleApi.getBill(saleId);
      if (res.success && res.data) {
        setActiveBill(res.data);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Pending Orders (Awaiting SELL Confirmation)
        </h1>
        <p className="text-xs text-slate-500">
          Review pending counter orders and execute inventory deduction using the SELL action.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading pending sales...</div>
      ) : pendingSales.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-800">No Pending Orders</h3>
          <p className="text-xs text-slate-400">
            All registered orders have been finalized via SELL or no pending sales exist.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSales.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-orange-200/80 p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-900">{s.billNumber}</div>
                    <div className="text-xs text-slate-400">
                      {s.saleDate} • Customer: <strong className="text-slate-700">{s.customerName}</strong> (
                      {s.customerPhone})
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="badge-pending badge-status">PENDING ORDER</span>
                  <span className="text-xl font-black text-slate-900">₹{Number(s.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Line items preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 divide-y divide-slate-100 text-xs">
                {s.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-slate-600">
                    <span>
                      {it.productName} × <strong>{it.quantity}</strong>
                    </span>
                    <span className="font-bold text-slate-800">₹{Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-400">
                  Stock remains unchanged until SELL is executed.
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openBill(s.id)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Inspect Pro-forma Bill
                  </button>
                  <button
                    onClick={() => setSelectedSale(s)}
                    className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-orange-600/30 transition flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>CONFIRM SELL</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Sell Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-900">Confirm Order & Execute SELL</h3>
              <p className="text-xs text-slate-500">Are you sure you want to finalize this retail sale?</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-mono font-bold text-slate-900">Order: {selectedSale.billNumber}</div>
              <div className="text-slate-600">
                Customer: <strong>{selectedSale.customerName}</strong> ({selectedSale.customerPhone})
              </div>
              <div className="text-slate-600">
                Total Payable: <strong className="text-amber-700 font-black">₹{Number(selectedSale.totalAmount).toFixed(2)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                {selectedSale.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.productName} (Qty: <strong>{it.quantity}</strong>)</span>
                    <span className="font-bold">₹{Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-2 text-xs text-slate-700">
              <div className="font-black text-amber-900 uppercase tracking-wider text-[10px]">
                Execution Checklist:
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Atomically decrement product quantities from inventory</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mark order as <strong className="text-emerald-700 font-bold">CONFIRMED</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trigger real-time purchase notification via WhatsApp & SMS</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Check warehouse safety stock thresholds</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selling}
                onClick={handleExecuteSell}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-md transition disabled:opacity-50"
              >
                {selling ? 'Deducting Stock...' : 'CONFIRM SELL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Tax Invoice Modal */}
      {activeBill && <TaxInvoiceModal bill={activeBill} onClose={() => setActiveBill(null)} />}
    </div>
  );
};

export default PendingSales;

