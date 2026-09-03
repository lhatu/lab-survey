import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Check initial network status via Capacitor Network plugin
    const checkNetwork = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      } catch (err) {
        // Fallback to browser navigator
        setIsOnline(navigator.onLine);
      }
    };

    checkNetwork();

    // Listen to Capacitor Network status changes
    let networkListener: any;
    try {
      networkListener = Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      });
    } catch (err) {
      // Ignore if not in capacitor runtime
    }

    // Web Fallback listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (networkListener && typeof networkListener.remove === 'function') {
        networkListener.remove();
      }
    };
  }, []);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  // Effective status considers real network status and simulated toggle
  const effectiveOnline = isOnline && !isSimulatedOffline;

  return {
    isOnline: effectiveOnline,
    realIsOnline: isOnline,
    isSimulatedOffline,
    connectionType,
    toggleSimulatedOffline,
  };
}
