import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, // BURASI EKLENDİ
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAhqXkYUm6LU5vjG6ZlCxi9hBtKfGHNfHc',
  authDomain: 'fixlog.co',
  projectId: 'is-dokumu',
  storageBucket: 'is-dokumu.firebasestorage.app',
  messagingSenderId: '587776552104',  
  appId: '1:587776552104:web:9b8faac2019dd1a6a2669d',
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