"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAppointmentRequestMessage = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
function formatAppointmentMessage(startsAtInput, phoneInput) {
    const phoneNumber = String(phoneInput ?? "").trim();
    const startsAt = String(startsAtInput ?? "").trim();
    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) {
        return `APPOINTMENT REQUESTED... ${startsAt || "n/a"}... n/a... ${phoneNumber || "n/a"}`;
    }
    const dateText = startsAtDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
    });
    const timeText = startsAtDate
        .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    })
        .toLowerCase();
    return `APPOINTMENT REQUESTED... ${dateText}... ${timeText}... ${phoneNumber || "n/a"}`;
}
exports.syncAppointmentRequestMessage = (0, firestore_1.onDocumentCreated)("appointments/{appointmentId}", async (event) => {
    const appointment = event.data?.data();
    if (!appointment || appointment.status !== "requested") {
        return;
    }
    const candidateId = String(appointment.candidateId ?? "").trim();
    if (!candidateId) {
        firebase_functions_1.logger.warn("Appointment request missing candidateId", {
            appointmentId: event.params.appointmentId
        });
        return;
    }
    const text = formatAppointmentMessage(appointment.startsAt, appointment.phoneNumber);
    const conversationRef = db.collection("conversations").doc(candidateId);
    await conversationRef.set({
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        lastMessageText: text,
        lastMessageAt: firestore_2.FieldValue.serverTimestamp(),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
        createdAt: firestore_2.FieldValue.serverTimestamp()
    }, { merge: true });
    await conversationRef.collection("messages").add({
        candidateId,
        senderId: candidateId,
        senderRole: "candidate",
        text,
        attachments: [],
        createdAt: firestore_2.FieldValue.serverTimestamp()
    });
});
