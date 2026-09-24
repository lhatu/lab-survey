import React from 'react';
import { TimeSlot, RoomBooking } from '../types/roomBooking';
import { VKU_TIME_SLOTS } from '../api/roomBookingApi';
import { Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';

interface TimeSlotPickerProps {
  selectedDate: string;
  existingBookings: RoomBooking[];
  onSelectSlot: (slot: TimeSlot) => void;
  selectedSlotId?: string;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  existingBookings,
  onSelectSlot,
  selectedSlotId,
}) => {
  // Check if a time slot is reserved
  const getSlotStatus = (slot: TimeSlot) => {
    const booking = existingBookings.find(
      (b) =>
        b.status !== 'CANCELLED' &&
        b.startTime === slot.startTime &&
        b.endTime === slot.endTime
    );
    return booking;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sky-600" /> LibCal Realtime Time Slots ({selectedDate})
        </label>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available
          </span>
          <span className="flex items-center gap-1 text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Reserved
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Pending Sync
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {VKU_TIME_SLOTS.map((slot) => {
          const booking = getSlotStatus(slot);
          const isReserved = !!booking;
          const isSelected = selectedSlotId === slot.id;
          const isPending = booking?.syncStatus === 'PENDING_SYNC';

          return (
            <button
              key={slot.id}
              type="button"
              disabled={isReserved}
              onClick={() => onSelectSlot(slot)}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300'
                  : isReserved
                  ? isPending
                    ? 'bg-amber-50 border-amber-200 text-amber-900 cursor-not-allowed opacity-90'
                    : 'bg-red-50 border-red-200 text-red-900 cursor-not-allowed opacity-90'
                  : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm tracking-tight">{slot.label}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isReserved ? (
                  isPending ? (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[10px] bg-red-200 text-red-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
                      Reserved
                    </span>
                  )
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Free
                  </span>
                )}
              </div>

              {booking ? (
                <div className="mt-2 pt-2 border-t border-red-200/60 text-xs space-y-0.5">
                  <p className="font-semibold truncate flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0" /> {booking.bookedBy} ({booking.studentId})
                  </p>
                  <p className="text-[11px] opacity-80 truncate">"{booking.purpose}"</p>
                </div>
              ) : (
                <p
                  className={`mt-2 text-[11px] ${
                    isSelected ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  Click to select this time slot
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
