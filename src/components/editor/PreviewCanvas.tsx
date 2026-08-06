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
  const mediaElementsRef = useRef<Map<string, HTMLMediaElement | HTMLImageElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const { width: targetWidth, height: targetHeight } = getCanvasDimensions(project.aspectRatio);

  // Preload all media elements
  useEffect(() => {
    const loadMediaElements = () => {
      project.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          // Skip if already cached
          if (mediaElementsRef.current.has(clip.id)) {
            return;
          }

          try {
            if (clip.type === 'video') {
              const video = document.createElement('video');
              video.crossOrigin = 'anonymous';
              video.preload = 'auto';
              video.setAttribute('webkit-playsinline', 'true');
              video.setAttribute('playsinline', 'true');
              video.muted = true;
              
              // Set src and manually load
              video.src = clip.src;
              video.load();
              
              mediaElementsRef.current.set(clip.id, video);
              console.log(`✅ Video loaded: ${clip.name} (${clip.id})`);
            } else if (clip.type === 'audio') {
              const audio = document.createElement('audio');
              audio.crossOrigin = 'anonymous';
              audio.preload = 'auto';
              audio.src = clip.src;
              audio.load();
              
              mediaElementsRef.current.set(clip.id, audio);
              console.log(`✅ Audio loaded: ${clip.name} (${clip.id})`);
            } else if (clip.type === 'image' || clip.type === 'giphy') {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = clip.src;
              
              mediaElementsRef.current.set(clip.id, img);
              console.log(`✅ Image loaded: ${clip.name} (${clip.id})`);
            }
          } catch (e) {
            console.error(`❌ Failed to load media: ${clip.name}`, e);
          }
        });
      });
    };

    loadMediaElements();
  }, [project]);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render each track
    project.tracks.forEach((track) => {
      if (track.hidden) return;

      track.clips.forEach((clip) => {
        // Check if clip is active at current time
        const isClipActive = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration;
        
        if (!isClipActive) {
          // Pause media if not active
          const media = mediaElementsRef.current.get(clip.id);
          if (media && 'pause' in media) {
            media.pause();
          }
          return;
        }

        const clipElapsedTime = currentTime - clip.startTime;
        const sourceTime = clip.sourceStart + clipElapsedTime * clip.speed;

        // ============ RENDER AUDIO ============
        if (clip.type === 'audio') {
          const audio = mediaElementsRef.current.get(clip.id) as HTMLAudioElement;
          if (!audio) return;

          const shouldMute = isMuted || track.muted || clip.audioSettings?.muted;
          audio.muted = shouldMute;
          audio.volume = shouldMute ? 0 : (clip.audioSettings?.volume ?? 1);
          audio.playbackRate = clip.speed || 1;
          audio.currentTime = sourceTime;

          if (isPlaying && !audio.paused === false) {
            audio.play().catch(() => {});
          } else if (!isPlaying && !audio.paused) {
            audio.pause();
          }
          return;
        }

        ctx.save();

        // ============ TRANSFORM SETUP ============
        const centerX = canvas.width / 2 + (clip.transform.x / 100) * canvas.width;
        const centerY = canvas.height / 2 + (clip.transform.y / 100) * canvas.height;

        ctx.translate(centerX, centerY);
        ctx.rotate((clip.transform.rotation * Math.PI) / 180);
        ctx.scale(
          clip.transform.flipH ? -clip.transform.scale : clip.transform.scale,
          clip.transform.flipV ? -clip.transform.scale : clip.transform.scale
        );

        // ============ APPLY FILTERS ============
        ctx.globalAlpha = clip.colorAdjustments?.opacity ?? 1;
        const filterString = buildCssFilterString(clip.colorAdjustments, clip.filter);
        if (filterString && filterString !== 'none') {
          ctx.filter = filterString;
        }

        const crop = clip.transform.crop;

        // ============ RENDER VIDEO ============
        if (clip.type === 'video') {
          const video = mediaElementsRef.current.get(clip.id) as HTMLVideoElement;
          
          if (video) {
            video.muted = true;
            video.volume = 0;
            video.playbackRate = clip.speed || 1;
            video.currentTime = sourceTime;

            if (isPlaying && video.paused) {
              video.play().catch((e) => {
                console.warn('Video play failed:', e);
                setIsBuffering(true);
              });
            } else if (!isPlaying && !video.paused) {
              video.pause();
            }

            // Wait for video to be ready
            if (video.readyState >= 2) {
              setIsBuffering(false);
              
              try {
                if (crop && (crop.width < 100 || crop.height < 100 || crop.x > 0 || crop.y > 0)) {
                  const sx = (crop.x / 100) * video.videoWidth;
                  const sy = (crop.y / 100) * video.videoHeight;
                  const sw = (crop.width / 100) * video.videoWidth;
                  const sh = (crop.height / 100) * video.videoHeight;
                  ctx.drawImage(
                    video,
                    sx, sy, sw, sh,
                    -canvas.width / 2, -canvas.height / 2,
                    canvas.width, canvas.height
                  );
                } else {
                  ctx.drawImage(
                    video,
                    -canvas.width / 2, -canvas.height / 2,
                    canvas.width, canvas.height
                  );
                }
              } catch (e) {
                console.error('Error drawing video:', e);
              }
            }
          }
        }
        // ============ RENDER IMAGE ============
        else if (clip.type === 'image' || clip.type === 'giphy') {
          const img = mediaElementsRef.current.get(clip.id) as HTMLImageElement;
          
          if (img && img.complete && img.naturalWidth > 0) {
            try {
              if (crop && (crop.width < 100 || crop.height < 100 || crop.x > 0 || crop.y > 0)) {
                const sx = (crop.x / 100) * img.naturalWidth;
                const sy = (crop.y / 100) * img.naturalHeight;
                const sw = (crop.width / 100) * img.naturalWidth;
                const sh = (crop.height / 100) * img.naturalHeight;
                ctx.drawImage(
                  img,
                  sx, sy, sw, sh,
                  -canvas.width / 2, -canvas.height / 2,
                  canvas.width, canvas.height
                );
              } else {
                ctx.drawImage(
                  img,
                  -canvas.width / 2, -canvas.height / 2,
                  canvas.width, canvas.height
                );
              }
            } catch (e) {
              console.error('Error drawing image:', e);
            }
          }
        }

        // ============ CHROMA KEY ============
        if (clip.chromaKey?.enabled) {
          applyChromaKey(ctx, canvas.width, canvas.height, clip.chromaKey);
        }

        ctx.restore();

        // ============ TEXT OVERLAY ============
        if (clip.type === 'text' && clip.textSettings) {
          renderAnimatedTextOnCanvas(
            ctx,
            canvas.width,
            canvas.height,
            clip.textSettings,
            clipElapsedTime,
            clip.duration
          );
        }
      });
    });
  }, [project, currentTime, isPlaying, isMuted]);

  // Animation loop
  useEffect(() => {
    let lastTimestamp = 0;
    let currentTimeState = currentTime;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        currentTimeState += deltaTime;

        if (currentTimeState >= project.duration) {
          currentTimeState = 0;
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(currentTimeState);
        }
      }

      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, project.duration, render, setCurrentTime, setIsPlaying]);

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

    updateClipTransform(selectedClipId, { x: dx, y: dy });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsMobileFullscreen(false);
    } else if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsMobileFullscreen((prev) => !prev);
      });
    } else {
      setIsMobileFullscreen((prev) => !prev);
    }
  };

  return (
    <div className={`flex-1 bg-black flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden select-none ${
      isMobileFullscreen ? 'fixed inset-0 z-50 p-0 m-0 bg-black' : ''
    }`}>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative bg-black border border-neutral-800 shadow-2xl flex items-center justify-center overflow-hidden transition-all ${
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
          className="w-full h-full object-contain cursor-move bg-black"
        />

        {isBuffering && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm font-bold">Buffering...</div>
          </div>
        )}

        {selectedClipId && (
          <div className="absolute inset-2 border-2 border-white border-dashed rounded-lg pointer-events-none opacity-80 animate-pulse flex items-top justify-right p-2">
            <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
              Selected
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-neutral-700 text-white font-mono text-xs px-2.5 py-1 rounded-md shadow flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{formatTimecode(currentTime, true)}</span>
          <span className="text-neutral-500">/</span>
          <span className="text-neutral-400">{formatTimecode(project.duration)}</span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition backdrop-blur shadow-lg"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold transition shadow-xl"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-black/90 border border-neutral-800 rounded-lg p-1 shadow-lg backdrop-blur">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 text-neutral-300 hover:text-white transition rounded hover:bg-neutral-800"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-neutral-800"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-neutral-800"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
