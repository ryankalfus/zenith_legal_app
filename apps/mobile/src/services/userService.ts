import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function watchUser(uid: string, onData: (data: any) => void, onError: (err: Error) => void) {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      onData(snapshot.data());
    },
    (err) => onError(err as Error)
  );
}

export async function updatePreferences(
  uid: string,
  payload: {
    preferredCities: string[];
    practiceArea: string;
  }
) {
  await updateDoc(doc(db, "users", uid), {
    preferences: payload
  });
}
