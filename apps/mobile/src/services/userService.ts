import { deleteField, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  verifyBeforeUpdateEmail
} from "firebase/auth";
import { auth, db, storage } from "../lib/firebase";

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
    dateOfBirth?: string;
    jdDegreeDate?: string;
  }
) {
  await updateDoc(doc(db, "users", uid), {
    fullName: payload.fullName,
    mobile: payload.mobile,
    dateOfBirth: payload.dateOfBirth || deleteField(),
    jdDegreeDate: payload.jdDegreeDate || deleteField(),
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

  const safeName = file.fileName.replace(/[^\w.-]+/g, "_");
  const stampedName = `${Date.now()}-${safeName}`;
  const primaryPath = `profilePhotos/${uid}/avatar/${stampedName}`;
  const fallbackPath = `messageAttachments/${uid}/profile/${stampedName}`;

  let savedPath = primaryPath;
  let photoRef = ref(storage, primaryPath);

  try {
    await uploadBytes(photoRef, blob, { contentType: file.mimeType });
  } catch (error: any) {
    const code = String(error?.code ?? "");
    if (code !== "storage/unauthorized") {
      throw error;
    }
    // Backward-compatible fallback for projects still running older Storage rules.
    savedPath = fallbackPath;
    photoRef = ref(storage, fallbackPath);
    await uploadBytes(photoRef, blob, { contentType: file.mimeType });
  }

  const avatarUrl = await getDownloadURL(photoRef);

  await updateDoc(doc(db, "users", uid), {
    avatarUrl,
    avatarPath: savedPath,
    updatedAt: serverTimestamp()
  });

  return { avatarUrl, avatarPath: savedPath };
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

export async function changeMyEmailWithPassword(input: {
  oldEmail: string;
  newEmail: string;
  currentPassword: string;
}): Promise<{ mode: "updated" | "verify_pending" }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user.");
  }

  const oldEmail = input.oldEmail.trim().toLowerCase();
  const newEmail = input.newEmail.trim().toLowerCase();
  const currentEmail = String(user.email ?? "").trim().toLowerCase();
  const currentPassword = input.currentPassword.trim();

  if (!oldEmail || !newEmail || !currentPassword) {
    throw new Error("Old email, new email, and current password are required.");
  }
  if (oldEmail !== currentEmail) {
    throw new Error("Old email does not match your signed-in account email.");
  }

  const credential = EmailAuthProvider.credential(oldEmail, currentPassword);
  await reauthenticateWithCredential(user, credential);
  try {
    await updateEmail(user, newEmail);
  } catch (error: any) {
    if (String(error?.code ?? "") === "auth/operation-not-allowed") {
      await verifyBeforeUpdateEmail(user, newEmail);
      return { mode: "verify_pending" };
    }
    throw error;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: newEmail,
      emailVerified: Boolean(user.emailVerified),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  return { mode: "updated" };
}

export async function changeMyPasswordWithCurrentPassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user.");
  }

  const email = input.email.trim().toLowerCase();
  const currentPassword = input.currentPassword.trim();
  const newPassword = input.newPassword.trim();

  if (!email || !currentPassword || !newPassword) {
    throw new Error("Email, current password, and new password are required.");
  }

  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
