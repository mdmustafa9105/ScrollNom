// Firebase Authentication Client Configuration with Real Environment Variable Validation
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '';

// Validate that Firebase configuration exists in environment
export const isFirebaseConfigured = Boolean(apiKey && !apiKey.includes('Mock'));
export const isMockFirebase = !isFirebaseConfigured;

if (!isFirebaseConfigured) {
  console.warn('[FIREBASE CONFIG] Firebase Web Auth is not configured.');
}

const firebaseConfig = {
  apiKey: apiKey || 'UNCONFIGURED_API_KEY',
  authDomain: authDomain || 'unconfigured.firebaseapp.com',
  projectId: projectId || 'unconfigured-project',
  storageBucket,
  messagingSenderId,
  appId
};

// Initialize Firebase Client App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
};
