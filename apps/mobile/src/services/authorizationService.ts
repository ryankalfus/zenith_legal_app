import {
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

export function watchPendingAuthorizations(
  candidateId: string,
  onData: (rows: any[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "authorizationRequests"),
    where("candidateId", "==", candidateId),
    where("state", "==", "pending"),
    orderBy("requestedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((row) => ({ id: row.id, ...row.data() }))),
    (err) => onError(err as Error)
  );
}

export async function respondToAuthorization(requestId: string, state: "approved" | "declined") {
  await updateDoc(doc(db, "authorizationRequests", requestId), {
    state,
    respondedAt: serverTimestamp()
  });
}
