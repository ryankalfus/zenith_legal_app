import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const db = getFirestore();

type AppRole = "candidate" | "admin";

function normalizeRole(input: unknown): AppRole | "" {
  const value = String(input ?? "").trim().toLowerCase();
  return value === "admin" ? "admin" : value === "candidate" ? "candidate" : "";
}

function mergeUniqueDocs(
  into: Map<string, QueryDocumentSnapshot>,
  docs: QueryDocumentSnapshot[]
) {
  docs.forEach((entry) => {
    into.set(entry.id, entry);
  });
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

function isZenithEmail(value: unknown) {
  return /@zenithlegal\.com$/i.test(String(value ?? "").trim());
}

export const syncOwnRoleFromProfile = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign-in required.");
  }

  const authUser = await auth.getUser(uid);
  const authEmail = String(authUser.email ?? request.auth?.token?.email ?? "").trim().toLowerCase();
  const roleFromClaim = normalizeRole(authUser.customClaims?.role);

  const canonicalRef = db.collection("users").doc(uid);
  const canonicalSnap = await canonicalRef.get();
  const canonicalData = (canonicalSnap.data() ?? {}) as Record<string, unknown>;
  const canonicalName = normalizeName(canonicalData.fullName);
  const canonicalPhoneDigits = normalizePhoneDigits(canonicalData.mobile);
  const authPhoneDigits = normalizePhoneDigits(authUser.phoneNumber);
  const roleFromCanonical = normalizeRole(canonicalData.role);

  const relatedDocsMap = new Map<string, QueryDocumentSnapshot>();
  const relatedByUid = await db.collection("users").where("uid", "==", uid).get();
  mergeUniqueDocs(relatedDocsMap, relatedByUid.docs);

  if (authEmail) {
    const relatedByEmail = await db.collection("users").where("email", "==", authEmail).get();
    mergeUniqueDocs(relatedDocsMap, relatedByEmail.docs);
  }

  let hasAdminProfile = roleFromCanonical === "admin";
  if (!hasAdminProfile) {
    hasAdminProfile = [...relatedDocsMap.values()].some(
      (entry) => normalizeRole(entry.data()?.role) === "admin"
    );
  }

  if (!hasAdminProfile) {
    // Legacy duplicate fallback: match admin identity by normalized name + phone.
    const adminDocs = await db.collection("users").where("role", "==", "admin").get();
    hasAdminProfile = adminDocs.docs.some((entry) => {
      const row = entry.data() as Record<string, unknown>;
      const rowName = normalizeName(row.fullName);
      const rowPhoneDigits = normalizePhoneDigits(row.mobile);

      const hasPhoneMatch =
        Boolean(rowPhoneDigits) &&
        (rowPhoneDigits === canonicalPhoneDigits || rowPhoneDigits === authPhoneDigits);
      if (!hasPhoneMatch) {
        return false;
      }

      if (!canonicalName) {
        return true;
      }
      return rowName === canonicalName;
    });
  }

  const shouldBeAdmin = roleFromClaim === "admin" || hasAdminProfile || isZenithEmail(authEmail);

  if (shouldBeAdmin) {
    await auth.setCustomUserClaims(uid, {
      ...(authUser.customClaims ?? {}),
      role: "admin"
    });

    const rolePayload: Record<string, unknown> = {
      uid,
      role: "admin",
      updatedAt: FieldValue.serverTimestamp()
    };
    if (authEmail) {
      rolePayload.email = authEmail;
    }

    const batch = db.batch();
    batch.set(canonicalRef, rolePayload, { merge: true });
    relatedDocsMap.forEach((entry) => {
      batch.set(entry.ref, rolePayload, { merge: true });
    });
    await batch.commit();

    return { role: "admin", updated: true };
  }

  return { role: roleFromCanonical || "candidate", updated: false };
});
