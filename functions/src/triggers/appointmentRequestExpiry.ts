import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export const autoCancelExpiredAppointmentRequests = onSchedule("every 15 minutes", async () => {
  const nowIso = new Date().toISOString();
  const snapshot = await db
    .collection("appointments")
    .where("status", "==", "requested")
    .where("startsAt", "<=", nowIso)
    .limit(300)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((entry) => {
    batch.update(entry.ref, {
      status: "canceled",
      updatedBy: "system",
      updatedByRole: "system",
      updatedAt: FieldValue.serverTimestamp(),
      autoCanceledReason: "expired_requested_time"
    });
  });

  await batch.commit();
  logger.info("Auto-canceled expired requested appointments", { count: snapshot.size });
});
