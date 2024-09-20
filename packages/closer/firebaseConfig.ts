import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

let firebaseConfig;

try {
  firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : null;
} catch (e) {
  console.warn('Failed to parse Firebase configuration:', e);
  firebaseConfig = null;
}

// Mock configuration for testing environments
const mockConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-auth-domain',
  projectId: 'mock-project-id',
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (e) {
    console.warn('Failed to initialize Firebase app:', e);
  }
} else {
  console.warn('Using mock Firebase configuration for testing.');
  app = initializeApp(mockConfig);
  auth = getAuth(app);
}

export { auth };