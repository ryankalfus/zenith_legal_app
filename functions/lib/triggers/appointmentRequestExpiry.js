"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoCancelExpiredAppointmentRequests = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
exports.autoCancelExpiredAppointmentRequests = (0, scheduler_1.onSchedule)("every 15 minutes", async () => {
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
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            autoCanceledReason: "expired_requested_time"
        });
    });
    await batch.commit();
    firebase_functions_1.logger.info("Auto-canceled expired requested appointments", { count: snapshot.size });
});
