import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { StockProgressBar } from '../components/StockProgressBar';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Edit3, Plus, Wrench, ShieldAlert } from 'lucide-react';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProductById(id);
      if (res.success && res.data) {
        setProduct(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <NavLink to="/products" className="text-amber-600 font-bold hover:underline">
          &larr; Return to Product Catalog
        </NavLink>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
        {/* Left: Product Image */}
        <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 aspect-square">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Wrench className="w-20 h-20 text-slate-300" />
          )}
        </div>

        {/* Right: Specifications & Inventory */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                {product.category || 'General Hardware'}
              </span>
              <span className="text-xs font-mono text-slate-400">SKU / ID #{product.id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="text-3xl font-black text-amber-600">
              ₹{Number(product.price).toFixed(2)}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {product.description || 'Quality hardware equipment item meeting standard specifications.'}
            </p>
          </div>

          {/* Inventory Health Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Live Warehouse Stock Metrics
            </span>
            <StockProgressBar available={product.availableQuantity} limit={product.lowStockLimit} />
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 text-slate-600">
              <div>Alert Threshold: <strong>{product.lowStockLimit} pieces</strong></div>
              <div>Alerts Enabled: <strong>{product.lowStockNotificationEnabled ? 'YES (SMS+WA)' : 'NO'}</strong></div>
            </div>
          </div>

          {/* Restock Notification */}
          {product.outOfStock && product.expectedRestockDate && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Expected restocking date: <strong>{product.expectedRestockDate}</strong></span>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin() && (
            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <NavLink
                to={`/admin/products/${product.id}/edit`}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Product</span>
              </NavLink>
              <NavLink
                to="/admin/stock"
                className="py-3 px-5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Manage Stock</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

