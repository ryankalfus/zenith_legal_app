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

export type CandidateStatusRequestRecord = {
  id: string;
  candidateId: string;
  firmId: string;
  requestType: "authorization" | "cancellation";
  state: "pending" | "resolved";
  requestedAt?: unknown;
  resolvedAt?: unknown;
  resolvedBy?: string;
};

export function watchPendingCandidateStatusRequests(
  candidateId: string,
  onData: (rows: CandidateStatusRequestRecord[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    collection(db, "candidateStatusRequests"),
    where("candidateId", "==", candidateId),
    where("state", "==", "pending"),
    orderBy("requestedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<CandidateStatusRequestRecord, "id">)
        }))
      );
    },
    (error) => onError(error as Error)
  );
}

export function watchAdminPendingCandidateStatusRequests(
  candidateId: string,
  onData: (rows: CandidateStatusRequestRecord[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    collection(db, "candidateStatusRequests"),
    where("candidateId", "==", candidateId),
    orderBy("requestedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<CandidateStatusRequestRecord, "id">)
        }))
      );
    },
    (error) => onError(error as Error)
  );
}

export async function createCandidateStatusRequest(input: {
  candidateId: string;
  firmId: string;
  requestType: "authorization" | "cancellation";
}) {
  await addDoc(collection(db, "candidateStatusRequests"), {
    candidateId: input.candidateId,
    firmId: input.firmId,
    requestType: input.requestType,
    state: "pending",
    requestedAt: serverTimestamp()
  });
}

export async function resolveCandidateStatusRequest(requestId: string, resolvedBy: string) {
  await updateDoc(doc(db, "candidateStatusRequests", requestId), {
    state: "resolved",
    resolvedBy,
    resolvedAt: serverTimestamp()
  });
}
