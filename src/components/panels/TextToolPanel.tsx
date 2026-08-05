import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Type, Sparkles, Plus, Palette, Smile } from 'lucide-react';
import { TextSettings } from '../../types/editor';

const PRESET_FONTS = [
  'Space Grotesk',
  'Plus Jakarta Sans',
  'Impact',
  'Playfair Display',
  'Courier New',
  'Comic Sans MS',
  'Trebuchet MS',
  'Georgia',
];

const PRESET_STYLES: { label: string; textSettings: Partial<TextSettings> }[] = [
  {
    label: 'Cyber Neon',
    textSettings: {
      fontFamily: 'Space Grotesk',
      fontSize: 64,
      textColor: '#38BDF8',
      strokeColor: '#0284C7',
      strokeWidth: 4,
      shadowColor: '#38BDF8',
      shadowBlur: 20,
      animation: 'pop',
      bold: true,
    },
  },
  {
    label: 'Golden Sunset',
    textSettings: {
      fontFamily: 'Playfair Display',
      fontSize: 56,
      textColor: '#F59E0B',
      gradientText: { enabled: true, from: '#F59E0B', to: '#EF4444', direction: 'horizontal' },
      shadowColor: '#78350F',
      shadowBlur: 10,
      animation: 'fade',
      bold: true,
    },
  },
  {
    label: 'Minimal Pill Box',
    textSettings: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 48,
      textColor: '#FFFFFF',
      backgroundColor: '#09090B',
      animation: 'slide-up',
      bold: true,
    },
  },
  {
    label: 'Impact Subtitle',
    textSettings: {
      fontFamily: 'Impact',
      fontSize: 72,
      textColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 6,
      animation: 'typewriter',
      bold: true,
    },
  },
];

const EMOJI_PRESETS = ['🔥', '✨', '⚡', '🚀', '💯', '🎬', '😍', '🎉', '🌟', '💥', '❤️', '😱'];

export const TextToolPanel: React.FC = () => {
  const { addClipToTrack } = useEditor();

  const [textContent, setTextContent] = useState('YOUR TEXT HERE');
  const [selectedFont, setSelectedFont] = useState('Space Grotesk');
  const [fontSize, setFontSize] = useState(60);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [animation, setAnimation] = useState<TextSettings['animation']>('pop');

  const handleCreateText = (customSettings?: Partial<TextSettings>, overrideContent?: string) => {
    const finalContent = overrideContent || textContent || 'SAMPLE TEXT';

    const textSettings: TextSettings = {
      content: finalContent,
      fontFamily: selectedFont,
      fontSize,
      textColor,
      strokeColor,
      strokeWidth,
      shadowColor: '#000000',
      shadowBlur: 10,
      animation,
      align: 'center',
      bold: true,
      italic: false,
      ...customSettings,
    };

    addClipToTrack({
      type: 'text',
      src: textSettings.content,
      name: `Text: "${finalContent.substring(0, 12)}"`,
      duration: 5,
      textSettings,
    });
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto select-none">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
        <Type className="w-4 h-4 text-purple-400" />
        Animated Text & Typography
      </h2>

      {/* Preset Style Templates */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-neutral-400 mb-2 block">Quick Text Styles</label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleCreateText(preset.textSettings)}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/60 rounded-lg text-left transition"
            >
              <div className="text-xs font-bold text-white truncate">{preset.label}</div>
              <div className="text-[10px] text-purple-400 mt-0.5">Click to add</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text Builder */}
      <div className="flex flex-col gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
        <div>
          <label className="text-xs font-semibold text-neutral-400 mb-1 block">Custom Text Content</label>
          <input
            type="text"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-purple-500"
          />
        </div>

        {/* Emojis Quick Bar */}
        <div>
          <label className="text-xs font-semibold text-neutral-400 mb-1 block flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            Quick Emojis
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleCreateText({}, emoji)}
                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 rounded text-base border border-neutral-800 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family & Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Font Family</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none"
            >
              {PRESET_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Font Size ({fontSize}px)</label>
            <input
              type="range"
              min="24"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-purple-500 mt-2"
            />
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Text Color</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-8 rounded bg-transparent cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1 block">Outline Color</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-full h-8 rounded bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Animation Preset */}
        <div>
          <label className="text-xs font-semibold text-neutral-400 mb-1 block">Text Animation</label>
          <select
            value={animation}
            onChange={(e) => setAnimation(e.target.value as any)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none"
          >
            <option value="pop">Pop / Scale In</option>
            <option value="fade">Fade In</option>
            <option value="typewriter">Typewriter Effect</option>
            <option value="slide-up">Slide Up</option>
            <option value="bounce">Bounce In</option>
            <option value="none">Static (No Animation)</option>
          </select>
        </div>

        <button
          onClick={() => handleCreateText()}
          className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-lg shadow-purple-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Text to Timeline</span>
        </button>
      </div>
    </div>
  );
};
