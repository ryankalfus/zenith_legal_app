import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut
} from "firebase/auth";
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import * as Linking from "expo-linking";
import { auth, db } from "../lib/firebase";
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
  sendEmailLink: (email: string) => Promise<void>;
  completeEmailLinkSignIn: (email: string, incomingUrl: string) => Promise<void>;
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
const pendingEmailKey = "zenith.pendingEmailLink";

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

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          role: "candidate",
          fullName: "",
          email: user.email ?? "",
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

      const refreshed = await getDoc(userRef);
      const data = refreshed.data() as { role?: "candidate" | "admin"; fullName?: string } | undefined;
      setSession({
        user,
        role: data?.role ?? "candidate",
        profileComplete: Boolean(data?.fullName)
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

    const subscription = Linking.addEventListener("url", async ({ url }) => {
      const pendingEmail = await AsyncStorage.getItem(pendingEmailKey);
      if (pendingEmail && isSignInWithEmailLink(auth, url)) {
        await signInWithEmailLink(auth, pendingEmail, url);
        await AsyncStorage.removeItem(pendingEmailKey);
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  const sendEmailLink = async (email: string) => {
    const actionCodeSettings = {
      url: Linking.createURL("auth/email"),
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    await AsyncStorage.setItem(pendingEmailKey, email);
  };

  const completeEmailLinkSignIn = async (email: string, incomingUrl: string) => {
    if (!isSignInWithEmailLink(auth, incomingUrl)) {
      throw new Error("The link is not a valid sign-in link");
    }
    await signInWithEmailLink(auth, email, incomingUrl);
    await AsyncStorage.removeItem(pendingEmailKey);
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
      sendEmailLink,
      completeEmailLinkSignIn,
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
