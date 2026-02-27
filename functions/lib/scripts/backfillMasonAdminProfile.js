"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
const masonEmail = "mason@zenithlegal.com";
async function run() {
    const user = await auth.getUserByEmail(masonEmail);
    await auth.setCustomUserClaims(user.uid, {
        ...(user.customClaims ?? {}),
        role: "admin"
    });
    await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        role: "admin",
        fullName: "Mason Kalfus",
        email: masonEmail,
        mobile: "+12024863535",
        updatedAt: firestore_1.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log("Mason admin profile backfill complete.");
}
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
