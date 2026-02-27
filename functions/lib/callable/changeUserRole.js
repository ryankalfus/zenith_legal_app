"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
const DEFAULT_CANDIDATE_PREFERENCES = {
    preferredCities: [],
    practiceArea: "Antitrust"
};
function normalizeRole(input) {
    const value = String(input ?? "").trim().toLowerCase();
    if (value === "candidate" || value === "admin") {
        return value;
    }
    return null;
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
async function assertCallerAdmin(uid) {
    const callerUser = await auth.getUser(uid);
    const callerRoleFromClaim = normalizeRole(callerUser.customClaims?.role);
    if (callerRoleFromClaim === "admin") {
        return;
    }
    const callerDoc = await db.collection("users").doc(uid).get();
    const callerRoleFromDoc = normalizeRole(callerDoc.data()?.role);
    if (callerRoleFromDoc !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admin users can change roles.");
    }
}
async function getAdminCount() {
    const snapshot = await db.collection("users").where("role", "==", "admin").get();
    const identities = new Set();
    snapshot.docs.forEach((entry) => {
        const row = entry.data();
        const uid = String(row.uid ?? "").trim();
        const email = String(row.email ?? "").trim().toLowerCase();
        const key = uid || email || entry.id;
        identities.add(key);
    });
    return identities.size;
}
async function setUserRole(uid, role, existingData) {
    const userRecord = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
        ...(userRecord.customClaims ?? {}),
        role
    });
    const rolePayload = {
        uid,
        role,
        updatedAt: firestore_1.FieldValue.serverTimestamp()
    };
    if (role === "candidate" && !existingData.preferences) {
        rolePayload.preferences = DEFAULT_CANDIDATE_PREFERENCES;
    }
    await db.collection("users").doc(uid).set(rolePayload, { merge: true });
}
async function resolveTargetAuthUid(inputTargetUid) {
    try {
        const user = await auth.getUser(inputTargetUid);
        return user.uid;
    }
    catch {
        // Continue with fallback resolution.
    }
    const targetDoc = await db.collection("users").doc(inputTargetUid).get();
    if (!targetDoc.exists) {
        throw new https_1.HttpsError("not-found", "Target user was not found.");
    }
    const targetData = targetDoc.data();
    const docUid = String(targetData.uid ?? "").trim();
    if (docUid) {
        try {
            const user = await auth.getUser(docUid);
            return user.uid;
        }
        catch {
            // Continue to email fallback.
        }
    }
    const docEmail = String(targetData.email ?? "").trim().toLowerCase();
    if (docEmail) {
        try {
            const user = await auth.getUserByEmail(docEmail);
            return user.uid;
        }
        catch {
            // Fall through to not-found below.
        }
    }
    throw new https_1.HttpsError("not-found", "Target auth account was not found.");
}
exports.changeUserRole = (0, https_1.onCall)(async (request) => {
    const requesterUid = request.auth?.uid;
    if (!requesterUid) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required.");
    }
    await assertCallerAdmin(requesterUid);
    const requestedTargetUid = String(request.data?.targetUid ?? "").trim();
    if (!requestedTargetUid) {
        throw new https_1.HttpsError("invalid-argument", "targetUid is required.");
    }
    const targetRole = normalizeRole(request.data?.targetRole);
    if (!targetRole) {
        throw new https_1.HttpsError("invalid-argument", "targetRole must be candidate or admin.");
    }
    const targetUid = await resolveTargetAuthUid(requestedTargetUid);
    if (targetUid === requesterUid) {
        throw new https_1.HttpsError("failed-precondition", "You cannot change your own role.");
    }
    const canonicalDocRef = db.collection("users").doc(targetUid);
    const canonicalDoc = await canonicalDocRef.get();
    const canonicalData = (canonicalDoc.data() ?? {});
    const canonicalEmail = String(canonicalData.email ?? "").trim().toLowerCase();
    const canonicalName = normalizeName(canonicalData.fullName);
    const canonicalPhoneDigits = normalizePhoneDigits(canonicalData.mobile);
    const usersSnapshot = await db.collection("users").get();
    const relatedDocs = usersSnapshot.docs.filter((entry) => {
        const row = entry.data();
        const rowUid = String(row.uid ?? "").trim();
        const rowEmail = String(row.email ?? "").trim().toLowerCase();
        const rowName = normalizeName(row.fullName);
        const rowPhoneDigits = normalizePhoneDigits(row.mobile);
        const matchesUid = entry.id === targetUid || rowUid === targetUid;
        const matchesEmail = Boolean(canonicalEmail) && rowEmail === canonicalEmail;
        const matchesNameAndPhone = Boolean(canonicalName) &&
            Boolean(canonicalPhoneDigits) &&
            rowName === canonicalName &&
            rowPhoneDigits === canonicalPhoneDigits;
        return matchesUid || matchesEmail || matchesNameAndPhone;
    });
    const currentRole = relatedDocs.some((entry) => normalizeRole(entry.data()?.role) === "admin") ? "admin" : "candidate";
    if (currentRole === targetRole) {
        return { success: true, uid: targetUid, role: targetRole, unchanged: true };
    }
    if (currentRole === "admin" && targetRole === "candidate") {
        const adminCount = await getAdminCount();
        if (adminCount <= 1) {
            throw new https_1.HttpsError("failed-precondition", "At least one admin account must remain active.");
        }
    }
    await setUserRole(targetUid, targetRole, canonicalData);
    const rolePayload = {
        uid: targetUid,
        role: targetRole,
        updatedAt: firestore_1.FieldValue.serverTimestamp()
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
