import React from 'react';

export const StockProgressBar = ({ available, limit }) => {
  const qty = Number(available) || 0;
  const lim = Number(limit) || 10;
  const maxThreshold = Math.max(qty, lim * 2.5, 20);
  const pct = qty > 0 ? Math.min(100, Math.max(8, Math.round((qty / maxThreshold) * 100))) : 0;

  let barColor = 'bg-emerald-500';
  let statusText = `${qty} in stock`;
  let textClass = 'text-emerald-700';

  if (qty <= 0) {
    barColor = 'bg-rose-500';
    statusText = 'Out of Stock';
    textClass = 'text-rose-600';
  } else if (qty <= lim) {
    barColor = 'bg-amber-500';
    statusText = `Low: ${qty} / ${lim} threshold`;
    textClass = 'text-amber-700';
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className={`${textClass} flex items-center space-x-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${barColor}`}></span>
          <span>{statusText}</span>
        </span>
        <span className="text-slate-400 font-mono text-[10px]">
          {qty} / {Math.round(maxThreshold)} max
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
        <div
          className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default StockProgressBar;

