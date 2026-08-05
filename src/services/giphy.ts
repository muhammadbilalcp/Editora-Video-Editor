import { GiphyMediaItem } from '../types/editor';

const DEFAULT_GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || "Z2zKCC43dRuA3z4Y6kPRv3braMKNp9xP";

export async function fetchTrendingGiphy(
  isSticker: boolean = false,
  limit: number = 24,
  apiKey?: string
): Promise<GiphyMediaItem[]> {
  const key = apiKey || DEFAULT_GIPHY_KEY;
  const endpoint = isSticker ? 'stickers' : 'gifs';
  const url = `https://api.giphy.com/v1/${endpoint}/trending?api_key=${key}&limit=${limit}&rating=g`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GIPHY API Error: ${res.status}`);
    const data = await res.json();
    
    return parseGiphyResponse(data, isSticker);
  } catch (err) {
    console.error('Error fetching GIPHY trending:', err);
    return getFallbackGiphys(isSticker);
  }
}

export async function searchGiphy(
  query: string,
  isSticker: boolean = false,
  limit: number = 24,
  apiKey?: string
): Promise<GiphyMediaItem[]> {
  if (!query.trim()) return fetchTrendingGiphy(isSticker, limit, apiKey);

  const key = apiKey || DEFAULT_GIPHY_KEY;
  const endpoint = isSticker ? 'stickers' : 'gifs';
  const url = `https://api.giphy.com/v1/${endpoint}/search?api_key=${key}&q=${encodeURIComponent(
    query
  )}&limit=${limit}&rating=g`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GIPHY Search Error: ${res.status}`);
    const data = await res.json();
    return parseGiphyResponse(data, isSticker);
  } catch (err) {
    console.error('Error searching GIPHY:', err);
    return getFallbackGiphys(isSticker);
  }
}

function parseGiphyResponse(data: any, isSticker: boolean): GiphyMediaItem[] {
  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data.map((item: any) => {
    const images = item.images;
    const previewUrl =
      images.fixed_height_small?.url ||
      images.fixed_width_small?.url ||
      images.downsized?.url ||
      item.embed_url;

    const fullUrl =
      images.original?.url ||
      images.downsized_large?.url ||
      previewUrl;

    return {
      id: item.id,
      title: item.title || (isSticker ? 'Sticker' : 'GIF'),
      url: fullUrl,
      previewUrl: previewUrl,
      width: parseInt(images.original?.width || '300', 10),
      height: parseInt(images.original?.height || '300', 10),
      isSticker,
    };
  });
}

function getFallbackGiphys(isSticker: boolean): GiphyMediaItem[] {
  // Sample reliable GIPHY stickers & GIFs if rate limited
  const sampleGifs = [
    {
      id: 'fallback_1',
      title: 'Wow Sparkles',
      url: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif',
      width: 480,
      height: 480,
      isSticker: false,
    },
    {
      id: 'fallback_2',
      title: 'Fire Reaction',
      url: 'https://media.giphy.com/media/2630p6742u9Qx2yL6/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/2630p6742u9Qx2yL6/giphy.gif',
      width: 480,
      height: 480,
      isSticker: false,
    },
  ];
  return sampleGifs;
}
