import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../lib/firebase";
import { registerForPushNotificationsAsync } from "../lib/notifications";
import { PRACTICE_AREAS } from "@zenith/shared";

type CandidateSession = {
  user: User;
  profileComplete: boolean;
  role: "candidate" | "admin";
};

type AuthContextValue = {
  loading: boolean;
  session: CandidateSession | null;
  signupWithEmailPassword: (email: string, password: string) => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  completeProfile: (input: {
    fullName: string;
    email: string;
    mobile: string;
    preferredCities: string[];
    practiceArea: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultPracticeArea = PRACTICE_AREAS[0];
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const zenithAdminEmail =
  (process.env.EXPO_PUBLIC_ZENITH_ADMIN_EMAIL ?? extra.zenithAdminEmail ?? "mason@zenithlegal.com")
    .trim()
    .toLowerCase();
const zenithAdminName = "Zenith Legal";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CandidateSession | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userEmail = String(user.email ?? "").trim().toLowerCase();
      const isZenithAdmin = userEmail === zenithAdminEmail;

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          role: isZenithAdmin ? "admin" : "candidate",
          fullName: isZenithAdmin ? zenithAdminName : "",
          email: userEmail,
          mobile: user.phoneNumber ?? "",
          emailVerified: Boolean(user.emailVerified),
          phoneVerified: Boolean(user.phoneNumber),
          preferences: {
            preferredCities: [],
            practiceArea: defaultPracticeArea
          },
          pushTokens: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      if (isZenithAdmin) {
        try {
          const ensureZenithAdmin = httpsCallable(functions, "ensureZenithAdminClaim");
          await ensureZenithAdmin();
          await user.getIdToken(true);
        } catch {
          // Keep session available; dashboard guard will still validate claim access.
        }
      }

      const refreshed = await getDoc(userRef);
      const data = refreshed.data() as { role?: "candidate" | "admin"; fullName?: string } | undefined;
      const tokenResult = await user.getIdTokenResult(true).catch(() => null);
      const hasAdminClaim = tokenResult?.claims?.role === "admin";
      const hasAdminDocRole = data?.role === "admin";
      const shouldBeAdmin = isZenithAdmin && (hasAdminClaim || hasAdminDocRole);

      if (isZenithAdmin && shouldBeAdmin && data?.role !== "admin") {
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: zenithAdminEmail,
            fullName: zenithAdminName,
            role: "admin",
            updatedAt: serverTimestamp()
          },
          { merge: true }
        ).catch(() => undefined);
      }

      const sessionRole: "candidate" | "admin" =
        shouldBeAdmin ? "admin" : "candidate";

      if (!isZenithAdmin && data?.role === "admin") {
        await updateDoc(userRef, {
          role: "candidate",
          updatedAt: serverTimestamp()
        }).catch(() => undefined);
      }

      setSession({
        user,
        role: sessionRole,
        profileComplete: sessionRole === "admin" ? true : Boolean(data?.fullName)
      });

      const token = await registerForPushNotificationsAsync();
      if (token) {
        await updateDoc(userRef, {
          pushTokens: arrayUnion(token),
          updatedAt: serverTimestamp()
        }).catch(() => undefined);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signupWithEmailPassword: AuthContextValue["signupWithEmailPassword"] = async (
    email,
    password
  ) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  const loginWithEmailPassword: AuthContextValue["loginWithEmailPassword"] = async (
    email,
    password
  ) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const completeProfile: AuthContextValue["completeProfile"] = async (input) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user");
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      fullName: input.fullName,
      email: input.email,
      mobile: input.mobile,
      preferences: {
        preferredCities: input.preferredCities,
        practiceArea: input.practiceArea
      },
      updatedAt: serverTimestamp()
    });

    setSession((prev) => (prev ? { ...prev, profileComplete: true } : prev));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      signupWithEmailPassword,
      loginWithEmailPassword,
      completeProfile,
      logout: () => signOut(auth)
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
