import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getSuperAdminAllowlist, getZenithAdminEmail } from "../config/env";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const db = getFirestore();

export const setAdminRoleByEmail = onCall(async (request) => {
  const requesterEmail = request.auth?.token?.email?.toString().toLowerCase();
  if (!requesterEmail) {
    throw new HttpsError("permission-denied", "Missing requester email.");
  }

  const allowlist = getSuperAdminAllowlist();
  if (!allowlist.includes(requesterEmail)) {
    throw new HttpsError("permission-denied", "Requester is not in SUPER_ADMIN_EMAILS.");
  }

  const targetEmail = String(request.data?.email ?? "").trim().toLowerCase();
  if (!targetEmail) {
    throw new HttpsError("invalid-argument", "Target email is required.");
  }
  const zenithAdminEmail = getZenithAdminEmail();
  if (targetEmail !== zenithAdminEmail) {
    throw new HttpsError(
      "permission-denied",
      `Only ${zenithAdminEmail} can be assigned admin in this environment.`
    );
  }

  const user = await auth.getUserByEmail(targetEmail);
  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    role: "admin"
  });

  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      role: "admin",
      fullName: "Zenith Legal",
      email: targetEmail,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { success: true, uid: user.uid };
});
