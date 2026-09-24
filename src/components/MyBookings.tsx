import React, { useState } from 'react';
import { RoomBooking } from '../types/roomBooking';
import { cancelRoomBooking } from '../db/database';
import { Calendar, Clock, Building2, User, CheckCircle2, AlertTriangle, QrCode, X, Trash2 } from 'lucide-react';

interface MyBookingsProps {
  bookings: RoomBooking[];
  onBookingsChanged: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onBookingsChanged }) => {
  const [selectedQRBooking, setSelectedQRBooking] = useState<RoomBooking | null>(null);

  const handleCancelBooking = async (id: string, roomName: string) => {
    if (window.confirm(`Are you sure you want to cancel your reservation for ${roomName}?`)) {
      await cancelRoomBooking(id);
      onBookingsChanged();
    }
  };

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Calendar className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600 text-sm">No room reservations found.</p>
          <p className="text-xs">Select a room and date in the Lab Booking tab to create your first reservation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition flex flex-col justify-between ${
                booking.status === 'CANCELLED'
                  ? 'border-slate-200 opacity-65 bg-slate-50'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header: Status & Sync Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                      booking.status === 'CANCELLED'
                        ? 'bg-slate-200 text-slate-700'
                        : booking.syncStatus === 'SYNCED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {booking.status === 'CANCELLED' ? (
                      'Cancelled'
                    ) : booking.syncStatus === 'SYNCED' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Synced
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Pending Sync
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    {booking.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setSelectedQRBooking(booking)}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-semibold"
                        title="Display digital check-in QR code"
                      >
                        <QrCode className="w-4 h-4" /> Check-in Badge
                      </button>
                    )}
                    {booking.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id, booking.roomName)}
                        className="text-slate-400 hover:text-red-600 transition"
                        title="Cancel reservation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="mt-3">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <Building2 className="w-4.5 h-4.5 text-sky-600" />
                    {booking.roomName} ({booking.building})
                  </h3>

                  <div className="mt-2 text-xs space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="font-semibold text-sky-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date: {booking.date}
                    </p>
                    <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Time: {booking.startTime} - {booking.endTime}
                    </p>
                    <p className="text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Booked by: {booking.bookedBy} ({booking.studentId}) — {booking.userRole}
                    </p>
                    <p className="text-slate-600 italic">Purpose: "{booking.purpose}"</p>
                  </div>

                  {booking.equipmentRequested && booking.equipmentRequested.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {booking.equipmentRequested.map((eq) => (
                        <span key={eq} className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100 font-medium">
                          + {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Reserved: {new Date(booking.createdAt).toLocaleString()}</span>
                <span className="font-mono text-[10px]">#{booking.id.substring(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Digital Badge Modal */}
      {selectedQRBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 p-6 text-center animate-fadeIn space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">VKU Digital Check-in Badge</h3>
              <button
                onClick={() => setSelectedQRBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated QR Code Canvas */}
            <div className="bg-sky-50 p-6 rounded-xl border border-sky-100 flex flex-col items-center justify-center space-y-2">
              <div className="w-40 h-40 bg-slate-900 rounded-lg p-2 flex items-center justify-center text-white font-mono text-[10px] shadow-md">
                <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-white rounded">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        (i * 7) % 3 === 0 || i % 2 === 0 ? 'bg-slate-950' : 'bg-sky-600'
                      } rounded-sm`}
                    />
                  ))}
                </div>
              </div>
              <p className="font-mono text-xs font-bold text-slate-800 tracking-widest mt-2">
                {selectedQRBooking.id}
              </p>
            </div>

            <div className="text-left text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">{selectedQRBooking.roomName}</p>
              <p className="text-sky-700 font-medium">
                {selectedQRBooking.date} ({selectedQRBooking.startTime} - {selectedQRBooking.endTime})
              </p>
              <p className="text-slate-600">Inspector/Student: {selectedQRBooking.bookedBy} ({selectedQRBooking.studentId})</p>
            </div>

            <button
              onClick={() => setSelectedQRBooking(null)}
              className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-xs"
            >
              Close Check-in Badge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
