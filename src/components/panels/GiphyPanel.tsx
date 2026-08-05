import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { searchGiphy, fetchTrendingGiphy } from '../../services/giphy';
import { GiphyMediaItem } from '../../types/editor';
import { Search, Sparkles, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';

export const GiphyPanel: React.FC = () => {
  const { addClipToTrack } = useEditor();
  const { profile } = useAuth();
  const apiKey = profile?.customApiKeys?.giphyKey;

  const [isSticker, setIsSticker] = useState(true);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<GiphyMediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGiphy = async () => {
    setLoading(true);
    try {
      const results = query.trim()
        ? await searchGiphy(query, isSticker, 24, apiKey)
        : await fetchTrendingGiphy(isSticker, 24, apiKey);
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGiphy();
  }, [isSticker]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGiphy();
  };

  const handleAddGiphy = (item: GiphyMediaItem) => {
    addClipToTrack({
      type: 'giphy',
      src: item.url,
      name: item.title || (isSticker ? 'GIPHY Sticker' : 'GIPHY GIF'),
      thumbnail: item.previewUrl,
      duration: 4,
    });
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto select-none">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          GIPHY GIFs & Stickers
        </h2>

        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setIsSticker(true)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              isSticker ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Stickers
          </button>
          <button
            onClick={() => setIsSticker(false)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              !isSticker ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            GIFs
          </button>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isSticker ? 'Search GIPHY stickers...' : 'Search trending GIFs...'}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
      </form>

      {/* Media Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAddGiphy(item)}
              className="group relative aspect-square bg-neutral-900/60 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:border-amber-400 transition p-1 flex items-center justify-center"
            >
              <img
                src={item.previewUrl}
                alt={item.title}
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-300"
              />

              <div className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-[10px] font-bold transition">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
