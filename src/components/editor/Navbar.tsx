import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { EditoraLogo } from '../brand/EditoraLogo';
import {
  Undo,
  Redo,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  Download,
  FolderOpen,
  User as UserIcon,
  CloudCheck,
  CloudUpload,
  Settings,
  Plus,
  Menu,
  Home,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
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
    canUndo,
    canRedo,
    undo,
    redo,
    setAspectRatio,
    isAutosaving,
    saveProjectNow,
    setViewMode,
    theme,
    toggleTheme,
    setIsDrawerMenuOpen,
  } = useEditor();
  const { user } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [projName, setProjName] = useState(project.name);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (projName.trim()) {
      setProject((prev) => ({ ...prev, name: projName.trim() }));
    } else {
      setProjName(project.name);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const aspectOptions: { label: string; value: AspectRatio; icon: any }[] = [
    { label: '9:16 TikTok / Reels', value: '9:16', icon: Smartphone },
    { label: '16:9 YouTube', value: '16:9', icon: Monitor },
    { label: '1:1 Square', value: '1:1', icon: Square },
    { label: '4:5 Portrait', value: '4:5', icon: Smartphone },
  ];

  return (
    <header className={`h-14 border-b flex items-center justify-between px-3 md:px-5 select-none shrink-0 z-30 ${
      theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
    }`}>
      {/* Left: 3-Lines Menu, Home Button, Brand Logo & Project Title */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* 3-Lines Menu Button */}
        <button
          onClick={() => setIsDrawerMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-neutral-800/80 transition text-neutral-300 hover:text-white"
          title="Open Menu (3 lines)"
        >
          <Menu className="w-5 h-5 text-sky-400" />
        </button>

        {/* Home Screen Button */}
        <button
          onClick={() => setViewMode('home')}
          className="p-2 rounded-lg hover:bg-neutral-800/80 transition text-neutral-300 hover:text-white"
          title="Return to Home Dashboard"
        >
          <Home className="w-4 h-4 text-amber-400" />
        </button>

        <EditoraLogo size="sm" variant={theme === 'light' ? 'light' : 'dark'} className="cursor-pointer hidden sm:flex" />

        <div className="flex items-center gap-2 border-l border-neutral-800 pl-3">
          {isEditingName ? (
            <input
              type="text"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              autoFocus
              className="bg-neutral-800 text-white font-medium text-xs px-2 py-1 rounded border border-sky-500 outline-none w-32 md:w-40"
            />
          ) : (
            <h1
              onClick={() => setIsEditingName(true)}
              className="font-semibold text-xs md:text-sm hover:text-sky-400 transition cursor-pointer truncate max-w-[120px] md:max-w-[200px]"
              title="Click to rename"
            >
              {project.name}
            </h1>
          )}

          {/* Cloud Autosave Indicator */}
          <button
            onClick={saveProjectNow}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition"
            title="Cloud Autosave Status"
          >
            {isAutosaving ? (
              <CloudUpload className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            ) : (
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Middle: Quick Tools (Aspect Ratio, Undo/Redo) */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Aspect Ratio Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-700/60 transition">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">{project.aspectRatio}</span>
          </button>

          {/* Aspect Ratio Dropdown */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col bg-neutral-800 border border-neutral-700 rounded-lg p-1 shadow-xl z-50 min-w-[160px]">
            {aspectOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAspectRatio(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md w-full text-left transition ${
                  project.aspectRatio === opt.value
                    ? 'bg-sky-500/20 text-sky-400 font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-800/80 rounded-lg border border-neutral-700/60 p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-neutral-700"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-neutral-700"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Eye Comfort Theme Switcher */}
        <button
          onClick={toggleTheme}
          className={`p-1.5 rounded-lg border transition ${
            theme === 'light'
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-neutral-800 border-neutral-700 text-sky-400'
          }`}
          title="Eye Comfort Theme Switcher (Sunlight / Night)"
        >
          {theme === 'light' ? <Sun className="w-4 h-4 fill-current" /> : <Moon className="w-4 h-4 fill-current" />}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-neutral-300 hover:text-white transition rounded-lg bg-neutral-800/80 border border-neutral-700/60"
          title="Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Right: Settings, Profile & Export Button */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={onOpenSettings}
          className="p-2 text-neutral-400 hover:text-white transition rounded-lg hover:bg-neutral-800 hidden sm:block"
          title="Settings & Shortcuts"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 p-1 md:px-2.5 md:py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4 text-sky-400" />
          )}
          <span className="hidden lg:inline text-xs font-medium text-neutral-200 truncate max-w-[90px]">
            {user ? user.displayName || user.email?.split('@')[0] : 'Sign In'}
          </span>
        </button>

        {/* Primary Export CTA */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-sky-500/20 transition transform active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
