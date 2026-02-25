"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminRoleByEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const env_1 = require("../config/env");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
exports.setAdminRoleByEmail = (0, https_1.onCall)(async (request) => {
    const requesterEmail = request.auth?.token?.email?.toString().toLowerCase();
    if (!requesterEmail) {
        throw new https_1.HttpsError("permission-denied", "Missing requester email.");
    }
    const allowlist = (0, env_1.getSuperAdminAllowlist)();
    if (!allowlist.includes(requesterEmail)) {
        throw new https_1.HttpsError("permission-denied", "Requester is not in SUPER_ADMIN_EMAILS.");
    }
    const targetEmail = String(request.data?.email ?? "").trim().toLowerCase();
    if (!targetEmail) {
        throw new https_1.HttpsError("invalid-argument", "Target email is required.");
    }
    const user = await auth.getUserByEmail(targetEmail);
    await auth.setCustomUserClaims(user.uid, {
        ...(user.customClaims ?? {}),
        role: "admin"
    });
    await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        role: "admin",
        email: targetEmail,
        updatedAt: firestore_1.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true, uid: user.uid };
});
