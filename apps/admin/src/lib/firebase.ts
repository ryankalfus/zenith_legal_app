"use client";

import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let cachedApp: FirebaseApp | null = null;
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;
let functionsEmulatorConnected = false;

function ensureClient() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK can only be used in the browser.");
  }
}

function getFirebaseApp() {
  ensureClient();

  if (cachedApp) {
    return cachedApp;
  }

  cachedApp = getApps().length ? getApps()[0] : initializeApp(config);
  return cachedApp;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (useEmulators && !authEmulatorConnected) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    authEmulatorConnected = true;
  }

  return auth;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (useEmulators && !firestoreEmulatorConnected) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
    connectFirestoreEmulator(db, host, 8080);
    firestoreEmulatorConnected = true;
  }

  return db;
}

export function getFirebaseFunctions() {
  const app = getFirebaseApp();
  const functions = getFunctions(app);
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (useEmulators && !functionsEmulatorConnected) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
    connectFunctionsEmulator(functions, host, 5001);
    functionsEmulatorConnected = true;
  }

  return functions;
}

export function getGoogleProvider() {
  return new GoogleAuthProvider();
}
