import React, { useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { formatTimecode } from '../../utils/time';
import { CapCutToolbar } from './CapCutToolbar';
import {
  Scissors,
  Copy,
  Trash2,
  Zap,
  RotateCcw,
  Snowflake,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  Type,
  Mic,
} from 'lucide-react';
import { Track, Clip } from '../../types/editor';

export const Timeline: React.FC = () => {
  const {
    project,
    setProject,
    currentTime,
    setCurrentTime,
    selectedClipId,
    setSelectedClipId,
    splitClipAtPlayhead,
    removeClip,
    duplicateClip,
    updateClipSpeed,
    freezeFrame,
    toggleReverseClip,
    zoomLevel,
    setZoomLevel,
    setActivePanel,
    trimClip,
    theme,
  } = useEditor();

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingTrim, setDraggingTrim] = useState<{
    clipId: string;
    side: 'left' | 'right';
    initialX: number;
    initialStart: number;
    initialDuration: number;
  } | null>(null);

  const totalWidthPx = Math.max(project.duration * zoomLevel, 600);

  // Handle Playhead Scrubbing on Timeline Header
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(clickX / zoomLevel, project.duration));
    setCurrentTime(clickedTime);
  };

  const handleScrubStart = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleTimelineClick(e);
  };

  const handleScrubMove = (e: React.MouseEvent) => {
    if (isScrubbing) {
      handleTimelineClick(e);
    } else if (draggingTrim) {
      const dx = (e.clientX - draggingTrim.initialX) / zoomLevel;
      if (draggingTrim.side === 'left') {
        const newStart = Math.max(0, draggingTrim.initialStart + dx);
        const newDur = Math.max(0.5, draggingTrim.initialDuration - dx);
        trimClip(draggingTrim.clipId, newStart, newDur);
      } else {
        const newDur = Math.max(0.5, draggingTrim.initialDuration + dx);
        trimClip(draggingTrim.clipId, draggingTrim.initialStart, newDur);
      }
    }
  };

  const handleScrubEnd = () => {
    setIsScrubbing(false);
    setDraggingTrim(null);
  };

  // Toggle Track Visibility / Mute / Lock
  const toggleTrackMute = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    }));
  };

  const toggleTrackHide = (trackId: string) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, hidden: !t.hidden } : t)),
    }));
  };

  return (
    <div
      onMouseMove={handleScrubMove}
      onMouseUp={handleScrubEnd}
      onMouseLeave={handleScrubEnd}
      className={`h-72 md:h-80 border-t flex flex-col select-none shrink-0 z-20 ${
        theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
      }`}
    >
      {/* CapCut Horizontal Action Toolbar */}
      <CapCutToolbar />

      {/* Timeline Controls & Zoom Bar */}
      <div className={`h-8 border-b px-3 flex items-center justify-between text-xs shrink-0 ${
        theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-neutral-900/90 border-neutral-800/80 text-neutral-400'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Timeline Tracks</span>
        </div>

        {/* Zoom Scale Controls */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="range"
            min="10"
            max="100"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-20 md:w-28 accent-sky-500 cursor-pointer"
          />
          <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
        </div>
      </div>

      {/* Main Multi-Track Scroll Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Control Headers (Left Column) */}
        <div className="w-36 md:w-44 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 z-10">
          <div className="h-7 border-b border-neutral-800 px-3 flex items-center text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
            Tracks
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className="h-10 px-2 flex items-center justify-between text-xs text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800/40"
              >
                <span className="truncate font-medium text-[11px] max-w-[80px] md:max-w-[100px]">
                  {track.name}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`p-1 rounded hover:bg-neutral-700 transition ${
                      track.muted ? 'text-rose-400' : 'text-neutral-400 hover:text-white'
                    }`}
                    title={track.muted ? 'Unmute Track' : 'Mute Track'}
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => toggleTrackHide(track.id)}
                    className={`p-1 rounded hover:bg-neutral-700 transition ${
                      track.hidden ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                    }`}
                    title={track.hidden ? 'Show Track' : 'Hide Track'}
                  >
                    {track.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Tracks & Scrubber (Right Column) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative" ref={timelineRef}>
          <div style={{ width: `${totalWidthPx}px` }} className="relative min-h-full">
            {/* Time Ruler Bar */}
            <div
              onMouseDown={handleScrubStart}
              className="h-7 border-b border-neutral-800 bg-neutral-900/80 sticky top-0 z-20 cursor-pointer flex items-center"
            >
              {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-[9px] font-mono text-neutral-500 border-l border-neutral-800 h-3 pl-1 top-2"
                  style={{ left: `${i * zoomLevel}px` }}
                >
                  {formatTimecode(i)}
                </div>
              ))}
            </div>

            {/* Red Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              <div className="w-3 h-3 bg-rose-500 -translate-x-[5px] rotate-45 rounded-sm shadow-md" />
            </div>

            {/* Tracks Stack */}
            <div className="divide-y divide-neutral-800/60">
              {project.tracks.map((track) => (
                <div key={track.id} className="h-10 relative bg-neutral-900/40">
                  {track.clips.map((clip) => {
                    const isSelected = clip.id === selectedClipId;
                    const leftPx = clip.startTime * zoomLevel;
                    const widthPx = clip.duration * zoomLevel;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                        className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-xs font-medium cursor-pointer border shadow-sm transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-sky-500/30 border-sky-400 text-white ring-2 ring-sky-400/50'
                            : clip.type === 'text'
                            ? 'bg-purple-900/40 border-purple-600/60 text-purple-200'
                            : clip.type === 'voiceover'
                            ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-200'
                            : clip.type === 'giphy'
                            ? 'bg-amber-900/40 border-amber-600/60 text-amber-200'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:border-neutral-500'
                        }`}
                      >
                        {/* Left Trim Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingTrim({
                              clipId: clip.id,
                              side: 'left',
                              initialX: e.clientX,
                              initialStart: clip.startTime,
                              initialDuration: clip.duration,
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-400/60 hover:bg-sky-400 cursor-ew-resize rounded-l-md"
                        />

                        <span className="truncate text-[10px] pl-1">{clip.name}</span>

                        {/* Right Trim Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingTrim({
                              clipId: clip.id,
                              side: 'right',
                              initialX: e.clientX,
                              initialStart: clip.startTime,
                              initialDuration: clip.duration,
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-1.5 bg-sky-400/60 hover:bg-sky-400 cursor-ew-resize rounded-r-md"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
