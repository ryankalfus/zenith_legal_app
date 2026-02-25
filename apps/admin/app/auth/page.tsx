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
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed.");
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
      setError(err?.message ?? "Google login failed.");
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className={mode === "signup" ? "" : "secondary"} onClick={() => setMode("signup")}>
            Sign up
          </button>
          <button className={mode === "login" ? "" : "secondary"} onClick={() => setMode("login")}>
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

        <button onClick={onEmailPassword} disabled={busy}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up with Email" : "Log in with Email"}
        </button>
        <button className="secondary" onClick={onGoogle} disabled={busy}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up with Google" : "Log in with Google"}
        </button>
        {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
      </section>
    </main>
  );
}
