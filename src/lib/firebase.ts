import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// --- INSTRUCTIONS FOR OWNER ---
// Please replace the keys below with your values from the Firebase Console (https://console.firebase.google.com/)
// Path: Project Settings > Your Apps > Web App (Add App if not exists)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
