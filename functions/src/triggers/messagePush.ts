import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sendExpoPush } from "../utils/push";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export const sendPushOnMessageCreate = onDocumentCreated(
  "conversations/{candidateId}/messages/{messageId}",
  async (event) => {
    const candidateId = event.params.candidateId;
    const message = event.data?.data();

    if (!message || message.senderRole !== "admin") {
      return;
    }

    const userDoc = await db.collection("users").doc(candidateId).get();
    if (!userDoc.exists) {
      logger.warn("No user for candidateId", candidateId);
      return;
    }

    const pushTokens = (userDoc.data()?.pushTokens ?? []) as string[];

    await sendExpoPush(pushTokens, {
      title: "New message from Zenith Legal",
      body: message.text ? String(message.text).slice(0, 140) : "You have a new message",
      data: { candidateId, type: "message" }
    });
  }
);
