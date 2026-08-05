import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { exportProjectVideo, ExportProgress } from '../../services/exporter';
import { EditoraLogo } from '../brand/EditoraLogo';
import confetti from 'canvas-confetti';
import { X, Download, Film, Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { project } = useEditor();

  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [exportState, setExportState] = useState<ExportProgress>({
    status: 'idle',
    progress: 0,
  });

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setExportState({ status: 'preparing', progress: 5 });

    try {
      const downloadUrl = await exportProjectVideo(project, resolution, (p) => {
        setExportState(p);
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setExportState({
        status: 'error',
        progress: 0,
        error: err.message || 'Export failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-5">
          <EditoraLogo size="md" variant="dark" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-2">Export Project Video</h2>
          <p className="text-xs text-neutral-400">High-fidelity MP4 rendering engine</p>
        </div>

        {exportState.status === 'idle' && (
          <div className="space-y-4">
            {/* Resolution Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-2">Select Export Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '720p', label: '720p HD', desc: 'Fast & Lightweight' },
                  { id: '1080p', label: '1080p Full HD', desc: 'Recommended' },
                  { id: '4K', label: '4K Ultra HD', desc: 'Crisp Master' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id as any)}
                    className={`p-3 rounded-xl border text-center transition ${
                      resolution === res.id
                        ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400'
                        : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{res.label}</div>
                    <div className="text-[10px] text-sky-400 mt-0.5">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartExport}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-neutral-950 font-bold text-sm py-3 rounded-xl shadow-lg shadow-sky-500/20 transition transform active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>Start Rendering MP4</span>
            </button>
          </div>
        )}

        {(exportState.status === 'preparing' ||
          exportState.status === 'rendering' ||
          exportState.status === 'encoding') && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />

            <div>
              <div className="text-sm font-bold text-white capitalize">
                {exportState.status}... ({exportState.progress}%)
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Synthesizing multi-track layers, audio graph & filters...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${exportState.progress}%` }}
              />
            </div>
          </div>
        )}

        {exportState.status === 'completed' && exportState.downloadUrl && (
          <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Rendering Complete!</h3>
              <p className="text-xs text-neutral-400 mt-1">Your video is ready for download and sharing.</p>
            </div>

            <a
              href={exportState.downloadUrl}
              download={`${project.name.toLowerCase().replace(/\s+/g, '_')}_${resolution}.mp4`}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4 File</span>
            </a>
          </div>
        )}

        {exportState.status === 'error' && (
          <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-rose-300">Export Error</h3>
              <p className="text-xs text-rose-400 mt-1">{exportState.error}</p>
            </div>

            <button
              onClick={() => setExportState({ status: 'idle', progress: 0 })}
              className="px-4 py-2 bg-neutral-800 text-white font-bold text-xs rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
