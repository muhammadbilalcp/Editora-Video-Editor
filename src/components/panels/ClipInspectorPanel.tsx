import React from 'react';
import { useEditor } from '../../context/EditorContext';
import {
  Sliders,
  Sparkles,
  Zap,
  Volume2,
  Maximize,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Palette,
  Eye,
} from 'lucide-react';

const PRESET_FILTERS = [
  { id: 'none', label: 'Original' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'bw', label: 'B & W' },
  { id: 'warm', label: 'Warm Glow' },
  { id: 'cold', label: 'Cold Tone' },
  { id: 'drama', label: 'Drama' },
];

export const ClipInspectorPanel: React.FC = () => {
  const {
    project,
    selectedClipId,
    updateClipColor,
    updateClipFilter,
    updateClipSpeed,
    updateClipTransform,
    updateClipAudio,
    setProject,
  } = useEditor();

  const selectedClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  if (!selectedClip) {
    return (
      <div className="p-6 text-center text-neutral-500 text-xs flex flex-col items-center justify-center h-full">
        <Sliders className="w-8 h-8 text-neutral-700 mb-2 animate-bounce" />
        <p>No clip selected.</p>
        <p className="text-[11px] text-neutral-600 mt-1">Click any clip on the timeline to edit its properties.</p>
      </div>
    );
  }

  const { colorAdjustments, filter, speed, transform, audioSettings, chromaKey } = selectedClip;

  const toggleChromaKey = () => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => {
          if (c.id === selectedClipId) {
            const current = c.chromaKey || { enabled: false, color: '#00FF00', similarity: 0.4, smoothness: 0.1 };
            return { ...c, chromaKey: { ...current, enabled: !current.enabled } };
          }
          return c;
        }),
      })),
    }));
  };

  const updateChromaKeySettings = (keyUpdates: any) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => {
          if (c.id === selectedClipId) {
            const current = c.chromaKey || { enabled: true, color: '#00FF00', similarity: 0.4, smoothness: 0.1 };
            return { ...c, chromaKey: { ...current, ...keyUpdates } };
          }
          return c;
        }),
      })),
    }));
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto select-none space-y-5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          Clip Inspector: {selectedClip.name}
        </h2>
      </div>

      {/* Speed Multiplier */}
      <div>
        <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Playback Speed
          </span>
          <span className="text-sky-400 font-mono font-bold">{speed}x</span>
        </label>
        <div className="flex items-center gap-2">
          {[0.5, 1, 1.5, 2, 4].map((sVal) => (
            <button
              key={sVal}
              onClick={() => updateClipSpeed(selectedClipId, sVal)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                speed === sVal
                  ? 'bg-sky-500 text-neutral-950 border-sky-400'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {sVal}x
            </button>
          ))}
        </div>
      </div>

      {/* Preset Filters */}
      <div>
        <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          Color Filter Presets
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => updateClipFilter(selectedClipId, f.id)}
              className={`p-2 rounded-lg text-[10px] font-bold truncate transition border ${
                filter === f.id
                  ? 'bg-purple-500/30 text-purple-200 border-purple-400 ring-1 ring-purple-400'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chroma Key Green Screen Removal */}
      <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            Chroma Key (Green Screen)
          </label>
          <input
            type="checkbox"
            checked={chromaKey?.enabled || false}
            onChange={toggleChromaKey}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </div>

        {chromaKey?.enabled && (
          <div className="space-y-2 mt-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">Key Color</span>
              <input
                type="color"
                value={chromaKey.color || '#00FF00'}
                onChange={(e) => updateChromaKeySettings({ color: e.target.value })}
                className="w-8 h-6 rounded bg-transparent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                <span>Similarity Threshold</span>
                <span>{Math.round((chromaKey.similarity || 0.4) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={chromaKey.similarity || 0.4}
                onChange={(e) => updateChromaKeySettings({ similarity: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Color Adjustments */}
      <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <label className="text-xs font-semibold text-neutral-200 block">Fine Color Controls</label>

        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Brightness</span>
            <span>{colorAdjustments.brightness}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={colorAdjustments.brightness}
            onChange={(e) => updateClipColor(selectedClipId, { brightness: Number(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Contrast</span>
            <span>{colorAdjustments.contrast}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={colorAdjustments.contrast}
            onChange={(e) => updateClipColor(selectedClipId, { contrast: Number(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Saturation</span>
            <span>{colorAdjustments.saturation}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={colorAdjustments.saturation}
            onChange={(e) => updateClipColor(selectedClipId, { saturation: Number(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Blur</span>
            <span>{colorAdjustments.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={colorAdjustments.blur}
            onChange={(e) => updateClipColor(selectedClipId, { blur: Number(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>
      </div>

      {/* Audio Controls */}
      <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          Audio Controls
        </label>

        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Volume</span>
            <span>{Math.round(audioSettings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={audioSettings.volume}
            onChange={(e) => updateClipAudio(selectedClipId, { volume: parseFloat(e.target.value) })}
            className="w-full accent-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-neutral-400 block mb-1">Fade In (sec)</span>
            <input
              type="number"
              min="0"
              max="5"
              value={audioSettings.fadeIn}
              onChange={(e) => updateClipAudio(selectedClipId, { fadeIn: Number(e.target.value) })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
            />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block mb-1">Fade Out (sec)</span>
            <input
              type="number"
              min="0"
              max="5"
              value={audioSettings.fadeOut}
              onChange={(e) => updateClipAudio(selectedClipId, { fadeOut: Number(e.target.value) })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Transformations (Rotate, Flip, Scale) */}
      <div className="space-y-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <label className="text-xs font-semibold text-neutral-200 block">Transform & Scale</label>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateClipTransform(selectedClipId, { rotation: (transform.rotation + 90) % 360 })}
            className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 flex items-center justify-center gap-1.5 transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Rotate 90°</span>
          </button>

          <button
            onClick={() => updateClipTransform(selectedClipId, { flipH: !transform.flipH })}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition"
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={() => updateClipTransform(selectedClipId, { flipV: !transform.flipV })}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition"
            title="Flip Vertical"
          >
            <FlipVertical className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Scale / Zoom</span>
            <span>{Math.round(transform.scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.05"
            value={transform.scale}
            onChange={(e) => updateClipTransform(selectedClipId, { scale: parseFloat(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>
      </div>
    </div>
  );
};
