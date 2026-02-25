import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getSignupAlertConfig } from "../config/env";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

type UserDocShape = {
  role?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  preferences?: {
    preferredCities?: string[];
    practiceArea?: string;
  };
  createdAt?: unknown;
  signupSummarySentAt?: unknown;
};

function asText(value: unknown) {
  return String(value ?? "").trim();
}

function isProfileComplete(input: UserDocShape | null | undefined) {
  if (!input || input.role !== "candidate") {
    return false;
  }

  return (
    asText(input.fullName).length > 0 &&
    asText(input.email).length > 0 &&
    asText(input.mobile).length > 0 &&
    asText(input.preferences?.practiceArea).length > 0
  );
}

function formatCreatedAt(input: unknown) {
  if (input instanceof Timestamp) {
    return input.toDate().toISOString();
  }

  if (typeof input === "string" && input.trim()) {
    return input;
  }

  return "n/a";
}

export const sendSignupSummaryEmail = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after.data() as UserDocShape | undefined;
  const before = event.data?.before.data() as UserDocShape | undefined;
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
    const userData = userSnapshot.data() as UserDocShape | undefined;

    if (dispatchSnapshot.exists || userData?.signupSummarySentAt) {
      return false;
    }

    txn.set(dispatchRef, {
      type: "signup_summary",
      uid,
      createdAt: FieldValue.serverTimestamp()
    });

    return true;
  });

  if (!shouldSend) {
    return;
  }

  const { apiKey, from, to } = getSignupAlertConfig();
  if (!apiKey) {
    logger.warn("Signup summary email skipped: RESEND_API_KEY missing.", { uid });
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

    await afterRef.set(
      {
        signupSummarySentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    logger.error("Signup summary email failed", {
      uid,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
