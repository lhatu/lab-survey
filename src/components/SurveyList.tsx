import React, { useState } from 'react';
import { InspectionSurvey } from '../types/survey';
import { deleteSurvey } from '../db/database';
import {
  Building2,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface SurveyListProps {
  surveys: InspectionSurvey[];
  onSurveysChanged: () => void;
}

export const SurveyList: React.FC<SurveyListProps> = ({ surveys, onSurveysChanged }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SYNCED'>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const filteredSurveys = surveys.filter((s) => {
    if (filter === 'PENDING') return s.syncStatus === 'PENDING_SYNC';
    if (filter === 'SYNCED') return s.syncStatus === 'SYNCED';
    return true;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inspection record from IndexedDB?')) {
      await deleteSurvey(id);
      onSurveysChanged();
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Audits ({surveys.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Sync ({surveys.filter((s) => s.syncStatus === 'PENDING_SYNC').length})
          </button>
          <button
            onClick={() => setFilter('SYNCED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'SYNCED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Synced ({surveys.filter((s) => s.syncStatus === 'SYNCED').length})
          </button>
        </div>
      </div>

      {/* Survey List Cards */}
      {filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Building2 className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600 text-sm">No facility audit reports found.</p>
          <p className="text-xs">Use the Audit Form tab to conduct and save local inspections offline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Status & Date */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        survey.syncStatus === 'SYNCED'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : survey.syncStatus === 'SYNC_FAILED'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {survey.syncStatus === 'SYNCED' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Synced
                        </>
                      ) : survey.syncStatus === 'SYNC_FAILED' ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Sync Error
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Pending Sync
                        </>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      #{survey.id.substring(0, 8)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="text-slate-400 hover:text-red-600 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Location & Room */}
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                      <Building2 className="w-4.5 h-4.5 text-sky-600" />
                      {survey.building} — Room {survey.roomNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{survey.floor}</p>
                  </div>

                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {survey.category}
                  </span>
                </div>

                {/* Condition Rating Stars */}
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-xs text-slate-500 mr-1 font-medium">Condition:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= survey.conditionRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Defect Notes */}
                {survey.defectNotes && (
                  <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                    "{survey.defectNotes}"
                  </p>
                )}

                {/* Photo & GPS info */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  {survey.photoBase64 ? (
                    <button
                      onClick={() => setSelectedPhoto(survey.photoBase64 || null)}
                      className="flex items-center gap-1 text-sky-600 hover:underline font-medium"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> View Photo Evidence
                    </button>
                  ) : (
                    <span className="text-slate-400">No Photo</span>
                  )}

                  {survey.location && (
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                      <MapPin className="w-3 h-3" /> GPS: {survey.location.latitude},{' '}
                      {survey.location.longitude}
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamp footer */}
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created: {new Date(survey.createdAt).toLocaleString()}</span>
                {survey.syncedAt && (
                  <span className="text-emerald-600">
                    Synced: {new Date(survey.syncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing full size photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-xl w-full bg-white rounded-xl overflow-hidden shadow-2xl p-2">
            <img src={selectedPhoto} alt="Audit Evidence" className="w-full h-auto rounded-lg" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="mt-2 w-full bg-slate-900 text-white text-xs py-2 rounded font-semibold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
