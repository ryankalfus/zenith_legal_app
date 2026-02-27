import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const db = getFirestore();

const DEFAULT_CANDIDATE_PREFERENCES = {
  preferredCities: [],
  practiceArea: "Antitrust"
};

type AppRole = "candidate" | "admin";

function normalizeRole(input: unknown): AppRole | null {
  const value = String(input ?? "").trim().toLowerCase();
  if (value === "candidate" || value === "admin") {
    return value;
  }
  return null;
}

async function assertCallerAdmin(uid: string) {
  const callerUser = await auth.getUser(uid);
  const callerRoleFromClaim = normalizeRole(callerUser.customClaims?.role);
  if (callerRoleFromClaim === "admin") {
    return;
  }

  const callerDoc = await db.collection("users").doc(uid).get();
  const callerRoleFromDoc = normalizeRole(callerDoc.data()?.role);
  if (callerRoleFromDoc !== "admin") {
    throw new HttpsError("permission-denied", "Only admin users can change roles.");
  }
}

async function getAdminCount() {
  const snapshot = await db.collection("users").where("role", "==", "admin").get();
  return snapshot.size;
}

async function setUserRole(uid: string, role: AppRole, existingData: Record<string, unknown>) {
  const userRecord = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...(userRecord.customClaims ?? {}),
    role
  });

  const rolePayload: Record<string, unknown> = {
    uid,
    role,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (role === "candidate" && !existingData.preferences) {
    rolePayload.preferences = DEFAULT_CANDIDATE_PREFERENCES;
  }

  await db.collection("users").doc(uid).set(rolePayload, { merge: true });
}

export const changeUserRole = onCall(async (request) => {
  const requesterUid = request.auth?.uid;
  if (!requesterUid) {
    throw new HttpsError("unauthenticated", "Sign-in required.");
  }

  await assertCallerAdmin(requesterUid);

  const targetUid = String(request.data?.targetUid ?? "").trim();
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "targetUid is required.");
  }

  const targetRole = normalizeRole(request.data?.targetRole);
  if (!targetRole) {
    throw new HttpsError("invalid-argument", "targetRole must be candidate or admin.");
  }

  if (targetUid === requesterUid) {
    throw new HttpsError("failed-precondition", "You cannot change your own role.");
  }

  const targetDocRef = db.collection("users").doc(targetUid);
  const targetDoc = await targetDocRef.get();
  if (!targetDoc.exists) {
    throw new HttpsError("not-found", "Target user was not found.");
  }

  const currentRole = normalizeRole(targetDoc.data()?.role) ?? "candidate";
  if (currentRole === targetRole) {
    return { success: true, uid: targetUid, role: targetRole, unchanged: true };
  }

  if (currentRole === "admin" && targetRole === "candidate") {
    const adminCount = await getAdminCount();
    if (adminCount <= 1) {
      throw new HttpsError("failed-precondition", "At least one admin account must remain active.");
    }
  }

  await setUserRole(targetUid, targetRole, targetDoc.data() ?? {});

  return {
    success: true,
    uid: targetUid,
    previousRole: currentRole,
    role: targetRole
  };
});
