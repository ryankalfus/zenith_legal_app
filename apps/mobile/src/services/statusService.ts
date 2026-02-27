import {
  arrayUnion,
  collection,
  deleteDoc,
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

export type CandidateStatusIndex = Record<
  string,
  {
    statuses: CandidateFirmStatus[];
    firmIds: string[];
  }
>;

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

export function watchAllCandidateStatusIndex(
  onData: (index: CandidateStatusIndex) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, "candidateFirmStatuses"));
  return onSnapshot(
    q,
    (snapshot) => {
      const next: CandidateStatusIndex = {};
      snapshot.docs.forEach((entry) => {
        const row = entry.data() as Partial<CandidateFirmStatusRow>;
        const candidateId = String(row.candidateId ?? "").trim();
        const status = row.status as CandidateFirmStatus | undefined;
        const firmId = String(row.firmId ?? "").trim();
        if (!candidateId) {
          return;
        }

        if (!next[candidateId]) {
          next[candidateId] = { statuses: [], firmIds: [] };
        }

        if (status && !next[candidateId].statuses.includes(status)) {
          next[candidateId].statuses.push(status);
        }
        if (firmId && !next[candidateId].firmIds.includes(firmId)) {
          next[candidateId].firmIds.push(firmId);
        }
      });
      onData(next);
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

export async function updateCandidateFirmStatusByCandidate(input: {
  statusRecordId: string;
  status: CandidateFirmStatus;
  candidateUid: string;
}) {
  if (input.status !== "waiting_for_submission" && input.status !== "canceled") {
    throw new Error("Invalid candidate status transition.");
  }

  const statusRef = doc(db, "candidateFirmStatuses", input.statusRecordId);
  const snapshot = await getDoc(statusRef);
  if (!snapshot.exists()) {
    throw new Error("This firm assignment is no longer available.");
  }

  const current = snapshot.data() as Partial<CandidateFirmStatusRow>;
  if (String(current.candidateId ?? "") !== input.candidateUid) {
    throw new Error("You do not have access to change this firm status.");
  }
  if (String(current.status ?? "") !== "authorization_pending") {
    throw new Error("This firm status is no longer waiting on your authorization.");
  }

  await updateDoc(statusRef, {
    status: input.status,
    updatedBy: input.candidateUid,
    updatedAt: serverTimestamp(),
    history: arrayUnion({
      status: input.status,
      updatedBy: input.candidateUid,
      updatedAt: new Date().toISOString()
    })
  });

  const readBack = await getDoc(statusRef);
  if (!readBack.exists() || String(readBack.data()?.status ?? "") !== input.status) {
    throw new Error("Status update did not persist. Please try again.");
  }
}

export async function removeCandidateFirmStatus(statusRecordId: string) {
  await deleteDoc(doc(db, "candidateFirmStatuses", statusRecordId));
}
