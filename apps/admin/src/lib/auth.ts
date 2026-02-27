"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions, getGoogleProvider } from "./firebase";

function normalizeRole(input: unknown) {
  const value = String(input ?? "").trim().toLowerCase();
  return value === "admin" ? "admin" : value === "candidate" ? "candidate" : "";
}

async function syncAdminProfile(user: User) {
  const userRef = doc(getFirebaseDb(), "users", user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      role: "admin",
      email: String(user.email ?? "").trim().toLowerCase(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch(() => undefined);
}

async function syncOwnRoleFromProfileIfNeeded() {
  try {
    const syncFn = httpsCallable(getFirebaseFunctions(), "syncOwnRoleFromProfile");
    await syncFn();
  } catch {
    // Continue even if callable is unavailable.
  }
}

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  try {
    return await signInWithPopup(auth, getGoogleProvider());
  } catch (error: any) {
    const code = String(error?.code ?? "");
    const message = String(error?.message ?? "").toLowerCase();
    const shouldFallbackToRedirect =
      code.includes("popup-blocked") ||
      code.includes("popup-closed-by-user") ||
      code.includes("cancelled-popup-request") ||
      message.includes("popup");

    if (shouldFallbackToRedirect) {
      await signInWithRedirect(auth, getGoogleProvider());
      return null;
    }

    throw error;
  }
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

export async function ensureZenithAdminClaimIfNeeded(_user: User | null) {
  // Legacy no-op kept for compatibility with older imports.
  return;
}

export async function bootstrapAdminSessionIfNeeded() {
  const auth = getFirebaseAuth();
  return isAuthorizedAdmin(auth.currentUser);
}

export async function isAuthorizedAdmin(user: User | null) {
  if (!user) {
    return false;
  }

  await syncOwnRoleFromProfileIfNeeded();
  const tokenResult = await user.getIdTokenResult(true).catch(() => null);
  const hasAdminClaim = normalizeRole(tokenResult?.claims?.role) === "admin";

  const userRef = doc(getFirebaseDb(), "users", user.uid);
  const profileDoc = await getDoc(userRef).catch(() => null);
  const hasAdminProfileRole = Boolean(profileDoc?.exists() && normalizeRole(profileDoc.data()?.role) === "admin");
  if (!hasAdminClaim && !hasAdminProfileRole) {
    return false;
  }

  await syncAdminProfile(user);
  return true;
}

export function watchAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
