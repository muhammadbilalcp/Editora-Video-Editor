import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { loginWithGoogle, logoutUser } from '../../services/firebase';
import { EditoraLogo } from '../brand/EditoraLogo';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { X, Mail, Lock, LogIn, UserPlus, LogOut, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { user, profile, updateCustomKeys } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom API key inputs
  const [pexelsKey, setPexelsKey] = useState(profile?.customApiKeys?.pexelsKey || '');
  const [giphyKey, setGiphyKey] = useState(profile?.customApiKeys?.giphyKey || '');
  const [elevenlabsKey, setElevenlabsKey] = useState(profile?.customApiKeys?.elevenlabsKey || '');

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKeys = async () => {
    await updateCustomKeys({
      pexelsKey,
      giphyKey,
      elevenlabsKey,
    });
    alert('API Keys saved successfully!');
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <EditoraLogo size="lg" variant="dark" />
          <p className="text-xs text-neutral-400 mt-2">
            {user ? 'Account & Custom API Configuration' : 'Sign in to sync video projects in cloud'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        {user ? (
          /* Logged In User Profile & Keys */
          <div className="space-y-4">
            <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700 flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sky-500 text-neutral-950 font-bold flex items-center justify-center text-lg">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <div className="truncate flex-1">
                <div className="text-sm font-bold text-white truncate">{user.displayName || 'Editora Creator'}</div>
                <div className="text-xs text-neutral-400 truncate">{user.email}</div>
              </div>
            </div>

            {/* Custom API Keys Configuration */}
            <div className="bg-neutral-800/40 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>Custom API Key Overrides</span>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Pexels API Key</label>
                <input
                  type="password"
                  value={pexelsKey}
                  onChange={(e) => setPexelsKey(e.target.value)}
                  placeholder="Default Key Active"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">GIPHY API Key</label>
                <input
                  type="password"
                  value={giphyKey}
                  onChange={(e) => setGiphyKey(e.target.value)}
                  placeholder="Default Key Active"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">ElevenLabs API Key</label>
                <input
                  type="password"
                  value={elevenlabsKey}
                  onChange={(e) => setElevenlabsKey(e.target.value)}
                  placeholder="Default Key Active"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={handleSaveApiKeys}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-sky-400 font-bold text-xs py-2 rounded-lg border border-neutral-700 transition"
              >
                Save Custom Keys
              </button>
            </div>

            <button
              onClick={logoutUser}
              className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs py-2.5 rounded-lg border border-rose-500/30 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In Form */
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@editora.app"
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-lg shadow-sky-500/20 transition"
            >
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isSignUp ? 'Create Account' : 'Sign In with Email'}</span>
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-neutral-900 px-3 text-[10px] font-bold text-neutral-500 uppercase absolute">
                or
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2.5 rounded-lg border border-neutral-700 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-sky-400 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
