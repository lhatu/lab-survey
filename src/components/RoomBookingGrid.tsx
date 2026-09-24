import React, { useState, useEffect, useCallback } from 'react';
import { VKURoom, TimeSlot, RoomBooking } from '../types/roomBooking';
import { getAllRooms, getBookingsByRoomAndDate, getAllRoomBookings } from '../db/database';
import { TimeSlotPicker } from './TimeSlotPicker';
import { BookingModal } from './BookingModal';
import { MyBookings } from './MyBookings';
import {
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
  BookOpen,
} from 'lucide-react';

interface RoomBookingGridProps {
  isOnline: boolean;
}

export const RoomBookingGrid: React.FC<RoomBookingGridProps> = ({ isOnline }) => {
  const [subTab, setSubTab] = useState<'GRID' | 'MY_BOOKINGS'>('GRID');
  const [rooms, setRooms] = useState<VKURoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room_lab201');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');

  const [existingBookings, setExistingBookings] = useState<RoomBooking[]>([]);
  const [allBookings, setAllBookings] = useState<RoomBooking[]>([]);

  const [activeSlotModal, setActiveSlotModal] = useState<TimeSlot | null>(null);

  const loadData = useCallback(async () => {
    const loadedRooms = await getAllRooms();
    setRooms(loadedRooms);

    const roomBookings = await getBookingsByRoomAndDate(selectedRoomId, selectedDate);
    setExistingBookings(roomBookings);

    const all = await getAllRoomBookings();
    setAllBookings(all);
  }, [selectedRoomId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const filteredRooms = rooms.filter((r) => {
    if (buildingFilter !== 'ALL' && r.building !== buildingFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 text-xs font-semibold">
          <button
            onClick={() => setSubTab('GRID')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              subTab === 'GRID'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Robin / LibCal Realtime Slot Grid</span>
          </button>

          <button
            onClick={() => setSubTab('MY_BOOKINGS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              subTab === 'MY_BOOKINGS'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Reservations ({allBookings.filter((b) => b.status !== 'CANCELLED').length})</span>
          </button>
        </div>
      </div>

      {subTab === 'MY_BOOKINGS' ? (
        <MyBookings bookings={allBookings} onBookingsChanged={loadData} />
      ) : (
        <div className="space-y-6">
          {/* Controls: Building Filter & Date Picker */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Date Selection */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-sky-500 font-bold text-slate-800"
                />
              </div>

              {/* Building Filters */}
              <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['ALL', 'Building A', 'Building B', 'Building C', 'Library'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBuildingFilter(b)}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                      buildingFilter === b
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {b === 'ALL' ? 'All Buildings' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
              {filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 truncate">{room.name}</span>
                      <span className="text-[10px] bg-slate-100 font-semibold px-1.5 py-0.5 rounded text-slate-600">
                        {room.building}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" /> {room.capacity} seats
                      </span>
                      <span className="text-sky-700 font-medium">{room.type}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Room Details Header */}
          {selectedRoom && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedRoom.name}</h2>
                  <span className="text-xs bg-sky-500/20 text-sky-200 px-2.5 py-0.5 rounded-full border border-sky-400/30 font-semibold">
                    {selectedRoom.building} • {selectedRoom.floor}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{selectedRoom.description}</p>

                {/* Amenities */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedRoom.amenities.map((item) => (
                    <span
                      key={item}
                      className="text-[11px] bg-white/10 text-sky-200 px-2.5 py-0.5 rounded-full border border-white/10"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-lg border border-white/10 text-center shrink-0 w-full md:w-auto">
                <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Room Capacity</p>
                <p className="text-2xl font-extrabold text-sky-300 mt-0.5">{selectedRoom.capacity} Seats</p>
              </div>
            </div>
          )}

          {/* Robin / LibCal Realtime Time Slot Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <TimeSlotPicker
              selectedDate={selectedDate}
              existingBookings={existingBookings}
              onSelectSlot={(slot) => setActiveSlotModal(slot)}
            />
          </div>
        </div>
      )}

      {/* Booking Reservation Modal */}
      {activeSlotModal && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          date={selectedDate}
          slot={activeSlotModal}
          isOnline={isOnline}
          onClose={() => setActiveSlotModal(null)}
          onBookingSuccess={() => {
            setActiveSlotModal(null);
            loadData();
            setSubTab('MY_BOOKINGS');
          }}
        />
      )}
    </div>
  );
};
