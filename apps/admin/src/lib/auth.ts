"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions, getGoogleProvider } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

const defaultZenithAdminEmail = "mason@zenithlegal.com";

export function getZenithAdminEmail() {
  return (process.env.NEXT_PUBLIC_ZENITH_ADMIN_EMAIL ?? defaultZenithAdminEmail).trim().toLowerCase();
}

export function isZenithAdminUser(user: User | null) {
  return String(user?.email ?? "").trim().toLowerCase() === getZenithAdminEmail();
}

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  return signInWithPopup(auth, getGoogleProvider());
}

export async function signupWithEmailPassword(email: string, password: string) {
  const auth = getFirebaseAuth();
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function loginWithEmailPassword(email: string, password: string) {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout() {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

export async function ensureZenithAdminClaimIfNeeded(user: User | null) {
  if (!user || !isZenithAdminUser(user)) {
    return;
  }

  const fn = httpsCallable(getFirebaseFunctions(), "ensureZenithAdminClaim");
  await fn();
  await user.getIdToken(true);
}

export async function isAuthorizedAdmin(user: User | null) {
  if (!user?.email || !isZenithAdminUser(user)) {
    return false;
  }

  await ensureZenithAdminClaimIfNeeded(user).catch(() => undefined);

  const tokenResult = await user.getIdTokenResult();
  if (tokenResult.claims.role === "admin") {
    return true;
  }

  const db = getFirebaseDb();
  const profileDoc = await getDoc(doc(db, "users", user.uid));
  return profileDoc.exists() && profileDoc.data().role === "admin";
}

export function watchAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
