import React, { useState, useEffect } from 'react';
import { 
  Bell, MessageSquare, Smartphone, CheckCircle2, AlertCircle, 
  RefreshCw, Search, Filter, ShieldCheck, Info, ExternalLink, Clock
} from 'lucide-react';
import { notificationApi } from '../services/api';

export default function Notifications() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationApi.getLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load notification logs:', err);
      setError(err.message || 'Unable to retrieve notification dispatch logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (channelFilter && log.channel !== channelFilter) return false;
    if (statusFilter && log.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.recipient?.toLowerCase().includes(term) ||
        log.message?.toLowerCase().includes(term) ||
        log.notificationType?.toLowerCase().includes(term) ||
        log.providerMessageId?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalSent = logs.filter(l => l.status === 'SENT' || l.status === 'DELIVERED').length;
  const totalFailed = logs.filter(l => l.status === 'FAILED').length;
  const whatsappCount = logs.filter(l => l.channel === 'WHATSAPP').length;
  const smsCount = logs.filter(l => l.channel === 'SMS').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            Live Notification Dispatch & Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time audit log of automated WhatsApp & SMS alerts for purchases, payments, and low-stock events.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Provider Architecture Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Provider Notification Architecture
            </div>
            <h2 className="text-lg font-bold">Dual-Channel Automated Dispatch</h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Spring Boot backend integrates Twilio Messages API (WhatsApp + SMS) and Meta WhatsApp Cloud API v20.0 with automatic credential detection and fail-safe logging. All purchase confirmations, payment receipts, and warehouse low-stock thresholds trigger atomic asynchronous dispatches.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-xs text-slate-400 block font-medium">Delivered</span>
              <span className="text-xl font-bold text-emerald-400">{totalSent}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-xs text-slate-400 block font-medium">Failed</span>
              <span className="text-xl font-bold text-rose-400">{totalFailed}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-xs text-slate-400 block font-medium">WhatsApp</span>
              <span className="text-xl font-bold text-emerald-400">{whatsappCount}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-xs text-slate-400 block font-medium">SMS</span>
              <span className="text-xl font-bold text-blue-400">{smsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by recipient phone, message text, or Provider ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          >
            <option value="">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="SENT">SENT / DELIVERED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Alert Type</th>
                <th className="py-3 px-4">Message Snippet</th>
                <th className="py-3 px-4">Status & Provider Ref</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Fetching dispatch audit trail...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">No notification logs recorded</p>
                    <p className="text-xs text-slate-400 mt-1">Dispatches appear when sales are confirmed or inventory dips below threshold.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {log.sentAt || log.createdAt ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(log.sentAt || log.createdAt).toLocaleDateString()}{' '}
                          {new Date(log.sentAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : '—'}
                    </td>

                    <td className="py-3 px-4">
                      {log.channel === 'WHATSAPP' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Smartphone className="w-3 h-3 text-blue-600" /> SMS
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-900 text-xs">
                      {log.recipient}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {log.notificationType}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-xs text-slate-600" title={log.message}>
                      {log.message}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        {log.status === 'SENT' || log.status === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> {log.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800" title={log.errorMessage}>
                            <AlertCircle className="w-3 h-3" /> {log.status || 'FAILED'}
                          </span>
                        )}
                        {log.providerMessageId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]" title={log.providerMessageId}>
                            ID: {log.providerMessageId}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedMessage(log)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Inspect Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Bell className="w-5 h-5 text-amber-500" />
                Notification Payload Audit
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Channel</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.channel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className={`font-semibold ${selectedMessage.status === 'SENT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedMessage.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Recipient</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedMessage.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Type</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.notificationType}</span>
                </div>
              </div>

              {selectedMessage.providerMessageId && (
                <div>
                  <span className="text-slate-400 block font-medium mb-0.5">Provider Message ID</span>
                  <div className="bg-slate-50 p-2 rounded-lg font-mono text-[11px] text-slate-700 border border-slate-200 break-all">
                    {selectedMessage.providerMessageId}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 block font-medium mb-0.5">Full Message Content</span>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              {selectedMessage.errorMessage && (
                <div>
                  <span className="text-rose-600 font-medium block mb-0.5">Failure Diagnostic</span>
                  <div className="bg-rose-50 text-rose-800 p-2.5 rounded-lg text-xs border border-rose-200">
                    {selectedMessage.errorMessage}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
