"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flagCandidateAppointmentUpdates = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
exports.flagCandidateAppointmentUpdates = (0, firestore_1.onDocumentWritten)("appointments/{appointmentId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) {
        return;
    }
    const actor = String(after.updatedByRole ?? "");
    const statusChanged = before?.status !== after.status;
    const detailsChanged = before?.startsAt !== after.startsAt ||
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
    await db.collection("users").doc(candidateId).set({
        hasAppointmentUpdates: true,
        updatedAt: firestore_2.FieldValue.serverTimestamp()
    }, { merge: true });
});
