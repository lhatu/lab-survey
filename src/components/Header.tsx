import React from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  realIsOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingCount: number;
  isSyncing: boolean;
  onForceSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  realIsOnline,
  isSimulatedOffline,
  toggleSimulatedOffline,
  pendingCount,
  isSyncing,
  onForceSync,
}) => {
  return (
    <header className="bg-sky-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2 rounded-lg border border-white/20">
              <Smartphone className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg leading-tight tracking-wide">VKU Field Survey</h1>
                <span className="text-[10px] bg-sky-900 text-sky-200 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PWA & Native
                </span>
              </div>
              <p className="text-xs text-sky-200">Vietnam-Korea University of ICT Facilities Audit</p>
            </div>
          </div>

          {/* Network Controls & Sync Indicator */}
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            {/* Network Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-inner ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/40 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>OFFLINE MODE</span>
                </>
              )}
            </div>

            {/* Simulated Offline Toggle Button */}
            <button
              onClick={toggleSimulatedOffline}
              title={isSimulatedOffline ? 'Disable simulated offline mode' : 'Simulate offline environment'}
              className={`text-xs px-2.5 py-1 rounded-md transition border font-medium ${
                isSimulatedOffline
                  ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-700'
                  : 'bg-white/10 text-sky-100 border-white/20 hover:bg-white/20'
              }`}
            >
              {isSimulatedOffline ? 'Simulating Offline ⚡' : 'Simulate Offline'}
            </button>

            {/* Pending Sync Count Badge & Manual Sync */}
            {pendingCount > 0 && (
              <button
                onClick={onForceSync}
                disabled={!isOnline || isSyncing}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-3 py-1 rounded-full text-xs transition shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `${pendingCount} Pending Sync`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
