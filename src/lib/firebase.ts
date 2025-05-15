
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCSgf9pJxDnSCtbI8PczU9S712nO_Y-QqM",
  authDomain: "campus-kart-mlr.firebaseapp.com",
  projectId: "campus-kart-mlr",
  storageBucket: "campus-kart-mlr.appspot.com", // Corrected storage bucket
  messagingSenderId: "341026646410",
  appId: "1:341026646410:web:34ca3ab7118de0d12d4073",
  measurementId: "G-ZZLNHNCY4G"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
