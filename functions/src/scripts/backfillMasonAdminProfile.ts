import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const db = getFirestore();

const masonEmail = "mason@zenithlegal.com";

async function run() {
  const user = await auth.getUserByEmail(masonEmail);

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    role: "admin"
  });

  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      role: "admin",
      fullName: "Mason Kalfus",
      email: masonEmail,
      mobile: "+12024863535",
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  console.log("Mason admin profile backfill complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
