import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPendingSurveys,
  updateSurveyStatus,
  addSyncLog,
  getAllSurveys,
} from '../db/database';
import { dispatchSurveyToServer } from '../api/syncApi';
import type { InspectionSurvey } from '../types/survey';

export function useSyncQueue(isOnline: boolean, isSimulatedOffline: boolean) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<InspectionSurvey[]>([]);

  const isSyncingRef = useRef<boolean>(false);

  const refreshSurveys = useCallback(async () => {
    const all = await getAllSurveys();
    setSurveys(all);
    const pending = all.filter((s) => s.syncStatus === 'PENDING_SYNC');
    setPendingCount(pending.length);
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return;

    const pendingList = await getPendingSurveys();
    if (pendingList.length === 0) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    await addSyncLog({
      surveyId: 'BATCH',
      timestamp: new Date().toISOString(),
      status: 'INFO',
      message: `Starting sequential sync of ${pendingList.length} pending survey(s)...`,
    });

    for (const survey of pendingList) {
      try {
        const result = await dispatchSurveyToServer(survey, isSimulatedOffline);
        if (result.success) {
          await updateSurveyStatus(survey.id, 'SYNCED', {
            syncedAt: result.timestamp,
          });
          await addSyncLog({
            surveyId: survey.id,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            message: `Survey ${survey.id.substring(0, 8)} (${survey.building} - ${survey.roomNumber}) synced to server successfully.`,
          });
        }
      } catch (err: any) {
        const errorMessage = err?.message || 'Unknown network error during server sync dispatch.';
        await updateSurveyStatus(survey.id, 'SYNC_FAILED', {
          syncErrorMessage: errorMessage,
        });
        await addSyncLog({
          surveyId: survey.id,
          timestamp: new Date().toISOString(),
          status: 'ERROR',
          message: `Sync failed for ${survey.id.substring(0, 8)}: ${errorMessage}`,
        });
      }
    }

    isSyncingRef.current = false;
    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString());
    await refreshSurveys();
  }, [isOnline, isSimulatedOffline, refreshSurveys]);

  // Trigger sync when online status changes to true
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);

  // Initial load
  useEffect(() => {
    refreshSurveys();
  }, [refreshSurveys]);

  return {
    pendingCount,
    isSyncing,
    lastSyncTime,
    surveys,
    refreshSurveys,
    forceSyncAll: processQueue,
  };
}
