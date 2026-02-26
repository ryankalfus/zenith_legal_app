import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { CandidateFirmStatus } from "@zenith/shared";
import { db } from "../lib/firebase";

export type CandidateFirmStatusRow = {
  id: string;
  candidateId: string;
  firmId: string;
  status: CandidateFirmStatus;
  updatedBy?: string;
  updatedAt?: unknown;
};

function asSortMs(input: unknown) {
  if (!input) {
    return 0;
  }
  if (typeof input === "number") {
    return input;
  }
  if (typeof input === "string") {
    const ms = Date.parse(input);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof input === "object" && input && "toDate" in input && typeof (input as any).toDate === "function") {
    try {
      return (input as any).toDate().getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}

export function watchCandidateStatuses(
  candidateId: string,
  onData: (rows: CandidateFirmStatusRow[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, "candidateFirmStatuses"), where("candidateId", "==", candidateId));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CandidateFirmStatusRow, "id">) }));
      rows.sort((a, b) => asSortMs(b.updatedAt) - asSortMs(a.updatedAt));
      onData(rows);
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminCandidateStatuses(
  candidateId: string,
  onData: (rows: CandidateFirmStatusRow[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, "candidateFirmStatuses"), where("candidateId", "==", candidateId));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CandidateFirmStatusRow, "id">) }));
      rows.sort((a, b) => asSortMs(b.updatedAt) - asSortMs(a.updatedAt));
      onData(rows);
    },
    (err) => onError(err as Error)
  );
}

export async function saveCandidateFirmStatus(input: {
  candidateId: string;
  firmId: string;
  status: CandidateFirmStatus;
  adminUid: string;
}) {
  const statusId = `${input.candidateId}_${input.firmId}`;

  await setDoc(
    doc(db, "candidateFirmStatuses", statusId),
    {
      candidateId: input.candidateId,
      firmId: input.firmId,
      status: input.status,
      updatedBy: input.adminUid,
      updatedAt: serverTimestamp(),
      history: arrayUnion({
        status: input.status,
        updatedBy: input.adminUid,
        updatedAt: new Date().toISOString()
      })
    },
    { merge: true }
  );

  const saved = await getDoc(doc(db, "candidateFirmStatuses", statusId));
  if (!saved.exists()) {
    throw new Error("Firm assignment did not persist.");
  }
}

export async function updateCandidateFirmStatus(input: {
  statusRecordId: string;
  status: CandidateFirmStatus;
  adminUid: string;
}) {
  await updateDoc(doc(db, "candidateFirmStatuses", input.statusRecordId), {
    status: input.status,
    updatedBy: input.adminUid,
    updatedAt: serverTimestamp(),
    history: arrayUnion({
      status: input.status,
      updatedBy: input.adminUid,
      updatedAt: new Date().toISOString()
    })
  });
}
