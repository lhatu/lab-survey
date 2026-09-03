import React, { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { GPSLocation } from '../types/survey';

interface LocationPickerProps {
  location?: GPSLocation;
  onLocationCaptured: (loc: GPSLocation | undefined) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationCaptured,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const captureGPS = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Try Capacitor Geolocation plugin
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      onLocationCaptured({
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        accuracy: Math.round(position.coords.accuracy),
        timestamp: position.timestamp,
      });
    } catch (err: any) {
      console.warn('Native geolocation failed, attempting web fallback:', err);
      // Web fallback
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            onLocationCaptured({
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
              timestamp: pos.timestamp,
            });
            setIsLoading(false);
          },
          (geoErr) => {
            setErrorMsg(`Location access denied or unavailable: ${geoErr.message}`);
            setIsLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
        return;
      } else {
        setErrorMsg('Geolocation is not supported by your browser/device.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Audit Geolocation Coordinates (GPS)
      </label>

      {location ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">
                Lat: {location.latitude}, Lon: {location.longitude}
              </p>
              <p className="text-[11px] text-emerald-700">
                Accuracy: ±{location.accuracy || 'N/A'}m • Tagged offline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLocationCaptured(undefined)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] underline font-medium"
          >
            Clear GPS
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={captureGPS}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-4 py-2.5 rounded-lg text-sm border border-slate-300 transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Acquiring GPS Fix...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-sky-600" />
                <span>Acquire Current GPS Location</span>
              </>
            )}
          </button>
          {errorMsg && (
            <p className="mt-1.5 text-xs text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
