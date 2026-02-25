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
import { db } from "../lib/firebase";

export function watchAppointments(
  candidateId: string,
  onData: (rows: any[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "appointments"),
    where("candidateId", "==", candidateId),
    orderBy("startsAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((row) => ({ id: row.id, ...row.data() }))),
    (err) => onError(err as Error)
  );
}

export async function createAppointment(payload: {
  candidateId: string;
  createdBy: string;
  createdByRole: "candidate" | "admin";
  title: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  location?: string;
  meetingLink?: string;
}) {
  await addDoc(collection(db, "appointments"), {
    ...payload,
    status: "scheduled",
    reminderMinutesBefore: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateAppointmentStatus(appointmentId: string, status: "scheduled" | "canceled") {
  await updateDoc(doc(db, "appointments", appointmentId), {
    status,
    updatedAt: serverTimestamp()
  });
}
