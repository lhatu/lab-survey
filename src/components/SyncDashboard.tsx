import React, { useState, useEffect } from 'react';
import { getSyncLogs, clearSyncLogs } from '../db/database';
import { getMockServerRecords } from '../api/syncApi';
import { SyncLogEntry, InspectionSurvey } from '../types/survey';
import { RefreshCw, Server, ShieldCheck, AlertCircle, Trash2, Clock, CheckCircle2 } from 'lucide-react';

interface SyncDashboardProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  onForceSync: () => void;
  lastSyncTime: string | null;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({
  pendingCount,
  isOnline,
  isSyncing,
  onForceSync,
  lastSyncTime,
}) => {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [serverRecords, setServerRecords] = useState<InspectionSurvey[]>([]);

  const loadDashboardData = async () => {
    const fetchedLogs = await getSyncLogs(15);
    setLogs(fetchedLogs);
    setServerRecords(getMockServerRecords());
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    await clearSyncLogs();
    await loadDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Status</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {pendingCount > 0 ? (
                <span className="text-amber-600">{pendingCount} Pending</span>
              ) : (
                <span className="text-emerald-600">All Synced</span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingCount > 0 ? 'Queued in IndexedDB' : 'No items waiting in queue'}
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              pendingCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Link</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {isOnline ? (
                <span className="text-emerald-600">Online</span>
              ) : (
                <span className="text-amber-600">Offline</span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOnline ? 'Ready for API dispatch' : 'Background Sync Queue Active'}
            </p>
          </div>
          <div className={`p-3 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Server Database</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{serverRecords.length} Items</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Last Sync: {lastSyncTime || 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-full bg-sky-100 text-sky-700">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Manual Sync Control */}
      <div className="bg-gradient-to-r from-sky-800 to-sky-900 rounded-xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Offline Queue Dispatcher</h3>
          <p className="text-xs text-sky-200 mt-0.5">
            Manually trigger background sync API sequential dispatch for pending items in IndexedDB.
          </p>
        </div>
        <button
          onClick={onForceSync}
          disabled={!isOnline || isSyncing || pendingCount === 0}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm transition shadow shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Dispatching Queue...' : 'Force Sync Queue Now'}</span>
        </button>
      </div>

      {/* Sync Activity Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" /> Synchronization Activity Logs
          </h3>
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Logs
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No sync log events recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 text-xs flex items-start gap-3 hover:bg-slate-50">
                {log.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : log.status === 'ERROR' ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-mono text-[11px] leading-relaxed">{log.message}</p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
