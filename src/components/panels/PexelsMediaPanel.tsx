import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { searchPexelsVideos, searchPexelsPhotos, fetchPopularPexelsVideos } from '../../services/pexels';
import { PexelsMediaItem } from '../../types/editor';
import { Search, Film, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';

export const PexelsMediaPanel: React.FC = () => {
  const { addClipToTrack } = useEditor();
  const { profile } = useAuth();
  const userApiKey = profile?.customApiKeys?.pexelsKey;

  const [activeTab, setActiveTab] = useState<'video' | 'photo'>('video');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<PexelsMediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMedia = async () => {
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

  const handleImportMedia = (item: PexelsMediaItem) => {
    if (item.type === 'video') {
      addClipToTrack({
        type: 'video',
        src: item.videoUrl || item.previewUrl,
        name: `Pexels Video #${item.id}`,
        thumbnail: item.previewUrl,
        duration: item.duration || 8,
      });
    } else {
      addClipToTrack({
        type: 'image',
        src: item.videoUrl || item.previewUrl,
        name: `Pexels Photo #${item.id}`,
        thumbnail: item.previewUrl,
        duration: 5,
      });
    }
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-sky-400" />
          Pexels Stock Media
        </h2>

        {/* Tab Switcher */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'video' ? 'bg-sky-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Videos
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeTab === 'photo' ? 'bg-sky-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photos
          </button>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={activeTab === 'video' ? 'Search 4K/HD stock videos...' : 'Search stock photos...'}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-sky-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
      </form>

      {/* Media Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleImportMedia(item)}
              className="group relative aspect-video bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:border-sky-500 transition shadow"
            >
              <img
                src={item.previewUrl}
                alt={item.author}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              {item.type === 'video' && item.duration && (
                <span className="absolute bottom-1.5 right-1.5 bg-neutral-950/80 backdrop-blur text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded text-white">
                  {item.duration}s
                </span>
              )}

              <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-semibold transition">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Add Clip</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
