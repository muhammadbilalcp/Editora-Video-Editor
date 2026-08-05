import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Project, Track, Clip, AspectRatio, ClipType, TextSettings, ColorAdjustments, AudioSettings, TransformSettings } from '../types/editor';
import { saveProjectToCloud } from '../services/firebase';
import { useAuth } from './AuthContext';

export type ActiveToolPanel = 'media' | 'voice' | 'text' | 'giphy' | 'audio' | 'inspector' | 'recorder' | 'export' | 'projects' | 'settings';

interface EditorContextType {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  currentTime: number;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  selectedTrackId: string | null;
  setSelectedTrackId: (id: string | null) => void;
  activePanel: ActiveToolPanel;
  setActivePanel: (panel: ActiveToolPanel) => void;
  zoomLevel: number; // Pixels per second in timeline
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // Timeline Operations
  addClipToTrack: (clipData: Partial<Clip> & { type: ClipType; src: string; name: string }, targetTrackId?: string) => void;
  removeClip: (clipId: string) => void;
  splitClipAtPlayhead: (clipId: string) => void;
  trimClip: (clipId: string, newStartTime: number, newDuration: number, newSourceStart?: number) => void;
  duplicateClip: (clipId: string) => void;
  updateClipTransform: (clipId: string, transform: Partial<TransformSettings>) => void;
  updateClipColor: (clipId: string, color: Partial<ColorAdjustments>) => void;
  updateClipFilter: (clipId: string, filter: string) => void;
  updateClipText: (clipId: string, textSettings: Partial<TextSettings>) => void;
  updateClipAudio: (clipId: string, audioSettings: Partial<AudioSettings>) => void;
  updateClipSpeed: (clipId: string, speed: number) => void;
  freezeFrame: (clipId: string) => void;
  toggleReverseClip: (clipId: string) => void;
  setAspectRatio: (aspect: AspectRatio) => void;
  
  // Autosave & Toast
  isAutosaving: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  saveProjectNow: () => Promise<void>;
  createNewProject: (name?: string, aspect?: AspectRatio) => void;
}

const DEFAULT_PROJECT: Project = {
  id: 'proj_' + Date.now(),
  name: 'My EDITORA Story',
  aspectRatio: '9:16', // Default mobile vertical format (TikTok, Reels, Shorts)
  duration: 15,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tracks: [
    {
      id: 'track_text_1',
      name: 'Text & Overlays',
      type: 'text',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
    {
      id: 'track_overlay_1',
      name: 'GIPHY & Stickers',
      type: 'overlay',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
    {
      id: 'track_media_1',
      name: 'Video Track 1',
      type: 'media',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
    {
      id: 'track_voice_1',
      name: 'AI Voice & Voiceover',
      type: 'voiceover',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
    {
      id: 'track_audio_1',
      name: 'Music & SFX',
      type: 'audio',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
  ],
};

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project>(() => {
    const local = localStorage.getItem('editora_current_project');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return DEFAULT_PROJECT;
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActiveToolPanel>('media');
  const [zoomLevel, setZoomLevel] = useState<number>(30); // 30px per sec
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Undo / Redo History Stack
  const historyRef = useRef<Project[]>([project]);
  const historyIndexRef = useRef<number>(0);

  const pushHistory = useCallback((newProj: Project) => {
    const currentHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current = [...currentHistory, newProj];
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = () => {
    if (canUndo) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      setProject(prev);
      showToast('Undo action');
    }
  };

  const redo = () => {
    if (canRedo) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      setProject(next);
      showToast('Redo action');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Recalculate Project total duration whenever clips change
  const recalculateDuration = useCallback((tracks: Track[]) => {
    let maxEnd = 10;
    tracks.forEach((tr) => {
      tr.clips.forEach((cl) => {
        const clipEnd = cl.startTime + cl.duration;
        if (clipEnd > maxEnd) maxEnd = clipEnd;
      });
    });
    return Math.ceil(maxEnd + 2); // 2s padding
  }, []);

  // Modify project with history push
  const updateProjectState = useCallback((updater: (prev: Project) => Project) => {
    setProject((prev) => {
      const updated = updater(prev);
      const newDuration = recalculateDuration(updated.tracks);
      const finalProj = { ...updated, duration: newDuration, updatedAt: Date.now() };
      pushHistory(finalProj);
      localStorage.setItem('editora_current_project', JSON.stringify(finalProj));
      return finalProj;
    });
  }, [pushHistory, recalculateDuration]);

  // Debounced Cloud Autosave
  const autosaveTimerRef = useRef<any>(null);
  useEffect(() => {
    localStorage.setItem('editora_current_project', JSON.stringify(project));

    if (user) {
      setIsAutosaving(true);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      
      autosaveTimerRef.current = setTimeout(async () => {
        await saveProjectToCloud(user.uid, project);
        setIsAutosaving(false);
      }, 3000);
    }
  }, [project, user]);

  const saveProjectNow = async () => {
    if (user) {
      setIsAutosaving(true);
      await saveProjectToCloud(user.uid, project);
      setIsAutosaving(false);
      showToast('Project saved to cloud');
    } else {
      localStorage.setItem('editora_current_project', JSON.stringify(project));
      showToast('Project saved locally');
    }
  };

  const createNewProject = (name: string = 'Untitled Story', aspect: AspectRatio = '9:16') => {
    const newProj: Project = {
      ...DEFAULT_PROJECT,
      id: 'proj_' + Date.now(),
      name,
      aspectRatio: aspect,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProject(newProj);
    setCurrentTime(0);
    setSelectedClipId(null);
    historyRef.current = [newProj];
    historyIndexRef.current = 0;
    showToast(`Created new project: ${name}`);
  };

  // Timeline Operations
  const addClipToTrack = (
    clipData: Partial<Clip> & { type: ClipType; src: string; name: string },
    targetTrackId?: string
  ) => {
    updateProjectState((prev) => {
      let track = prev.tracks.find((t) => t.id === targetTrackId);

      // Auto pick track if not specified
      if (!track) {
        if (clipData.type === 'text') track = prev.tracks.find((t) => t.type === 'text');
        else if (clipData.type === 'giphy') track = prev.tracks.find((t) => t.type === 'overlay');
        else if (clipData.type === 'voiceover') track = prev.tracks.find((t) => t.type === 'voiceover');
        else if (clipData.type === 'audio') track = prev.tracks.find((t) => t.type === 'audio');
        else track = prev.tracks.find((t) => t.type === 'media');
      }

      if (!track) track = prev.tracks[0];

      // Calculate placement start time after existing clips or at playhead
      let placementStart = currentTime;
      if (track.clips.length > 0) {
        const lastClip = track.clips[track.clips.length - 1];
        if (placementStart < lastClip.startTime + lastClip.duration) {
          placementStart = lastClip.startTime + lastClip.duration;
        }
      }

      const duration = clipData.duration || 5;

      const newClip: Clip = {
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        trackId: track.id,
        name: clipData.name,
        type: clipData.type,
        src: clipData.src,
        thumbnail: clipData.thumbnail,
        startTime: placementStart,
        duration,
        sourceStart: clipData.sourceStart || 0,
        sourceDuration: clipData.sourceDuration || duration,
        speed: 1,
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          flipH: false,
          flipV: false,
          ...clipData.transform,
        },
        colorAdjustments: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
          opacity: 1,
          hueRotate: 0,
          ...clipData.colorAdjustments,
        },
        filter: clipData.filter || 'none',
        audioSettings: {
          volume: 1,
          muted: false,
          fadeIn: 0,
          fadeOut: 0,
          speed: 1,
          ...clipData.audioSettings,
        },
        textSettings: clipData.textSettings,
        chromaKey: clipData.chromaKey,
      };

      const newTracks = prev.tracks.map((t) => {
        if (t.id === track!.id) {
          return { ...t, clips: [...t.clips, newClip] };
        }
        return t;
      });

      return { ...prev, tracks: newTracks };
    });

    showToast(`Added ${clipData.name} to timeline`);
  };

  const removeClip = (clipId: string) => {
    updateProjectState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.filter((c) => c.id !== clipId),
      })),
    }));
    if (selectedClipId === clipId) setSelectedClipId(null);
    showToast('Removed clip');
  };

  const splitClipAtPlayhead = (clipId: string) => {
    updateProjectState((prev) => {
      const newTracks = prev.tracks.map((track) => {
        const targetClip = track.clips.find((c) => c.id === clipId);
        if (!targetClip) return track;

        // Ensure playhead is within clip bounds
        if (currentTime <= targetClip.startTime || currentTime >= targetClip.startTime + targetClip.duration) {
          return track;
        }

        const splitOffset = currentTime - targetClip.startTime;

        const leftClip: Clip = {
          ...targetClip,
          duration: splitOffset,
          sourceDuration: splitOffset * targetClip.speed,
        };

        const rightClip: Clip = {
          ...targetClip,
          id: 'clip_' + Date.now() + '_split',
          startTime: currentTime,
          duration: targetClip.duration - splitOffset,
          sourceStart: targetClip.sourceStart + splitOffset * targetClip.speed,
          sourceDuration: (targetClip.duration - splitOffset) * targetClip.speed,
        };

        const updatedClips = track.clips.flatMap((c) => (c.id === clipId ? [leftClip, rightClip] : [c]));
        return { ...track, clips: updatedClips };
      });

      return { ...prev, tracks: newTracks };
    });

    showToast('Split clip at playhead');
  };

  const trimClip = (clipId: string, newStartTime: number, newDuration: number, newSourceStart?: number) => {
    updateProjectState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => {
          if (c.id === clipId) {
            return {
              ...c,
              startTime: Math.max(0, newStartTime),
              duration: Math.max(0.5, newDuration),
              sourceStart: newSourceStart !== undefined ? newSourceStart : c.sourceStart,
            };
          }
          return c;
        }),
      })),
    }));
  };

  const duplicateClip = (clipId: string) => {
    let duplicatedName = 'Clip';
    updateProjectState((prev) => {
      const newTracks = prev.tracks.map((track) => {
        const clip = track.clips.find((c) => c.id === clipId);
        if (!clip) return track;

        duplicatedName = clip.name;
        const copy: Clip = {
          ...clip,
          id: 'clip_' + Date.now() + '_copy',
          name: `${clip.name} (Copy)`,
          startTime: clip.startTime + clip.duration + 0.2,
        };

        return { ...track, clips: [...track.clips, copy] };
      });
      return { ...prev, tracks: newTracks };
    });
    showToast(`Duplicated ${duplicatedName}`);
  };

  const updateClipTransform = (clipId: string, transform: Partial<TransformSettings>) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === clipId ? { ...c, transform: { ...c.transform, ...transform } } : c)),
      })),
    }));
  };

  const updateClipColor = (clipId: string, color: Partial<ColorAdjustments>) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === clipId ? { ...c, colorAdjustments: { ...c.colorAdjustments, ...color } } : c)),
      })),
    }));
  };

  const updateClipFilter = (clipId: string, filter: string) => {
    updateProjectState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === clipId ? { ...c, filter } : c)),
      })),
    }));
  };

  const updateClipText = (clipId: string, textSettings: Partial<TextSettings>) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) =>
          c.id === clipId && c.textSettings
            ? { ...c, textSettings: { ...c.textSettings, ...textSettings } }
            : c
        ),
      })),
    }));
  };

  const updateClipAudio = (clipId: string, audioSettings: Partial<AudioSettings>) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) =>
          c.id === clipId ? { ...c, audioSettings: { ...c.audioSettings, ...audioSettings } } : c
        ),
      })),
    }));
  };

  const updateClipSpeed = (clipId: string, speed: number) => {
    updateProjectState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => {
          if (c.id === clipId) {
            const newDuration = c.sourceDuration / speed;
            return { ...c, speed, duration: newDuration };
          }
          return c;
        }),
      })),
    }));
    showToast(`Speed set to ${speed}x`);
  };

  const freezeFrame = (clipId: string) => {
    updateProjectState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === clipId ? { ...c, isFrozen: !c.isFrozen } : c)),
      })),
    }));
    showToast('Toggled Freeze Frame');
  };

  const toggleReverseClip = (clipId: string) => {
    updateProjectState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === clipId ? { ...c, isReversed: !c.isReversed } : c)),
      })),
    }));
    showToast('Toggled Reverse Playback');
  };

  const setAspectRatio = (aspect: AspectRatio) => {
    updateProjectState((prev) => ({ ...prev, aspectRatio: aspect }));
    showToast(`Aspect ratio set to ${aspect}`);
  };

  return (
    <EditorContext.Provider
      value={{
        project,
        setProject,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        selectedClipId,
        setSelectedClipId,
        selectedTrackId,
        setSelectedTrackId,
        activePanel,
        setActivePanel,
        zoomLevel,
        setZoomLevel,
        canUndo,
        canRedo,
        undo,
        redo,
        addClipToTrack,
        removeClip,
        splitClipAtPlayhead,
        trimClip,
        duplicateClip,
        updateClipTransform,
        updateClipColor,
        updateClipFilter,
        updateClipText,
        updateClipAudio,
        updateClipSpeed,
        freezeFrame,
        toggleReverseClip,
        setAspectRatio,
        isAutosaving,
        toastMessage,
        showToast,
        saveProjectNow,
        createNewProject,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within an EditorProvider');
  return context;
};
