import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sendExpoPush } from "../utils/push";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export const sendPushOnAppointmentChange = onDocumentWritten(
  "appointments/{appointmentId}",
  async (event) => {
    const after = event.data?.after.data();
    if (!after) {
      return;
    }

    if (after.createdByRole !== "admin") {
      return;
    }

    const userDoc = await db.collection("users").doc(after.candidateId).get();
    if (!userDoc.exists) {
      return;
    }

    const pushTokens = (userDoc.data()?.pushTokens ?? []) as string[];

    await sendExpoPush(pushTokens, {
      title: "Appointment update",
      body: `${after.title} (${after.status})`,
      data: { candidateId: after.candidateId, type: "appointment" }
    });
  }
);
