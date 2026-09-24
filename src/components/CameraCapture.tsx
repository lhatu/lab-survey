import React, { useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, Trash2, Upload } from 'lucide-react';

interface CameraCaptureProps {
  photoBase64?: string;
  onPhotoCaptured: (base64: string | undefined) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  photoBase64,
  onPhotoCaptured,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const takePhotoNative = async () => {
    try {
      // Downscale and compress native photos to 800px & 60% quality to avoid high memory/CPU usage
      const image = await Camera.getPhoto({
        quality: 60,
        width: 800,
        height: 800,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        const fullBase64 = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
        onPhotoCaptured(fullBase64);
      }
    } catch (error: any) {
      console.warn('Native camera capture failed or cancelled, prompting file fallback:', error);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            // Compress fallback image using HTML Canvas
            const canvas = document.createElement('canvas');
            const maxDim = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            onPhotoCaptured(compressedDataUrl);
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Facility Defect Photo Capture
      </label>

      {photoBase64 ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
          <img
            src={photoBase64}
            alt="Defect evidence"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => onPhotoCaptured(undefined)}
              className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow transition"
              title="Remove photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={takePhotoNative}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition shadow-sm"
          >
            <CameraIcon className="w-4 h-4" />
            <span>Capture Camera Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg text-sm border border-slate-300 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
        </div>
      )}

      {/* Hidden fallback HTML file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
