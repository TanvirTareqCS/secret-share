import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBSn_UrhUnWZdvU0WfaDUbPC8lviWFfRWA",
  authDomain: "share-5d4a0.firebaseapp.com",
  databaseURL: "https://share-5d4a0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "share-5d4a0",
  storageBucket: "share-5d4a0.firebasestorage.app",
  messagingSenderId: "851824058701",
  appId: "1:851824058701:web:8e66692c9a9213f1229704",
  measurementId: "G-7DNZJJZD69"
};

// Safely initialize Firebase for Next.js to prevent hot-reload crashes
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the database so our pages can use it
export const db = getDatabase(app);