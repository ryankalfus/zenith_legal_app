"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSignupSummaryEmail = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const env_1 = require("../config/env");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
function asText(value) {
    return String(value ?? "").trim();
}
function isProfileComplete(input) {
    if (!input || input.role !== "candidate") {
        return false;
    }
    return (asText(input.fullName).length > 0 &&
        asText(input.email).length > 0 &&
        asText(input.mobile).length > 0 &&
        asText(input.preferences?.practiceArea).length > 0);
}
function formatCreatedAt(input) {
    if (input instanceof firestore_2.Timestamp) {
        return input.toDate().toISOString();
    }
    if (typeof input === "string" && input.trim()) {
        return input;
    }
    return "n/a";
}
exports.sendSignupSummaryEmail = (0, firestore_1.onDocumentWritten)("users/{uid}", async (event) => {
    const uid = event.params.uid;
    const after = event.data?.after.data();
    const before = event.data?.before.data();
    const afterRef = event.data?.after.ref;
    if (!after || !afterRef) {
        return;
    }
    if (after.signupSummarySentAt) {
        return;
    }
    const completedNow = isProfileComplete(after);
    const completedBefore = isProfileComplete(before);
    if (!completedNow || completedBefore) {
        return;
    }
    const dispatchId = `${event.id}_signup_summary`;
    const dispatchRef = db.collection("_internalEmailDispatches").doc(dispatchId);
    const shouldSend = await db.runTransaction(async (txn) => {
        const dispatchSnapshot = await txn.get(dispatchRef);
        const userSnapshot = await txn.get(afterRef);
        const userData = userSnapshot.data();
        if (dispatchSnapshot.exists || userData?.signupSummarySentAt) {
            return false;
        }
        txn.set(dispatchRef, {
            type: "signup_summary",
            uid,
            createdAt: firestore_2.FieldValue.serverTimestamp()
        });
        return true;
    });
    if (!shouldSend) {
        return;
    }
    const { apiKey, from, to } = (0, env_1.getSignupAlertConfig)();
    if (!apiKey) {
        firebase_functions_1.logger.warn("Signup summary email skipped: RESEND_API_KEY missing.", { uid });
        return;
    }
    const preferredCities = Array.isArray(after.preferences?.preferredCities)
        ? after.preferences?.preferredCities.join(", ")
        : "";
    const subject = `New Zenith applicant signup: ${asText(after.fullName) || uid}`;
    const text = [
        "A new applicant completed signup/profile.",
        "",
        `Name: ${asText(after.fullName) || "n/a"}`,
        `Email: ${asText(after.email) || "n/a"}`,
        `Mobile: ${asText(after.mobile) || "n/a"}`,
        `Preferred Cities: ${preferredCities || "n/a"}`,
        `Practice Area: ${asText(after.preferences?.practiceArea) || "n/a"}`,
        `UID: ${uid}`,
        `Created At: ${formatCreatedAt(after.createdAt)}`
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
        await afterRef.set({
            signupSummarySentAt: firestore_2.FieldValue.serverTimestamp(),
            updatedAt: firestore_2.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    catch (error) {
        firebase_functions_1.logger.error("Signup summary email failed", {
            uid,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
