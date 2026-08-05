import React, { useState, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Mic, Square, Play, Plus, Volume2, AlertCircle, Sparkles } from 'lucide-react';

export const AudioRecorderPanel: React.FC = () => {
  const { addClipToTrack, showToast } = useEditor();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        showToast('Voiceover recorded successfully!');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setMicError('Microphone permission blocked or unavailable in browser. Click below to generate a voiceover demo!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const generateFallbackVoice = () => {
    // Generate synthesized audio tone / speech sample for sandbox iframe fallback
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const dest = ctx.createMediaStreamDestination();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.connect(dest);
    osc.start();

    const recorder = new MediaRecorder(dest.stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setRecordDuration(4);
      showToast('Generated Voiceover Clip');
    };

    recorder.start();
    setTimeout(() => {
      recorder.stop();
      osc.stop();
    }, 4000);
  };

  const handleAddToTimeline = () => {
    if (!recordedUrl) return;
    addClipToTrack({
      type: 'voiceover',
      src: recordedUrl,
      name: `Voiceover (${recordDuration || 4}s)`,
      duration: Math.max(1, recordDuration || 4),
    });
    setRecordedUrl(null);
    showToast('Added voiceover to timeline');
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center h-full select-none text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <Mic className={`w-7 h-7 ${isRecording ? 'animate-bounce text-rose-500' : ''}`} />
      </div>

      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Voice Recording</h2>
        <p className="text-xs text-neutral-400 mt-0.5 max-w-xs">Record audio commentary directly into your project timeline.</p>
      </div>

      {/* Timer Display */}
      <div className="text-4xl font-mono font-bold text-white tracking-widest bg-neutral-950 px-6 py-2 rounded-2xl border border-neutral-800">
        00:{recordDuration.toString().padStart(2, '0')}
      </div>

      {micError && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-300 text-xs flex flex-col items-center gap-1 max-w-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{micError}</span>
          <button
            onClick={generateFallbackVoice}
            className="mt-1 flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] px-3 py-1 rounded-lg transition"
          >
            <Sparkles className="w-3 h-3" />
            <span>Generate Voiceover Sample</span>
          </button>
        </div>
      )}

      {/* Record Toggle Button */}
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-6 py-3 rounded-full shadow-lg shadow-rose-600/30 transition transform active:scale-95"
        >
          <Mic className="w-4 h-4" />
          <span>Start Voice Recording</span>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-6 py-3 rounded-full border border-neutral-700 transition animate-pulse"
        >
          <Square className="w-4 h-4 text-rose-500 fill-current" />
          <span>Stop Recording</span>
        </button>
      )}

      {/* Preview Player & Insert CTA */}
      {recordedUrl && !isRecording && (
        <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl w-full max-w-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-rose-400" />
              Recorded Preview
            </span>
            <span className="text-neutral-500 font-mono">{recordDuration || 4}s</span>
          </div>

          <audio src={recordedUrl} controls className="w-full h-8" />

          <button
            onClick={handleAddToTimeline}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs py-2.5 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Voiceover to Timeline</span>
          </button>
        </div>
      )}
    </div>
  );
};

