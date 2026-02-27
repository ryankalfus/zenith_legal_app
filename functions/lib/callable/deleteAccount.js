"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidateAccountData = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const userCleanup_1 = require("./userCleanup");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
async function getAdminCount() {
    const snapshot = await db.collection("users").where("role", "==", "admin").get();
    return snapshot.size;
}
exports.deleteCandidateAccountData = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required.");
    }
    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection("users").doc(uid).get();
    const roleFromDoc = String(userDoc.data()?.role ?? "").trim().toLowerCase();
    const roleFromClaim = String(userRecord.customClaims?.role ?? "").trim().toLowerCase();
    const role = roleFromClaim === "admin" || roleFromDoc === "admin" ? "admin" : "candidate";
    if (role === "admin") {
        const adminCount = await getAdminCount();
        if (adminCount <= 1) {
            throw new https_1.HttpsError("failed-precondition", "At least one admin account must remain active.");
        }
    }
    const deletionRef = db.collection("deletionRequests").doc();
    await deletionRef.set({
        candidateId: uid,
        requestedBy: uid,
        requestedAt: firestore_1.FieldValue.serverTimestamp(),
        status: "processing",
        role
    });
    try {
        await (0, userCleanup_1.deleteUserAccountAndData)(uid);
        await deletionRef.update({
            status: "completed",
            completedAt: firestore_1.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        await deletionRef.update({
            status: "failed",
            completedAt: firestore_1.FieldValue.serverTimestamp(),
            errorMessage: error?.message ?? "Unknown deletion error"
        });
        throw new https_1.HttpsError("internal", "Could not delete account data.");
    }
});
