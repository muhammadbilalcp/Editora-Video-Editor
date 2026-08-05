import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Navbar } from './components/editor/Navbar';
import { PreviewCanvas } from './components/editor/PreviewCanvas';
import { Timeline } from './components/editor/Timeline';
import { ToolPanels } from './components/editor/ToolPanels';
import { AuthModal } from './components/modals/AuthModal';
import { ProjectsModal } from './components/modals/ProjectsModal';
import { ExportModal } from './components/modals/ExportModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { CheckCircle2 } from 'lucide-react';

const EditorLayout: React.FC = () => {
  const {
    isPlaying,
    setIsPlaying,
    undo,
    redo,
    selectedClipId,
    splitClipAtPlayhead,
    removeClip,
    duplicateClip,
    toastMessage,
    setSelectedClipId,
  } = useEditor();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inside text inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        if (selectedClipId) splitClipAtPlayhead(selectedClipId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) removeClip(selectedClipId);
      } else if (e.key === 'd' || e.key === 'D') {
        if (selectedClipId) duplicateClip(selectedClipId);
      } else if (e.key === 'Escape') {
        setSelectedClipId(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedClipId, setIsPlaying, splitClipAtPlayhead, removeClip, duplicateClip, undo, redo, setSelectedClipId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-white overflow-hidden select-none font-['Plus_Jakarta_Sans']">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace (Preview + Drawer) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Tool Drawers */}
        <ToolPanels />

        {/* Center Canvas Preview Area */}
        <PreviewCanvas />
      </div>

      {/* Bottom Timeline Drawer */}
      <Timeline />

      {/* Toast Notification Bar */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenSettings={() => {
          setIsAuthOpen(false);
          setIsSettingsOpen(true);
        }}
      />
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
      />
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <EditorProvider>
        <EditorLayout />
      </EditorProvider>
    </AuthProvider>
  );
}
