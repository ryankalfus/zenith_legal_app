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

const zenithAdminName = "Zenith Legal";

export const ensureZenithAdminClaim = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const requesterEmail = String(request.auth.token.email ?? "").trim().toLowerCase();
  const allowedAdminEmail = getZenithAdminEmail();

  if (!requesterEmail || requesterEmail !== allowedAdminEmail) {
    throw new HttpsError("permission-denied", "Only the Zenith Legal account can be admin.");
  }

  const uid = request.auth.uid;
  const user = await auth.getUser(uid);

  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    role: "admin"
  });

  await auth.updateUser(uid, { displayName: zenithAdminName }).catch(() => undefined);

  await db.collection("users").doc(uid).set(
    {
      uid,
      role: "admin",
      fullName: zenithAdminName,
      email: requesterEmail,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { success: true, uid };
});
