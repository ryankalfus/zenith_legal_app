import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  recruiterId: string;
  recruiterName: string;
  notes?: string;
};

function normalizeRecruiter(input: {
  recruiterId?: unknown;
  recruiterName?: unknown;
}): { recruiterId: string; recruiterName: string } {
  const rawId = String(input.recruiterId ?? "").trim();
  const rawName = String(input.recruiterName ?? "").trim();
  if (rawId && rawName) {
    return { recruiterId: rawId, recruiterName: rawName };
  }

  if (rawId) {
    return { recruiterId: rawId, recruiterName: "Recruiter" };
  }
  return { recruiterId: "unknown", recruiterName: rawName || "Recruiter" };
}

function mapAppointmentSnapshot(snapshot: any): AppointmentRow[] {
  return snapshot.docs.map((entry: any) => {
    const data = entry.data() as Record<string, unknown>;
    const recruiter = normalizeRecruiter({
      recruiterId: data.recruiterId,
      recruiterName: data.recruiterName
    });

    return {
      id: entry.id,
      candidateId: String(data.candidateId ?? ""),
      createdBy: String(data.createdBy ?? ""),
      createdByRole: String(data.createdByRole ?? "candidate") as "candidate" | "admin",
      updatedBy: String(data.updatedBy ?? ""),
      updatedByRole: String(data.updatedByRole ?? "") as "candidate" | "admin" | "system",
      status: String(data.status ?? "requested") as AppointmentStatus,
      title: String(data.title ?? "Call appointment"),
      startsAt: String(data.startsAt ?? ""),
      endsAt: String(data.endsAt ?? ""),
      phoneNumber: String(data.phoneNumber ?? ""),
      recruiterId: recruiter.recruiterId,
      recruiterName: recruiter.recruiterName,
      notes: String(data.notes ?? "")
    };
  });
}

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
      onData(mapAppointmentSnapshot(snapshot));
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminAppointmentRequests(
  onData: (rows: AppointmentRow[]) => void,
  onError: (err: Error) => void
) {
  // Keep this admin stream index-safe and deterministic, then split into sections in UI.
  const q = query(collection(db, "appointments"), orderBy("startsAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(mapAppointmentSnapshot(snapshot));
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminUnattendedRequests(
  onData: (rows: AppointmentRow[]) => void,
  onError: (err: Error) => void
) {
  // Keep this query index-free (status equality only); sort in UI.
  const q = query(collection(db, "appointments"), where("status", "==", "requested"));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(mapAppointmentSnapshot(snapshot));
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
    (snapshot) => onData(snapshot.size),
    (err) => onError(err as Error)
  );
}

export async function createAppointmentRequest(payload: {
  candidateId: string;
  createdBy: string;
  createdByRole: "candidate" | "admin";
  startsAt: string;
  phoneNumber: string;
  recruiterId: string;
  recruiterName: string;
  notes?: string;
}) {
  const recruiter = normalizeRecruiter({
    recruiterId: payload.recruiterId,
    recruiterName: payload.recruiterName
  });
  const created = await addDoc(collection(db, "appointments"), {
    candidateId: payload.candidateId,
    createdBy: payload.createdBy,
    createdByRole: payload.createdByRole,
    updatedBy: payload.createdBy,
    updatedByRole: payload.createdByRole,
    title: "Call appointment",
    startsAt: payload.startsAt,
    endsAt: buildEndsAt(payload.startsAt),
    phoneNumber: payload.phoneNumber,
    recruiterId: recruiter.recruiterId,
    recruiterName: recruiter.recruiterName,
    notes: payload.notes ?? "",
    status: "requested",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const readBack = await getDoc(created);
  if (!readBack.exists()) {
    throw new Error("Appointment request did not persist.");
  }
}

export async function updateAppointmentStatus(input: {
  appointmentId: string;
  status: AppointmentStatus;
  updatedBy: string;
  updatedByRole: "candidate" | "admin";
}) {
  const ref = doc(db, "appointments", input.appointmentId);
  await updateDoc(ref, {
    status: input.status,
    updatedBy: input.updatedBy,
    updatedByRole: input.updatedByRole,
    updatedAt: serverTimestamp()
  });

  const readBack = await getDoc(ref);
  if (!readBack.exists() || String(readBack.data()?.status ?? "") !== input.status) {
    throw new Error("Appointment status update did not persist.");
  }
}

export async function updateAppointmentDetails(input: {
  appointmentId: string;
  startsAt: string;
  phoneNumber: string;
  recruiterId: string;
  recruiterName: string;
  notes?: string;
  updatedBy: string;
  updatedByRole: "candidate" | "admin";
}) {
  const recruiter = normalizeRecruiter({
    recruiterId: input.recruiterId,
    recruiterName: input.recruiterName
  });
  const ref = doc(db, "appointments", input.appointmentId);
  await updateDoc(ref, {
    startsAt: input.startsAt,
    endsAt: buildEndsAt(input.startsAt),
    phoneNumber: input.phoneNumber,
    recruiterId: recruiter.recruiterId,
    recruiterName: recruiter.recruiterName,
    notes: input.notes ?? "",
    updatedBy: input.updatedBy,
    updatedByRole: input.updatedByRole,
    updatedAt: serverTimestamp()
  });

  const readBack = await getDoc(ref);
  if (!readBack.exists()) {
    throw new Error("Appointment edit did not persist.");
  }
}

export async function createAdminAppointment(payload: {
  candidateId: string;
  createdBy: string;
  startsAt: string;
  phoneNumber: string;
  recruiterId: string;
  recruiterName: string;
  notes?: string;
}) {
  const recruiter = normalizeRecruiter({
    recruiterId: payload.recruiterId,
    recruiterName: payload.recruiterName
  });
  const created = await addDoc(collection(db, "appointments"), {
    candidateId: payload.candidateId,
    createdBy: payload.createdBy,
    createdByRole: "admin",
    updatedBy: payload.createdBy,
    updatedByRole: "admin",
    title: "Call appointment",
    startsAt: payload.startsAt,
    endsAt: buildEndsAt(payload.startsAt),
    phoneNumber: payload.phoneNumber,
    recruiterId: recruiter.recruiterId,
    recruiterName: recruiter.recruiterName,
    notes: payload.notes ?? "",
    status: "scheduled",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const readBack = await getDoc(created);
  if (!readBack.exists()) {
    throw new Error("Appointment did not persist.");
  }
}

export async function updateAppointmentStatusLegacy(appointmentId: string, status: AppointmentStatus) {
  await updateDoc(doc(db, "appointments", appointmentId), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function deleteAppointment(appointmentId: string) {
  await deleteDoc(doc(db, "appointments", appointmentId));
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
  recruiterId?: string;
  recruiterName?: string;
}) {
  const recruiter = normalizeRecruiter({
    recruiterId: payload.recruiterId,
    recruiterName: payload.recruiterName
  });
  await addDoc(collection(db, "appointments"), {
    ...payload,
    recruiterId: recruiter.recruiterId,
    recruiterName: recruiter.recruiterName,
    updatedBy: payload.createdBy,
    updatedByRole: payload.createdByRole,
    phoneNumber: payload.phoneNumber ?? "",
    status: "scheduled",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
