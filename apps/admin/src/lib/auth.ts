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
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions, getGoogleProvider } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const defaultZenithAdminEmail = "mason@zenithlegal.com";
const zenithAdminDisplayName = "Zenith Legal";

export function getZenithAdminEmail() {
  return (process.env.NEXT_PUBLIC_ZENITH_ADMIN_EMAIL ?? defaultZenithAdminEmail).trim().toLowerCase();
}

export function isZenithAdminUser(user: User | null) {
  return String(user?.email ?? "").trim().toLowerCase() === getZenithAdminEmail();
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

  const tokenResult = await user.getIdTokenResult(true).catch(() => null);
  const hasAdminClaim = tokenResult?.claims?.role === "admin";

  const db = getFirebaseDb();
  const userRef = doc(db, "users", user.uid);
  const profileDoc = await getDoc(userRef).catch(() => null);
  const hasAdminProfileRole = Boolean(profileDoc?.exists() && profileDoc.data().role === "admin");

  if (hasAdminClaim || hasAdminProfileRole) {
    if (hasAdminClaim) {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: getZenithAdminEmail(),
          fullName: zenithAdminDisplayName,
          role: "admin",
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ).catch(() => undefined);
    }
    return true;
  }

  // Last retry in case callable deployment or token propagation was delayed.
  await ensureZenithAdminClaimIfNeeded(user).catch(() => undefined);
  const retryTokenResult = await user.getIdTokenResult(true).catch(() => null);
  if (retryTokenResult?.claims?.role === "admin") {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: getZenithAdminEmail(),
        fullName: zenithAdminDisplayName,
        role: "admin",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    ).catch(() => undefined);
    return true;
  }

  return false;
}

export function watchAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
