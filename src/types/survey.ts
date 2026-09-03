export type BuildingOption = 'Building A' | 'Building B' | 'Building C' | 'Library' | 'Admin Center' | 'Lab Complex';
export type CategoryOption = 'Hardware' | 'Projector' | 'AC Unit' | 'Electrical' | 'Furniture' | 'Network Router';
export type SyncStatus = 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface InspectionSurvey {
  id: string; // UUID
  building: BuildingOption;
  floor: string;
  roomNumber: string;
  category: CategoryOption;
  conditionRating: number; // 1 to 5 stars
  defectNotes: string;
  photoBase64?: string;
  location?: GPSLocation;
  createdAt: string; // ISO string
  syncedAt?: string; // ISO string
  syncStatus: SyncStatus;
  retryCount?: number;
  syncErrorMessage?: string;
}

export interface SurveyDraft {
  step: number;
  building: BuildingOption;
  floor: string;
  roomNumber: string;
  category: CategoryOption;
  conditionRating: number;
  defectNotes: string;
  photoBase64?: string;
  location?: GPSLocation;
  updatedAt: string;
}

export interface SyncLogEntry {
  id: string;
  surveyId: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR' | 'INFO';
  message: string;
}
