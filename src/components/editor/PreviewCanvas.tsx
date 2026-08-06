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
  const isMutedRef = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  // Keep muted state in ref to avoid dependency issues
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const { width: targetWidth, height: targetHeight } = getCanvasDimensions(project.aspectRatio);

  // Preload video, audio & image elements into DOM cache with proper initialization
  useEffect(() => {
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (!mediaCacheRef.current.has(clip.id)) {
          if (clip.type === 'video') {
            const vid = document.createElement('video');
            if (!clip.src.startsWith('blob:') && !clip.src.startsWith('data:')) {
              vid.crossOrigin = 'anonymous';
            }
            vid.src = clip.src;
            vid.muted = false;
            vid.playsInline = true;
            vid.preload = 'metadata';
            
            // Force loading for blob URLs
            vid.addEventListener('loadedmetadata', () => {
              vid.load();
            }, { once: true });
            
            mediaCacheRef.current.set(clip.id, vid);
          } else if (clip.type === 'audio') {
            const aud = document.createElement('audio');
            if (!clip.src.startsWith('blob:') && !clip.src.startsWith('data:')) {
              aud.crossOrigin = 'anonymous';
            }
            aud.src = clip.src;
            aud.muted = false;
            aud.preload = 'metadata';
            aud.load();
            mediaCacheRef.current.set(clip.id, aud);
          } else if (clip.type === 'image' || clip.type === 'giphy') {
            const img = new Image();
            if (!clip.src.startsWith('blob:') && !clip.src.startsWith('data:')) {
              img.crossOrigin = 'anonymous';
            }
            img.src = clip.src;
            mediaCacheRef.current.set(clip.id, img);
          }
        }
      });
    });
  }, [project]);

  // Keep live refs for animation loop to avoid re-binding requestAnimationFrame
  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    if (!isPlaying) {
      currentTimeRef.current = currentTime;
    }
  }, [currentTime, isPlaying]);

  const lastReactUpdateRef = useRef<number>(0);

  // Main Render Frame Function reading from live time Ref - FIXED DEPENDENCIES
  const renderFrame = useCallback((timeToRender?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const time = timeToRender !== undefined ? timeToRender : currentTimeRef.current;

    // Clear Canvas
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render active tracks bottom to top
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const isActive = !track.hidden && time >= clip.startTime && time <= clip.startTime + clip.duration;

        if (!isActive) {
          if (clip.type === 'video' || clip.type === 'audio') {
            const media = mediaCacheRef.current.get(clip.id) as HTMLMediaElement;
            if (media && !media.paused) {
              media.pause();
            }
          }
          return;
        }

        const clipElapsed = time - clip.startTime;
        const targetTime = clip.sourceStart + clipElapsed * clip.speed;
        const shouldMute = track.muted || clip.audioSettings?.muted || isMutedRef.current;
        const targetVol = shouldMute ? 0 : Math.min(1, Math.max(0, clip.audioSettings?.volume ?? 1));

        // Handle Audio Track Clips
        if (clip.type === 'audio') {
          const aud = mediaCacheRef.current.get(clip.id) as HTMLAudioElement;
          if (aud) {
            aud.muted = shouldMute;
            aud.volume = targetVol;
            aud.playbackRate = clip.speed || 1;

            if (!isPlaying) {
              if (!aud.paused) aud.pause();
              if (Math.abs(aud.currentTime - targetTime) > 0.05) {
                aud.currentTime = targetTime;
              }
            } else {
              if (aud.paused && !shouldMute) {
                aud.currentTime = targetTime;
                aud.play().catch(() => {});
              } else if (Math.abs(aud.currentTime - targetTime) > 0.15) {
                aud.currentTime = targetTime;
              }
            }
          }
          return;
        }

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

        // Color & Filter Adjustments & Opacity
        ctx.globalAlpha = clip.colorAdjustments?.opacity !== undefined ? clip.colorAdjustments.opacity : 1;
        const filterStr = buildCssFilterString(clip.colorAdjustments, clip.filter);
        if (filterStr && filterStr !== 'none') {
          ctx.filter = filterStr;
        } else {
          ctx.filter = 'none';
        }

        const crop = clip.transform.crop;

        if (clip.type === 'video') {
          const vid = mediaCacheRef.current.get(clip.id) as HTMLVideoElement;
          // FIX: Changed from readyState >= 2 to >= 3 for proper video rendering
          if (vid && vid.readyState >= 3) {
            vid.muted = shouldMute;
            vid.volume = targetVol;
            vid.playbackRate = clip.speed || 1;

            if (!isPlaying) {
              if (!vid.paused) vid.pause();
              if (Math.abs(vid.currentTime - targetTime) > 0.05) {
                vid.currentTime = targetTime;
              }
            } else {
              if (vid.paused) {
                vid.currentTime = targetTime;
                vid.play().catch(() => {});
              } else if (Math.abs(vid.currentTime - targetTime) > 0.15) {
                vid.currentTime = targetTime;
              }
            }

            if (crop && (crop.width < 100 || crop.height < 100 || crop.x > 0 || crop.y > 0)) {
              const sx = (crop.x / 100) * vid.videoWidth;
              const sy = (crop.y / 100) * vid.videoHeight;
              const sw = (crop.width / 100) * vid.videoWidth;
              const sh = (crop.height / 100) * vid.videoHeight;
              ctx.drawImage(vid, sx, sy, sw, sh, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            } else {
              ctx.drawImage(vid, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            }
          }
        } else if (clip.type === 'image' || clip.type === 'giphy') {
          const img = mediaCacheRef.current.get(clip.id) as HTMLImageElement;
          // FIX: Added naturalWidth check to verify image loaded properly
          if (img && img.complete && img.naturalWidth > 0) {
            if (crop && (crop.width < 100 || crop.height < 100 || crop.x > 0 || crop.y > 0)) {
              const sx = (crop.x / 100) * img.naturalWidth;
              const sy = (crop.y / 100) * img.naturalHeight;
              const sw = (crop.width / 100) * img.naturalWidth;
              const sh = (crop.height / 100) * img.naturalHeight;
              ctx.drawImage(img, sx, sy, sw, sh, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            } else {
              ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            }
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
      });
    });
  }, [project, isPlaying]); // FIX: Removed isMuted from deps, using ref instead

  // Playback Animation Loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        currentTimeRef.current += deltaTime;

        if (currentTimeRef.current >= project.duration) {
          currentTimeRef.current = 0;
          setCurrentTime(0);
          setIsPlaying(false);
          renderFrame(0);
          return;
        }

        // Throttle React state updates to 15 FPS (~66ms) so timeline playhead moves smoothly without locking UI
        if (timestamp - lastReactUpdateRef.current > 66) {
          lastReactUpdateRef.current = timestamp;
          setCurrentTime(currentTimeRef.current);
        }
      }

      renderFrame(currentTimeRef.current);

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      renderFrame(currentTime);
      setCurrentTime(currentTimeRef.current);
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
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsMobileFullscreen(false);
    } else if (containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen().then(() => {
        setIsMobileFullscreen(true);
      }).catch(() => {
        // Fallback for iOS Safari / Mobile web where requestFullscreen is blocked
        setIsMobileFullscreen((prev) => !prev);
      });
    } else {
      setIsMobileFullscreen((prev) => !prev);
    }
  };

  return (
    <div className={`flex-1 bg-neutral-950 flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden select-none ${
      isMobileFullscreen ? 'fixed inset-0 z-50 p-0 m-0 bg-black flex items-center justify-center' : ''
    }`}>
      {/* Aspect Ratio Canvas Frame */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative bg-neutral-900 border border-neutral-800 shadow-2xl flex items-center justify-center overflow-hidden transition-all ${
          isMobileFullscreen
            ? 'w-full h-full max-h-screen max-w-screen rounded-none border-none'
            : 'rounded-xl max-h-[55vh] md:max-h-[60vh] max-w-full aspect-[9/16]'
        }`}
        style={{
          aspectRatio: isMobileFullscreen
            ? undefined
            : project.aspectRatio === '9:16'
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
