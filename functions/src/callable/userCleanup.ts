import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

const DELETE_BATCH_LIMIT = 400;

async function deleteDocBatch(docRefs: FirebaseFirestore.DocumentReference[]) {
  if (!docRefs.length) {
    return;
  }

  for (let index = 0; index < docRefs.length; index += DELETE_BATCH_LIMIT) {
    const slice = docRefs.slice(index, index + DELETE_BATCH_LIMIT);
    const batch = db.batch();
    slice.forEach((entry) => batch.delete(entry));
    await batch.commit();
  }
}

async function deleteQueryDocs(collectionName: string, field: string, value: string) {
  const snapshot = await db.collection(collectionName).where(field, "==", value).get();
  await deleteDocBatch(snapshot.docs.map((entry) => entry.ref));
}

async function deleteConversation(candidateId: string) {
  const conversationRef = db.collection("conversations").doc(candidateId);
  const conversationSnapshot = await conversationRef.get();
  if (!conversationSnapshot.exists) {
    return;
  }

  const messagesSnapshot = await conversationRef.collection("messages").get();
  await deleteDocBatch(messagesSnapshot.docs.map((entry) => entry.ref));
  await conversationRef.delete();
}

async function deleteConversationByCandidateQuery(candidateId: string) {
  const snapshot = await db.collection("conversations").where("candidateId", "==", candidateId).get();
  for (const entry of snapshot.docs) {
    const messagesSnapshot = await entry.ref.collection("messages").get();
    await deleteDocBatch(messagesSnapshot.docs.map((message) => message.ref));
    await entry.ref.delete();
  }
}

async function deleteStoragePrefixes(uid: string) {
  const bucket = getStorage().bucket();
  await Promise.all([
    bucket.deleteFiles({ prefix: `messageAttachments/${uid}/` }).catch(() => undefined),
    bucket.deleteFiles({ prefix: `profilePhotos/${uid}/` }).catch(() => undefined)
  ]);
}

export async function deleteCandidateScopedData(uid: string) {
  await Promise.all([
    deleteConversation(uid),
    deleteConversationByCandidateQuery(uid),
    deleteQueryDocs("candidateFirmStatuses", "candidateId", uid),
    deleteQueryDocs("authorizationRequests", "candidateId", uid),
    deleteQueryDocs("appointments", "candidateId", uid),
    deleteQueryDocs("candidateStatusRequests", "candidateId", uid),
    deleteQueryDocs("deletionRequests", "candidateId", uid)
  ]);

  await deleteStoragePrefixes(uid);
}

export async function deleteUserAccountAndData(uid: string) {
  await deleteCandidateScopedData(uid);
  await db.collection("users").doc(uid).delete().catch(() => undefined);
  await auth.deleteUser(uid);
}
