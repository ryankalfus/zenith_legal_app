import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { deleteUserAccountAndData } from "./userCleanup";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

async function getAdminCount() {
  const snapshot = await db.collection("users").where("role", "==", "admin").get();
  return snapshot.size;
}

export const deleteCandidateAccountData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign-in required.");
  }

  const userRecord = await auth.getUser(uid);
  const userDoc = await db.collection("users").doc(uid).get();
  const roleFromDoc = String(userDoc.data()?.role ?? "").trim().toLowerCase();
  const roleFromClaim = String(userRecord.customClaims?.role ?? "").trim().toLowerCase();
  const role = roleFromClaim === "admin" || roleFromDoc === "admin" ? "admin" : "candidate";

  if (role === "admin") {
    const adminCount = await getAdminCount();
    if (adminCount <= 1) {
      throw new HttpsError("failed-precondition", "At least one admin account must remain active.");
    }
  }

  const deletionRef = db.collection("deletionRequests").doc();
  await deletionRef.set({
    candidateId: uid,
    requestedBy: uid,
    requestedAt: FieldValue.serverTimestamp(),
    status: "processing",
    role
  });

  try {
    await deleteUserAccountAndData(uid);

    await deletionRef.update({
      status: "completed",
      completedAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    await deletionRef.update({
      status: "failed",
      completedAt: FieldValue.serverTimestamp(),
      errorMessage: error?.message ?? "Unknown deletion error"
    });
    throw new HttpsError("internal", "Could not delete account data.");
  }
});
