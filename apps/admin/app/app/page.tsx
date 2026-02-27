"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  APPOINTMENT_RECRUITERS,
  CANDIDATE_STATUS_LABELS,
  CandidateFirmStatus,
  CANDIDATE_VISIBLE_STATUSES,
  DEFAULT_APPOINTMENT_RECRUITER_ID,
  PRACTICE_AREAS,
  PREFERRED_CITIES
} from "@zenith/shared";
import { getFirebaseDb, getFirebaseFunctions } from "../../src/lib/firebase";
import { bootstrapAdminSessionIfNeeded, isAuthorizedAdmin, logout, watchAuth } from "../../src/lib/auth";

const defaultRecruiterLabel =
  APPOINTMENT_RECRUITERS.find((entry) => entry.id === DEFAULT_APPOINTMENT_RECRUITER_ID)?.label || "Mason";

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [firmMap, setFirmMap] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<any[]>([]);
  const [authRequests, setAuthRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [apptTitle, setApptTitle] = useState("");
  const [apptStart, setApptStart] = useState("");
  const [apptEnd, setApptEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let teardown: (() => void)[] = [];
    const unsub = watchAuth(async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      setEmail(String(user.email ?? ""));
      setUid(user.uid);

      const isAdminBootstrap = await bootstrapAdminSessionIfNeeded();
      const isAdmin = isAdminBootstrap || (await isAuthorizedAdmin(user));
      if (isAdmin) {
        router.push("/dashboard");
        return;
      }

      const db = getFirebaseDb();

      teardown.forEach((fn) => fn());
      teardown = [];

      teardown.push(
        onSnapshot(doc(db, "users", user.uid), (snapshot) => {
          const data = snapshot.data();
          setFullName(String(data?.fullName ?? ""));
          setMobile(String(data?.mobile ?? ""));
          setPreferredCities(Array.isArray(data?.preferences?.preferredCities) ? data.preferences.preferredCities : []);
          setPracticeArea(String(data?.preferences?.practiceArea ?? PRACTICE_AREAS[0]));
        })
      );

      teardown.push(
        onSnapshot(collection(db, "firms"), (snapshot) => {
          const next: Record<string, string> = {};
          snapshot.docs.forEach((entry) => {
            next[entry.id] = String(entry.data().name ?? entry.id);
          });
          setFirmMap(next);
        })
      );

      teardown.push(
        onSnapshot(
          query(
            collection(db, "candidateFirmStatuses"),
            where("candidateId", "==", user.uid),
            where("status", "in", [...CANDIDATE_VISIBLE_STATUSES]),
            orderBy("updatedAt", "desc")
          ),
          (snapshot) => setStatuses(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        )
      );

      teardown.push(
        onSnapshot(
          query(
            collection(db, "authorizationRequests"),
            where("candidateId", "==", user.uid),
            where("state", "==", "pending"),
            orderBy("requestedAt", "desc")
          ),
          (snapshot) => setAuthRequests(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        )
      );

      teardown.push(
        onSnapshot(
          query(collection(db, "conversations", user.uid, "messages"), orderBy("createdAt", "asc")),
          (snapshot) => setMessages(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        )
      );

      teardown.push(
        onSnapshot(
          query(collection(db, "appointments"), where("candidateId", "==", user.uid), orderBy("startsAt", "asc")),
          (snapshot) => setAppointments(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
        )
      );
    });

    return () => {
      unsub();
      teardown.forEach((fn) => fn());
    };
  }, [router]);

  const toggleCity = (city: string) => {
    setPreferredCities((prev) =>
      prev.includes(city) ? prev.filter((value) => value !== city) : [...prev, city]
    );
  };

  const saveProfile = async () => {
    if (!uid) {
      return;
    }

    try {
      const db = getFirebaseDb();
      setSaving(true);
      setError(null);
      await updateDoc(doc(db, "users", uid), {
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        preferences: {
          preferredCities,
          practiceArea
        },
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err?.message ?? "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const respondAuthRequest = async (requestId: string, state: "approved" | "declined") => {
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "authorizationRequests", requestId), {
        state,
        respondedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err?.message ?? "Could not update authorization.");
    }
  };

  const sendMessage = async () => {
    if (!uid || !messageText.trim()) {
      return;
    }

    try {
      const db = getFirebaseDb();
      await setDoc(
        doc(db, "conversations", uid),
        {
          candidateId: uid,
          participantIds: [uid, "zenith-team"],
          lastMessageText: messageText.trim(),
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      await addDoc(collection(db, "conversations", uid, "messages"), {
        candidateId: uid,
        senderId: uid,
        senderRole: "candidate",
        text: messageText.trim(),
        attachments: [],
        createdAt: serverTimestamp()
      });

      setMessageText("");
    } catch (err: any) {
      setError(err?.message ?? "Could not send message.");
    }
  };

  const createAppointment = async () => {
    if (!uid || !apptTitle.trim() || !apptStart.trim() || !apptEnd.trim()) {
      setError("Appointment title/start/end are required.");
      return;
    }

    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, "appointments"), {
        candidateId: uid,
        createdBy: uid,
        createdByRole: "candidate",
        title: apptTitle.trim(),
        startsAt: apptStart.trim(),
        endsAt: apptEnd.trim(),
        recruiterId: DEFAULT_APPOINTMENT_RECRUITER_ID,
        recruiterName: defaultRecruiterLabel,
        status: "scheduled",
        reminderMinutesBefore: 30,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setApptTitle("");
      setApptStart("");
      setApptEnd("");
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Could not create appointment.");
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "appointments", id), {
        status: "canceled",
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err?.message ?? "Could not cancel appointment.");
    }
  };

  const deleteAccount = async () => {
    try {
      const functions = getFirebaseFunctions();
      const fn = httpsCallable(functions, "deleteCandidateAccountData");
      await fn();
      await logout();
      router.push("/auth");
    } catch (err: any) {
      setError(err?.message ?? "Could not delete account.");
    }
  };

  return (
    <main className="container" style={{ display: "grid", gap: 14 }}>
      <section className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0 }}>Zenith Legal Candidate App</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>Signed in as {email || "user"}.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary" onClick={() => logout()}>
            Log out
          </button>
          <button className="secondary" onClick={() => deleteAccount()}>
            Delete account/data
          </button>
        </div>
      </section>

      {error ? (
        <section className="card" style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
          <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
        </section>
      ) : null}

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Home</h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Contact Zenith Legal anytime: <a href="mailto:mason@zenithlegal.com">mason@zenithlegal.com</a> ·{" "}
          <a href="tel:+15551234567">+1 555 123 4567</a>
        </p>
      </section>

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Status</h2>
        {authRequests.length > 0 ? (
          <div className="grid">
            {authRequests.map((row) => (
              <div key={row.id} className="card" style={{ display: "grid", gap: 8 }}>
                <strong>Authorization: {firmMap[row.firmId] ?? row.firmId}</strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => respondAuthRequest(row.id, "approved")}>Approve</button>
                  <button className="secondary" onClick={() => respondAuthRequest(row.id, "declined")}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: "var(--muted)" }}>No pending authorizations.</p>
        )}
        <div className="grid">
          {statuses.map((row) => (
            <div key={row.id} className="card" style={{ display: "grid", gap: 4 }}>
              <strong>{firmMap[row.firmId] ?? row.firmId}</strong>
              <span>{CANDIDATE_STATUS_LABELS[row.status as CandidateFirmStatus] ?? row.status}</span>
            </div>
          ))}
          {statuses.length === 0 ? <p style={{ margin: 0, color: "var(--muted)" }}>No firm statuses yet.</p> : null}
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Messages</h2>
        <div className="grid">
          {messages.map((msg) => (
            <div key={msg.id} className="card" style={{ background: msg.senderRole === "candidate" ? "#f3f4f6" : "#f9fafb" }}>
              <strong>{msg.senderRole}</strong>
              <p style={{ margin: 0 }}>{msg.text || "(attachment)"}</p>
            </div>
          ))}
          {messages.length === 0 ? <p style={{ margin: 0, color: "var(--muted)" }}>No messages yet.</p> : null}
        </div>
        <textarea
          rows={3}
          placeholder="Type a message"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
        />
        <button onClick={sendMessage}>Send message</button>
      </section>

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Calendar</h2>
        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr auto", alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Title</span>
            <input value={apptTitle} onChange={(event) => setApptTitle(event.target.value)} placeholder="Interview prep" />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Start ISO</span>
            <input value={apptStart} onChange={(event) => setApptStart(event.target.value)} placeholder="2026-03-01T10:00:00Z" />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>End ISO</span>
            <input value={apptEnd} onChange={(event) => setApptEnd(event.target.value)} placeholder="2026-03-01T10:30:00Z" />
          </label>
          <button onClick={createAppointment}>Create</button>
        </div>
        <div className="grid">
          {appointments.map((appt) => (
            <div key={appt.id} className="card" style={{ display: "grid", gap: 4 }}>
              <strong>{appt.title}</strong>
              <span>{appt.startsAt}</span>
              <span>Status: {appt.status}</span>
              {appt.status !== "canceled" ? (
                <button className="secondary" onClick={() => cancelAppointment(appt.id)}>Cancel</button>
              ) : null}
            </div>
          ))}
          {appointments.length === 0 ? <p style={{ margin: 0, color: "var(--muted)" }}>No appointments yet.</p> : null}
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Profile</h2>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Name</span>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Mobile</span>
          <input value={mobile} onChange={(event) => setMobile(event.target.value)} />
        </label>

        <div style={{ display: "grid", gap: 6 }}>
          <span>Preferred Cities</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PREFERRED_CITIES.map((city) => {
              const selected = preferredCities.includes(city);
              return (
                <button
                  key={city}
                  className={selected ? "" : "secondary"}
                  onClick={() => toggleCity(city)}
                  type="button"
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Practice Area</span>
          <select value={practiceArea} onChange={(event) => setPracticeArea(event.target.value)}>
            {PRACTICE_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <button onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </section>
    </main>
  );
}
