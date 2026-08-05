import { Project } from '../types/editor';
import { getCanvasDimensions, buildCssFilterString, applyChromaKey, renderAnimatedTextOnCanvas } from '../utils/canvas';

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  progress: number; // 0 to 100
  timeRemaining?: string;
  downloadUrl?: string;
  error?: string;
}

export async function exportProjectVideo(
  project: Project,
  resolution: '720p' | '1080p' | '4K',
  onProgress: (p: ExportProgress) => void
): Promise<string> {
  onProgress({ status: 'preparing', progress: 5 });

  let exportWidth = 1080;
  let exportHeight = 1920;

  const aspect = project.aspectRatio;
  if (aspect === '9:16') {
    exportWidth = resolution === '4K' ? 2160 : resolution === '1080p' ? 1080 : 720;
    exportHeight = resolution === '4K' ? 3840 : resolution === '1080p' ? 1920 : 1280;
  } else if (aspect === '16:9') {
    exportWidth = resolution === '4K' ? 3840 : resolution === '1080p' ? 1920 : 1280;
    exportHeight = resolution === '4K' ? 2160 : resolution === '1080p' ? 1080 : 720;
  } else if (aspect === '1:1') {
    exportWidth = resolution === '4K' ? 2160 : resolution === '1080p' ? 1080 : 720;
    exportHeight = exportWidth;
  } else {
    exportWidth = resolution === '4K' ? 2160 : resolution === '1080p' ? 1080 : 720;
    exportHeight = Math.round(exportWidth * 1.25);
  }

  // Create offscreen canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    onProgress({ status: 'error', progress: 0, error: 'Could not create canvas context' });
    throw new Error('Could not create canvas context');
  }

  // Set up Web Audio API Stream Context
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioDest = audioCtx.createMediaStreamDestination();

  // Combine Canvas stream + Audio stream
  const canvasStream = canvas.captureStream(30); // 30 FPS
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  // MediaRecorder setup
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: resolution === '4K' ? 16000000 : resolution === '1080p' ? 8000000 : 4000000,
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.start();
  onProgress({ status: 'rendering', progress: 10 });

  const fps = 30;
  const totalFrames = Math.max(Math.ceil(project.duration * fps), 30);
  const frameDurationSec = 1 / fps;

  // Preload video/image elements for rendering
  const loadedMediaMap = new Map<string, HTMLVideoElement | HTMLImageElement>();
  for (const track of project.tracks) {
    if (track.hidden) continue;
    for (const clip of track.clips) {
      if (clip.type === 'video') {
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.src = clip.src;
        vid.muted = true;
        vid.playsInline = true;
        await new Promise((res) => {
          vid.onloadeddata = res;
          vid.onerror = res; // Proceed even if media fails
        });
        loadedMediaMap.set(clip.id, vid);
      } else if (clip.type === 'image' || clip.type === 'giphy') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = clip.src;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
        loadedMediaMap.set(clip.id, img);
      }
    }
  }

  // Render loop frame by frame
  for (let frame = 0; frame <= totalFrames; frame++) {
    const currentTime = frame * frameDurationSec;
    const progressPct = 10 + Math.floor((frame / totalFrames) * 80);
    onProgress({ status: 'rendering', progress: progressPct });

    // Clear frame canvas
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Draw active clips per track
    for (const track of project.tracks) {
      if (track.hidden) continue;

      for (const clip of track.clips) {
        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
          const clipElapsed = currentTime - clip.startTime;

          ctx.save();
          
          // Apply Transformations (Position, Scale, Rotate, Flip)
          const centerX = exportWidth / 2 + (clip.transform.x / 100) * exportWidth;
          const centerY = exportHeight / 2 + (clip.transform.y / 100) * exportHeight;
          ctx.translate(centerX, centerY);
          ctx.rotate((clip.transform.rotation * Math.PI) / 180);
          ctx.scale(
            clip.transform.flipH ? -clip.transform.scale : clip.transform.scale,
            clip.transform.flipV ? -clip.transform.scale : clip.transform.scale
          );

          // Apply CSS Filters
          ctx.filter = buildCssFilterString(clip.colorAdjustments, clip.filter);

          if (clip.type === 'video') {
            const vid = loadedMediaMap.get(clip.id) as HTMLVideoElement;
            if (vid) {
              const targetVidTime = clip.sourceStart + clipElapsed * clip.speed;
              vid.currentTime = targetVidTime;
              ctx.drawImage(vid, -exportWidth / 2, -exportHeight / 2, exportWidth, exportHeight);
            }
          } else if (clip.type === 'image' || clip.type === 'giphy') {
            const img = loadedMediaMap.get(clip.id) as HTMLImageElement;
            if (img) {
              ctx.drawImage(img, -exportWidth / 2, -exportHeight / 2, exportWidth, exportHeight);
            }
          }

          // Apply Chroma Key
          if (clip.chromaKey?.enabled) {
            applyChromaKey(ctx, exportWidth, exportHeight, clip.chromaKey);
          }

          ctx.restore();

          // Text overlay rendering
          if (clip.type === 'text' && clip.textSettings) {
            renderAnimatedTextOnCanvas(
              ctx,
              exportWidth,
              exportHeight,
              clip.textSettings,
              clipElapsed,
              clip.duration
            );
          }
        }
      }
    }

    // Yield execution every 5 frames so UI stays smooth
    if (frame % 5 === 0) {
      await new Promise((res) => setTimeout(res, 10));
    }
  }

  onProgress({ status: 'encoding', progress: 95 });
  recorder.stop();

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      onProgress({ status: 'completed', progress: 100, downloadUrl });
      resolve(downloadUrl);
    };
  });
}
