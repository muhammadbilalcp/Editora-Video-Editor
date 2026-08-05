import React, { useEffect, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { loadUserProjectsFromCloud, deleteProjectFromCloud } from '../../services/firebase';
import { Project, AspectRatio } from '../../types/editor';
import { X, FolderOpen, Plus, Trash2, Smartphone, Monitor, Square, Clock, Cloud } from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({ isOpen, onClose }) => {
  const { setProject, createNewProject, showToast } = useEditor();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>('9:16');

  const fetchCloudProjects = async () => {
    if (!user) return;
    setLoading(true);
    const cloudProjs = await loadUserProjectsFromCloud(user.uid);
    setProjects(cloudProjs);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCloudProjects();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSelectProject = (proj: Project) => {
    setProject(proj);
    showToast(`Loaded project: ${proj.name}`);
    onClose();
  };

  const handleDeleteProject = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProjectFromCloud(user.uid, projId);
      setProjects((prev) => prev.filter((p) => p.id !== projId));
      showToast('Project deleted');
    }
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    createNewProject(newProjName.trim(), selectedAspect);
    setNewProjName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-amber-400" />
          Project Manager & Templates
        </h2>

        {/* Create New Project Section */}
        <form onSubmit={handleCreateNew} className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700/80 mb-5 flex flex-col md:flex-row items-center gap-3">
          <input
            type="text"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            placeholder="New Project Title (e.g. Travel Vlog Reel)..."
            required
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400 w-full"
          />

          <select
            value={selectedAspect}
            onChange={(e) => setSelectedAspect(e.target.value as AspectRatio)}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white outline-none w-full md:w-auto"
          >
            <option value="9:16">9:16 TikTok / Reels</option>
            <option value="16:9">16:9 YouTube</option>
            <option value="1:1">1:1 Square</option>
            <option value="4:5">4:5 Portrait</option>
          </select>

          <button
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs px-4 py-2 rounded-lg transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </form>

        {/* Cloud Saved Projects List */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-400" />
            Saved Cloud Projects ({projects.length})
          </h3>

          {!user ? (
            <div className="bg-neutral-800/40 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-400">
              Sign in with Firebase to enable cloud autosave and access your project history across all devices.
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">Loading project history...</div>
          ) : projects.length === 0 ? (
            <div className="bg-neutral-800/40 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">
              No saved projects found. Create your first video project above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className="group bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-400 p-3.5 rounded-xl cursor-pointer transition shadow flex items-center justify-between"
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition">
                      {proj.name}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-sky-400" />
                        {proj.aspectRatio}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteProject(e, proj.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-700 transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
