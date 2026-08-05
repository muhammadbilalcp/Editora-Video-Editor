import React from 'react';
import { useEditor, ActiveToolPanel } from '../../context/EditorContext';
import { PexelsMediaPanel } from '../panels/PexelsMediaPanel';
import { ElevenLabsVoicePanel } from '../panels/ElevenLabsVoicePanel';
import { GiphyPanel } from '../panels/GiphyPanel';
import { TextToolPanel } from '../panels/TextToolPanel';
import { ClipInspectorPanel } from '../panels/ClipInspectorPanel';
import { AudioRecorderPanel } from '../panels/AudioRecorderPanel';
import {
  Film,
  Sparkles,
  Type,
  Image as ImageIcon,
  Sliders,
  Mic,
  X,
} from 'lucide-react';

export const ToolPanels: React.FC = () => {
  const { activePanel, setActivePanel } = useEditor();

  if (!activePanel) {
    return null;
  }

  const navItems: { id: ActiveToolPanel; label: string; icon: any }[] = [
    { id: 'media', label: 'Stock Media', icon: Film },
    { id: 'voice', label: 'AI Voice', icon: Sparkles },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'giphy', label: 'GIFs', icon: ImageIcon },
    { id: 'inspector', label: 'Inspector', icon: Sliders },
    { id: 'recorder', label: 'Voice Record', icon: Mic },
  ];

  return (
    <div className="absolute top-0 left-0 bottom-0 z-30 w-full sm:w-80 md:w-96 bg-neutral-900/95 backdrop-blur border-r border-neutral-800 flex flex-col shadow-2xl transition-all animate-in slide-in-from-left duration-200">
      {/* Panel Header & Tabs */}
      <div className="h-12 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 select-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activePanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isActive
                    ? 'bg-white text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={() => setActivePanel(null)}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition ml-2 shrink-0"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Panel Content Drawer */}
      <div className="flex-1 overflow-y-auto relative">
        {activePanel === 'media' && <PexelsMediaPanel />}
        {activePanel === 'voice' && <ElevenLabsVoicePanel />}
        {activePanel === 'text' && <TextToolPanel />}
        {activePanel === 'giphy' && <GiphyPanel />}
        {activePanel === 'inspector' && <ClipInspectorPanel />}
        {activePanel === 'recorder' && <AudioRecorderPanel />}
      </div>
    </div>
  );
};

