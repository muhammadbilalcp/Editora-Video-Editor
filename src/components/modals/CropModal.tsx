import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { X, Crop, Check, RotateCcw, Smartphone, Monitor, Square } from 'lucide-react';

export const CropModal: React.FC = () => {
  const {
    isCropModalOpen,
    cropClipId,
    closeCropModal,
    project,
    updateClipTransform,
    showToast,
  } = useEditor();

  const selectedClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === cropClipId);

  const initialCrop = selectedClip?.transform?.crop || { x: 0, y: 0, width: 100, height: 100 };

  const [cropX, setCropX] = useState(initialCrop.x || 0);
  const [cropY, setCropY] = useState(initialCrop.y || 0);
  const [cropWidth, setCropWidth] = useState(initialCrop.width || 100);
  const [cropHeight, setCropHeight] = useState(initialCrop.height || 100);

  useEffect(() => {
    if (selectedClip?.transform?.crop) {
      setCropX(selectedClip.transform.crop.x);
      setCropY(selectedClip.transform.crop.y);
      setCropWidth(selectedClip.transform.crop.width);
      setCropHeight(selectedClip.transform.crop.height);
    } else {
      setCropX(0);
      setCropY(0);
      setCropWidth(100);
      setCropHeight(100);
    }
  }, [selectedClip]);

  if (!isCropModalOpen || !selectedClip) return null;

  const handleApplyPreset = (preset: 'free' | '1:1' | '16:9' | '9:16' | '4:5') => {
    if (preset === 'free') {
      setCropX(0); setCropY(0); setCropWidth(100); setCropHeight(100);
    } else if (preset === '1:1') {
      setCropX(10); setCropY(10); setCropWidth(80); setCropHeight(80);
    } else if (preset === '16:9') {
      setCropX(0); setCropY(15); setCropWidth(100); setCropHeight(56.25);
    } else if (preset === '9:16') {
      setCropX(22); setCropY(0); setCropWidth(56.25); setCropHeight(100);
    } else if (preset === '4:5') {
      setCropX(10); setCropY(0); setCropWidth(80); setCropHeight(100);
    }
  };

  const handleSaveCrop = () => {
    updateClipTransform(selectedClip.id, {
      crop: {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      },
    });
    showToast('Applied crop settings');
    closeCropModal();
  };

  const handleResetCrop = () => {
    setCropX(0);
    setCropY(0);
    setCropWidth(100);
    setCropHeight(100);
    updateClipTransform(selectedClip.id, { crop: undefined });
    showToast('Reset crop to full frame');
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl flex flex-col space-y-4">
        <button
          onClick={closeCropModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Crop className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Crop Canvas: {selectedClip.name}
          </h2>
        </div>

        {/* Visual Crop Preview Canvas */}
        <div className="relative w-full aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
          {selectedClip.type === 'video' || selectedClip.type === 'media' ? (
            <video src={selectedClip.src} className="w-full h-full object-contain opacity-40" />
          ) : selectedClip.type === 'giphy' || selectedClip.type === 'image' ? (
            <img src={selectedClip.src} className="w-full h-full object-contain opacity-40" alt="Preview" />
          ) : (
            <div className="text-xs text-neutral-500 font-mono">Clip Frame Preview</div>
          )}

          {/* Interactive Bounding Box */}
          <div
            className="absolute border-2 border-amber-400 bg-amber-400/10 shadow-xl transition-all duration-150 flex items-center justify-center"
            style={{
              left: `${cropX}%`,
              top: `${cropY}%`,
              width: `${cropWidth}%`,
              height: `${cropHeight}%`,
            }}
          >
            <span className="bg-amber-500 text-neutral-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
              {Math.round(cropWidth)}% × {Math.round(cropHeight)}%
            </span>

            {/* Corner Handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-full" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-full" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full" />
          </div>
        </div>

        {/* Preset Ratio Chips */}
        <div>
          <label className="text-[11px] font-bold text-neutral-400 block mb-2 uppercase">Aspect Ratio Presets</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { id: 'free', label: 'Free' },
              { id: '1:1', label: '1:1 Square' },
              { id: '16:9', label: '16:9 Wide' },
              { id: '9:16', label: '9:16 Vertical' },
              { id: '4:5', label: '4:5 Portrait' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id as any)}
                className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[10px] font-bold rounded-lg transition text-center truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fine Adjustment Sliders */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
          <div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
              <span>Crop Width</span>
              <span className="text-amber-400 font-bold">{Math.round(cropWidth)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={cropWidth}
              onChange={(e) => setCropWidth(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
              <span>Crop Height</span>
              <span className="text-amber-400 font-bold">{Math.round(cropHeight)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={cropHeight}
              onChange={(e) => setCropHeight(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
              <span>Position X</span>
              <span>{Math.round(cropX)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={100 - cropWidth}
              value={cropX}
              onChange={(e) => setCropX(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
              <span>Position Y</span>
              <span>{Math.round(cropY)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={100 - cropHeight}
              value={cropY}
              onChange={(e) => setCropY(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleResetCrop}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-lg hover:bg-neutral-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Crop</span>
          </button>

          <button
            onClick={handleSaveCrop}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
