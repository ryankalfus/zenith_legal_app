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
  let promoted = false;

  try {
    const zenithUser = await auth.getUserByEmail(zenithAdminEmail);
    await auth.setCustomUserClaims(zenithUser.uid, {
      ...(zenithUser.customClaims ?? {}),
      role: "admin"
    });
    await auth.updateUser(zenithUser.uid, { displayName: "Zenith Legal" }).catch(() => undefined);
    await db.collection("users").doc(zenithUser.uid).set(
      {
        uid: zenithUser.uid,
        email: zenithAdminEmail,
        fullName: "Zenith Legal",
        role: "admin",
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    promoted = true;
  } catch (error) {
    console.error(`Could not promote ${zenithAdminEmail} to admin.`, error);
  }

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

  console.log(
    `Single-admin cleanup complete. Promoted Zenith admin=${promoted}. Demoted ${demoted} non-Zenith admin account(s).`
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
