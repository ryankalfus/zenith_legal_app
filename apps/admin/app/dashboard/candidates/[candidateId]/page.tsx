"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { CANDIDATE_STATUS_LABELS, CANDIDATE_VISIBLE_STATUSES } from "@zenith/shared";
import { getFirebaseDb } from "../../../../src/lib/firebase";
import { isAuthorizedAdmin, watchAuth } from "../../../../src/lib/auth";

export default function CandidateDetailPage() {
  const router = useRouter();
  const { candidateId } = useParams<{ candidateId: string }>();
  const db = getFirebaseDb();

  const [ready, setReady] = useState(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [firms, setFirms] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [newFirmId, setNewFirmId] = useState("");
  const [newStatus, setNewStatus] = useState<typeof CANDIDATE_VISIBLE_STATUSES[number]>("authorization_pending");
  const [newMessage, setNewMessage] = useState("");
  const [newAppointmentTitle, setNewAppointmentTitle] = useState("");
  const [newAppointmentStart, setNewAppointmentStart] = useState("");
  const [newAppointmentEnd, setNewAppointmentEnd] = useState("");

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    let teardown: (() => void)[] = [];

    const unsubAuth = watchAuth(async (user) => {
      const ok = await isAuthorizedAdmin(user);
      if (!ok || !user) {
        router.push("/auth");
        return;
      }

      setAdminUid(user.uid);

      teardown.forEach((fn) => fn());
      teardown = [];

      teardown.push(
        onSnapshot(doc(db, "users", candidateId), (snapshot) => {
          setCandidate(snapshot.data());
          setReady(true);
        })
      );

      teardown.push(
        onSnapshot(collection(db, "firms"), (snapshot) => {
          setFirms(snapshot.docs.map((row) => ({ id: row.id, ...row.data() })));
        })
      );

      teardown.push(
        onSnapshot(
          query(collection(db, "candidateFirmStatuses"), where("candidateId", "==", candidateId)),
          (snapshot) => {
            setStatuses(snapshot.docs.map((row) => ({ id: row.id, ...row.data() })));
          }
        )
      );

      teardown.push(
        onSnapshot(
          query(
            collection(db, "authorizationRequests"),
            where("candidateId", "==", candidateId),
            orderBy("requestedAt", "desc")
          ),
          (snapshot) => {
            setRequests(snapshot.docs.map((row) => ({ id: row.id, ...row.data() })));
          }
        )
      );

      teardown.push(
        onSnapshot(
          query(collection(db, "conversations", candidateId, "messages"), orderBy("createdAt", "asc")),
          (snapshot) => {
            setMessages(snapshot.docs.map((row) => ({ id: row.id, ...row.data() })));
          }
        )
      );

      teardown.push(
        onSnapshot(
          query(collection(db, "appointments"), where("candidateId", "==", candidateId), orderBy("startsAt", "asc")),
          (snapshot) => {
            setAppointments(snapshot.docs.map((row) => ({ id: row.id, ...row.data() })));
          }
        )
      );
    });

    return () => {
      unsubAuth();
      teardown.forEach((fn) => fn());
    };
  }, [candidateId, router]);

  const firmName = useMemo(() => {
    const map: Record<string, string> = {};
    firms.forEach((firm) => {
      map[firm.id] = String(firm.name ?? firm.id);
    });
    return map;
  }, [firms]);

  const onAddFirm = async () => {
    if (!candidateId || !adminUid || !newFirmId) {
      return;
    }

    const statusId = `${candidateId}_${newFirmId}`;
    await setDoc(doc(db, "candidateFirmStatuses", statusId), {
      candidateId,
      firmId: newFirmId,
      status: newStatus,
      updatedBy: adminUid,
      updatedAt: serverTimestamp(),
      history: [
        {
          status: newStatus,
          updatedBy: adminUid,
          updatedAt: new Date().toISOString(),
          note: "Initial status"
        }
      ]
    });
  };

  const onRequestAuthorization = async () => {
    if (!candidateId || !adminUid || !newFirmId) {
      return;
    }

    await addDoc(collection(db, "authorizationRequests"), {
      candidateId,
      firmId: newFirmId,
      state: "pending",
      requestedBy: adminUid,
      requestedAt: serverTimestamp()
    });
  };

  const onUpdateStatus = async (statusRecordId: string, status: string) => {
    if (!adminUid) {
      return;
    }

    await updateDoc(doc(db, "candidateFirmStatuses", statusRecordId), {
      status,
      updatedBy: adminUid,
      updatedAt: serverTimestamp()
    });
  };

  const onSendMessage = async () => {
    if (!candidateId || !adminUid || !newMessage.trim()) {
      return;
    }

    await setDoc(
      doc(db, "conversations", candidateId),
      {
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        lastMessageText: newMessage,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    await addDoc(collection(db, "conversations", candidateId, "messages"), {
      candidateId,
      senderId: adminUid,
      senderRole: "admin",
      text: newMessage,
      attachments: [],
      createdAt: serverTimestamp()
    });

    setNewMessage("");
  };

  const onCreateAppointment = async () => {
    if (!candidateId || !adminUid || !newAppointmentTitle || !newAppointmentStart || !newAppointmentEnd) {
      return;
    }

    await addDoc(collection(db, "appointments"), {
      candidateId,
      createdBy: adminUid,
      createdByRole: "admin",
      title: newAppointmentTitle,
      startsAt: newAppointmentStart,
      endsAt: newAppointmentEnd,
      status: "scheduled",
      reminderMinutesBefore: 30,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setNewAppointmentTitle("");
    setNewAppointmentStart("");
    setNewAppointmentEnd("");
  };

  const onCancelAppointment = async (appointmentId: string) => {
    await updateDoc(doc(db, "appointments", appointmentId), {
      status: "canceled",
      updatedAt: serverTimestamp()
    });
  };

  if (!ready) {
    return (
      <main className="container">
        <p>Loading candidate...</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ display: "grid", gap: 12 }}>
      <section className="card" style={{ display: "grid", gap: 6 }}>
        <Link href="/dashboard">← Back to candidates</Link>
        <h1 style={{ margin: 0 }}>{candidate?.fullName || "Candidate"}</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>{candidate?.email || "No email"}</p>
        <p style={{ margin: 0, color: "var(--muted)" }}>{candidate?.mobile || "No mobile"}</p>
      </section>

      <section className="card" style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Firms + Status</h2>
        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr", alignItems: "end" }}>
          <div>
            <label>Firm</label>
            <select value={newFirmId} onChange={(e) => setNewFirmId(e.target.value)}>
              <option value="">Select firm</option>
              {firms.map((firm) => (
                <option key={firm.id} value={firm.id}>
                  {firm.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as any)}>
              {CANDIDATE_VISIBLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CANDIDATE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <button onClick={onAddFirm}>Add/Update Firm</button>
        </div>
        <button className="secondary" onClick={onRequestAuthorization}>
          Request authorization for selected firm
        </button>

        <div className="grid">
          {statuses.map((statusRow) => (
            <div key={statusRow.id} className="card" style={{ display: "grid", gap: 8 }}>
              <strong>{firmName[statusRow.firmId] ?? statusRow.firmId}</strong>
              <select
                value={statusRow.status}
                onChange={(e) => onUpdateStatus(statusRow.id, e.target.value)}
              >
                {CANDIDATE_VISIBLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CANDIDATE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {statuses.length === 0 ? <p>No firms assigned.</p> : null}
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Authorization Requests</h2>
        <div className="grid">
          {requests.map((request) => (
            <div key={request.id} className="card" style={{ display: "grid", gap: 4 }}>
              <strong>{firmName[request.firmId] ?? request.firmId}</strong>
              <span>Status: {request.state}</span>
            </div>
          ))}
          {requests.length === 0 ? <p>No authorization requests yet.</p> : null}
        </div>
      </section>

      <section className="card" style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Messages</h2>
        <div className="grid">
          {messages.map((message) => (
            <div key={message.id} className="card" style={{ background: "#f9fafb" }}>
              <p style={{ margin: 0 }}>
                <strong>{message.senderRole}</strong>: {message.text || "(attachment)"}
              </p>
            </div>
          ))}
          {messages.length === 0 ? <p>No messages yet.</p> : null}
        </div>

        <textarea
          rows={3}
          placeholder="Type a message to candidate"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={onSendMessage}>Send message</button>
      </section>

      <section className="card" style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Appointments</h2>
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr 1fr auto" }}>
          <input
            placeholder="Title"
            value={newAppointmentTitle}
            onChange={(e) => setNewAppointmentTitle(e.target.value)}
          />
          <input
            placeholder="Start ISO"
            value={newAppointmentStart}
            onChange={(e) => setNewAppointmentStart(e.target.value)}
          />
          <input
            placeholder="End ISO"
            value={newAppointmentEnd}
            onChange={(e) => setNewAppointmentEnd(e.target.value)}
          />
          <button onClick={onCreateAppointment}>Create</button>
        </div>

        <div className="grid">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card" style={{ display: "grid", gap: 4 }}>
              <strong>{appointment.title}</strong>
              <span>{appointment.startsAt}</span>
              <span>Status: {appointment.status}</span>
              {appointment.status !== "canceled" && (
                <button className="secondary" onClick={() => onCancelAppointment(appointment.id)}>
                  Cancel
                </button>
              )}
            </div>
          ))}
          {appointments.length === 0 ? <p>No appointments yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
