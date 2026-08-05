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
  Music,
} from 'lucide-react';

export const ToolPanels: React.FC = () => {
  const { activePanel, setActivePanel, selectedClipId } = useEditor();

  const navItems: { id: ActiveToolPanel; label: string; icon: any; accent: string }[] = [
    { id: 'media', label: 'Pexels Media', icon: Film, accent: 'text-sky-400' },
    { id: 'voice', label: 'AI Voice', icon: Sparkles, accent: 'text-amber-400' },
    { id: 'text', label: 'Text & Fonts', icon: Type, accent: 'text-purple-400' },
    { id: 'giphy', label: 'GIPHY GIFs', icon: ImageIcon, accent: 'text-emerald-400' },
    { id: 'inspector', label: 'Inspector', icon: Sliders, accent: 'text-blue-400' },
    { id: 'recorder', label: 'Voice Record', icon: Mic, accent: 'text-rose-400' },
  ];

  return (
    <div className="w-full md:w-80 lg:w-96 bg-neutral-900 border-r md:border-r border-neutral-800 flex flex-col shrink-0 h-64 md:h-auto overflow-hidden">
      {/* Tool Drawer Selector Tabs */}
      <div className="h-12 bg-neutral-900 border-b border-neutral-800 flex items-center justify-around px-1 overflow-x-auto shrink-0 select-none">
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition min-w-[56px] ${
                isActive
                  ? 'bg-neutral-800 text-white font-bold border border-neutral-700/80 shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? item.accent : ''}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Panel Content Drawer */}
      <div className="flex-1 overflow-hidden relative">
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
