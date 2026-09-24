import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { InspectionSurvey, SurveyDraft, SyncLogEntry } from '../types/survey';
import type { RoomBooking, VKURoom } from '../types/roomBooking';

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
  rooms: {
    key: string;
    value: VKURoom;
  };
  roomBookings: {
    key: string;
    value: RoomBooking;
    indexes: {
      'by-roomId': string;
      'by-date': string;
      'by-syncStatus': string;
    };
  };
}

const DB_NAME = 'VKU_FieldSurvey_DB';
const DB_VERSION = 2; // Incremented for Room Bookings feature
const DRAFT_KEY = 'active_form_draft';

let dbPromise: Promise<IDBPDatabase<VKUSurveyDB>> | null = null;

export const INITIAL_ROOMS: VKURoom[] = [
  {
    id: 'room_lab201',
    name: 'Computer Lab 201',
    building: 'Building A',
    floor: 'Floor 2',
    capacity: 45,
    type: 'LAB',
    amenities: ['45 High-Spec PCs', 'Laser Projector', 'Central AC', 'Gigabit Wi-Fi'],
    status: 'AVAILABLE',
    description: 'Advanced Computer Network & Software Engineering Laboratory.',
  },
  {
    id: 'room_lab202',
    name: 'AI & Data Science Lab 202',
    building: 'Building A',
    floor: 'Floor 2',
    capacity: 40,
    type: 'LAB',
    amenities: ['40 GPU Workstations', 'Smart Touch Screen', 'AC', 'Fiber Internet'],
    status: 'AVAILABLE',
    description: 'Specialized Lab for Artificial Intelligence & Deep Learning experiments.',
  },
  {
    id: 'room_b104',
    name: 'Lecture Hall B104',
    building: 'Building B',
    floor: 'Floor 1',
    capacity: 75,
    type: 'CLASSROOM',
    amenities: ['Dual Projectors', 'Wireless Sound System', 'Central AC', 'Whiteboard'],
    status: 'AVAILABLE',
    description: 'Spacious lecture hall suitable for general lectures & seminars.',
  },
  {
    id: 'room_c301',
    name: 'Smart Classroom C301',
    building: 'Building C',
    floor: 'Floor 3',
    capacity: 60,
    type: 'CLASSROOM',
    amenities: ['Interactive Board', 'Sound Pods', 'AC', 'Flexible Desks'],
    status: 'AVAILABLE',
    description: 'Interactive classroom designed for group discussions and team presentations.',
  },
  {
    id: 'room_lib_innov',
    name: 'Library Innovation Space',
    building: 'Library',
    floor: 'Floor 2',
    capacity: 30,
    type: 'INNOVATION_SPACE',
    amenities: ['Interactive Display', 'Whiteboard Wall', 'High-Speed Wi-Fi', 'Coffee Machine Access'],
    status: 'AVAILABLE',
    description: 'Open collaborative space for student start-up teams and hackathon preparation.',
  },
];

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VKUSurveyDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Draft store
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }

        // Survey store
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

        // Room Bookings stores added in v2
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('rooms')) {
            const roomStore = db.createObjectStore('rooms', { keyPath: 'id' });
            // Seed default VKU rooms
            INITIAL_ROOMS.forEach((room) => roomStore.put(room));
          }

          if (!db.objectStoreNames.contains('roomBookings')) {
            const bookingStore = db.createObjectStore('roomBookings', { keyPath: 'id' });
            bookingStore.createIndex('by-roomId', 'roomId');
            bookingStore.createIndex('by-date', 'date');
            bookingStore.createIndex('by-syncStatus', 'syncStatus');
          }
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

// -------------------------------------------------------------
// Room Booking Operations (v2)
// -------------------------------------------------------------
export const getAllRooms = async (): Promise<VKURoom[]> => {
  const db = await getDB();
  const rooms = await db.getAll('rooms');
  if (rooms.length === 0) {
    // Fallback seed if empty
    return INITIAL_ROOMS;
  }
  return rooms;
};

export const saveRoomBooking = async (booking: RoomBooking): Promise<string> => {
  const db = await getDB();
  await db.put('roomBookings', booking);
  return booking.id;
};

export const getAllRoomBookings = async (): Promise<RoomBooking[]> => {
  const db = await getDB();
  const bookings = await db.getAll('roomBookings');
  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getBookingsByRoomAndDate = async (roomId: string, date: string): Promise<RoomBooking[]> => {
  const db = await getDB();
  const allDateBookings = await db.getAllFromIndex('roomBookings', 'by-date', date);
  return allDateBookings.filter((b) => b.roomId === roomId && b.status !== 'CANCELLED');
};

export const getPendingRoomBookings = async (): Promise<RoomBooking[]> => {
  const db = await getDB();
  const bookings = await db.getAllFromIndex('roomBookings', 'by-syncStatus', 'PENDING_SYNC');
  return bookings.filter((b) => b.status !== 'CANCELLED');
};

export const cancelRoomBooking = async (id: string): Promise<void> => {
  const db = await getDB();
  const booking = await db.get('roomBookings', id);
  if (booking) {
    booking.status = 'CANCELLED';
    await db.put('roomBookings', booking);
  }
};

export const updateBookingSyncStatus = async (
  id: string,
  syncStatus: 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED',
  syncedAt?: string
): Promise<void> => {
  const db = await getDB();
  const booking = await db.get('roomBookings', id);
  if (booking) {
    booking.syncStatus = syncStatus;
    if (syncedAt) booking.syncedAt = syncedAt;
    await db.put('roomBookings', booking);
  }
};
