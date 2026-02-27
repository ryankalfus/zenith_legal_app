"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureZenithAdminClaim = void 0;
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
const defaultZenithAdminName = "Mason Kalfus";
const defaultZenithAdminPhone = "+12024863535";
exports.ensureZenithAdminClaim = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const requesterEmail = String(request.auth.token.email ?? "").trim().toLowerCase();
    const allowedAdminEmail = (0, env_1.getZenithAdminEmail)();
    if (!requesterEmail || requesterEmail !== allowedAdminEmail) {
        throw new https_1.HttpsError("permission-denied", "Only the Zenith Legal owner account can use this action.");
    }
    const uid = request.auth.uid;
    const user = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
        ...(user.customClaims ?? {}),
        role: "admin"
    });
    const userRef = db.collection("users").doc(uid);
    const existing = await userRef.get();
    const existingData = existing.data() ?? {};
    const existingName = String(existingData.fullName ?? "").trim();
    const existingPhone = String(existingData.mobile ?? "").trim();
    await userRef.set({
        uid,
        role: "admin",
        email: requesterEmail,
        fullName: existingName && existingName.toLowerCase() !== "zenith legal"
            ? existingName
            : defaultZenithAdminName,
        mobile: existingPhone || defaultZenithAdminPhone,
        updatedAt: firestore_1.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true, uid };
});
