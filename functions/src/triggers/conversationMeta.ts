import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export const syncConversationMetaOnMessageCreate = onDocumentCreated(
  "conversations/{candidateId}/messages/{messageId}",
  async (event) => {
    const candidateId = String(event.params.candidateId ?? "").trim();
    const message = event.data?.data();
    if (!candidateId || !message) {
      return;
    }

    const candidateDoc = await db.collection("users").doc(candidateId).get();
    const candidateData = candidateDoc.data() ?? {};
    const senderRole =
      message.senderRole === "admin" || message.senderRole === "system" ? message.senderRole : "candidate";
    const text = String(message.text ?? "").trim() || "(attachment)";
    const createdAt = message.createdAt ?? FieldValue.serverTimestamp();
    const handledClient = Boolean(message.metaHandledClient);

    await db.collection("conversations").doc(candidateId).set(
      {
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        candidateNameSnapshot: String(candidateData.fullName ?? "Candidate"),
        candidateAvatarUrlSnapshot: String(candidateData.avatarUrl ?? ""),
        lastMessageText: text,
        lastMessageAt: createdAt,
        lastMessageSenderRole: senderRole,
        unreadByAdminCount:
          handledClient
            ? FieldValue.increment(0)
            : senderRole === "candidate"
              ? FieldValue.increment(1)
              : FieldValue.increment(0),
        unreadByCandidateCount:
          handledClient
            ? FieldValue.increment(0)
            : senderRole === "admin" || senderRole === "system"
              ? FieldValue.increment(1)
              : FieldValue.increment(0),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }
);
