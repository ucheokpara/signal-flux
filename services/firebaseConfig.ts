import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// These values will be pulled from your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Ensure Firebase only initializes if an API key actually exists 
const isFirebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);

export const app = isFirebaseEnabled ? initializeApp(firebaseConfig) : null;
export const auth = isFirebaseEnabled ? getAuth(app as any) : null as any;
export const db = isFirebaseEnabled ? getFirestore(app as any) : null as any;

if (isFirebaseEnabled && auth) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence error:", error);
  });
}
