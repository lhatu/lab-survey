import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { InspectionSurvey, SurveyDraft, SyncLogEntry } from '../types/survey';

interface VKUSurveyDB extends DBSchema {
  drafts: {
    key: string;
    value: SurveyDraft;
  };
  surveys: {
    key: string;
    value: InspectionSurvey;
    indexes: {
      'by-status': string;
      'by-timestamp': string;
    };
  };
  syncLogs: {
    key: string;
    value: SyncLogEntry;
    indexes: {
      'by-timestamp': string;
    };
  };
}

const DB_NAME = 'VKU_FieldSurvey_DB';
const DB_VERSION = 1;
const DRAFT_KEY = 'active_form_draft';

let dbPromise: Promise<IDBPDatabase<VKUSurveyDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VKUSurveyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Draft store for auto-saving form state
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }

        // Main inspection survey store
        if (!db.objectStoreNames.contains('surveys')) {
          const surveyStore = db.createObjectStore('surveys', { keyPath: 'id' });
          surveyStore.createIndex('by-status', 'syncStatus');
          surveyStore.createIndex('by-timestamp', 'createdAt');
        }

        // Sync logs store
        if (!db.objectStoreNames.contains('syncLogs')) {
          const logStore = db.createObjectStore('syncLogs', { keyPath: 'id' });
          logStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};

// Draft Operations
export const saveDraft = async (draft: SurveyDraft): Promise<void> => {
  const db = await getDB();
  await db.put('drafts', draft, DRAFT_KEY);
};

export const getDraft = async (): Promise<SurveyDraft | undefined> => {
  const db = await getDB();
  return db.get('drafts', DRAFT_KEY);
};

export const clearDraft = async (): Promise<void> => {
  const db = await getDB();
  await db.delete('drafts', DRAFT_KEY);
};

// Survey Operations
export const saveSurvey = async (survey: InspectionSurvey): Promise<string> => {
  const db = await getDB();
  await db.put('surveys', survey);
  return survey.id;
};

export const getSurveyById = async (id: string): Promise<InspectionSurvey | undefined> => {
  const db = await getDB();
  return db.get('surveys', id);
};

export const getAllSurveys = async (): Promise<InspectionSurvey[]> => {
  const db = await getDB();
  const surveys = await db.getAll('surveys');
  // Sort descending by creation date
  return surveys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPendingSurveys = async (): Promise<InspectionSurvey[]> => {
  const db = await getDB();
  const surveys = await db.getAllFromIndex('surveys', 'by-status', 'PENDING_SYNC');
  return surveys.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const updateSurveyStatus = async (
  id: string,
  status: 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED',
  extra?: { syncedAt?: string; syncErrorMessage?: string }
): Promise<void> => {
  const db = await getDB();
  const survey = await db.get('surveys', id);
  if (survey) {
    survey.syncStatus = status;
    if (extra?.syncedAt) survey.syncedAt = extra.syncedAt;
    if (extra?.syncErrorMessage !== undefined) survey.syncErrorMessage = extra.syncErrorMessage;
    await db.put('surveys', survey);
  }
};

export const deleteSurvey = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('surveys', id);
};

// Log Operations
export const addSyncLog = async (log: Omit<SyncLogEntry, 'id'>): Promise<void> => {
  const db = await getDB();
  const entry: SyncLogEntry = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
  };
  await db.put('syncLogs', entry);
};

export const getSyncLogs = async (limit = 20): Promise<SyncLogEntry[]> => {
  const db = await getDB();
  const logs = await db.getAll('syncLogs');
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const clearSyncLogs = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('syncLogs');
};
