import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { searchPexelsVideos, searchPexelsPhotos } from '../../services/pexels';
import { PexelsMediaItem } from '../../types/editor';
import { Search, Film, Image as ImageIcon, Plus, Loader2, Upload, Music, FolderOpen, Trash2 } from 'lucide-react';

interface LocalUploadedMedia {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail?: string;
  duration: number;
}

export const PexelsMediaPanel: React.FC = () => {
  const { addClipToTrack, showToast } = useEditor();
  const { profile } = useAuth();
  const userApiKey = profile?.customApiKeys?.pexelsKey;

  const [activeTab, setActiveTab] = useState<'uploads' | 'video' | 'photo'>('uploads');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<PexelsMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localUploads, setLocalUploads] = useState<LocalUploadedMedia[]>(() => {
    const saved = localStorage.getItem('editora_uploaded_media');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    if (activeTab === 'uploads') return;
    setLoading(true);
    try {
      if (activeTab === 'video') {
        const results = await searchPexelsVideos(query, 16, userApiKey);
        setItems(results);
      } else {
        const results = await searchPexelsPhotos(query, 16, userApiKey);
        setItems(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');

      const mediaType: 'video' | 'image' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        
        // FIX: Set src BEFORE adding listeners
        video.src = url;

        // FIX: Use a timeout to ensure metadata is loaded
        let metadataLoaded = false;
        let duration = 8;

        const onMetadata = () => {
          metadataLoaded = true;
          duration = Math.max(1, Math.round(video.duration || 8));
          video.currentTime = Math.min(1, duration / 2);
        };

        const onSeeked = () => {
          if (!metadataLoaded) return;
          
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
              const newItem: LocalUploadedMedia = {
                id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                name: file.name,
                type: 'video',
                url,
                thumbnail,
                duration,
              };
              saveAndAddUpload(newItem);
              cleanup();
              return;
            }
          } catch (e) {
            console.error('Thumbnail generation failed:', e);
          }
          
          // Fallback: no thumbnail
          const newItem: LocalUploadedMedia = {
            id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: file.name,
            type: 'video',
            url,
            duration,
          };
          saveAndAddUpload(newItem);
          cleanup();
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onMetadata);
          video.removeEventListener('seeked', onSeeked);
          video.src = '';
        };

        video.addEventListener('loadedmetadata', onMetadata);
        video.addEventListener('seeked', onSeeked);
        
        // FIX: Force load for blob URLs
        video.load();

        // Timeout fallback (5 seconds) - in case video never loads properly
        setTimeout(() => {
          if (!metadataLoaded) {
            console.warn('Video metadata timeout for:', file.name);
            const newItem: LocalUploadedMedia = {
              id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              name: file.name,
              type: 'video',
              url,
              duration: 8,
            };
            saveAndAddUpload(newItem);
            cleanup();
          }
        }, 5000);

      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.src = url;
        audio.onloadedmetadata = () => {
          const duration = Math.max(1, Math.round(audio.duration || 10));
          const newItem: LocalUploadedMedia = {
            id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: file.name,
            type: 'audio',
            url,
            duration,
          };
          saveAndAddUpload(newItem);
        };
        audio.load();
      } else if (isImage) {
        const img = new Image();
        img.onload = () => {
          const newItem: LocalUploadedMedia = {
            id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: file.name,
            type: 'image',
            url,
            duration: 5,
          };
          saveAndAddUpload(newItem);
        };
        img.onerror = () => {
          showToast(`Failed to load image: ${file.name}`);
        };
        img.src = url;
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveAndAddUpload = (newItem: LocalUploadedMedia) => {
    setLocalUploads((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem('editora_uploaded_media', JSON.stringify(updated));
      return updated;
    });

    addClipToTrack({
      type: newItem.type,
      src: newItem.url,
      name: newItem.name,
      thumbnail: newItem.thumbnail || (newItem.type === 'image' ? newItem.url : undefined),
      duration: newItem.duration,
    });

    showToast(`✅ Uploaded & added ${newItem.name}`);
  };

  const handleRemoveUpload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalUploads((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('editora_uploaded_media', JSON.stringify(updated));
      return updated;
    });
  };

  const handleImportPexelsMedia = (item: PexelsMediaItem) => {
    if (item.type === 'video') {
      addClipToTrack({
        type: 'video',
        src: item.videoUrl || item.previewUrl,
        name: `Stock Video #${item.id}`,
        thumbnail: item.previewUrl,
        duration: item.duration || 8,
      });
    } else {
      addClipToTrack({
        type: 'image',
        src: item.videoUrl || item.previewUrl,
        name: `Stock Photo #${item.id}`,
        thumbnail: item.previewUrl,
        duration: 5,
      });
    }
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-white" />
          Media & Stock
        </h2>

        {/* Tab Switcher */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              activeTab === 'uploads' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            Uploads
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              activeTab === 'video' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3" />
            Stock Videos
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              activeTab === 'photo' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            Photos
          </button>
        </div>
      </div>

      {activeTab === 'uploads' ? (
        <div className="flex flex-col space-y-4">
          {/* Upload Drop Zone Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-white rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-950/60 hover:bg-neutral-950 transition"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center mb-2 transition transform hover:scale-110">
              <Upload className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-bold text-white mb-0.5">Click to Upload Media</h3>
            <p className="text-[11px] text-neutral-400">Supports MP4, MOV, MP3, WAV, JPG, PNG</p>
          </div>

          {/* User Uploaded Assets Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Your Uploaded Library ({localUploads.length})
            </h4>

            {localUploads.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs bg-neutral-950/40 rounded-xl border border-neutral-900">
                <FolderOpen className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                No local media uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {localUploads.map((up) => (
                  <div
                    key={up.id}
                    onClick={() =>
                      addClipToTrack({
                        type: up.type,
                        src: up.url,
                        name: up.name,
                        thumbnail: up.type === 'image' ? up.url : up.thumbnail,
                        duration: up.duration,
                      })
                    }
                    className="group relative aspect-video bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:border-white transition shadow flex flex-col items-center justify-center"
                  >
                    {up.type === 'image' ? (
                      <img src={up.url} alt={up.name} className="w-full h-full object-cover" />
                    ) : up.type === 'video' ? (
                      <>
                        {up.thumbnail ? (
                          <img src={up.thumbnail} alt={up.name} className="w-full h-full object-cover" />
                        ) : (
                          <Film className="w-8 h-8 text-neutral-600" />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-amber-400">
                        <Music className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold text-neutral-300 truncate max-w-[80px]">{up.name}</span>
                      </div>
                    )}

                    <span className="absolute bottom-1 right-1 bg-neutral-950/90 text-[9px] font-mono font-bold px-1 rounded text-white">
                      {up.duration}s
                    </span>

                    <button
                      onClick={(e) => handleRemoveUpload(up.id, e)}
                      className="absolute top-1 right-1 p-1 bg-neutral-900/80 hover:bg-rose-600 text-neutral-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition"
                      title="Remove from Uploads"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                      <Plus className="w-4 h-4 text-white" />
                      <span>Add</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search Input for Stock Media */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'video' ? 'Search HD stock videos...' : 'Search stock photos...'}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
          </form>

          {/* Stock Media Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleImportPexelsMedia(item)}
                  className="group relative aspect-video bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:border-white transition shadow"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.author}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {item.type === 'video' && item.duration && (
                    <span className="absolute bottom-1 right-1 bg-neutral-950/80 backdrop-blur text-[9px] font-mono font-bold px-1 rounded text-white">
                      {item.duration}s
                    </span>
                  )}

                  <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                    <Plus className="w-4 h-4 text-white" />
                    <span>Add Clip</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
