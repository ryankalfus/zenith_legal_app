"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncConversationMetaOnMessageCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
exports.syncConversationMetaOnMessageCreate = (0, firestore_1.onDocumentCreated)("conversations/{candidateId}/messages/{messageId}", async (event) => {
    const candidateId = String(event.params.candidateId ?? "").trim();
    const message = event.data?.data();
    if (!candidateId || !message) {
        return;
    }
    const candidateDoc = await db.collection("users").doc(candidateId).get();
    const candidateData = candidateDoc.data() ?? {};
    const senderRole = message.senderRole === "admin" || message.senderRole === "system" ? message.senderRole : "candidate";
    const text = String(message.text ?? "").trim() || "(attachment)";
    await db.collection("conversations").doc(candidateId).set({
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        candidateNameSnapshot: String(candidateData.fullName ?? "Candidate"),
        candidateAvatarUrlSnapshot: String(candidateData.avatarUrl ?? ""),
        lastMessageText: text,
        lastMessageAt: firestore_2.FieldValue.serverTimestamp(),
        lastMessageSenderRole: senderRole,
        unreadByAdminCount: senderRole === "candidate" ? firestore_2.FieldValue.increment(1) : firestore_2.FieldValue.increment(0),
        unreadByCandidateCount: senderRole === "admin" || senderRole === "system"
            ? firestore_2.FieldValue.increment(1)
            : firestore_2.FieldValue.increment(0),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
        createdAt: firestore_2.FieldValue.serverTimestamp()
    }, { merge: true });
});
