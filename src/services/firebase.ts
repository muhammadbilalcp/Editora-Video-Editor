import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { Project, UserProfile } from '../types/editor';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA62h3TQCMZb6PhnLCp_PJyPSi4a-PBnvQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ziloclips.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ziloclips",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ziloclips.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "68775909344",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:68775909344:web:b791b759242dcfc387fd85",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MGTN022JNY",
};

// Initialize Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Analytics not supported in this environment:', err);
  });
}

// Auth Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Google Auth Error:', error);
    throw error;
  }
};

export const logoutUser = () => signOut(auth);

// User Profile Sync
export const syncUserProfile = async (user: User) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Editora Creator',
      photoURL: user.photoURL,
    };
    await setDoc(userRef, newProfile);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, 'users', uid), updates, { merge: true });
  } catch (err) {
    console.error('Error updating user profile:', err);
  }
};

// Cloud Projects Persistence
export const saveProjectToCloud = async (userId: string, project: Project) => {
  try {
    const projectRef = doc(db, 'users', userId, 'projects', project.id);
    await setDoc(projectRef, {
      ...project,
      updatedAt: Date.now(),
      serverUpdatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Error saving project to cloud:', err);
    return false;
  }
};

export const loadUserProjectsFromCloud = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'projects'),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    const projects: Project[] = [];
    snap.forEach((docSnap) => {
      projects.push(docSnap.data() as Project);
    });
    return projects;
  } catch (err) {
    console.error('Error loading projects:', err);
    return [];
  }
};

export const deleteProjectFromCloud = async (userId: string, projectId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
    return true;
  } catch (err) {
    console.error('Error deleting project:', err);
    return false;
  }
};

// Upload Blob/File to Storage
export const uploadMediaToStorage = async (userId: string, file: File | Blob, pathName: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `users/${userId}/media/${Date.now()}_${pathName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error('Firebase Storage upload error:', err);
    throw err;
  }
};
