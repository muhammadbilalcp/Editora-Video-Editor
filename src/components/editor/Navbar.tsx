import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Search,
  Download,
  Settings,
  User as UserIcon,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { AspectRatio } from '../../types/editor';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProjects,
  onOpenExport,
  onOpenSettings,
}) => {
  const {
    project,
    setProject,
    setAspectRatio,
    setViewMode,
    theme,
    toggleTheme,
    setActivePanel,
  } = useEditor();
  const { user } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [projName, setProjName] = useState(project.name);
  const [quality, setQuality] = useState('AI UHD 4K');
  const [isQualityOpen, setIsQualityOpen] = useState(false);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (projName.trim()) {
      setProject((prev) => ({ ...prev, name: projName.trim() }));
    } else {
      setProjName(project.name);
    }
  };

  const qualities = ['AI UHD 4K', '1080P Full HD', '720P HD', 'Smart Compress'];

  return (
    <header
      className={`h-12 border-b flex items-center justify-between px-3 md:px-4 select-none shrink-0 z-30 ${
        theme === 'light'
          ? 'bg-slate-100 border-slate-300 text-slate-900'
          : 'bg-neutral-950 border-neutral-900 text-white'
      }`}
    >
      {/* Left: Close Button (X) and Search Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('home')}
          className="p-1.5 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition"
          title="Close Editor / Home"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={() => setActivePanel('media')}
          className="p-1.5 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition"
          title="Search Stock Assets & Effects"
        >
          <Search className="w-4 h-4 text-white" />
        </button>

        {/* Project Title */}
        <div className="hidden sm:flex items-center gap-2 border-l border-neutral-800 pl-3 ml-1">
          {isEditingName ? (
            <input
              type="text"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              autoFocus
              className="bg-neutral-800 text-white font-medium text-xs px-2 py-0.5 rounded border border-white outline-none w-32"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="font-semibold text-xs text-neutral-300 hover:text-white transition cursor-pointer truncate max-w-[140px]"
              title="Click to rename"
            >
              {project.name}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: Quality Dropdown & Export Button */}
      <div className="flex items-center gap-2">
        {/* Quality Selector */}
        <div className="relative">
          <button
            onClick={() => setIsQualityOpen(!isQualityOpen)}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold px-2.5 py-1 rounded-lg border border-neutral-800 transition"
          >
            <Sparkles className="w-3 h-3 text-white" />
            <span className="text-[11px]">{quality}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {isQualityOpen && (
            <div className="absolute top-full right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg py-1 shadow-2xl z-50 min-w-[130px]">
              {qualities.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuality(q);
                    setIsQualityOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition ${
                    quality === q ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-300 hover:bg-neutral-800/60'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1 rounded-lg border border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 transition"
          title="Toggle Sunlight / Dark Theme"
        >
          {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-neutral-950 font-extrabold text-xs px-3 py-1 rounded-lg shadow transition shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

