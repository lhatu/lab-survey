import { useState, useEffect, useCallback } from 'react';
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

  const refreshSurveys = useCallback(async () => {
    const all = await getAllSurveys();
    setSurveys(all);
    const pending = all.filter((s) => s.syncStatus === 'PENDING_SYNC');
    setPendingCount(pending.length);
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const pendingList = await getPendingSurveys();
    if (pendingList.length === 0) {
      return;
    }

    setIsSyncing(true);
    await addSyncLog({
      surveyId: 'BATCH',
      timestamp: new Date().toISOString(),
      status: 'INFO',
      message: `Starting sequential sync of ${pendingList.length} pending survey(s)...`,
    });

    let successCount = 0;
    let failCount = 0;

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
          successCount++;
        }
      } catch (err: any) {
        failCount++;
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

    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString());
    await refreshSurveys();
  }, [isOnline, isSimulatedOffline, isSyncing, refreshSurveys]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

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
