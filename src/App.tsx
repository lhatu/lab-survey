import React, { useState } from 'react';
import { Header } from './components/Header';
import { InspectionForm } from './components/InspectionForm';
import { SurveyList } from './components/SurveyList';
import { SyncDashboard } from './components/SyncDashboard';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useSyncQueue } from './hooks/useSyncQueue';
import { ClipboardList, FileSpreadsheet, Activity, WifiOff } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'FORM' | 'RECORDS' | 'QUEUE'>('FORM');
  const { isOnline, realIsOnline, isSimulatedOffline, toggleSimulatedOffline } = useNetworkStatus();
  const {
    pendingCount,
    isSyncing,
    lastSyncTime,
    surveys,
    refreshSurveys,
    forceSyncAll,
  } = useSyncQueue(isOnline, isSimulatedOffline);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Header
        isOnline={isOnline}
        realIsOnline={realIsOnline}
        isSimulatedOffline={isSimulatedOffline}
        toggleSimulatedOffline={toggleSimulatedOffline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onForceSync={forceSyncAll}
      />

      {/* Offline banner notification if offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 font-semibold px-4 py-2 text-xs text-center flex items-center justify-center gap-2 shadow-inner">
          <WifiOff className="w-4 h-4" />
          <span>
            {isSimulatedOffline
              ? 'SIMULATED OFFLINE MODE: Inspection submissions will be saved to IndexedDB queue as PENDING_SYNC.'
              : 'OFFLINE MODE: No internet detected. All audits will auto-save locally to IndexedDB.'}
          </span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('FORM')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'FORM'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Facility Audit Form</span>
          </button>

          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'RECORDS'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Inspection Records ({surveys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'QUEUE'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sync Queue & Logs</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'FORM' && (
          <InspectionForm
            isOnline={isOnline}
            onSurveySubmitted={() => {
              refreshSurveys();
              setActiveTab('RECORDS');
            }}
          />
        )}

        {activeTab === 'RECORDS' && (
          <SurveyList surveys={surveys} onSurveysChanged={refreshSurveys} />
        )}

        {activeTab === 'QUEUE' && (
          <SyncDashboard
            pendingCount={pendingCount}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onForceSync={forceSyncAll}
            lastSyncTime={lastSyncTime}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 VKU Field Survey — Mini-Project 1 (PWA & Capacitor)</p>
          <p className="text-slate-400">Cache-First Service Worker • IndexedDB • Native Plugins</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
