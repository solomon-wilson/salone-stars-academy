import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Safe Analytics Initialization for Sanboxed environments
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("[Firebase Analytics] Initialized successfully.");
  } else {
    console.log("[Firebase Analytics] Context is not supported in this iframe environment.");
  }
}).catch((err) => {
  console.log("[Firebase Analytics] Initialization skipped:", err);
});

console.log("[Firebase Core] Active client initialized with projectId:", firebaseConfig.projectId);
