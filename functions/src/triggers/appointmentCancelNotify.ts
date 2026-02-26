import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getSignupAlertConfig } from "../config/env";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

function formatCanceledMessage(startsAtInput: unknown, phoneInput: unknown) {
  const phoneNumber = String(phoneInput ?? "").trim();
  const startsAt = String(startsAtInput ?? "").trim();
  const startsAtDate = new Date(startsAt);

  if (Number.isNaN(startsAtDate.getTime())) {
    return `APPOINTMENT CANCELED... ${startsAt || "n/a"}... n/a... ${phoneNumber || "n/a"}`;
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

  return `APPOINTMENT CANCELED... ${dateText}... ${timeText}... ${phoneNumber || "n/a"}`;
}

export const notifyOnCandidateAppointmentCancel = onDocumentWritten(
  "appointments/{appointmentId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) {
      return;
    }

    if (before?.status === "canceled" || after.status !== "canceled" || after.updatedByRole !== "candidate") {
      return;
    }

    const candidateId = String(after.candidateId ?? "").trim();
    if (!candidateId) {
      return;
    }

    const candidateDoc = await db.collection("users").doc(candidateId).get();
    const candidate = candidateDoc.data() ?? {};
    const candidateName = String(candidate.fullName ?? "Candidate");
    const candidateEmail = String(candidate.email ?? "");
    const messageText = formatCanceledMessage(after.startsAt, after.phoneNumber);

    const conversationRef = db.collection("conversations").doc(candidateId);
    await conversationRef.set(
      {
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        lastMessageText: messageText,
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
      text: messageText,
      attachments: [],
      createdAt: FieldValue.serverTimestamp()
    });

    const { apiKey, from, to } = getSignupAlertConfig();
    if (!apiKey) {
      logger.warn("Appointment cancellation email skipped: RESEND_API_KEY missing.", {
        appointmentId: event.params.appointmentId
      });
      return;
    }

    const subject = `Candidate canceled appointment: ${candidateName}`;
    const text = [
      "A candidate canceled an appointment.",
      "",
      `Candidate: ${candidateName}`,
      `Candidate Email: ${candidateEmail || "n/a"}`,
      `Date/Time: ${String(after.startsAt ?? "n/a")}`,
      `Phone: ${String(after.phoneNumber ?? "n/a")}`,
      `Appointment ID: ${event.params.appointmentId}`,
      `Auto chat text: ${messageText}`
    ].join("\n");

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API error: ${response.status} ${body}`);
      }
    } catch (error) {
      logger.error("Appointment cancellation email failed", {
        appointmentId: event.params.appointmentId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
);
