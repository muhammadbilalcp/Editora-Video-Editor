import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import {
  getCanvasDimensions,
  buildCssFilterString,
  applyChromaKey,
  renderAnimatedTextOnCanvas,
} from '../../utils/canvas';
import { audioEngine } from '../../utils/audio';
import { formatTimecode } from '../../utils/time';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Undo,
  Redo,
} from 'lucide-react';

export const PreviewCanvas: React.FC = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    selectedClipId,
    updateClipTransform,
    undo,
    redo,
    canUndo,
    canRedo,
    showToast,
  } = useEditor();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mediaCacheRef = useRef<Map<string, HTMLVideoElement | HTMLImageElement>>(new Map());

  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { width: targetWidth, height: targetHeight } = getCanvasDimensions(project.aspectRatio);

  // Preload video & image elements into DOM cache
  useEffect(() => {
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (!mediaCacheRef.current.has(clip.id)) {
          if (clip.type === 'video') {
            const vid = document.createElement('video');
            vid.crossOrigin = 'anonymous';
            vid.src = clip.src;
            vid.muted = true;
            vid.playsInline = true;
            vid.preload = 'auto';
            mediaCacheRef.current.set(clip.id, vid);
          } else if (clip.type === 'image' || clip.type === 'giphy') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = clip.src;
            mediaCacheRef.current.set(clip.id, img);
          }
        }
      });
    });
  }, [project]);

  // Main Render Frame Function
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render active tracks bottom to top
    project.tracks.forEach((track) => {
      if (track.hidden) return;

      track.clips.forEach((clip) => {
        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
          const clipElapsed = currentTime - clip.startTime;

          ctx.save();

          // Transform Calculations (Position, Scale, Rotate, Flip)
          const centerX = canvas.width / 2 + (clip.transform.x / 100) * canvas.width;
          const centerY = canvas.height / 2 + (clip.transform.y / 100) * canvas.height;

          ctx.translate(centerX, centerY);
          ctx.rotate((clip.transform.rotation * Math.PI) / 180);
          ctx.scale(
            clip.transform.flipH ? -clip.transform.scale : clip.transform.scale,
            clip.transform.flipV ? -clip.transform.scale : clip.transform.scale
          );

          // Color & Filter Adjustments
          ctx.filter = buildCssFilterString(clip.colorAdjustments, clip.filter);

          if (clip.type === 'video') {
            const vid = mediaCacheRef.current.get(clip.id) as HTMLVideoElement;
            if (vid && vid.readyState >= 2) {
              const targetTime = clip.sourceStart + clipElapsed * clip.speed;
              if (Math.abs(vid.currentTime - targetTime) > 0.15) {
                vid.currentTime = targetTime;
              }
              ctx.drawImage(vid, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            }
          } else if (clip.type === 'image' || clip.type === 'giphy') {
            const img = mediaCacheRef.current.get(clip.id) as HTMLImageElement;
            if (img && img.complete) {
              ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            }
          }

          // Apply Chroma Key
          if (clip.chromaKey?.enabled) {
            applyChromaKey(ctx, canvas.width, canvas.height, clip.chromaKey);
          }

          ctx.restore();

          // Text Overlay
          if (clip.type === 'text' && clip.textSettings) {
            renderAnimatedTextOnCanvas(
              ctx,
              canvas.width,
              canvas.height,
              clip.textSettings,
              clipElapsed,
              clip.duration
            );
          }
        }
      });
    });
  }, [project, currentTime]);

  // Playback Animation Loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaTime;
          if (next >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      renderFrame();

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      renderFrame();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, project.duration, setCurrentTime, setIsPlaying, renderFrame]);

  // Handle Dragging On-Canvas Selected Clip Position
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedClipId) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedClipId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    updateClipTransform(selectedClipId, {
      x: dx,
      y: dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden select-none">
      {/* Aspect Ratio Canvas Frame */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden max-h-[55vh] md:max-h-[60vh] max-w-full aspect-[9/16] transition-all"
        style={{
          aspectRatio:
            project.aspectRatio === '9:16'
              ? '9/16'
              : project.aspectRatio === '16:9'
              ? '16/9'
              : project.aspectRatio === '1:1'
              ? '1/1'
              : '4/5',
        }}
      >
        <canvas
          ref={canvasRef}
          width={targetWidth}
          height={targetHeight}
          className="w-full h-full object-contain cursor-move"
        />

        {/* Selected Clip Highlight Boundary */}
        {selectedClipId && (
          <div className="absolute inset-2 border-2 border-white border-dashed rounded-lg pointer-events-none opacity-80 animate-pulse flex items-top justify-right p-2">
            <span className="bg-white text-neutral-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
              Selected Clip
            </span>
          </div>
        )}

        {/* Floating Timecode Counter */}
        <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur border border-neutral-800 text-white font-mono text-xs px-2.5 py-1 rounded-md shadow flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{formatTimecode(currentTime, true)}</span>
          <span className="text-neutral-500">/</span>
          <span className="text-neutral-400">{formatTimecode(project.duration)}</span>
        </div>

        {/* On-Screen Control Bar Below Canvas */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {/* Left: Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition backdrop-blur shadow-lg"
            title="Fullscreen Preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Center: Big Play / Pause Button */}
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 flex items-center justify-center font-bold transition shadow-xl transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Right: Snap/Cover, Undo, Redo */}
          <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-lg p-1 shadow-lg backdrop-blur">
            <button
              onClick={() => showToast('Snap to grid enabled')}
              className="px-2 py-1 rounded text-[10px] font-bold bg-neutral-800 text-white flex items-center gap-1 border border-neutral-700"
              title="Snap & Keyframes ON"
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>ON</span>
            </button>

            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-neutral-800"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-neutral-800"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
