import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseConfig;

try {
  firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
} catch (e) {
  firebaseConfig = '';
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
