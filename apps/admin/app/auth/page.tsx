"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthorizedAdmin, loginWithGoogle, watchAuth } from "../../src/lib/auth";

export default function AuthPage() {
  const router = useRouter();
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
        setError("This account is not allowed for admin access.");
      }
    });

    return unsub;
  }, [router]);

  const onLogin = async () => {
    try {
      setBusy(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message ?? "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ width: "100%", maxWidth: 480, display: "grid", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Zenith Legal Admin Console</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Recruiter/admin access only. Use approved Google account.
        </p>
        <button onClick={onLogin} disabled={busy}>
          {busy ? "Signing in..." : "Sign in with Google"}
        </button>
        {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
      </section>
    </main>
  );
}
