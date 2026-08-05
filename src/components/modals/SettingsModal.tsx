import React from 'react';
import { X, Keyboard, Settings, Sparkles, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Video' },
    { key: 'Ctrl + Z', desc: 'Undo action' },
    { key: 'Ctrl + Y', desc: 'Redo action' },
    { key: 'S', desc: 'Split clip at playhead' },
    { key: 'Delete / Backspace', desc: 'Remove selected clip' },
    { key: 'D', desc: 'Duplicate selected clip' },
    { key: 'Esc', desc: 'Deselect clip / Close modal' },
  ];

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-white" />
          Editor Settings & Shortcuts
        </h2>

        {/* Shortcuts */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-white" />
            Keyboard Shortcuts
          </h3>

          <div className="bg-neutral-800/60 rounded-xl border border-neutral-800 p-3 divide-y divide-neutral-800/80">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="py-2 flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">{sc.desc}</span>
                <kbd className="bg-neutral-900 border border-neutral-700 text-white font-mono text-[10px] px-2 py-1 rounded">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
