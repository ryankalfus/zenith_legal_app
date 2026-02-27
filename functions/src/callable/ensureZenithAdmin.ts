import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getZenithAdminEmail } from "../config/env";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const db = getFirestore();

const defaultZenithAdminName = "Mason Kalfus";
const defaultZenithAdminPhone = "+12024863535";

export const ensureZenithAdminClaim = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const requesterEmail = String(request.auth.token.email ?? "").trim().toLowerCase();
  const allowedAdminEmail = getZenithAdminEmail();

  if (!requesterEmail || requesterEmail !== allowedAdminEmail) {
    throw new HttpsError("permission-denied", "Only the Zenith Legal owner account can use this action.");
  }

  const uid = request.auth.uid;
  const user = await auth.getUser(uid);

  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    role: "admin"
  });

  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  const existingData = existing.data() ?? {};
  const existingName = String(existingData.fullName ?? "").trim();
  const existingPhone = String(existingData.mobile ?? "").trim();

  await userRef.set(
    {
      uid,
      role: "admin",
      email: requesterEmail,
      fullName:
        existingName && existingName.toLowerCase() !== "zenith legal"
          ? existingName
          : defaultZenithAdminName,
      mobile: existingPhone || defaultZenithAdminPhone,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { success: true, uid };
});
