import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_VOICES, fetchVoices, generateTextToSpeech, cloneVoice } from '../../services/elevenlabs';
import { ElevenLabsVoice } from '../../types/editor';
import { Mic, Sparkles, Volume2, Plus, Loader2, Upload, Play, Pause } from 'lucide-react';

export const ElevenLabsVoicePanel: React.FC = () => {
  const { addClipToTrack, currentTime } = useEditor();
  const { profile } = useAuth();
  const apiKey = profile?.customApiKeys?.elevenlabsKey;

  const [mode, setMode] = useState<'tts' | 'clone'>('tts');
  const [voices, setVoices] = useState<ElevenLabsVoice[]>(DEFAULT_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(DEFAULT_VOICES[0].voice_id);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  // Voice Cloning State
  const [cloneName, setCloneName] = useState('');
  const [cloneDesc, setCloneDesc] = useState('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    fetchVoices(apiKey).then((vList) => {
      if (vList && vList.length > 0) setVoices(vList);
    });
  }, [apiKey]);

  const handleGenerateTTS = async () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    try {
      const url = await generateTextToSpeech(promptText, selectedVoiceId, apiKey);
      setAudioPreviewUrl(url);

      const voiceObj = voices.find((v) => v.voice_id === selectedVoiceId);
      const voiceName = voiceObj ? voiceObj.name : 'AI Voice';

      // Auto Add to Voiceover track
      addClipToTrack({
        type: 'voiceover',
        src: url,
        name: `AI Voice (${voiceName})`,
        duration: Math.max(3, Math.ceil(promptText.length / 15)),
      });
    } catch (err: any) {
      alert(`ElevenLabs TTS Error: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreviewAudio = () => {
    if (!audioPreviewUrl) return;
    if (isPlayingPreview && audioObj) {
      audioObj.pause();
      setIsPlayingPreview(false);
    } else {
      const newAudio = new Audio(audioPreviewUrl);
      newAudio.play();
      setIsPlayingPreview(true);
      newAudio.onended = () => setIsPlayingPreview(false);
      setAudioObj(newAudio);
    }
  };

  const handleCloneVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName || cloneFiles.length === 0) return;
    setIsCloning(true);
    try {
      const newVoice = await cloneVoice(cloneName, cloneDesc, cloneFiles, apiKey);
      setVoices((prev) => [newVoice, ...prev]);
      setSelectedVoiceId(newVoice.voice_id);
      setMode('tts');
      alert(`Voice "${cloneName}" successfully cloned!`);
    } catch (err: any) {
      alert(`Cloning Error: ${err.message || err}`);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          ElevenLabs AI Voice
        </h2>

        {/* Mode Switcher */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setMode('tts')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              mode === 'tts' ? 'bg-sky-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Narration
          </button>
          <button
            onClick={() => setMode('clone')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              mode === 'clone' ? 'bg-sky-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Voice Clone
          </button>
        </div>
      </div>

      {mode === 'tts' ? (
        <div className="flex flex-col gap-4">
          {/* Voice Selector Grid */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-2 block">Select AI Voice Model</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {voices.map((v) => (
                <div
                  key={v.voice_id}
                  onClick={() => setSelectedVoiceId(v.voice_id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                    selectedVoiceId === v.voice_id
                      ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{v.name}</span>
                    <span className="text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded">
                      {v.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate mt-1">{v.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Text Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-2 block">
              Narration Script / Speech Text
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Type your video script here... (e.g., 'Welcome to today's video! In this story we explore...')"
              rows={4}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-500 focus:border-sky-500 outline-none resize-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateTTS}
              disabled={isGenerating || !promptText.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-neutral-950 font-bold text-xs py-2.5 rounded-lg shadow-lg shadow-sky-500/20 disabled:opacity-40 transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Voiceover</span>
                </>
              )}
            </button>

            {audioPreviewUrl && (
              <button
                onClick={togglePreviewAudio}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-sky-400 rounded-lg border border-neutral-700 transition"
                title="Preview Voice Audio"
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Instant Voice Cloning Form */
        <form onSubmit={handleCloneVoiceSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Voice Name</label>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="e.g. My Custom Voice"
              required
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Description</label>
            <input
              type="text"
              value={cloneDesc}
              onChange={(e) => setCloneDesc(e.target.value)}
              placeholder="e.g. Warm conversational male voice"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Audio Samples (Upload MP3/WAV)</label>
            <div className="border-2 border-dashed border-neutral-800 hover:border-sky-500/60 rounded-xl p-4 text-center cursor-pointer transition">
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={(e) => setCloneFiles(Array.from(e.target.files || []))}
                className="hidden"
                id="voice-sample-upload"
              />
              <label htmlFor="voice-sample-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                <span className="text-xs text-neutral-300 font-medium">
                  {cloneFiles.length > 0 ? `${cloneFiles.length} file(s) attached` : 'Click to upload speech sample audio'}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCloning || !cloneName || cloneFiles.length === 0}
            className="mt-2 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs py-2.5 rounded-lg disabled:opacity-40 transition"
          >
            {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            <span>Clone Voice Now</span>
          </button>
        </form>
      )}
    </div>
  );
};
