import { deleteField, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";

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

export async function uploadCandidateProfilePhoto(
  uid: string,
  file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }
) {
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const path = `profilePhotos/${uid}/avatar/${Date.now()}-${file.fileName}`;
  const photoRef = ref(storage, path);
  await uploadBytes(photoRef, blob, { contentType: file.mimeType });
  const avatarUrl = await getDownloadURL(photoRef);

  await updateDoc(doc(db, "users", uid), {
    avatarUrl,
    avatarPath: path,
    updatedAt: serverTimestamp()
  });

  return { avatarUrl, avatarPath: path };
}

export async function removeCandidateProfilePhoto(uid: string, avatarPath?: string) {
  if (avatarPath) {
    await deleteObject(ref(storage, avatarPath)).catch(() => undefined);
  }

  await updateDoc(doc(db, "users", uid), {
    avatarUrl: deleteField(),
    avatarPath: deleteField(),
    updatedAt: serverTimestamp()
  });
}

export async function clearCandidateAppointmentUpdates(uid: string) {
  await updateDoc(doc(db, "users", uid), {
    hasAppointmentUpdates: false,
    updatedAt: serverTimestamp()
  });
}
