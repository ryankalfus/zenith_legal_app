"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushOnAppointmentChange = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const push_1 = require("../utils/push");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
exports.sendPushOnAppointmentChange = (0, firestore_1.onDocumentWritten)("appointments/{appointmentId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) {
        return;
    }
    const statusChanged = before?.status !== after.status;
    const detailsChanged = before?.startsAt !== after.startsAt ||
        before?.endsAt !== after.endsAt ||
        before?.phoneNumber !== after.phoneNumber ||
        before?.recruiterId !== after.recruiterId ||
        before?.recruiterName !== after.recruiterName ||
        before?.notes !== after.notes;
    // Candidate-created request events are handled by appointmentRequestMessage trigger.
    if (after.status === "requested") {
        return;
    }
    // Push only when admin is the actor and either status/details changed.
    if (after.updatedByRole !== "admin" || (!statusChanged && !detailsChanged)) {
        return;
    }
    const userDoc = await db.collection("users").doc(after.candidateId).get();
    if (!userDoc.exists) {
        return;
    }
    const pushTokens = (userDoc.data()?.pushTokens ?? []);
    await (0, push_1.sendExpoPush)(pushTokens, {
        title: "Appointment update",
        body: `${String(after.title ?? "Appointment")} (${after.status})`,
        data: { candidateId: after.candidateId, type: "appointment" }
    });
});
