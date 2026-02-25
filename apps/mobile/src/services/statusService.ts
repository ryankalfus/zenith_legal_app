import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function watchCandidateStatuses(
  candidateId: string,
  onData: (rows: any[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "candidateFirmStatuses"),
    where("candidateId", "==", candidateId),
    where("status", "in", [
      "authorization_pending",
      "submitted_waiting",
      "interview",
      "rejected",
      "offer"
    ]),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    (err) => onError(err as Error)
  );
}
