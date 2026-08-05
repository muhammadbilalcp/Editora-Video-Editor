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
  Maximize2,
  Smile,
  UserMinus,
  Flag,
  Activity,
  Mic,
  VolumeX,
  Shield,
  CircleSlash,
  Link2Off,
  Image as ImageIcon,
  Folder,
  AlignLeft,
  Square,
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
    showToast,
  } = useEditor();

  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'volume' | 'speed' | 'opacity'>('none');

  const selectedClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  // Helper for triggering panel or selecting clip
  const handleEditClick = () => {
    const firstClip = project.tracks.flatMap((t) => t.clips)[0];
    if (firstClip) {
      setSelectedClipId(firstClip.id);
    } else {
      setActivePanel('media');
    }
  };

  // Main Mode Bottom Navigation Bar (Image 4 bottom row)
  if (!selectedClip) {
    const mainTools = [
      { id: 'edit', label: 'Edit', icon: Scissors, onClick: handleEditClick },
      { id: 'audio', label: 'Audio', icon: Music, onClick: () => setActivePanel('voice') },
      { id: 'text', label: 'Text', icon: Type, onClick: () => setActivePanel('text') },
      { id: 'effects', label: 'Effects', icon: Sparkles, onClick: () => setActivePanel('inspector') },
      { id: 'overlay', label: 'Overlay', icon: Layers, onClick: () => setActivePanel('media') },
      { id: 'captions', label: 'Captions', icon: AlignLeft, onClick: () => setActivePanel('text') },
      { id: 'filters', label: 'Filters', icon: Palette, onClick: () => setActivePanel('inspector') },
      { id: 'adjust', label: 'Adjust', icon: Sliders, onClick: () => setActivePanel('inspector') },
      { id: 'stickers', label: 'Stickers', icon: ImageIcon, onClick: () => setActivePanel('giphy') },
      { id: 'avatar', label: 'AI avatar', icon: Smile, onClick: () => setActivePanel('voice') },
      { id: 'aimedia', label: 'AI media', icon: Folder, onClick: () => setActivePanel('media') },
      { id: 'aspect', label: 'Aspect ratio', icon: Crop, onClick: () => openCropModal(project.tracks[0]?.clips[0]?.id || '') },
      { id: 'bg', label: 'Background', icon: Square, onClick: () => setActivePanel('inspector') },
    ];

    return (
      <div className={`h-16 border-t flex items-center px-2 overflow-x-auto no-scrollbar shrink-0 select-none ${
        theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-neutral-950 border-neutral-900 text-white'
      }`}>
        {mainTools.map((tool) => (
          <button
            key={tool.id}
            onClick={tool.onClick}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition shrink-0 min-w-[56px] md:min-w-[64px]"
          >
            <tool.icon className="w-5 h-5 text-white stroke-[1.8]" />
            <span className="text-[10px] font-semibold mt-1 truncate max-w-[56px] text-center">{tool.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Clip Action Scrollbar (Images 1-3)
  const clipActions = [
    { id: 'split', label: 'Split', icon: Scissors, onClick: () => splitClipAtPlayhead(selectedClip.id) },
    { id: 'volume', label: 'Volume', icon: Volume2, onClick: () => setActiveSubMenu(activeSubMenu === 'volume' ? 'none' : 'volume') },
    { id: 'speed', label: 'Speed', icon: Zap, onClick: () => setActiveSubMenu(activeSubMenu === 'speed' ? 'none' : 'speed') },
    { id: 'effects', label: 'Effects', icon: Sparkles, onClick: () => setActivePanel('inspector') },
    { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => removeClip(selectedClip.id), color: 'text-rose-400' },
    { id: 'beats', label: 'Beats', icon: Flag, onClick: () => showToast('Audio beats sync enabled') },
    { id: 'crop', label: 'Crop', icon: Crop, onClick: () => openCropModal(selectedClip.id) },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, onClick: () => duplicateClip(selectedClip.id) },
    { id: 'replace', label: 'Replace', icon: RefreshCw, onClick: () => setActivePanel('media') },
    { id: 'overlay', label: 'Overlay', icon: Layers, onClick: () => setActivePanel('media') },
    { id: 'adjust', label: 'Adjust', icon: Sliders, onClick: () => setActivePanel('inspector') },
    { id: 'filters', label: 'Filters', icon: Palette, onClick: () => setActivePanel('inspector') },
    { id: 'retouch', label: 'Retouch', icon: Smile, onClick: () => showToast('AI Face Retouch applied') },
    { id: 'removebg', label: 'Remove BG', icon: UserMinus, onClick: () => showToast('AI Background Removal toggled') },
    { id: 'changebg', label: 'Change BG', icon: Square, onClick: () => setActivePanel('inspector') },
    { id: 'aiexpand', label: 'AI expand', icon: Maximize2, onClick: () => showToast('AI Canvas Expansion active') },
    { id: 'eyecontact', label: 'Eye contact', icon: Eye, onClick: () => showToast('AI Eye Contact enhanced') },
    { id: 'relight', label: 'Relight', icon: Sun, onClick: () => setActivePanel('inspector') },
    { id: 'opacity', label: 'Opacity', icon: Droplet, onClick: () => setActiveSubMenu(activeSubMenu === 'opacity' ? 'none' : 'opacity') },
    { id: 'motionblur', label: 'Motion blur', icon: Activity, onClick: () => showToast('Motion Blur toggled') },
    { id: 'lipsync', label: 'Lip sync', icon: Mic, onClick: () => setActivePanel('voice') },
    { id: 'mimicmotion', label: 'Mimic motion', icon: Activity, onClick: () => showToast('AI Motion Mimic enabled') },
    { id: 'expressions', label: 'Expressions', icon: Smile, onClick: () => showToast('AI Facial Expression active') },
    { id: 'transform', label: 'Transform', icon: RotateCw, onClick: () => showToast('Transform rotated') },
    { id: 'autoreframe', label: 'Auto reframe', icon: Maximize2, onClick: () => showToast('Auto Reframed 9:16') },
    { id: 'stabilize', label: 'Stabilize', icon: Shield, onClick: () => showToast('Video Stabilized') },
    { id: 'extractaudio', label: 'Extract audio', icon: Music, onClick: () => extractAudioFromClip(selectedClip.id) },
    { id: 'isolatevoice', label: 'Isolate voice', icon: Volume2, onClick: () => showToast('AI Voice Isolated') },
    { id: 'reducenoise', label: 'Reduce noise', icon: VolumeX, onClick: () => showToast('Background Noise Reduced') },
    { id: 'audioeffects', label: 'Audio effects', icon: Sparkles, onClick: () => setActivePanel('voice') },
    { id: 'enhancevoice', label: 'Enhance voice', icon: Mic, onClick: () => showToast('Voice Clarity Enhanced') },
    { id: 'freeze', label: 'Freeze', icon: PauseCircle, onClick: () => freezeFrame(selectedClip.id) },
    { id: 'reverse', label: 'Reverse', icon: RotateCcw, onClick: () => toggleReverseClip(selectedClip.id) },
    { id: 'mask', label: 'Mask', icon: CircleSlash, onClick: () => openCropModal(selectedClip.id) },
    { id: 'unlink', label: 'Unlink', icon: Link2Off, onClick: () => showToast('Audio Track Unlinked') },
  ];

  return (
    <div className={`border-t flex flex-col shrink-0 select-none ${
      theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-neutral-950 border-neutral-900 text-white'
    }`}>
      {/* Submenu Popups for Volume, Speed, Opacity */}
      {activeSubMenu === 'volume' && (
        <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveSubMenu('none')}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Volume2 className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold text-neutral-300 shrink-0">Volume</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selectedClip.audioSettings?.volume ?? 1}
              onChange={(e) => updateClipAudio(selectedClip.id, { volume: parseFloat(e.target.value) })}
              className="w-full accent-white"
            />
            <span className="text-xs font-mono font-bold text-white w-10 text-right shrink-0">
              {Math.round((selectedClip.audioSettings?.volume ?? 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {activeSubMenu === 'speed' && (
        <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveSubMenu('none')}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Zap className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold text-neutral-300 shrink-0">Playback Speed:</span>
            {[0.5, 1, 1.5, 2, 4].map((sVal) => (
              <button
                key={sVal}
                onClick={() => updateClipSpeed(selectedClip.id, sVal)}
                className={`px-3 py-1 rounded text-xs font-bold border transition ${
                  selectedClip.speed === sVal
                    ? 'bg-white text-neutral-950 border-white'
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
        <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between gap-4">
          <button
            onClick={() => setActiveSubMenu('none')}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Droplet className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold text-neutral-300 shrink-0">Opacity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedClip.colorAdjustments?.opacity ?? 1}
              onChange={(e) => updateClipColor(selectedClip.id, { opacity: parseFloat(e.target.value) })}
              className="w-full accent-white"
            />
            <span className="text-xs font-mono font-bold text-white w-10 text-right shrink-0">
              {Math.round((selectedClip.colorAdjustments?.opacity ?? 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Main Horizontal Clip Tool Action Scroll Bar */}
      <div className="h-16 flex items-center gap-1 px-2 overflow-x-auto no-scrollbar">
        {/* Far Left Back Tile Button */}
        <button
          onClick={() => setSelectedClipId(null)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition shrink-0 min-w-[48px] h-12 border border-neutral-800"
          title="Back to Main Toolbar"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="h-6 w-[1px] bg-neutral-800 mx-1 shrink-0" />

        {/* Clip Action Tools */}
        {clipActions.map((act) => (
          <button
            key={act.id}
            onClick={act.onClick}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-200 hover:text-white transition shrink-0 min-w-[56px] md:min-w-[62px]"
          >
            <act.icon className={`w-4 h-4 stroke-[1.8] ${act.color || 'text-white'}`} />
            <span className="text-[10px] font-semibold mt-1 truncate max-w-[56px] text-center">{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

