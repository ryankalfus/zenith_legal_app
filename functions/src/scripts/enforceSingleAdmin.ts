import { getApps, initializeApp } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp();
}

async function run() {
  console.log(
    "enforceSingleAdmin.ts is deprecated. Multi-admin mode is enabled. No role changes were applied."
  );
  console.log("Use backfillMasonAdminProfile.ts if you need to ensure Mason defaults.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
