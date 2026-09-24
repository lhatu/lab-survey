import React, { useState } from 'react';
import { VKURoom, TimeSlot, RoomBooking } from '../types/roomBooking';
import { checkTimeSlotConflict, dispatchBookingToServer } from '../api/roomBookingApi';
import { saveRoomBooking, addSyncLog } from '../db/database';
import { Calendar, Clock, Building2, X, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BookingModalProps {
  room: VKURoom;
  date: string;
  slot: TimeSlot;
  isOnline: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

const EQUIPMENT_OPTIONS = [
  'Extra Projector Lamp',
  'Wireless Microphone & Speaker',
  'Laptop Set (5 Units)',
  'Whiteboard Markers & Erasers',
  'Extension Power Cables',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  room,
  date,
  slot,
  isOnline,
  onClose,
  onBookingSuccess,
}) => {
  const [bookedBy, setBookedBy] = useState('');
  const [studentId, setStudentId] = useState('');
  const [userRole, setUserRole] = useState<'STUDENT' | 'LECTURER' | 'STAFF'>('STUDENT');
  const [purpose, setPurpose] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookedBy.trim() || !studentId.trim() || !purpose.trim()) {
      alert('Please fill in all required fields (Name, Student/Staff ID, Purpose).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // 1. Conflict checking
    const conflictResult = await checkTimeSlotConflict(room.id, date, slot.startTime, slot.endTime);
    if (conflictResult.hasConflict) {
      setErrorMessage(conflictResult.message || 'Selected time slot is already reserved.');
      setIsSubmitting(false);
      return;
    }

    // 2. Build booking object
    const newBooking: RoomBooking = {
      id: `BOOK_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      roomId: room.id,
      roomName: room.name,
      building: room.building,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedBy: bookedBy.trim(),
      studentId: studentId.trim(),
      userRole,
      purpose: purpose.trim(),
      equipmentRequested: selectedEquipment,
      status: 'CONFIRMED',
      syncStatus: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
    };

    try {
      // Save locally to IndexedDB
      await saveRoomBooking(newBooking);

      // Attempt to dispatch to mock server if online
      if (isOnline) {
        try {
          const res = await dispatchBookingToServer(newBooking);
          if (res.success) {
            newBooking.syncStatus = 'SYNCED';
            newBooking.syncedAt = res.timestamp;
            await saveRoomBooking(newBooking);
            await addSyncLog({
              surveyId: newBooking.id,
              timestamp: new Date().toISOString(),
              status: 'SUCCESS',
              message: `Room Booking ${newBooking.roomName} (${newBooking.date} ${newBooking.startTime}-${newBooking.endTime}) synced to server.`,
            });
          }
        } catch (err: any) {
          console.warn('Backend sync failed, saved as PENDING_SYNC:', err);
        }
      }

      onBookingSuccess();
    } catch (err: any) {
      setErrorMessage('Failed to save reservation into local database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-700 to-sky-800 p-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-sky-900/80 text-sky-200 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              VKU Robin / LibCal Reservation
            </span>
            <h3 className="text-lg font-bold mt-1">{room.name}</h3>
            <p className="text-xs text-sky-100 flex items-center gap-2 mt-0.5">
              <span>{room.building} ({room.floor})</span> •
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <Calendar className="w-3 h-3" /> {date} ({slot.startTime} - {slot.endTime})
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sky-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nguyen Van A"
                value={bookedBy}
                onChange={(e) => setBookedBy(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student / Staff ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 21IT001 or VKU-TEA-05"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              User Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['STUDENT', 'LECTURER', 'STAFF'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRole(r)}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    userRole === r
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Booking Purpose / Course *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Dev Hackathon, Group Presentation Practice, AI Lab Work"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            />
          </div>

          {/* Additional Equipment Request */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Request Additional Equipment (Optional)
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
              {EQUIPMENT_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(item)}
                    onChange={() => toggleEquipment(item)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Reserving Slot...' : 'Confirm Reservation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
