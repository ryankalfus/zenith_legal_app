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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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

  const functions = getFirebaseFunctions();

  // Prefer the strict callable, then fall back to legacy bootstrap callable.
  try {
    const strictFn = httpsCallable(functions, "ensureZenithAdminClaim");
    await strictFn();
  } catch {
    const legacyFn = httpsCallable(functions, "setAdminRoleByEmail");
    await legacyFn({ email: getZenithAdminEmail() });
  }

  await user.getIdToken(true);
}

export async function bootstrapAdminSessionIfNeeded() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!isZenithAdminUser(user)) {
    return false;
  }

  await ensureZenithAdminClaimIfNeeded(user).catch(() => undefined);
  return isAuthorizedAdmin(user);
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
  const userRef = doc(db, "users", user.uid);
  const profileDoc = await getDoc(userRef);

  if (profileDoc.exists() && profileDoc.data().role === "admin") {
    return true;
  }

  // Fallback: keep Zenith account profile role aligned even if claim propagation is delayed.
  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: getZenithAdminEmail(),
      fullName: "Zenith Legal",
      role: "admin",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch(() => undefined);

  return true;
}

export function watchAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
