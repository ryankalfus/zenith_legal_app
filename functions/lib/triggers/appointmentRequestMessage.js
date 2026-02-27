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
function formatAppointmentDateTime(startsAtInput) {
    const startsAt = String(startsAtInput ?? "").trim();
    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) {
        return startsAt || "an unknown date/time";
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
    });
    return `${dateText} at ${timeText}`;
}
function formatAppointmentMessage(input) {
    const candidateName = String(input.candidateName ?? "").trim() || "Candidate";
    const recruiterName = String(input.recruiterName ?? "").trim();
    const recruiterSuffix = recruiterName ? ` Recruiter: ${recruiterName}.` : "";
    const note = String(input.notes ?? "").trim();
    const noteSuffix = note ? ` Note: ${note}` : "";
    return `${candidateName} has requested an appointment on ${formatAppointmentDateTime(input.startsAt)}.${recruiterSuffix}${noteSuffix}`;
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
    const candidateDoc = await db.collection("users").doc(candidateId).get();
    const candidateName = String(candidateDoc.data()?.fullName ?? "Candidate");
    const text = formatAppointmentMessage({
        candidateName,
        startsAt: appointment.startsAt,
        recruiterName: appointment.recruiterName,
        notes: appointment.notes
    });
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
