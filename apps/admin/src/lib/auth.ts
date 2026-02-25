"use client";

import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb, getGoogleProvider } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export function getAllowlist() {
  const allowlist = process.env.NEXT_PUBLIC_ADMIN_ALLOWLIST ?? "";
  return allowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  return signInWithPopup(auth, getGoogleProvider());
}

export async function logout() {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

export async function isAuthorizedAdmin(user: User | null) {
  if (!user?.email) {
    return false;
  }

  const allowlist = getAllowlist();
  if (allowlist.length > 0 && !allowlist.includes(user.email.toLowerCase())) {
    return false;
  }

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
