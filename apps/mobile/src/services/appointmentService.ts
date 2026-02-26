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
  updatedBy?: string;
  updatedByRole?: "candidate" | "admin" | "system";
  status: AppointmentStatus;
  title: string;
  startsAt: string;
  endsAt: string;
  phoneNumber: string;
  notes?: string;
};

function buildEndsAt(startsAt: string) {
  const startsDate = new Date(startsAt);
  return new Date(startsDate.getTime() + 30 * 60 * 1000).toISOString();
}

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

export function watchAdminUnattendedRequestCount(
  onData: (count: number) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, "appointments"), where("status", "==", "requested"));
  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const count = snapshot.docs.filter((entry) => {
        const startsAt = String(entry.data().startsAt ?? "");
        const value = Date.parse(startsAt);
        return Number.isFinite(value) && value >= now;
      }).length;
      onData(count);
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
  await addDoc(collection(db, "appointments"), {
    candidateId: payload.candidateId,
    createdBy: payload.createdBy,
    createdByRole: payload.createdByRole,
    updatedBy: payload.createdBy,
    updatedByRole: payload.createdByRole,
    title: "Call appointment",
    startsAt: payload.startsAt,
    endsAt: buildEndsAt(payload.startsAt),
    phoneNumber: payload.phoneNumber,
    notes: payload.notes ?? "",
    status: "requested",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateAppointmentStatus(input: {
  appointmentId: string;
  status: AppointmentStatus;
  updatedBy: string;
  updatedByRole: "candidate" | "admin";
}) {
  await updateDoc(doc(db, "appointments", input.appointmentId), {
    status: input.status,
    updatedBy: input.updatedBy,
    updatedByRole: input.updatedByRole,
    updatedAt: serverTimestamp()
  });
}

export async function updateAppointmentDetails(input: {
  appointmentId: string;
  startsAt: string;
  phoneNumber: string;
  notes?: string;
  updatedBy: string;
  updatedByRole: "candidate" | "admin";
}) {
  await updateDoc(doc(db, "appointments", input.appointmentId), {
    startsAt: input.startsAt,
    endsAt: buildEndsAt(input.startsAt),
    phoneNumber: input.phoneNumber,
    notes: input.notes ?? "",
    updatedBy: input.updatedBy,
    updatedByRole: input.updatedByRole,
    updatedAt: serverTimestamp()
  });
}

export async function createAdminAppointment(payload: {
  candidateId: string;
  createdBy: string;
  startsAt: string;
  phoneNumber: string;
  notes?: string;
}) {
  await addDoc(collection(db, "appointments"), {
    candidateId: payload.candidateId,
    createdBy: payload.createdBy,
    createdByRole: "admin",
    updatedBy: payload.createdBy,
    updatedByRole: "admin",
    title: "Call appointment",
    startsAt: payload.startsAt,
    endsAt: buildEndsAt(payload.startsAt),
    phoneNumber: payload.phoneNumber,
    notes: payload.notes ?? "",
    status: "scheduled",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateAppointmentStatusLegacy(appointmentId: string, status: AppointmentStatus) {
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
    updatedBy: payload.createdBy,
    updatedByRole: payload.createdByRole,
    phoneNumber: payload.phoneNumber ?? "",
    status: "scheduled",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
