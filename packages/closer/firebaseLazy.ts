import type { FirebaseApp } from 'firebase/app';
import type { Auth, GoogleAuthProvider as GoogleAuthProviderType } from 'firebase/auth';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let isInitialized = false;
let initPromise: Promise<{ auth: Auth; GoogleAuthProvider: typeof GoogleAuthProviderType }> | null = null;

export async function getFirebaseAuth(): Promise<{
  auth: Auth;
  GoogleAuthProvider: typeof GoogleAuthProviderType;
}> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (isInitialized && firebaseAuth) {
      const { GoogleAuthProvider } = await import('firebase/auth');
      return { auth: firebaseAuth, GoogleAuthProvider };
    }

    const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG
      ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
      : null;

    if (!firebaseConfig) {
      throw new Error('Firebase configuration not found');
    }

    const { initializeApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider } = await import('firebase/auth');

    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    isInitialized = true;

    return { auth: firebaseAuth, GoogleAuthProvider };
  })();

  return initPromise;
}

export async function signOutFirebase(): Promise<void> {
  if (!firebaseAuth) {
    return;
  }

  const { signOut } = await import('firebase/auth');
  await signOut(firebaseAuth);
}

export async function signInWithGooglePopup(): Promise<{
  email: string | null;
  displayName: string | null;
  idToken: string;
}> {
  const { auth, GoogleAuthProvider } = await getFirebaseAuth();
  const { signInWithPopup } = await import('firebase/auth');

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    email: result.user.email,
    displayName: result.user.displayName,
    idToken,
  };
}
