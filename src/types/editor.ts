export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'giphy' | 'voiceover';

export interface ColorAdjustments {
  brightness: number; // -100 to 100 (0 default)
  contrast: number;   // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  blur: number;       // 0 to 50px
  opacity: number;    // 0 to 1 (1 default)
  hueRotate: number;  // 0 to 360 deg
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // hex code or 'green' / 'blue'
  similarity: number; // 0 to 1
  smoothness: number; // 0 to 1
}

export interface TextSettings {
  content: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  gradientText?: {
    enabled: boolean;
    from: string;
    to: string;
    direction: string;
  };
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  backgroundColor?: string;
  animation?: 'none' | 'fade' | 'slide-up' | 'bounce' | 'typewriter' | 'zoom' | 'pop';
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
}

export interface AudioSettings {
  volume: number; // 0 to 2 (1 default)
  muted: boolean;
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  speed: number; // 0.25 to 4
}

export interface TransformSettings {
  x: number; // offset % from center (-50 to 50)
  y: number; // offset % from center (-50 to 50)
  scale: number; // 0.1 to 5
  rotation: number; // 0, 90, 180, 270, or custom deg
  flipH: boolean;
  flipV: boolean;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: ClipType;
  src: string; // Blob URL, CDN URL, or raw text content
  thumbnail?: string;
  
  // Timing on timeline
  startTime: number; // Seconds on timeline where clip begins
  duration: number; // Total duration on timeline
  
  // Media source trimming
  sourceStart: number; // Start offset within original media file
  sourceDuration: number; // Total length of original media
  
  // Speed & Playback
  speed: number; // 0.25x to 4x
  isReversed?: boolean;
  isFrozen?: boolean;
  
  // Visuals & Audio
  transform: TransformSettings;
  colorAdjustments: ColorAdjustments;
  chromaKey?: ChromaKeySettings;
  filter: string; // 'none' | 'cinematic' | 'vintage' | 'cyberpunk' | 'bw' | 'warm' | 'cold' | 'drama'
  
  // Specific payload types
  textSettings?: TextSettings;
  audioSettings: AudioSettings;
}

export interface Track {
  id: string;
  name: string;
  type: 'media' | 'audio' | 'overlay' | 'text' | 'voiceover';
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  clips: Clip[];
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  duration: number;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  thumbnailUrl?: string;
  userId?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  customApiKeys?: {
    pexelsKey?: string;
    giphyKey?: string;
    elevenlabsKey?: string;
  };
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category: string;
  description?: string;
}

export interface PexelsMediaItem {
  id: number;
  type: 'video' | 'photo';
  previewUrl: string;
  videoUrl?: string;
  author: string;
  width: number;
  height: number;
  duration?: number;
}

export interface GiphyMediaItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  isSticker: boolean;
}
