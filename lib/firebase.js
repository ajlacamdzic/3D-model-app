import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVCxRi6hXpPwMookaES4scvY5qOP2A9k4",
  authDomain: "threejs-app-33bd7.firebaseapp.com",
  projectId: "threejs-app-33bd7",
  storageBucket: "threejs-app-33bd7.firebasestorage.app",
  messagingSenderId: "758473590539",
  appId: "1:758473590539:web:46e2a1a65e55503001c40e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);