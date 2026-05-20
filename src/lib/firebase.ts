import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Production Firebase Configuration for MarketBeacon
const firebaseConfig = {
  apiKey: "AIzaSyD4HievnUV5z6wuFBctv3IXdrLji-qFuV0",
  authDomain: "marketbeacon-9436f.firebaseapp.com",
  projectId: "marketbeacon-9436f",
  storageBucket: "marketbeacon-9436f.firebasestorage.app",
  messagingSenderId: "263801261902",
  appId: "1:263801261902:web:53c88a02b770b1427a181f",
  measurementId: "G-F1C8SFWGQV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
