import React, { useState, useEffect } from 'react';
import { useEditor, getLocalSavedProjects } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { loadUserProjectsFromCloud, deleteProjectFromCloud } from '../../services/firebase';
import { Project, AspectRatio } from '../../types/editor';
import { EditoraLogo } from '../brand/EditoraLogo';
import {
  Plus,
  FolderOpen,
  Film,
  Sparkles,
  Type,
  Image as ImageIcon,
  Mic,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Trash2,
  Play,
  Clock,
  Smartphone,
  Monitor,
  Square,
  User,
  Menu,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HomeScreenProps {
  onOpenAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenAuth }) => {
  const {
    project,
    createNewProject,
    deleteProject,
    setProject,
    setViewMode,
    theme,
    toggleTheme,
    setIsDrawerMenuOpen,
    showToast,
  } = useEditor();

  const { user } = useAuth();

  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [projNameInput, setProjNameInput] = useState('');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('9:16');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchAllProjects = async () => {
      setLoading(true);
      const localProjs = getLocalSavedProjects();
      let cloudProjs: Project[] = [];
      if (user) {
        cloudProjs = await loadUserProjectsFromCloud(user.uid);
      }
      const map = new Map<string, Project>();
      localProjs.forEach((p) => map.set(p.id, p));
      cloudProjs.forEach((p) => map.set(p.id, p));
      const merged = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      setSavedProjects(merged);
      setLoading(false);
    };
    fetchAllProjects();
  }, [user]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleStartNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const title = projNameInput.trim() || 'My New Story';
    createNewProject(title, selectedAspect);
    setViewMode('editor');
  };

  const handleOpenExistingProject = (proj: Project) => {
    setProject(proj);
    showToast(`Loaded: ${proj.name}`);
    setViewMode('editor');
  };

  const handleDeleteProject = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Delete this project permanently?')) {
      await deleteProject(projId);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projId));
    }
  };

  const aspectOptions: { id: AspectRatio; name: string; desc: string; icon: any }[] = [
    { id: '9:16', name: '9:16 Vertical', desc: 'TikTok, Reels, Shorts', icon: Smartphone },
    { id: '16:9', name: '16:9 Widescreen', desc: 'YouTube, Movies', icon: Monitor },
    { id: '1:1', name: '1:1 Square', desc: 'Instagram Feed', icon: Square },
    { id: '4:5', name: '4:5 Portrait', desc: 'Social Posts', icon: Smartphone },
  ];

  return (
    <div className={`h-screen w-full flex flex-col font-['Plus_Jakarta_Sans'] select-none overflow-hidden transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-neutral-950 text-white'
    }`}>
      {/* Home Header */}
      <header className={`h-16 shrink-0 px-4 md:px-8 border-b flex items-center justify-between z-40 backdrop-blur-md ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-neutral-900/80 border-neutral-800'
      }`}>
        <div className="flex items-center gap-3">
          {/* 3-Lines Hamburger Menu Button */}
          <button
            onClick={() => setIsDrawerMenuOpen(true)}
            className={`p-2 rounded-xl border transition ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
            }`}
            title="Open Editor Menu (3 lines)"
          >
            <Menu className="w-5 h-5" />
          </button>

          <EditoraLogo size="md" variant={theme === 'light' ? 'light' : 'dark'} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Eye Comfort Theme Switcher (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition ${
              theme === 'light'
                ? 'bg-neutral-200 text-neutral-900 border-neutral-300 hover:bg-neutral-300'
                : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Toggle Eye Comfort Theme (Sunlight / Night)"
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-neutral-800 fill-current" />
                <span className="hidden sm:inline">Sunlight</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-white fill-current" />
                <span className="hidden sm:inline">Night Dark</span>
              </>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
            }`}
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Auth Profile Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{user ? user.displayName || 'Account' : 'Sign In'}</span>
          </button>
        </div>
      </header>

      {/* Main Home Content Container */}
      <main className="flex-1 overflow-y-auto max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className={`p-6 md:p-8 rounded-3xl border relative overflow-hidden shadow-2xl ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : 'bg-neutral-900 border-neutral-800'
        }`}>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-white text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Editora - The Photo And Video Editor</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
              Create Photos & Videos in Seconds
            </h1>
            <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
              Multi-track timeline, local photo/video uploads, stock HD media, voiceover recording, crop tools, filters, and pro-grade editing precision.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Big Prominent New Project Button */}
              <button
                onClick={() => {
                  createNewProject('New Story', '9:16');
                  setViewMode('editor');
                }}
                className="flex items-center gap-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm md:text-base px-7 py-3.5 rounded-2xl shadow-xl hover:shadow-rose-500/25 transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>+ New Project</span>
              </button>

              {project && (
                <button
                  onClick={() => setViewMode('editor')}
                  className={`flex items-center gap-2 font-bold text-xs px-5 py-3.5 rounded-2xl border transition transform active:scale-95 ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current text-rose-500" />
                  <span>Open Recent: "{project.name}"</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Start New Project Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Start New Video Project</span>
          </h2>

          <form onSubmit={handleStartNewProject} className={`p-6 rounded-2xl border space-y-5 ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900/80 border-neutral-800'
          }`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={projNameInput}
                onChange={(e) => setProjNameInput(e.target.value)}
                placeholder="Enter Project Title (e.g. Summer Travel Vlog)..."
                className={`flex-1 border rounded-xl px-4 py-3 text-xs outline-none transition ${
                  theme === 'light'
                    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-black'
                    : 'bg-neutral-950 border-neutral-800 text-white focus:border-white'
                }`}
              />

              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create & Open Editor</span>
              </button>
            </div>

            {/* Canvas Aspect Ratio Cards */}
            <div>
              <label className={`text-[11px] font-bold block mb-2 uppercase ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Choose Aspect Ratio Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {aspectOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedAspect(opt.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col items-center text-center space-y-2 ${
                      selectedAspect === opt.id
                        ? 'bg-neutral-800 border-white text-white ring-1 ring-white'
                        : theme === 'light'
                        ? 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <opt.icon className="w-6 h-6" />
                    <div>
                      <div className="text-xs font-bold">{opt.name}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Quick Creative Tool Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Creative AI Studio Tools</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                id: 'media',
                title: 'Stock Media',
                desc: 'Stock Video & HD Photos',
                icon: Film,
                color: 'text-white bg-neutral-800 border-neutral-700',
              },
              {
                id: 'voice',
                title: 'AI Voiceovers',
                desc: 'Natural Speech Engine',
                icon: Sparkles,
                color: 'text-white bg-neutral-800 border-neutral-700',
              },
              {
                id: 'text',
                title: 'Text & Titles',
                desc: 'Animated Typography',
                icon: Type,
                color: 'text-white bg-neutral-800 border-neutral-700',
              },
              {
                id: 'giphy',
                title: 'Editora GIFs',
                desc: 'Stickers & Meme Overlay',
                icon: ImageIcon,
                color: 'text-white bg-neutral-800 border-neutral-700',
              },
              {
                id: 'recorder',
                title: 'Voice Record',
                desc: 'Direct Mic Audio',
                icon: Mic,
                color: 'text-white bg-neutral-800 border-neutral-700',
              },
            ].map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                    showToast('Please sign up or sign in to use studio tools!');
                    return;
                  }
                  setViewMode('editor');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col items-center text-center space-y-2 hover:scale-[1.02] ${
                  theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tool.color}`}>
                  <tool.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">{tool.title}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{tool.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Projects & History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>Saved Cloud Projects ({savedProjects.length})</span>
            </h2>

            {!user && (
              <button
                onClick={onOpenAuth}
                className="text-xs font-bold text-white hover:underline flex items-center gap-1"
              >
                <span>Sign in to sync cloud projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!user ? (
            <div className={`p-8 rounded-2xl border text-center space-y-2 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
            }`}>
              <ShieldCheck className="w-8 h-8 text-white mx-auto" />
              <div className="text-xs font-bold text-neutral-300">Firebase Cloud Synchronization Active</div>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                Sign in with Google or Email to store and load your video timeline across mobile and desktop devices.
              </p>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-neutral-500 animate-pulse">Loading saved cloud projects...</div>
          ) : savedProjects.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center text-xs ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-500' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
            }`}>
              No cloud projects saved yet. Create a new project above to start editing!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {savedProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleOpenExistingProject(proj)}
                  className={`group p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between hover:border-white space-y-3 ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <div className="text-sm font-bold truncate group-hover:text-white transition">
                        {proj.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-white" />
                          {proj.aspectRatio}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteProject(e, proj.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button className="w-full flex items-center justify-center gap-1.5 bg-neutral-800 group-hover:bg-white text-neutral-200 group-hover:text-neutral-950 font-bold text-xs py-2 rounded-xl transition">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Open in Studio</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
