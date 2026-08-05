import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import {
  Scissors,
  Volume2,
  Zap,
  Crop,
  Music,
  Trash2,
  Copy,
  RefreshCw,
  Droplet,
  RotateCcw,
  PauseCircle,
  Sliders,
  Palette,
  Layers,
  Sparkles,
  ChevronLeft,
  RotateCw,
  Eye,
  Type,
  Sun,
  Moon,
  Maximize2,
} from 'lucide-react';

export const CapCutToolbar: React.FC = () => {
  const {
    selectedClipId,
    setSelectedClipId,
    project,
    splitClipAtPlayhead,
    removeClip,
    duplicateClip,
    extractAudioFromClip,
    openCropModal,
    setActivePanel,
    updateClipAudio,
    updateClipSpeed,
    updateClipColor,
    toggleReverseClip,
    freezeFrame,
    theme,
  } = useEditor();

  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'volume' | 'speed' | 'opacity'>('none');

  const selectedClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  if (!selectedClip) {
    return (
      <div className={`h-12 border-t flex items-center justify-between px-4 text-xs font-semibold select-none ${
        theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Timeline Shortcuts:</span>
          <button
            onClick={() => setActivePanel('media')}
            className="flex items-center gap-1 hover:text-white transition"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Media</span>
          </button>
          <button
            onClick={() => setActivePanel('text')}
            className="flex items-center gap-1 hover:text-white transition"
          >
            <Type className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Text</span>
          </button>
          <button
            onClick={() => setActivePanel('voice')}
            className="flex items-center gap-1 hover:text-white transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Voice</span>
          </button>
        </div>
        <span className="text-[10px] text-neutral-500 hidden sm:inline">Click any timeline clip for full CapCut tools</span>
      </div>
    );
  }

  return (
    <div className={`border-t flex flex-col shrink-0 select-none ${
      theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
    }`}>
      {/* Submenu Popups for Volume, Speed, Opacity */}
      {activeSubMenu === 'volume' && (
        <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/90 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveSubMenu('none')}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-neutral-300 shrink-0">Volume</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selectedClip.audioSettings?.volume ?? 1}
              onChange={(e) => updateClipAudio(selectedClip.id, { volume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <span className="text-xs font-mono font-bold text-amber-400 w-10 text-right shrink-0">
              {Math.round((selectedClip.audioSettings?.volume ?? 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {activeSubMenu === 'speed' && (
        <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/90 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveSubMenu('none')}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Zap className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-bold text-neutral-300 shrink-0">Playback Speed:</span>
            {[0.5, 1, 1.5, 2, 4].map((sVal) => (
              <button
                key={sVal}
                onClick={() => updateClipSpeed(selectedClip.id, sVal)}
                className={`px-3 py-1 rounded text-xs font-bold border transition ${
                  selectedClip.speed === sVal
                    ? 'bg-sky-500 text-neutral-950 border-sky-400'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {sVal}x
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSubMenu === 'opacity' && (
        <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/90 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveSubMenu('none')}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Droplet className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-bold text-neutral-300 shrink-0">Opacity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedClip.colorAdjustments?.opacity ?? 1}
              onChange={(e) => updateClipColor(selectedClip.id, { opacity: parseFloat(e.target.value) })}
              className="w-full accent-purple-500"
            />
            <span className="text-xs font-mono font-bold text-purple-400 w-10 text-right shrink-0">
              {Math.round((selectedClip.colorAdjustments?.opacity ?? 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Main CapCut Horizontal Tool Action Scroll Bar */}
      <div className="h-14 flex items-center gap-1.5 px-3 overflow-x-auto no-scrollbar">
        {/* Back / Deselect */}
        <button
          onClick={() => setSelectedClipId(null)}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-400 hover:text-white transition shrink-0 min-w-[50px]"
          title="Deselect Clip"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-400" />
          <span className="text-[10px] font-medium mt-0.5">Deselect</span>
        </button>

        <div className="h-6 w-[1px] bg-neutral-800 mx-1 shrink-0" />

        {/* 1. Split */}
        <button
          onClick={() => splitClipAtPlayhead(selectedClip.id)}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-sky-400 transition shrink-0 min-w-[52px]"
          title="Split Clip at Playhead"
        >
          <Scissors className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] font-semibold mt-0.5">Split</span>
        </button>

        {/* 2. Crop */}
        <button
          onClick={() => openCropModal(selectedClip.id)}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-amber-400 transition shrink-0 min-w-[52px]"
          title="Crop Canvas Boundaries"
        >
          <Crop className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-semibold mt-0.5">Crop</span>
        </button>

        {/* 3. Speed */}
        <button
          onClick={() => setActiveSubMenu(activeSubMenu === 'speed' ? 'none' : 'speed')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition shrink-0 min-w-[52px] ${
            activeSubMenu === 'speed' ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-neutral-800/80 text-neutral-200'
          }`}
          title="Adjust Speed"
        >
          <Zap className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] font-semibold mt-0.5">Speed</span>
        </button>

        {/* 4. Volume */}
        <button
          onClick={() => setActiveSubMenu(activeSubMenu === 'volume' ? 'none' : 'volume')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition shrink-0 min-w-[52px] ${
            activeSubMenu === 'volume' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-neutral-800/80 text-neutral-200'
          }`}
          title="Adjust Volume"
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-semibold mt-0.5">Volume</span>
        </button>

        {/* 5. Extract Audio */}
        {selectedClip.type === 'video' || selectedClip.type === 'media' ? (
          <button
            onClick={() => extractAudioFromClip(selectedClip.id)}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-emerald-400 transition shrink-0 min-w-[62px]"
            title="Extract Audio to Music Track"
          >
            <Music className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-semibold mt-0.5">Extract Audio</span>
          </button>
        ) : null}

        {/* 6. Duplicate */}
        <button
          onClick={() => duplicateClip(selectedClip.id)}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-purple-400 transition shrink-0 min-w-[56px]"
          title="Duplicate Clip"
        >
          <Copy className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-semibold mt-0.5">Duplicate</span>
        </button>

        {/* 7. Opacity */}
        <button
          onClick={() => setActiveSubMenu(activeSubMenu === 'opacity' ? 'none' : 'opacity')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition shrink-0 min-w-[52px] ${
            activeSubMenu === 'opacity' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-neutral-800/80 text-neutral-200'
          }`}
          title="Adjust Opacity"
        >
          <Droplet className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-semibold mt-0.5">Opacity</span>
        </button>

        {/* 8. Replace */}
        <button
          onClick={() => setActivePanel('media')}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-blue-400 transition shrink-0 min-w-[52px]"
          title="Replace with Pexels Media"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-semibold mt-0.5">Replace</span>
        </button>

        {/* 9. Filters */}
        <button
          onClick={() => setActivePanel('inspector')}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-purple-400 transition shrink-0 min-w-[52px]"
          title="Color Filter Presets"
        >
          <Palette className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-semibold mt-0.5">Filters</span>
        </button>

        {/* 10. Adjust */}
        <button
          onClick={() => setActivePanel('inspector')}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-sky-400 transition shrink-0 min-w-[52px]"
          title="Fine Color Adjustments"
        >
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] font-semibold mt-0.5">Adjust</span>
        </button>

        {/* 11. Reverse */}
        <button
          onClick={() => toggleReverseClip(selectedClip.id)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition shrink-0 min-w-[52px] ${
            selectedClip.isReversed ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-neutral-800/80 text-neutral-200'
          }`}
          title="Toggle Reverse Playback"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-semibold mt-0.5">Reverse</span>
        </button>

        {/* 12. Freeze */}
        <button
          onClick={() => freezeFrame(selectedClip.id)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition shrink-0 min-w-[52px] ${
            selectedClip.isFrozen ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-neutral-800/80 text-neutral-200'
          }`}
          title="Toggle Freeze Frame"
        >
          <PauseCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-semibold mt-0.5">Freeze</span>
        </button>

        {/* 13. Delete */}
        <button
          onClick={() => removeClip(selectedClip.id)}
          className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-rose-500/20 text-neutral-200 hover:text-rose-400 transition shrink-0 min-w-[52px]"
          title="Delete Clip"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span className="text-[10px] font-semibold mt-0.5">Delete</span>
        </button>
      </div>
    </div>
  );
};
