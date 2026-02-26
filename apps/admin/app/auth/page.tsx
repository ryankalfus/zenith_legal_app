"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthorizedAdmin,
  loginWithEmailPassword,
  loginWithGoogle,
  signupWithEmailPassword,
  watchAuth
} from "../../src/lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const usingEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  const formatAuthError = (err: any, fallback: string) => {
    const code = String(err?.code ?? "");
    const message = String(err?.message ?? "");

    if (code.includes("auth/email-already-in-use")) {
      return "This email already has an account. Use Log in instead.";
    }
    if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
      return "Email or password is incorrect.";
    }
    if (code.includes("auth/user-not-found")) {
      return "No account found for this email.";
    }
    if (code.includes("auth/invalid-email")) {
      return "Email format is invalid.";
    }
    if (code.includes("auth/weak-password")) {
      return "Password must be at least 6 characters.";
    }
    if (code.includes("auth/operation-not-allowed")) {
      return "Email/password sign-in is not enabled in Firebase Auth.";
    }
    if (message) {
      return message;
    }
    return fallback;
  };

  useEffect(() => {
    const unsub = watchAuth(async (user) => {
      if (!user) {
        return;
      }
      const ok = await isAuthorizedAdmin(user);
      if (ok) {
        router.push("/dashboard");
      } else {
        router.push("/app");
      }
    });

    return unsub;
  }, [router]);

  const onEmailPassword = async () => {
    try {
      setBusy(true);
      setError(null);
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required.");
        return;
      }

      if (mode === "signup") {
        await signupWithEmailPassword(email, password);
      } else {
        await loginWithEmailPassword(email, password);
      }

      router.push("/app");
    } catch (err: any) {
      setError(formatAuthError(err, "Authentication failed."));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    try {
      setBusy(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(formatAuthError(err, "Google login failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ width: "100%", maxWidth: 480, display: "grid", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Zenith Legal</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Sign up or log in to enter the app.
        </p>
        {usingEmulators ? (
          <p style={{ margin: 0, color: "#92400e", background: "#fef3c7", padding: 8, borderRadius: 8 }}>
            Emulator mode is ON for web auth. If sign-in fails, set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` and restart `npm run dev:admin`.
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={mode === "signup" ? "" : "secondary"} onClick={() => setMode("signup")}>
            Sign up
          </button>
          <button type="button" className={mode === "login" ? "" : "secondary"} onClick={() => setMode("login")}>
            Log in
          </button>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        <button type="button" onClick={onEmailPassword} disabled={busy}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up with Email" : "Log in with Email"}
        </button>
        <button type="button" className="secondary" onClick={onGoogle} disabled={busy}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up with Google" : "Log in with Google"}
        </button>
        {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
      </section>
    </main>
  );
}
