import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };
const firebaseConfig = {
  apiKey: "AIzaSyAINhGcCv_D-meQhYryEEsm5qLmRMApfX0",
  authDomain: "bible-app-4ea8f.firebaseapp.com",
  projectId: "bible-app-4ea8f",
  storageBucket: "bible-app-4ea8f.firebasestorage.app",
  messagingSenderId: "1052050185148",
  appId: "1:1052050185148:web:93778e8f126d9e85a329b9",
  measurementId: "G-3FD1WCMH6P",
};

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
