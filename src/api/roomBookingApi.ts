import { RoomBooking, TimeSlot, BookingConflictResult } from '../types/roomBooking';
import { getBookingsByRoomAndDate } from '../db/database';

const MOCK_BOOKINGS_SERVER_KEY = 'vku_server_synced_room_bookings';

export const VKU_TIME_SLOTS: TimeSlot[] = [
  { id: 'slot_1', startTime: '07:00', endTime: '08:30', label: 'Slot 1 (07:00 - 08:30)' },
  { id: 'slot_2', startTime: '08:45', endTime: '10:15', label: 'Slot 2 (08:45 - 10:15)' },
  { id: 'slot_3', startTime: '10:30', endTime: '12:00', label: 'Slot 3 (10:30 - 12:00)' },
  { id: 'slot_4', startTime: '13:00', endTime: '14:30', label: 'Slot 4 (13:00 - 14:30)' },
  { id: 'slot_5', startTime: '14:45', endTime: '16:15', label: 'Slot 5 (14:45 - 16:15)' },
  { id: 'slot_6', startTime: '16:30', endTime: '18:00', label: 'Slot 6 (16:30 - 18:00)' },
];

/**
 * Checks for time slot overlap conflicts for a room on a given date.
 */
export const checkTimeSlotConflict = async (
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  ignoreBookingId?: string
): Promise<BookingConflictResult> => {
  const existingBookings = await getBookingsByRoomAndDate(roomId, date);

  // Convert "HH:mm" to minutes for numeric comparison
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  for (const booking of existingBookings) {
    if (ignoreBookingId && booking.id === ignoreBookingId) continue;
    if (booking.status === 'CANCELLED') continue;

    const existStart = timeToMinutes(booking.startTime);
    const existEnd = timeToMinutes(booking.endTime);

    // Overlap condition: (StartA < EndB) AND (EndA > StartB)
    if (newStart < existEnd && newEnd > existStart) {
      return {
        hasConflict: true,
        conflictingBooking: booking,
        message: `Conflict detected: Reserved by ${booking.bookedBy} (${booking.startTime} - ${booking.endTime}) for ${booking.purpose}`,
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Dispatches room reservation to simulated VKU backend server.
 */
export const dispatchBookingToServer = async (
  booking: RoomBooking,
  simulatedOffline = false
): Promise<{ success: boolean; serverBookingId: string; timestamp: string }> => {
  if (simulatedOffline) {
    throw new Error('Server unreachable: Simulated offline mode active.');
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('Server unreachable: Device is currently offline.');
  }

  // Simulate network dispatch delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const existingRecordsStr = localStorage.getItem(MOCK_BOOKINGS_SERVER_KEY) || '[]';
  const records: RoomBooking[] = JSON.parse(existingRecordsStr);

  const syncedRecord = {
    ...booking,
    syncStatus: 'SYNCED' as const,
    syncedAt: new Date().toISOString(),
  };

  const index = records.findIndex((b) => b.id === booking.id);
  if (index >= 0) {
    records[index] = syncedRecord;
  } else {
    records.push(syncedRecord);
  }

  localStorage.setItem(MOCK_BOOKINGS_SERVER_KEY, JSON.stringify(records));

  return {
    success: true,
    serverBookingId: `VKU_RES_${booking.id.substring(0, 8)}`,
    timestamp: syncedRecord.syncedAt,
  };
};

/**
 * Gets reservations stored on mock server
 */
export const getMockServerBookings = (): RoomBooking[] => {
  const existingRecordsStr = localStorage.getItem(MOCK_BOOKINGS_SERVER_KEY) || '[]';
  return JSON.parse(existingRecordsStr);
};
