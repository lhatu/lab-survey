import React, { useState, useEffect } from 'react';
import {
  BuildingOption,
  CategoryOption,
  InspectionSurvey,
  SurveyDraft,
  GPSLocation,
} from '../types/survey';
import { saveDraft, getDraft, clearDraft, saveSurvey } from '../db/database';
import { CameraCapture } from './CameraCapture';
import { LocationPicker } from './LocationPicker';
import {
  Star,
  Building2,
  Layers,
  DoorClosed,
  CheckCircle,
  Save,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

interface InspectionFormProps {
  onSurveySubmitted: () => void;
  isOnline: boolean;
}

const BUILDINGS: BuildingOption[] = [
  'Building A',
  'Building B',
  'Building C',
  'Library',
  'Admin Center',
  'Lab Complex',
];

const CATEGORIES: CategoryOption[] = [
  'Hardware',
  'Projector',
  'AC Unit',
  'Electrical',
  'Furniture',
  'Network Router',
];

const FLOORS = ['Basement B1', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'];

export const InspectionForm: React.FC<InspectionFormProps> = ({
  onSurveySubmitted,
  isOnline,
}) => {
  const [step, setStep] = useState<number>(1);
  const [building, setBuilding] = useState<BuildingOption>('Building A');
  const [floor, setFloor] = useState<string>('Floor 1');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [category, setCategory] = useState<CategoryOption>('Hardware');
  const [conditionRating, setConditionRating] = useState<number>(5);
  const [defectNotes, setDefectNotes] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<GPSLocation | undefined>(undefined);

  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Load existing draft on initial render
  useEffect(() => {
    const loadDraftFromDB = async () => {
      try {
        const savedDraft = await getDraft();
        if (savedDraft) {
          setStep(savedDraft.step || 1);
          setBuilding(savedDraft.building || 'Building A');
          setFloor(savedDraft.floor || 'Floor 1');
          setRoomNumber(savedDraft.roomNumber || '');
          setCategory(savedDraft.category || 'Hardware');
          setConditionRating(savedDraft.conditionRating || 5);
          setDefectNotes(savedDraft.defectNotes || '');
          setPhotoBase64(savedDraft.photoBase64);
          setLocation(savedDraft.location);
          setDraftLoaded(true);
        }
      } catch (err) {
        console.error('Error reading draft from IndexedDB:', err);
      }
    };
    loadDraftFromDB();
  }, []);

  // Auto-save draft to IndexedDB on state changes
  useEffect(() => {
    const draft: SurveyDraft = {
      step,
      building,
      floor,
      roomNumber,
      category,
      conditionRating,
      defectNotes,
      photoBase64,
      location,
      updatedAt: new Date().toISOString(),
    };
    saveDraft(draft).catch((err) => console.error('Failed to auto-save draft:', err));
  }, [step, building, floor, roomNumber, category, conditionRating, defectNotes, photoBase64, location]);

  const handleResetForm = async () => {
    await clearDraft();
    setStep(1);
    setBuilding('Building A');
    setFloor('Floor 1');
    setRoomNumber('');
    setCategory('Hardware');
    setConditionRating(5);
    setDefectNotes('');
    setPhotoBase64(undefined);
    setLocation(undefined);
    setDraftLoaded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      alert('Please enter a Room Number before submitting.');
      return;
    }

    setIsSaving(true);

    const newSurvey: InspectionSurvey = {
      id: `SURVEY_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      building,
      floor,
      roomNumber: roomNumber.trim(),
      category,
      conditionRating,
      defectNotes: defectNotes.trim(),
      photoBase64,
      location,
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING_SYNC',
    };

    try {
      await saveSurvey(newSurvey);
      await clearDraft();
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        handleResetForm();
        onSurveySubmitted();
      }, 1200);
    } catch (err) {
      console.error('Failed to save survey to IndexedDB:', err);
      alert('Failed to save survey locally into IndexedDB.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Header & Step Indicator */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-800 text-base">Facility Audit Form</h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {draftLoaded && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Sparkles className="w-3 h-3" /> Draft Restored
              </span>
            )}
            <button
              type="button"
              onClick={handleResetForm}
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium underline"
              title="Clear current draft"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* Multi-step progress dots */}
        <div className="flex items-center justify-between mt-4 max-w-xs mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                  step === s
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 rounded ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {submitSuccess ? (
        <div className="p-10 text-center space-y-3">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-slate-800">Inspection Saved Offline!</h3>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            Your survey has been stored into <strong>IndexedDB</strong> as{' '}
            <span className="text-amber-600 font-semibold">PENDING_SYNC</span>.
            {isOnline
              ? ' It is dispatcing to the VKU server...'
              : ' It will automatically sync once your connection is restored.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* STEP 1: LOCATION DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-600" /> Step 1: Location Setup
                </h3>
                <p className="text-xs text-slate-500">Select building, floor level, and room number.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Building Name
                </label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value as BuildingOption)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {BUILDINGS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Floor Level
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {FLOORS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A204, B101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!roomNumber.trim()) {
                      alert('Please enter a Room Number.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-sm"
                >
                  <span>Next: Equipment Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: EQUIPMENT CATEGORY & CONDITION */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" /> Step 2: Equipment & Star Condition
                </h3>
                <p className="text-xs text-slate-500">Choose equipment category and condition rating (1 to 5 Stars).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Equipment Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryOption)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1-5 Star Condition Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Condition Rating: {conditionRating} / 5 Star{conditionRating > 1 ? 's' : ''}
                </label>
                <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setConditionRating(star)}
                      className="p-1 hover:scale-110 transition focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= conditionRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg text-sm border border-slate-300 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-sm"
                >
                  <span>Next: Media & Notes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MEDIA EVIDENCE & NOTES */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <DoorClosed className="w-4 h-4 text-sky-600" /> Step 3: Evidence & Notes
                </h3>
                <p className="text-xs text-slate-500">Capture photo, geolocation coordinates, and detailed notes.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Defect Description & Audit Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Projector lamp flickering, AC leaking water, desk leg broken..."
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                />
              </div>

              {/* Native Camera Plugin component */}
              <CameraCapture
                photoBase64={photoBase64}
                onPhotoCaptured={(b64) => setPhotoBase64(b64)}
              />

              {/* Native Geolocation Plugin component */}
              <LocationPicker
                location={location}
                onLocationCaptured={(loc) => setLocation(loc)}
              />

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg text-sm border border-slate-300 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to DB...' : 'Save Survey Offline'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
