"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidateScopedData = deleteCandidateScopedData;
exports.deleteUserAccountAndData = deleteUserAccountAndData;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
const DELETE_BATCH_LIMIT = 400;
async function deleteDocBatch(docRefs) {
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
async function deleteQueryDocs(collectionName, field, value) {
    const snapshot = await db.collection(collectionName).where(field, "==", value).get();
    await deleteDocBatch(snapshot.docs.map((entry) => entry.ref));
}
async function deleteConversation(candidateId) {
    const conversationRef = db.collection("conversations").doc(candidateId);
    const conversationSnapshot = await conversationRef.get();
    if (!conversationSnapshot.exists) {
        return;
    }
    const messagesSnapshot = await conversationRef.collection("messages").get();
    await deleteDocBatch(messagesSnapshot.docs.map((entry) => entry.ref));
    await conversationRef.delete();
}
async function deleteConversationByCandidateQuery(candidateId) {
    const snapshot = await db.collection("conversations").where("candidateId", "==", candidateId).get();
    for (const entry of snapshot.docs) {
        const messagesSnapshot = await entry.ref.collection("messages").get();
        await deleteDocBatch(messagesSnapshot.docs.map((message) => message.ref));
        await entry.ref.delete();
    }
}
async function deleteStoragePrefixes(uid) {
    const bucket = (0, storage_1.getStorage)().bucket();
    await Promise.all([
        bucket.deleteFiles({ prefix: `messageAttachments/${uid}/` }).catch(() => undefined),
        bucket.deleteFiles({ prefix: `profilePhotos/${uid}/` }).catch(() => undefined)
    ]);
}
async function deleteCandidateScopedData(uid) {
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
async function deleteUserAccountAndData(uid) {
    await deleteCandidateScopedData(uid);
    await db.collection("users").doc(uid).delete().catch(() => undefined);
    await auth.deleteUser(uid);
}
