import { InspectionSurvey } from '../types/survey';

const MOCK_SERVER_KEY = 'vku_server_synced_records';

/**
 * Simulates server receiving synced inspection data from offline queue.
 * In a production environment, this dispatches a REST POST request to your backend endpoint (e.g., https://api.vku.edu.vn/inspections).
 */
export const dispatchSurveyToServer = async (
  survey: InspectionSurvey,
  simulatedOffline = false
): Promise<{ success: boolean; serverId: string; timestamp: string }> => {
  if (simulatedOffline) {
    throw new Error('Server unreachable: Offline network simulation enabled.');
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('Server unreachable: Device is currently offline.');
  }

  // Simulate network dispatch delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Store in simulated backend database (localStorage mock server)
  const existingRecordsStr = localStorage.getItem(MOCK_SERVER_KEY) || '[]';
  const records: InspectionSurvey[] = JSON.parse(existingRecordsStr);

  const syncedRecord = {
    ...survey,
    syncStatus: 'SYNCED' as const,
    syncedAt: new Date().toISOString(),
  };

  // Replace or add
  const index = records.findIndex((r) => r.id === survey.id);
  if (index >= 0) {
    records[index] = syncedRecord;
  } else {
    records.push(syncedRecord);
  }

  localStorage.setItem(MOCK_SERVER_KEY, JSON.stringify(records));

  return {
    success: true,
    serverId: `SERVER_REC_${survey.id.substring(0, 8)}`,
    timestamp: syncedRecord.syncedAt,
  };
};

/**
 * Fetch records stored on the mock server
 */
export const getMockServerRecords = (): InspectionSurvey[] => {
  const existingRecordsStr = localStorage.getItem(MOCK_SERVER_KEY) || '[]';
  return JSON.parse(existingRecordsStr);
};
