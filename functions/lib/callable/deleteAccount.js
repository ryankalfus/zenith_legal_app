"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidateAccountData = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
async function deleteQueryDocs(collectionName, field, value) {
    const snapshot = await db.collection(collectionName).where(field, "==", value).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
}
async function deleteConversation(candidateId) {
    const messageSnapshot = await db.collection("conversations").doc(candidateId).collection("messages").get();
    const batch = db.batch();
    messageSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(db.collection("conversations").doc(candidateId));
    await batch.commit();
}
async function deleteMessageAttachments(candidateId) {
    const bucket = (0, storage_1.getStorage)().bucket();
    await bucket.deleteFiles({ prefix: `messageAttachments/${candidateId}/` }).catch(() => undefined);
}
exports.deleteCandidateAccountData = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required.");
    }
    const deletionRef = db.collection("deletionRequests").doc();
    await deletionRef.set({
        candidateId: uid,
        requestedBy: uid,
        requestedAt: firestore_1.FieldValue.serverTimestamp(),
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
            completedAt: firestore_1.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        await deletionRef.update({
            status: "failed",
            completedAt: firestore_1.FieldValue.serverTimestamp(),
            errorMessage: error?.message ?? "Unknown deletion error"
        });
        throw new https_1.HttpsError("internal", "Could not delete account data.");
    }
});
