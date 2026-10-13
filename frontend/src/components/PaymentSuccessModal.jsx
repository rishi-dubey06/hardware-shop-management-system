import React from 'react';
import { Check, Printer } from 'lucide-react';

export const PaymentSuccessModal = ({ sale, onOpenBill, onClose }) => {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl text-center space-y-5 border border-slate-100">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <Check className="w-9 h-9" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Payment Confirmed!</h3>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            ₹{Number(sale.totalAmount).toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Customer: {sale.customerName} • {sale.billNumber}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-1 max-h-36 overflow-y-auto">
          {sale.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{it.productName} × {it.quantity}</span>
              <span className="font-bold">₹{Number(it.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenBill(sale.id)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Tax Invoice</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;

