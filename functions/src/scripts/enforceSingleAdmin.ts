import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getZenithAdminEmail } from "../config/env";

if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();
const db = getFirestore();

async function run() {
  const zenithAdminEmail = getZenithAdminEmail();
  let pageToken: string | undefined;
  let demoted = 0;

  do {
    const page = await auth.listUsers(1000, pageToken);

    for (const user of page.users) {
      const email = String(user.email ?? "").trim().toLowerCase();
      const hasAdminRole = user.customClaims?.role === "admin";
      if (!hasAdminRole || email === zenithAdminEmail) {
        continue;
      }

      await auth.setCustomUserClaims(user.uid, {
        ...(user.customClaims ?? {}),
        role: "candidate"
      });

      await db.collection("users").doc(user.uid).set(
        {
          uid: user.uid,
          email,
          role: "candidate",
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      demoted += 1;
    }

    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`Single-admin cleanup complete. Demoted ${demoted} non-Zenith admin account(s).`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
