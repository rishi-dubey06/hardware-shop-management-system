import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { productApi } from '../services/api';
import { StockProgressBar } from '../components/StockProgressBar';
import { Search, Plus, Edit3, Trash2, Sliders, Wrench, Package } from 'lucide-react';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(true);

  // Quick Stock Adjustment Modal State
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockDelta, setStockDelta] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [submittingStock, setSubmittingStock] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [query, category, page]);

  const loadCategories = async () => {
    try {
      const res = await productApi.getCategories();
      if (res.success && res.data) setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAdminProducts({ page, size: 15, query, category });
      if (res.success && res.data) {
        setProducts(res.data.content || []);
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

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to delete product "${p.name}"?`)) return;
    try {
      const res = await productApi.deleteProduct(p.id);
      if (res.success) {
        loadProducts();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockModalProduct || !stockDelta) return;
    setSubmittingStock(true);
    try {
      const res = await productApi.updateStock(stockModalProduct.id, {
        quantityChange: parseInt(stockDelta, 10),
        reason: stockReason || 'Manual inventory adjustment',
      });
      if (res.success) {
        setStockModalProduct(null);
        setStockDelta('');
        setStockReason('');
        loadProducts();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmittingStock(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product & Warehouse Management</h1>
          <p className="text-xs text-slate-500">Maintain products, update selling prices, adjust stock, and edit alert limits.</p>
        </div>
        <NavLink
          to="/admin/products/new"
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-amber-500/25 transition flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </NavLink>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search by product name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white w-full md:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center">Available Stock</th>
                <th className="p-4 text-center w-48">Stock Ratio</th>
                <th className="p-4 text-center">Alert Limit</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No products found.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.availableQuantity <= 0;
                  const isLowStock = !isOutOfStock && p.availableQuantity <= p.lowStockLimit;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID #{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-semibold">
                          {p.category || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-900">₹{Number(p.price).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOutOfStock
                              ? 'badge-out-of-stock'
                              : isLowStock
                              ? 'badge-low-stock'
                              : 'badge-available'
                          }`}
                        >
                          {p.availableQuantity}
                        </span>
                      </td>
                      <td className="p-4">
                        <StockProgressBar available={p.availableQuantity} limit={p.lowStockLimit} />
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600">{p.lowStockLimit}</td>
                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setStockModalProduct(p)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition"
                          title="Adjust Stock"
                        >
                          + Stock
                        </button>
                        <NavLink
                          to={`/admin/products/${p.id}/edit`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-block"
                        >
                          Edit
                        </NavLink>
                        <button
                          onClick={() => handleDelete(p)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold"
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>Showing page <strong>{page + 1}</strong> of <strong>{pageData.totalPages}</strong></div>
            <div className="flex space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= pageData.totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stock Adjustment Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Adjust Warehouse Stock</h3>
            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
              Product: <strong>{stockModalProduct.name}</strong><br />
              Current Stock: <strong>{stockModalProduct.availableQuantity} pieces</strong>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  placeholder="e.g. +25 or -5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Positive number increases stock; negative decreases.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g. Fresh manufacturer shipment"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStock}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {submittingStock ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

