import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

function formatAppointmentMessage(startsAtInput: unknown, phoneInput: unknown) {
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

export const syncAppointmentRequestMessage = onDocumentCreated(
  "appointments/{appointmentId}",
  async (event) => {
    const appointment = event.data?.data();
    if (!appointment || appointment.status !== "requested") {
      return;
    }

    const candidateId = String(appointment.candidateId ?? "").trim();
    if (!candidateId) {
      logger.warn("Appointment request missing candidateId", {
        appointmentId: event.params.appointmentId
      });
      return;
    }

    const text = formatAppointmentMessage(appointment.startsAt, appointment.phoneNumber);

    const conversationRef = db.collection("conversations").doc(candidateId);
    await conversationRef.set(
      {
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        lastMessageText: text,
        lastMessageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await conversationRef.collection("messages").add({
      candidateId,
      senderId: candidateId,
      senderRole: "candidate",
      text,
      attachments: [],
      createdAt: FieldValue.serverTimestamp()
    });
  }
);
