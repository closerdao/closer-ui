import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAjzn-Lu6MKJhn89eXK4-7yawtYYAxf0s8',
  authDomain: 'closer-cf870.firebaseapp.com',
  projectId: 'closer-cf870',
  storageBucket: 'closer-cf870.appspot.com',
  messagingSenderId: '768409005597',
  appId: '1:768409005597:web:a9b4adb8faa2875d0760f4',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
