import React, { useState, useEffect } from 'react';
import { Printer, Download, X, Share2, MessageSquare, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { saleApi } from '../services/api';

export const TaxInvoiceModal = ({ bill: initialBill, saleId, isOpen = true, onClose }) => {
  const [bill, setBill] = useState(initialBill || null);
  const [loading, setLoading] = useState(!initialBill && Boolean(saleId));
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialBill) {
      setBill(initialBill);
      setLoading(false);
      return;
    }

    if (saleId && isOpen) {
      setLoading(true);
      setError(null);
      saleApi.getBill(saleId)
        .then((res) => {
          if (res.success && res.data) {
            setBill(res.data);
          } else if (res.data) {
            setBill(res.data);
          } else {
            setBill(res);
          }
        })
        .catch((err) => {
          console.error('Failed to load bill:', err);
          setError(err.message || 'Could not load bill data');
        })
        .finally(() => setLoading(false));
    }
  }, [initialBill, saleId, isOpen]);

  if (!isOpen) return null;

  const currentSaleId = bill?.saleId || saleId;

  const handleShareWhatsApp = () => {
    if (bill?.whatsappShareUrl) {
      window.open(bill.whatsappShareUrl, '_blank', 'noopener,noreferrer');
    } else if (bill) {
      const msg = encodeURIComponent(
        `Tax Invoice from ${bill.shopName}\nBill No: ${bill.billNumber}\nCustomer: ${bill.customerName}\nTotal: ₹${Number(bill.totalAmount || 0).toFixed(2)}\nPayment: ${bill.paymentStatus || 'CONFIRMED'}`
      );
      const phone = (bill.customerPhone || '').replace(/[^0-9]/g, '');
      const url = phone ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareSms = () => {
    if (bill?.smsShareUrl) {
      window.location.href = bill.smsShareUrl;
    } else if (bill) {
      const phone = (bill.customerPhone || '').replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(`Bill from ${bill.shopName}: No ${bill.billNumber}, Total ₹${Number(bill.totalAmount || 0).toFixed(2)}`);
      window.location.href = `sms:${phone ? `+91${phone.slice(-10)}` : ''}?body=${msg}`;
    }
  };

  const handleCopyText = () => {
    if (bill?.printableReceiptText) {
      navigator.clipboard.writeText(bill.printableReceiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header Actions (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2 no-print shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Official GST Tax Invoice & Bill
            </span>
            {bill?.billNumber && (
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                {bill.billNumber}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* WhatsApp 1-Click Share Button */}
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition active:scale-95"
              title="Send formatted bill on WhatsApp to customer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            {/* SMS Share Button */}
            <button
              onClick={handleShareSms}
              type="button"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition active:scale-95"
              title="Send bill link via SMS"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              type="button"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center space-x-1.5 transition"
              title="Print standard Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* PDF Download Button */}
            {currentSaleId && (
              <a
                href={saleApi.getBillPdfUrl(currentSaleId)}
                target="_blank"
                rel="noreferrer"
                download={`Invoice-${bill?.billNumber || currentSaleId}.pdf`}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition"
                title="Download authentic GST Tax Invoice PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Generating official tax invoice...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
              <p className="text-sm font-bold text-rose-700">Error loading invoice</p>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          ) : bill ? (
            <div id="printable-invoice" className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-300 shadow-xs font-sans space-y-4 text-slate-900">
              
              {/* 1. Header: Shop Name & GST Details */}
              <div className="text-center border-b border-slate-300 pb-4 space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                  {bill.shopName || 'XYZ HARDWARE & SANITARY STORE'}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Dealers in Tools, Pipes, Sanitary, Paints, Electricals & Construction Materials
                </p>
                <p className="text-[11px] text-slate-500">
                  {bill.shopAddress || 'Shop #12, Central Hardware Market, Sector 18, Greater Noida, UP'} • Contact: <strong>{bill.shopContact || '+91 98765 43210'}</strong>
                </p>
                <div className="inline-flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-700">
                  <span>GSTIN: <span className="font-mono text-slate-900">{bill.shopGstin || '09AABCU9603R1ZM'}</span></span>
                  <span>•</span>
                  <span>State: {bill.shopState || '09 - Uttar Pradesh'}</span>
                </div>
              </div>

              {/* 2. Banner: Tax Invoice / Cash Memo */}
              <div className="bg-slate-900 text-white text-center py-1.5 rounded-lg text-xs font-black tracking-widest uppercase">
                TAX INVOICE  /  CASH MEMO (ORIGINAL FOR RECIPIENT)
              </div>

              {/* 3. Metadata Grid: 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Customer):</span>
                  <div className="font-black text-slate-950 text-sm">{bill.customerName || 'Walk-in Customer'}</div>
                  <div className="text-slate-600">Mobile: <strong className="text-slate-900 font-mono">{bill.customerPhone || 'N/A'}</strong></div>
                  <div className="text-slate-600">Address: {bill.customerAddress || 'Local Counter Sale'}</div>
                  <div className="text-[11px] text-slate-500">Place of Supply: {bill.shopState || 'Uttar Pradesh (09)'}</div>
                </div>

                <div className="space-y-1 sm:text-right sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Particulars:</span>
                  <div>Invoice / Bill No: <strong className="font-mono font-black text-slate-900">{bill.billNumber}</strong></div>
                  <div>Invoice Date: <strong className="text-slate-800">{bill.saleDate}</strong></div>
                  <div>Time of Supply: <strong className="text-slate-800">{bill.saleTime || 'N/A'}</strong></div>
                  <div>
                    Payment Mode: <strong className="uppercase text-slate-900">{bill.paymentMethod || 'CASH'}</strong> (
                    <span className={bill.paymentStatus === 'SUCCESS' || bill.paymentStatus === 'CONFIRMED' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {bill.paymentStatus || 'CONFIRMED'}
                    </span>)
                  </div>
                </div>
              </div>

              {/* 4. Itemized Goods Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description of Goods</th>
                      <th className="py-2.5 px-2 text-center">HSN</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {bill.items?.map((it, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{it.productName}</div>
                          {it.productCategory && (
                            <div className="text-[10px] text-slate-400 font-medium">[{it.productCategory}]</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">{it.hsnCode || '7326'}</td>
                        <td className="py-2 px-3 text-center font-black text-slate-800">{it.quantity}</td>
                        <td className="py-2 px-3 text-right text-slate-700 font-mono">₹{Number(it.unitPrice).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">₹{Number(it.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5. Summary & Tax Calculations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Left: Words, Terms & Bank Details */}
                <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2 bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Chargeable (in words):</span>
                    <span className="font-black text-slate-900 italic text-[11px]">{bill.totalInWords || 'Rupees Only'}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                    <strong className="text-slate-700 block">Bank & UPI Payment Details:</strong>
                    <div>Bank: State Bank of India | A/C: 39820011002233</div>
                    <div>IFSC: SBIN0001234 | UPI: {(bill.shopContact || '').replace(/[^0-9]/g, '')}@upi</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                    <strong className="text-slate-700 block">Terms & Conditions:</strong>
                    <div>1. Goods once sold can be exchanged within 7 days with original invoice.</div>
                    <div>2. Warranty claims are subject to manufacturer terms.</div>
                    <div>3. All disputes subject to local jurisdiction.</div>
                  </div>
                </div>

                {/* Right: Calculations Table */}
                <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 bg-white flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Taxable Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ₹{Number(bill.subtotalAmount || (bill.totalAmount / 1.18)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>CGST @ 9%:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ₹{Number(bill.cgstAmount || ((bill.totalAmount - (bill.totalAmount / 1.18)) / 2)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>SGST @ 9%:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ₹{Number(bill.sgstAmount || ((bill.totalAmount - (bill.totalAmount / 1.18)) / 2)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold text-slate-800">₹0.00</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <span className="font-black text-slate-900 text-sm">GRAND TOTAL:</span>
                    <span className="font-black text-amber-700 text-xl font-mono">
                      ₹{Number(bill.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Signatures Section */}
              <div className="grid grid-cols-2 pt-6 pb-2 text-xs">
                <div className="space-y-8">
                  <div className="text-slate-400">___________________________</div>
                  <div className="font-bold text-slate-600 text-[11px]">Customer's Signature</div>
                </div>
                <div className="text-right space-y-8">
                  <div className="font-bold text-slate-900 text-[11px]">For {bill.shopName?.toUpperCase()}</div>
                  <div className="text-slate-400">___________________________</div>
                  <div className="font-bold text-slate-600 text-[11px]">Authorized Signatory (Seal & Sign)</div>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
                This is a Computer Generated Tax Invoice. Thank you for shopping with {bill.shopName}!
              </div>

              {/* Plain-Text Monospace Slip (Optional for POS receipt printer) */}
              {bill.printableReceiptText && (
                <details className="text-[11px] text-slate-400 no-print mt-4 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer hover:text-slate-700 font-bold flex items-center justify-between">
                    <span>Show Plain-Text Thermal Printer Slip</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyText();
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded border border-slate-200 font-normal"
                    >
                      {copied ? 'Copied!' : 'Copy Slip'}
                    </button>
                  </summary>
                  <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto mt-2 leading-relaxed">
                    {bill.printableReceiptText}
                  </pre>
                </details>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TaxInvoiceModal;
