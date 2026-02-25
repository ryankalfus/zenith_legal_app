"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getFirebaseDb } from "../../src/lib/firebase";
import { isAuthorizedAdmin, logout, watchAuth } from "../../src/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let unsubUsers: null | (() => void) = null;

    const unsubAuth = watchAuth(async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      const ok = await isAuthorizedAdmin(user);
      if (!ok) {
        router.push("/app");
        return;
      }

      if (unsubUsers) {
        unsubUsers();
      }

      const usersQuery = query(
        collection(getFirebaseDb(), "users"),
        where("role", "==", "candidate"),
        orderBy("fullName", "asc")
      );

      unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setRows(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubUsers) {
        unsubUsers();
      }
    };
  }, [router]);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }
    const term = search.toLowerCase();
    return rows.filter((row) => {
      return (
        String(row.fullName ?? "").toLowerCase().includes(term) ||
        String(row.email ?? "").toLowerCase().includes(term) ||
        String(row.mobile ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  return (
    <main className="container" style={{ display: "grid", gap: 16 }}>
      <section className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4 }}>Candidates</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Search and manage candidate workflows.</p>
        </div>
        <button className="secondary" onClick={() => logout()}>
          Log out
        </button>
      </section>

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone"
        />
        {loading ? <p>Loading candidates...</p> : null}
        {!loading && filtered.length === 0 ? <p>No candidates found.</p> : null}
        <div className="grid">
          {filtered.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/dashboard/candidates/${candidate.id}`}
              className="card"
              style={{ display: "grid", gap: 4 }}
            >
              <strong>{candidate.fullName || "(No name yet)"}</strong>
              <span style={{ color: "var(--muted)" }}>{candidate.email || "No email"}</span>
              <span style={{ color: "var(--muted)" }}>{candidate.mobile || "No mobile"}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
