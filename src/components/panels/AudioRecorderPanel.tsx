import React, { useState, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Mic, Square, Play, Plus, Loader2 } from 'lucide-react';

export const AudioRecorderPanel: React.FC = () => {
  const { addClipToTrack, currentTime } = useEditor();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
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
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or unavailable.');
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

  const handleAddToTimeline = () => {
    if (!recordedUrl) return;
    addClipToTrack({
      type: 'voiceover',
      src: recordedUrl,
      name: `Voice Record (${recordDuration}s)`,
      duration: Math.max(1, recordDuration),
    });
    setRecordedUrl(null);
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center h-full select-none text-center">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
        <Mic className="w-6 h-6 animate-pulse" />
      </div>

      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Live Voice Recording</h2>
      <p className="text-xs text-neutral-400 mb-6 max-w-xs">Record audio directly into your project timeline.</p>

      {/* Timer Display */}
      <div className="text-3xl font-mono font-bold text-white mb-6">
        00:{recordDuration.toString().padStart(2, '0')}
      </div>

      {/* Record Toggle Button */}
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-6 py-3 rounded-full shadow-lg shadow-rose-600/30 transition transform active:scale-95 mb-4"
        >
          <Mic className="w-4 h-4" />
          <span>Start Voice Recording</span>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs px-6 py-3 rounded-full border border-neutral-700 transition mb-4 animate-pulse"
        >
          <Square className="w-4 h-4 text-rose-500 fill-current" />
          <span>Stop Recording</span>
        </button>
      )}

      {/* Insert Clip CTA */}
      {recordedUrl && !isRecording && (
        <button
          onClick={handleAddToTimeline}
          className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Voiceover to Timeline</span>
        </button>
      )}
    </div>
  );
};
