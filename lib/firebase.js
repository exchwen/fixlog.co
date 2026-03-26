import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, // BURASI EKLENDİ
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC9_FIIHA8qo4Eyi2sIDHufvE12C-Jy3Cs',
  authDomain: 'fixlog-co.firebaseapp.com',
  projectId: 'fixlog-co',
  storageBucket: 'fixlog-co.firebasestorage.app',
  messagingSenderId: '171633921362',
  appId: '1:171633921362:web:5e2982a573b427b3e07e8b',
  measurementId: 'G-5Z07JT4NRY',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, // BURASI EKLENDİ
};