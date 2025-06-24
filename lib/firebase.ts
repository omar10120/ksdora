// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB3heCbqg7OmshC4TAJrLOlpB8lxzcW3bA",
  authDomain: "ksdora-7fe98.firebaseapp.com",
  projectId: "ksdora-7fe98",
  storageBucket: "ksdora-7fe98.firebasestorage.app",
  messagingSenderId: "335865524970",
  appId: "1:335865524970:web:7f86cec6bff9e298de5d93",
  measurementId: "G-W5QTFNESLB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
