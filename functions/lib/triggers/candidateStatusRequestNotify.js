"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOnCandidateStatusRequestCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const env_1 = require("../config/env");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
exports.notifyOnCandidateStatusRequestCreate = (0, firestore_1.onDocumentCreated)("candidateStatusRequests/{requestId}", async (event) => {
    const payload = event.data?.data();
    if (!payload || payload.state !== "pending") {
        return;
    }
    const candidateId = String(payload.candidateId ?? "").trim();
    const firmId = String(payload.firmId ?? "").trim();
    const requestType = payload.requestType === "cancellation" ? "cancellation" : "authorization";
    if (!candidateId || !firmId) {
        firebase_functions_1.logger.warn("candidateStatusRequests missing candidateId or firmId", {
            requestId: event.params.requestId
        });
        return;
    }
    const [candidateDoc, firmDoc] = await Promise.all([
        db.collection("users").doc(candidateId).get(),
        db.collection("firms").doc(firmId).get()
    ]);
    const candidateName = String(candidateDoc.data()?.fullName ?? "Candidate").trim();
    const candidateEmail = String(candidateDoc.data()?.email ?? "").trim();
    const firmName = String(firmDoc.data()?.name ?? firmId).trim();
    const actionText = requestType === "authorization"
        ? "requested authorization to contact/submit"
        : "requested cancellation";
    const dmText = requestType === "authorization"
        ? `STATUS REQUEST... Authorization requested for ${firmName}`
        : `STATUS REQUEST... Cancellation requested for ${firmName}`;
    const conversationRef = db.collection("conversations").doc(candidateId);
    await conversationRef.set({
        candidateId,
        participantIds: [candidateId, "zenith-team"],
        lastMessageText: dmText,
        lastMessageAt: firestore_2.FieldValue.serverTimestamp(),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
        createdAt: firestore_2.FieldValue.serverTimestamp()
    }, { merge: true });
    await conversationRef.collection("messages").add({
        candidateId,
        senderId: candidateId,
        senderRole: "candidate",
        text: dmText,
        attachments: [],
        createdAt: firestore_2.FieldValue.serverTimestamp()
    });
    const { apiKey, from, to } = (0, env_1.getSignupAlertConfig)();
    if (!apiKey) {
        firebase_functions_1.logger.warn("Status request email skipped: RESEND_API_KEY missing.", {
            requestId: event.params.requestId
        });
        return;
    }
    const subject = `Candidate status request: ${candidateName}`;
    const text = [
        "A candidate submitted a status request.",
        "",
        `Candidate: ${candidateName}`,
        `Candidate Email: ${candidateEmail || "n/a"}`,
        `Firm: ${firmName}`,
        `Request Type: ${requestType}`,
        `Action: ${actionText}`,
        `Candidate UID: ${candidateId}`,
        `Request ID: ${event.params.requestId}`
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
    }
    catch (error) {
        firebase_functions_1.logger.error("Status request email failed", {
            requestId: event.params.requestId,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
