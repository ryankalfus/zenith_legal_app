import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { AppointmentStatus } from "@zenith/shared";
import { db } from "../lib/firebase";

export type AppointmentRow = {
  id: string;
  candidateId: string;
  createdBy: string;
  createdByRole: "candidate" | "admin";
  status: AppointmentStatus;
  title: string;
  startsAt: string;
  endsAt: string;
  phoneNumber: string;
  notes?: string;
};

export function watchCandidateAppointments(
  candidateId: string,
  onData: (rows: AppointmentRow[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "appointments"),
    where("candidateId", "==", candidateId),
    orderBy("startsAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<AppointmentRow, "id">) })));
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminAppointmentRequests(
  onData: (rows: AppointmentRow[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "appointments"),
    where("status", "in", ["requested", "scheduled", "completed", "canceled"]),
    orderBy("startsAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<AppointmentRow, "id">) })));
    },
    (err) => onError(err as Error)
  );
}

export async function createAppointmentRequest(payload: {
  candidateId: string;
  createdBy: string;
  createdByRole: "candidate" | "admin";
  startsAt: string;
  phoneNumber: string;
  notes?: string;
}) {
  const startsDate = new Date(payload.startsAt);
  const endsAt = new Date(startsDate.getTime() + 30 * 60 * 1000).toISOString();

  await addDoc(collection(db, "appointments"), {
    candidateId: payload.candidateId,
    createdBy: payload.createdBy,
    createdByRole: payload.createdByRole,
    title: "Call appointment",
    startsAt: payload.startsAt,
    endsAt,
    phoneNumber: payload.phoneNumber,
    notes: payload.notes ?? "",
    status: "requested",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  await updateDoc(doc(db, "appointments", appointmentId), {
    status,
    updatedAt: serverTimestamp()
  });
}

// Backward-compatible aliases for existing imports during transition.
export const watchAppointments = watchCandidateAppointments;

export async function createAppointment(payload: {
  candidateId: string;
  createdBy: string;
  createdByRole: "candidate" | "admin";
  title: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  phoneNumber?: string;
}) {
  await addDoc(collection(db, "appointments"), {
    ...payload,
    phoneNumber: payload.phoneNumber ?? "",
    status: "scheduled",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
