import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
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
    preferences: payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateCandidateProfile(
  uid: string,
  payload: {
    fullName: string;
    mobile: string;
    preferredCities: string[];
    practiceArea: string;
  }
) {
  await updateDoc(doc(db, "users", uid), {
    fullName: payload.fullName,
    mobile: payload.mobile,
    preferences: {
      preferredCities: payload.preferredCities,
      practiceArea: payload.practiceArea
    },
    updatedAt: serverTimestamp()
  });
}
