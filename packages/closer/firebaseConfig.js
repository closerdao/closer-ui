import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
