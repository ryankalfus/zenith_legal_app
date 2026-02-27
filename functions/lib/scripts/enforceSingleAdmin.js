"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
async function run() {
    console.log("enforceSingleAdmin.ts is deprecated. Multi-admin mode is enabled. No role changes were applied.");
    console.log("Use backfillMasonAdminProfile.ts if you need to ensure Mason defaults.");
}
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
