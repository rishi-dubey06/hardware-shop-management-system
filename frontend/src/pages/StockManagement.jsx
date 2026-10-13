import React, { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import { StockProgressBar } from '../components/StockProgressBar';
import { AlertTriangle, RefreshCw, Plus, Sliders, CheckCircle2 } from 'lucide-react';

export const StockManagement = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    setLoading(true);
    try {
      const res = await productApi.getLowStockProducts();
      if (res.success && res.data) {
        setLowStockItems(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !delta) return;
    setSubmitting(true);
    try {
      const res = await productApi.updateStock(selectedProduct.id, {
        quantityChange: parseInt(delta, 10),
        reason: reason || 'Warehouse stock replenishment',
      });
      if (res.success) {
        setSelectedProduct(null);
        setDelta('');
        setReason('');
        loadLowStock();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Low Stock Alerts & Warehouse Replenishment
          </h1>
          <p className="text-xs text-slate-500">
            Products currently at or below safety alert thresholds requiring restock.
          </p>
        </div>
        <button
          onClick={loadLowStock}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading stock alerts...</div>
      ) : lowStockItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-800">All Stock Levels Healthy</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no products at or below their configured low-stock safety limits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lowStockItems.map((p) => {
            const isOut = p.availableQuantity <= 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isOut ? 'badge-out-of-stock' : 'badge-low-stock'
                      }`}
                    >
                      {isOut ? 'OUT OF STOCK' : 'LOW STOCK ALERT'}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-2">{p.name}</h3>
                    <span className="text-xs text-slate-400">{p.category || 'Hardware'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Available</span>
                    <span className={`text-xl font-black ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>
                      {p.availableQuantity}
                    </span>
                  </div>
                </div>

                <StockProgressBar available={p.availableQuantity} limit={p.lowStockLimit} />

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Threshold: <strong>{p.lowStockLimit}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Restock Product</h3>
            <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700">
              Product: <strong>{selectedProduct.name}</strong><br />
              Current Stock: <strong>{selectedProduct.availableQuantity} pieces</strong><br />
              Safety Limit: <strong>{selectedProduct.lowStockLimit} pieces</strong>
            </div>

            <form onSubmit={handleStockUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Restock Quantity (+)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Adding stock above {selectedProduct.lowStockLimit} units will re-arm the alert trigger.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Supplier restock shipment"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;

