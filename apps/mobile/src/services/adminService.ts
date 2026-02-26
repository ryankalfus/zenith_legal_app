import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export type CandidateRow = {
  id: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  avatarUrl?: string;
  avatarPath?: string;
  hasAppointmentUpdates?: boolean;
  preferences?: {
    preferredCities?: string[];
    practiceArea?: string;
  };
};

export type FirmRow = {
  id: string;
  name: string;
};

export function watchCandidates(onData: (rows: CandidateRow[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, "users"), where("role", "==", "candidate"), orderBy("fullName", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CandidateRow, "id">) })));
    },
    (error) => onError(error as Error)
  );
}

export function watchCandidateById(
  candidateId: string,
  onData: (row: CandidateRow | null) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    doc(db, "users", candidateId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({ id: snapshot.id, ...(snapshot.data() as Omit<CandidateRow, "id">) });
    },
    (error) => onError(error as Error)
  );
}

export function watchFirms(onData: (rows: FirmRow[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, "firms"), orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => {
          const data = entry.data();
          return { id: entry.id, name: String(data.name ?? entry.id) };
        })
      );
    },
    (error) => onError(error as Error)
  );
}
