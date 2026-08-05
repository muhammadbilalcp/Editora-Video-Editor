import React, { useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { formatTimecode } from '../../utils/time';
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

  const selectedClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  return (
    <div
      onMouseMove={handleScrubMove}
      onMouseUp={handleScrubEnd}
      onMouseLeave={handleScrubEnd}
      className="h-64 md:h-72 bg-neutral-900 border-t border-neutral-800 flex flex-col select-none shrink-0 z-20"
    >
      {/* Quick Action Toolbar Above Timeline */}
      <div className="h-11 bg-neutral-900/90 border-b border-neutral-800/80 px-3 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => selectedClipId && splitClipAtPlayhead(selectedClipId)}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md border border-neutral-700/60 disabled:opacity-40 transition"
            title="Split selected clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-400" />
            <span>Split</span>
          </button>

          <button
            onClick={() => selectedClipId && duplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md border border-neutral-700/60 disabled:opacity-40 transition"
            title="Duplicate selected clip"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => selectedClipId && removeClip(selectedClipId)}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-rose-900/40 text-neutral-200 hover:text-rose-300 rounded-md border border-neutral-700/60 disabled:opacity-40 transition"
            title="Delete selected clip"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>

          <div className="w-px h-4 bg-neutral-800 mx-1" />

          {/* Inspector Panel Quick Open */}
          <button
            onClick={() => setActivePanel('inspector')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition ${
              selectedClipId
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-neutral-800 border-neutral-700/60 text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Filters & Crop</span>
          </button>

          <button
            onClick={() => selectedClipId && freezeFrame(selectedClipId)}
            disabled={!selectedClipId}
            className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700/60 disabled:opacity-40 transition"
            title="Freeze Frame"
          >
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Freeze</span>
          </button>

          <button
            onClick={() => selectedClipId && toggleReverseClip(selectedClipId)}
            disabled={!selectedClipId}
            className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700/60 disabled:opacity-40 transition"
            title="Reverse Playback"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Reverse</span>
          </button>
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
