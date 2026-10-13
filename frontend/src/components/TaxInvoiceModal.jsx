import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { saleApi } from '../services/api';

export const TaxInvoiceModal = ({ bill, onClose }) => {
  if (!bill) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-100">
        {/* Header actions (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Tax Invoice & Cash Receipt</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <a
              href={saleApi.getBillPdfUrl(bill.saleId)}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Container */}
        <div id="printable-invoice" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner font-sans space-y-5">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest">OFFICIAL TAX INVOICE</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{bill.shopName}</h1>
              <p className="text-xs text-slate-500 mt-1">{bill.shopAddress}</p>
              <p className="text-xs text-slate-500 font-semibold">Helpdesk: {bill.shopContact}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Reference</div>
              <div className="font-mono text-base font-black text-slate-900">{bill.billNumber}</div>
              <div className="text-xs text-slate-600 mt-1">Date: <strong>{bill.saleDate}</strong></div>
              <div className="text-xs text-slate-500">{bill.saleTime || ''}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Customer):</span>
              <div className="font-extrabold text-slate-900 text-sm">{bill.customerName}</div>
              <div className="text-slate-600">Phone: {bill.customerPhone}</div>
              <div className="text-slate-600">Address: {bill.customerAddress}</div>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Summary:</span>
              <div className="text-slate-700">Channel: <strong className="uppercase">{bill.paymentMethod}</strong></div>
              <div className="text-slate-700">Status: <strong className={bill.paymentStatus === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'}>{bill.paymentStatus}</strong></div>
            </div>
          </div>

          <div className="py-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2 w-8">#</th>
                  <th className="py-2">Product Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {bill.items?.map((it, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 text-slate-800 font-bold">{it.productName}</td>
                    <td className="py-2 text-center font-bold text-slate-700">{it.quantity}</td>
                    <td className="py-2 text-right font-medium text-slate-600">₹{Number(it.unitPrice).toFixed(2)}</td>
                    <td className="py-2 text-right font-extrabold text-slate-900">₹{Number(it.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-slate-900 pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal Amount:</span>
              <span className="font-bold text-slate-800">₹{Number(bill.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>GST & Surcharges:</span>
              <span className="font-bold text-slate-800">Inclusive</span>
            </div>
            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>NET TOTAL:</span>
              <span className="text-2xl text-amber-600 font-black">₹{Number(bill.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-400">
            Thank you for shopping with {bill.shopName}!
          </div>

          {bill.printableReceiptText && (
            <details className="text-[11px] text-slate-400 no-print mt-4">
              <summary className="cursor-pointer hover:text-slate-600 font-bold">Show Plain-Text Monospace Counter Slip</summary>
              <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto mt-2 leading-relaxed">
                {bill.printableReceiptText}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxInvoiceModal;

