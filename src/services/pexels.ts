import { PexelsMediaItem } from '../types/editor';

const DEFAULT_PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY || "fNhNYm1Qxl28JDraxG3Wd28WL4t26Smyl8m5ecQ8u3rmRn23leD5AKtC";

export async function fetchPopularPexelsVideos(
  perPage: number = 20,
  apiKey?: string
): Promise<PexelsMediaItem[]> {
  const key = apiKey || DEFAULT_PEXELS_KEY;
  try {
    const res = await fetch(`https://api.pexels.com/videos/popular?per_page=${perPage}`, {
      headers: { Authorization: key },
    });
    if (!res.ok) throw new Error(`Pexels API Error: ${res.status}`);
    const data = await res.json();
    return parsePexelsVideos(data.videos || []);
  } catch (err) {
    console.error('Error fetching Pexels videos:', err);
    return [];
  }
}

export async function searchPexelsVideos(
  query: string,
  perPage: number = 20,
  apiKey?: string
): Promise<PexelsMediaItem[]> {
  if (!query.trim()) return fetchPopularPexelsVideos(perPage, apiKey);
  const key = apiKey || DEFAULT_PEXELS_KEY;
  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: { Authorization: key },
      }
    );
    if (!res.ok) throw new Error(`Pexels API Error: ${res.status}`);
    const data = await res.json();
    return parsePexelsVideos(data.videos || []);
  } catch (err) {
    console.error('Error searching Pexels videos:', err);
    return [];
  }
}

export async function searchPexelsPhotos(
  query: string,
  perPage: number = 20,
  apiKey?: string
): Promise<PexelsMediaItem[]> {
  const key = apiKey || DEFAULT_PEXELS_KEY;
  const endpoint = query.trim()
    ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`
    : `https://api.pexels.com/v1/curated?per_page=${perPage}`;

  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: key },
    });
    if (!res.ok) throw new Error(`Pexels Photos API Error: ${res.status}`);
    const data = await res.json();
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      type: 'photo' as const,
      previewUrl: photo.src?.medium || photo.src?.small,
      videoUrl: photo.src?.large2x || photo.src?.original,
      author: photo.photographer || 'Pexels',
      width: photo.width,
      height: photo.height,
    }));
  } catch (err) {
    console.error('Error searching Pexels photos:', err);
    return [];
  }
}

function parsePexelsVideos(videos: any[]): PexelsMediaItem[] {
  return videos.map((v) => {
    // Find best HD mp4 file
    const files = v.video_files || [];
    const bestHdFile =
      files.find((f: any) => f.quality === 'hd' && f.file_type === 'video/mp4') ||
      files.find((f: any) => f.file_type === 'video/mp4') ||
      files[0];

    return {
      id: v.id,
      type: 'video' as const,
      previewUrl: v.image,
      videoUrl: bestHdFile?.link || v.image,
      author: v.user?.name || 'Pexels Creator',
      width: v.width,
      height: v.height,
      duration: v.duration,
    };
  });
}
