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
    const pushTokens = (userDoc.data()?.pushTokens ?? []);
    await (0, push_1.sendExpoPush)(pushTokens, {
        title: "Appointment update",
        body: `${after.title} (${after.status})`,
        data: { candidateId: after.candidateId, type: "appointment" }
    });
});
