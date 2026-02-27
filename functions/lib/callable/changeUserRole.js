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
    return snapshot.size;
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
exports.changeUserRole = (0, https_1.onCall)(async (request) => {
    const requesterUid = request.auth?.uid;
    if (!requesterUid) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required.");
    }
    await assertCallerAdmin(requesterUid);
    const targetUid = String(request.data?.targetUid ?? "").trim();
    if (!targetUid) {
        throw new https_1.HttpsError("invalid-argument", "targetUid is required.");
    }
    const targetRole = normalizeRole(request.data?.targetRole);
    if (!targetRole) {
        throw new https_1.HttpsError("invalid-argument", "targetRole must be candidate or admin.");
    }
    if (targetUid === requesterUid) {
        throw new https_1.HttpsError("failed-precondition", "You cannot change your own role.");
    }
    const targetDocRef = db.collection("users").doc(targetUid);
    const targetDoc = await targetDocRef.get();
    if (!targetDoc.exists) {
        throw new https_1.HttpsError("not-found", "Target user was not found.");
    }
    const currentRole = normalizeRole(targetDoc.data()?.role) ?? "candidate";
    if (currentRole === targetRole) {
        return { success: true, uid: targetUid, role: targetRole, unchanged: true };
    }
    if (currentRole === "admin" && targetRole === "candidate") {
        const adminCount = await getAdminCount();
        if (adminCount <= 1) {
            throw new https_1.HttpsError("failed-precondition", "At least one admin account must remain active.");
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
