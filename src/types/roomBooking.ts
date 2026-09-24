export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';
export type BookingSyncStatus = 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';

export interface RoomAmenity {
  id: string;
  name: string;
  iconName: string;
}

export interface VKURoom {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  type: 'LAB' | 'CLASSROOM' | 'AUDITORIUM' | 'INNOVATION_SPACE';
  amenities: string[]; // e.g. ['40 PCs', 'Projector', 'Air Conditioner', 'Smart Board']
  status: RoomStatus;
  description?: string;
  imageUrl?: string;
}

export interface TimeSlot {
  id: string;
  startTime: string; // "07:00"
  endTime: string;   // "08:30"
  label: string;     // "Slot 1 (07:00 - 08:30)"
}

export interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  building: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  bookedBy: string;
  studentId: string;
  userRole: 'STUDENT' | 'LECTURER' | 'STAFF';
  purpose: string;
  equipmentRequested?: string[];
  status: BookingStatus;
  syncStatus: BookingSyncStatus;
  createdAt: string; // ISO string
  syncedAt?: string;
}

export interface BookingConflictResult {
  hasConflict: boolean;
  conflictingBooking?: RoomBooking;
  message?: string;
}
