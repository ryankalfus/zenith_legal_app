import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

async function deleteQueryDocs(collectionName: string, field: string, value: string) {
  const snapshot = await db.collection(collectionName).where(field, "==", value).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function deleteConversation(candidateId: string) {
  const messageSnapshot = await db.collection("conversations").doc(candidateId).collection("messages").get();
  const batch = db.batch();
  messageSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection("conversations").doc(candidateId));
  await batch.commit();
}

async function deleteMessageAttachments(candidateId: string) {
  const bucket = getStorage().bucket();
  await bucket.deleteFiles({ prefix: `messageAttachments/${candidateId}/` }).catch(() => undefined);
}

export const deleteCandidateAccountData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign-in required.");
  }

  const deletionRef = db.collection("deletionRequests").doc();
  await deletionRef.set({
    candidateId: uid,
    requestedBy: uid,
    requestedAt: FieldValue.serverTimestamp(),
    status: "processing"
  });

  try {
    await deleteConversation(uid);
    await deleteQueryDocs("candidateFirmStatuses", "candidateId", uid);
    await deleteQueryDocs("authorizationRequests", "candidateId", uid);
    await deleteQueryDocs("appointments", "candidateId", uid);
    await deleteMessageAttachments(uid);
    await db.collection("users").doc(uid).delete();
    await auth.deleteUser(uid);

    await deletionRef.update({
      status: "completed",
      completedAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    await deletionRef.update({
      status: "failed",
      completedAt: FieldValue.serverTimestamp(),
      errorMessage: error?.message ?? "Unknown deletion error"
    });
    throw new HttpsError("internal", "Could not delete account data.");
  }
});
