import React from 'react';
import { useEditor, ActiveToolPanel } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { EditoraLogo } from '../brand/EditoraLogo';
import {
  X,
  Home,
  FolderOpen,
  Film,
  Sparkles,
  Type,
  Image as ImageIcon,
  Mic,
  Sliders,
  Settings,
  Download,
  Sun,
  Moon,
  User,
  Zap,
  Trash2,
} from 'lucide-react';

interface DrawerMenuProps {
  onOpenAuth: () => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  onOpenAuth,
  onOpenProjects,
  onOpenExport,
  onOpenSettings,
}) => {
  const {
    project,
    deleteProject,
    isDrawerMenuOpen,
    setIsDrawerMenuOpen,
    setViewMode,
    setActivePanel,
    theme,
    toggleTheme,
  } = useEditor();

  const { user } = useAuth();

  if (!isDrawerMenuOpen) return null;

  const navigateToPanel = (panel: ActiveToolPanel) => {
    if (!user) {
      setIsDrawerMenuOpen(false);
      onOpenAuth();
      return;
    }
    setViewMode('editor');
    setActivePanel(panel);
    setIsDrawerMenuOpen(false);
  };

  const navItems = [
    { label: 'Editora Stock Media', icon: Film, panel: 'media' as ActiveToolPanel, accent: 'text-white' },
    { label: 'AI Voiceovers (Pro Plan)', icon: Sparkles, panel: 'voice' as ActiveToolPanel, accent: 'text-white' },
    { label: 'Text & Titles', icon: Type, panel: 'text' as ActiveToolPanel, accent: 'text-white' },
    { label: 'GIFs & Stickers', icon: ImageIcon, panel: 'giphy' as ActiveToolPanel, accent: 'text-white' },
    { label: 'Clip Inspector', icon: Sliders, panel: 'inspector' as ActiveToolPanel, accent: 'text-white' },
    { label: 'Voiceover Recorder', icon: Mic, panel: 'recorder' as ActiveToolPanel, accent: 'text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerMenuOpen(false)}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Drawer Panel */}
      <div className={`relative w-80 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ${
        theme === 'light' ? 'bg-white text-slate-900 border-r border-slate-200' : 'bg-neutral-900 text-white border-r border-neutral-800'
      }`}>
        {/* Drawer Top Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <EditoraLogo size="sm" variant={theme === 'light' ? 'light' : 'dark'} />
          <button
            onClick={() => setIsDrawerMenuOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section 1: Views */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 px-2 block mb-1">
              Main Dashboard
            </label>

            <button
              onClick={() => {
                setViewMode('home');
                setIsDrawerMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition"
            >
              <Home className="w-4 h-4 text-white" />
              <span>Home Screen</span>
            </button>

            <button
              onClick={() => {
                setIsDrawerMenuOpen(false);
                onOpenProjects();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-amber-500/10 hover:text-amber-400 transition"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>My Projects</span>
            </button>
          </div>

          {/* Section 2: Tools Drawers */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 px-2 block mb-1">
              Creative Tools
            </label>

            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigateToPanel(item.panel)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${item.accent}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Section 3: Actions & Eye Comfort */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 px-2 block mb-1">
              Studio & Account
            </label>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition"
            >
              <div className="flex items-center gap-3">
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-neutral-800 fill-current" />
                ) : (
                  <Moon className="w-4 h-4 text-white fill-current" />
                )}
                <span>Eye Comfort: {theme === 'light' ? 'Sunlight Mode' : 'Night Mode'}</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsDrawerMenuOpen(false);
                onOpenExport();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-500/10 hover:text-emerald-400 transition text-emerald-400"
            >
              <Download className="w-4 h-4" />
              <span>Export Video MP4</span>
            </button>

            <button
              onClick={() => {
                setIsDrawerMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition"
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>Keyboard Shortcuts & Settings</span>
            </button>

            <button
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete "${project.name}" permanently?`)) {
                  setIsDrawerMenuOpen(false);
                  await deleteProject(project.id);
                  setViewMode('home');
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-rose-500/10 text-rose-400 transition"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Current Project</span>
            </button>
          </div>
        </div>

        {/* Drawer Bottom Profile Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white text-neutral-950 font-bold flex items-center justify-center text-xs">
                {user?.email?.[0].toUpperCase() || 'E'}
              </div>
            )}
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.displayName || 'Creator'}</div>
              <div className="text-[10px] text-neutral-400 truncate">{user ? user.email : 'Cloud Sync Active'}</div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsDrawerMenuOpen(false);
              onOpenAuth();
            }}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
