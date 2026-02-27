"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOwnRoleFromProfile = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
function normalizeRole(input) {
    const value = String(input ?? "").trim().toLowerCase();
    return value === "admin" ? "admin" : value === "candidate" ? "candidate" : "";
}
function mergeUniqueDocs(into, docs) {
    docs.forEach((entry) => {
        into.set(entry.id, entry);
    });
}
function normalizeName(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}
function normalizePhoneDigits(value) {
    return String(value ?? "").replace(/[^\d]/g, "");
}
function isZenithEmail(value) {
    return /@zenithlegal\.com$/i.test(String(value ?? "").trim());
}
exports.syncOwnRoleFromProfile = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required.");
    }
    const authUser = await auth.getUser(uid);
    const authEmail = String(authUser.email ?? request.auth?.token?.email ?? "").trim().toLowerCase();
    const roleFromClaim = normalizeRole(authUser.customClaims?.role);
    const canonicalRef = db.collection("users").doc(uid);
    const canonicalSnap = await canonicalRef.get();
    const canonicalData = (canonicalSnap.data() ?? {});
    const canonicalName = normalizeName(canonicalData.fullName);
    const canonicalPhoneDigits = normalizePhoneDigits(canonicalData.mobile);
    const authPhoneDigits = normalizePhoneDigits(authUser.phoneNumber);
    const roleFromCanonical = normalizeRole(canonicalData.role);
    const relatedDocsMap = new Map();
    const relatedByUid = await db.collection("users").where("uid", "==", uid).get();
    mergeUniqueDocs(relatedDocsMap, relatedByUid.docs);
    if (authEmail) {
        const relatedByEmail = await db.collection("users").where("email", "==", authEmail).get();
        mergeUniqueDocs(relatedDocsMap, relatedByEmail.docs);
    }
    let hasAdminProfile = roleFromCanonical === "admin";
    if (!hasAdminProfile) {
        hasAdminProfile = [...relatedDocsMap.values()].some((entry) => normalizeRole(entry.data()?.role) === "admin");
    }
    if (!hasAdminProfile) {
        // Legacy duplicate fallback: match admin identity by normalized name + phone.
        const adminDocs = await db.collection("users").where("role", "==", "admin").get();
        hasAdminProfile = adminDocs.docs.some((entry) => {
            const row = entry.data();
            const rowName = normalizeName(row.fullName);
            const rowPhoneDigits = normalizePhoneDigits(row.mobile);
            const hasPhoneMatch = Boolean(rowPhoneDigits) &&
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
        const rolePayload = {
            uid,
            role: "admin",
            updatedAt: firestore_1.FieldValue.serverTimestamp()
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
