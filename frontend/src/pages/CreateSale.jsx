import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, customerApi, saleApi } from '../services/api';
import {
  User,
  Package,
  Plus,
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  Check,
  AlertCircle,
} from 'lucide-react';

export const CreateSale = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // Line items state: [{ productId, quantity, price, name, maxStock }]
  const [items, setItems] = useState([{ productId: '', quantity: 1, price: 0, name: '', maxStock: 0 }]);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes] = await Promise.all([
        productApi.getAdminProducts({ size: 200 }),
        customerApi.getCustomers({ size: 200 }),
      ]);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data.content || []);
      if (custRes.success && custRes.data) setCustomers(custRes.data.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (id) => {
    setSelectedCustomerId(id);
    if (id) {
      const cust = customers.find((c) => c.id.toString() === id.toString());
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phoneNumber);
        setCustomerAddress(cust.address);
      }
    }
  };

  const handleItemProductChange = (index, prodId) => {
    const updated = [...items];
    const prod = products.find((p) => p.id.toString() === prodId.toString());
    if (prod) {
      updated[index] = {
        productId: prod.id,
        quantity: 1,
        price: Number(prod.price),
        name: prod.name,
        maxStock: prod.availableQuantity,
      };
    } else {
      updated[index] = { productId: '', quantity: 1, price: 0, name: '', maxStock: 0 };
    }
    setItems(updated);
  };

  const handleItemQuantityChange = (index, qty) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, parseInt(qty || 1, 10));
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, price: 0, name: '', maxStock: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.productId ? it.price * it.quantity : 0), 0);
  const total = subtotal;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items
      .filter((it) => it.productId && it.quantity > 0)
      .map((it) => ({
        productId: parseInt(it.productId, 10),
        quantity: it.quantity,
      }));

    if (validItems.length === 0) {
      alert('Please select at least one product with quantity > 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod,
        notes: notes.trim(),
        items: validItems,
      };

      const res = await saleApi.createSale(payload);
      if (res.success && res.data) {
        navigate('/admin/sales/pending');
      } else {
        throw new Error(res.message || 'Failed to create sale');
      }
    } catch (err) {
      alert(err.message || 'Error creating pending sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading catalog items and customer list...</div>;
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Retail Sale / Counter Order</h1>
        <p className="text-xs text-slate-500">
          Prepare customer invoice and snapshot unit prices. Creates a PENDING order until confirmed via SELL.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer & Items */}
        <div className="lg:col-span-7 space-y-5">
          {/* Customer Selection Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                Customer Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Select Registered Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Or enter customer details below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (For WhatsApp & SMS) *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+9198XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Billing & Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Sector / Area, City, State"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Purchased Line Items Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  Purchased Products
                </h3>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs"
                >
                  <div className="flex-1 w-full">
                    <select
                      value={it.productId}
                      onChange={(e) => handleItemProductChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - ₹{Number(p.price).toFixed(2)} ({p.availableQuantity} in stock)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-center font-bold"
                      />
                    </div>
                    <div className="w-24 text-right font-black text-slate-800">
                      ₹{Number(it.price * it.quantity).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => removeItemRow(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary & Checkout */}
        <div className="lg:col-span-5 sticky top-20 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Sale Summary</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                PENDING ORDER
              </span>
            </div>

            {/* Live Line Item Preview */}
            <div className="space-y-2 text-xs text-slate-600 max-h-52 overflow-y-auto divide-y divide-slate-100">
              {items.filter((it) => it.productId).length === 0 ? (
                <div className="py-6 text-center text-slate-400">No items selected yet</div>
              ) : (
                items
                  .filter((it) => it.productId)
                  .map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1.5">
                      <span className="truncate pr-2">
                        <strong>{it.name}</strong> × {it.quantity}
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        ₹{Number(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>GST (Estimated)</span>
                <span className="font-bold text-slate-800">₹0.00</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-2xl font-black text-amber-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Intended Payment Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-2xl transition ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                      : 'border-slate-200 hover:border-amber-500 text-slate-600'
                  }`}
                >
                  <Banknote className="w-4 h-4 mb-1" />
                  <span className="text-[11px]">CASH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-2xl transition ${
                    paymentMethod === 'UPI'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                      : 'border-slate-200 hover:border-amber-500 text-slate-600'
                  }`}
                >
                  <QrCode className="w-4 h-4 mb-1" />
                  <span className="text-[11px]">UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('OTHER')}
                  className={`flex flex-col items-center justify-center p-2.5 border rounded-2xl transition ${
                    paymentMethod === 'OTHER'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                      : 'border-slate-200 hover:border-amber-500 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span className="text-[11px]">OTHER</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional delivery or quote reference..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Create Pending Sale'}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Stock is NOT deducted until confirmed via the SELL action.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;

