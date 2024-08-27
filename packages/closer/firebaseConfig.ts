import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

let firebaseConfig;

try {
  firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : null;
} catch (e) {
  console.error('Failed to parse Firebase configuration:', e);
  firebaseConfig = null;
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (e) {
    console.error('Failed to initialize Firebase app:', e);
  }
} else {
  console.error('Firebase configuration is missing or invalid.');
}

export { auth };