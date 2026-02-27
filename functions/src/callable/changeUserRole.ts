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

function normalizeName(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePhoneDigits(value: unknown) {
  return String(value ?? "").replace(/[^\d]/g, "");
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
  const identities = new Set<string>();
  snapshot.docs.forEach((entry) => {
    const row = entry.data() as Record<string, unknown>;
    const uid = String(row.uid ?? "").trim();
    const email = String(row.email ?? "").trim().toLowerCase();
    const key = uid || email || entry.id;
    identities.add(key);
  });
  return identities.size;
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

async function resolveTargetAuthUid(inputTargetUid: string) {
  try {
    const user = await auth.getUser(inputTargetUid);
    return user.uid;
  } catch {
    // Continue with fallback resolution.
  }

  const targetDoc = await db.collection("users").doc(inputTargetUid).get();
  if (!targetDoc.exists) {
    throw new HttpsError("not-found", "Target user was not found.");
  }
  const targetData = targetDoc.data() as Record<string, unknown>;

  const docUid = String(targetData.uid ?? "").trim();
  if (docUid) {
    try {
      const user = await auth.getUser(docUid);
      return user.uid;
    } catch {
      // Continue to email fallback.
    }
  }

  const docEmail = String(targetData.email ?? "").trim().toLowerCase();
  if (docEmail) {
    try {
      const user = await auth.getUserByEmail(docEmail);
      return user.uid;
    } catch {
      // Fall through to not-found below.
    }
  }

  throw new HttpsError("not-found", "Target auth account was not found.");
}

export const changeUserRole = onCall(async (request) => {
  const requesterUid = request.auth?.uid;
  if (!requesterUid) {
    throw new HttpsError("unauthenticated", "Sign-in required.");
  }

  await assertCallerAdmin(requesterUid);

  const requestedTargetUid = String(request.data?.targetUid ?? "").trim();
  if (!requestedTargetUid) {
    throw new HttpsError("invalid-argument", "targetUid is required.");
  }

  const targetRole = normalizeRole(request.data?.targetRole);
  if (!targetRole) {
    throw new HttpsError("invalid-argument", "targetRole must be candidate or admin.");
  }

  const targetUid = await resolveTargetAuthUid(requestedTargetUid);
  if (targetUid === requesterUid) {
    throw new HttpsError("failed-precondition", "You cannot change your own role.");
  }

  const canonicalDocRef = db.collection("users").doc(targetUid);
  const canonicalDoc = await canonicalDocRef.get();
  const canonicalData = (canonicalDoc.data() ?? {}) as Record<string, unknown>;
  const canonicalEmail = String(canonicalData.email ?? "").trim().toLowerCase();
  const canonicalName = normalizeName(canonicalData.fullName);
  const canonicalPhoneDigits = normalizePhoneDigits(canonicalData.mobile);

  const usersSnapshot = await db.collection("users").get();
  const relatedDocs = usersSnapshot.docs.filter((entry) => {
    const row = entry.data() as Record<string, unknown>;
    const rowUid = String(row.uid ?? "").trim();
    const rowEmail = String(row.email ?? "").trim().toLowerCase();
    const rowName = normalizeName(row.fullName);
    const rowPhoneDigits = normalizePhoneDigits(row.mobile);

    const matchesUid = entry.id === targetUid || rowUid === targetUid;
    const matchesEmail = Boolean(canonicalEmail) && rowEmail === canonicalEmail;
    const matchesNameAndPhone =
      Boolean(canonicalName) &&
      Boolean(canonicalPhoneDigits) &&
      rowName === canonicalName &&
      rowPhoneDigits === canonicalPhoneDigits;

    return matchesUid || matchesEmail || matchesNameAndPhone;
  });

  const currentRole =
    relatedDocs.some((entry) => normalizeRole(entry.data()?.role) === "admin") ? "admin" : "candidate";
  if (currentRole === targetRole) {
    return { success: true, uid: targetUid, role: targetRole, unchanged: true };
  }

  if (currentRole === "admin" && targetRole === "candidate") {
    const adminCount = await getAdminCount();
    if (adminCount <= 1) {
      throw new HttpsError("failed-precondition", "At least one admin account must remain active.");
    }
  }

  await setUserRole(targetUid, targetRole, canonicalData);

  const rolePayload: Record<string, unknown> = {
    uid: targetUid,
    role: targetRole,
    updatedAt: FieldValue.serverTimestamp()
  };
  if (targetRole === "candidate" && !canonicalData.preferences) {
    rolePayload.preferences = DEFAULT_CANDIDATE_PREFERENCES;
  }

  const batch = db.batch();
  batch.set(canonicalDocRef, rolePayload, { merge: true });
  relatedDocs.forEach((entry) => {
    batch.set(entry.ref, rolePayload, { merge: true });
  });
  await batch.commit();

  return {
    success: true,
    uid: targetUid,
    previousRole: currentRole,
    role: targetRole
  };
});
