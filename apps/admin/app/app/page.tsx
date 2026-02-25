"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthorizedAdmin, logout, watchAuth } from "../../src/lib/auth";

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsub = watchAuth(async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      setEmail(String(user.email ?? ""));
      const isAdmin = await isAuthorizedAdmin(user);
      if (isAdmin) {
        router.push("/dashboard");
      }
    });

    return unsub;
  }, [router]);

  return (
    <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Zenith Legal</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Signed in as {email || "user"}.
        </p>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Candidate workflows are available in the mobile app. Zenith admin account opens the management dashboard.
        </p>
        <button className="secondary" onClick={() => logout()}>
          Log out
        </button>
      </section>
    </main>
  );
}
