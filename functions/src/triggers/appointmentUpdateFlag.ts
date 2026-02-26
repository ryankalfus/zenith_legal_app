import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export const flagCandidateAppointmentUpdates = onDocumentWritten(
  "appointments/{appointmentId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) {
      return;
    }

    const actor = String(after.updatedByRole ?? "");
    const statusChanged = before?.status !== after.status;
    const detailsChanged =
      before?.startsAt !== after.startsAt ||
      before?.endsAt !== after.endsAt ||
      before?.phoneNumber !== after.phoneNumber ||
      before?.notes !== after.notes;

    if (!(actor === "admin" || actor === "system")) {
      return;
    }
    if (!statusChanged && !detailsChanged) {
      return;
    }

    const candidateId = String(after.candidateId ?? "").trim();
    if (!candidateId) {
      return;
    }

    await db.collection("users").doc(candidateId).set(
      {
        hasAppointmentUpdates: true,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }
);
