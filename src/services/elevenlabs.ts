import { ElevenLabsVoice } from '../types/editor';

const DEFAULT_ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "sk_fa28f84666dc6084f2a11bc65513214fc83d67bf61f601bf";

export const DEFAULT_VOICES: ElevenLabsVoice[] = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'Conversational', description: 'Calm, clear female voice for narration & stories' },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'Energetic', description: 'Vibrant, emphatic young female voice' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'Soft Narration', description: 'Warm, expressive female voice' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'Deep Narration', description: 'Smooth, confident male voice' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'Youthful', description: 'Playful, friendly female voice' },
  { voice_id: 'TxGEqnscrfW3v0zjSYXq', name: 'Josh', category: 'Deep Corporate', description: 'Resonant, authoritative male voice' },
  { voice_id: 'VR6AewLTigWG4xTVO15u', name: 'Arnold', category: 'Crisp & Punchy', description: 'Strong, intense male voice' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'Deep Trailer', description: 'Deep, dramatic male voice for promos' },
  { voice_id: 'yoZ06aGfXx9XF33m38Mr', name: 'Sam', category: 'Friendly', description: 'Versatile American male voice' },
];

export async function fetchVoices(apiKey?: string): Promise<ElevenLabsVoice[]> {
  const key = apiKey || DEFAULT_ELEVENLABS_KEY;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': key,
      },
    });

    if (!res.ok) {
      console.warn('ElevenLabs API voices error, using default voice list');
      return DEFAULT_VOICES;
    }

    const data = await res.json();
    if (data.voices && Array.isArray(data.voices)) {
      return data.voices.map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url,
        category: v.category || 'General',
        description: v.labels?.description || v.labels?.accent || 'ElevenLabs Voice',
      }));
    }
    return DEFAULT_VOICES;
  } catch (err) {
    console.error('Failed to fetch ElevenLabs voices:', err);
    return DEFAULT_VOICES;
  }
}

export async function generateTextToSpeech(
  text: string,
  voiceId: string,
  apiKey?: string,
  options?: { stability?: number; similarityBoost?: number }
): Promise<string> {
  const key = apiKey || DEFAULT_ELEVENLABS_KEY;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': key,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs TTS Error (${response.status}): ${errText}`);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

export async function cloneVoice(
  name: string,
  description: string,
  audioFiles: File[],
  apiKey?: string
): Promise<ElevenLabsVoice> {
  const key = apiKey || DEFAULT_ELEVENLABS_KEY;
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);

  audioFiles.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': key,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voice Cloning failed: ${errText}`);
  }

  const data = await response.json();
  return {
    voice_id: data.voice_id,
    name,
    category: 'Cloned',
    description,
  };
}
