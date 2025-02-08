import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Configure auth action URL
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
auth.config.authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
auth.config.actionCodeSettings = {
  url: `${baseUrl}/auth/action`,
  handleCodeInApp: true,
};

const db = getFirestore(app);

export { app, auth, db };
