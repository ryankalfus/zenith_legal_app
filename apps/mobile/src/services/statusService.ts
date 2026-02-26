import {
  arrayUnion,
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

export function watchCandidateStatuses(
  candidateId: string,
  onData: (rows: CandidateFirmStatusRow[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "candidateFirmStatuses"),
    where("candidateId", "==", candidateId),
    where("status", "in", ["authorization_pending", "submitted_waiting", "interview", "rejected", "offer"]),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CandidateFirmStatusRow, "id">) })));
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminCandidateStatuses(
  candidateId: string,
  onData: (rows: CandidateFirmStatusRow[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "candidateFirmStatuses"),
    where("candidateId", "==", candidateId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CandidateFirmStatusRow, "id">) })));
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
