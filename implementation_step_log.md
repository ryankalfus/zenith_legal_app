# Zenith Legal MVP Implementation Step Log

## Step 1 - Requirements Checklist
- What changed:
  - Created `requirements_checklist.md` with MVP/Later/Out tags from source specs.
- What to test:
  - Confirm every non-negotiable requirement is listed and marked `MVP`.

## Step 2 - Monorepo Scaffold
- What changed:
  - Added npm workspaces and root TypeScript config.
  - Created `apps/mobile`, `apps/admin`, `packages/shared`, `functions`, `docs`, `qa`.
- What to test:
  - Run `npm install` and verify workspace packages resolve.

## Step 3 - Schema + Types
- What changed:
  - Added shared domain types and zod schemas in `packages/shared`.
  - Added Firestore indexes file and collection shape alignment.
- What to test:
  - Run shared typecheck to confirm schema exports compile.

## Step 4 - Auth Setup
- What changed:
  - Mobile auth supports phone OTP and email link flows.
  - Admin auth supports Google sign-in and allowlist check.
  - Added callable function to set admin role claims.
- What to test:
  - Candidate can authenticate with either path.
  - Admin unauthorized email is blocked.

## Step 5 - Mobile Core Screens
- What changed:
  - Added tabs: Home, Status, Calendar, Profile.
  - Added Profile setup flow after first login.
- What to test:
  - Navigation works end-to-end with loading and empty states.

## Step 6 - Messaging + Push
- What changed:
  - Added realtime chat thread, send message, attachment upload (25MB cap).
  - Added function trigger to send push notifications for admin replies.
- What to test:
  - Candidate receives admin messages and push alert.

## Step 7 - Authorization UX
- What changed:
  - Mobile status screen shows pending authorizations with approve/decline actions.
- What to test:
  - Candidate can approve/decline pending request and see update.

## Step 8 - Admin Console
- What changed:
  - Added candidate list/search and detail view.
  - Added firms/status panel, authorization requests, messages, appointments.
- What to test:
  - Admin can complete workflow for one candidate from one page.

## Step 9 - RBAC Rules
- What changed:
  - Added `firestore.rules` and `storage.rules` for candidate/admin access control.
- What to test:
  - Emulator tests/manual checks confirm denied cross-user access.

## Step 10 - Firm Import
- What changed:
  - Added seed script `functions/src/scripts/seedFirms.ts`.
  - Import skips `Mc` and logs skipped entry.
- What to test:
  - Run seed command and verify firms collection count and sample names.

## Step 11 - Account/Data Deletion
- What changed:
  - Added mobile delete action and callable function `deleteCandidateAccountData`.
  - Function deletes related records, attachments, auth user, and audit status.
- What to test:
  - Deleted user cannot sign back in without re-onboarding.

## Step 12 - Docs
- What changed:
  - Added root `README.md`, `.env.example`, Firebase setup doc, EAS doc, App Store checklist.
- What to test:
  - New teammate can set up local environment from docs only.

## Step 13 - QA Checklist
- What changed:
  - Added acceptance checklist file in `qa/acceptance-checklist.md`.
- What to test:
  - Execute each checklist line against emulator and device builds.

## Step 14 - Local Emulator + RBAC Harness
- What changed:
  - Added emulator toggle wiring in mobile/admin Firebase clients.
  - Added RBAC smoke test script at `qa/rules/rbac-smoke.mjs`.
  - Added npm scripts `test:rules`, `test:rules:local`, and `qa:smoke`.
  - Updated setup docs and env template with emulator variables.
- What to test:
  - Install Firebase CLI and run `npm run test:rules`.
  - Confirm RBAC smoke test passes all candidate/admin rule checks.

## Step 15 - Validation Execution (Emulator + Startup)
- What changed:
  - Created `.env` from template and enabled emulator toggles for mobile/admin.
  - Installed Firebase CLI and Java runtime prerequisites.
  - Executed static checks and local startup checks for admin/mobile.
- Commands run + result:
  - `npm install` -> PASS (engine warning only)
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> BLOCKED (Firestore emulator jar download failed)
  - `npm run dev:admin` -> PASS (server ready)
  - `EXPO_OFFLINE=1 npx expo start --offline` -> PASS (Metro started)
- What to test next:
  - Restore network access to `storage.googleapis.com/firebase-preview-drop/...` and rerun `npm run test:rules`.
  - Authenticate Firebase CLI (`firebase login`) and set real project id to execute Phase 3 deploy/seed checks.

## Step 16 - Firebase Recovery Hardening + Retry
- What changed:
  - Set `.firebaserc` default project alias to `zenith-legal-dev`.
  - Added root scripts:
    - `npm run firebase:project` (prints resolved project id from env/.env/.firebaserc).
    - `npm run firebase:doctor` (checks project source, Firebase auth, Java, TLS cert env, emulator jar cache).
    - `npm run test:rules` now resolves project dynamically instead of hardcoded `demo-zenith-legal`.
  - Added helper scripts:
    - `scripts/lib/firebaseProject.mjs`
    - `scripts/firebase-project-id.mjs`
    - `scripts/firebase-doctor.mjs`
    - `scripts/run-rules-test.mjs`
  - Added CLI helper env keys to `.env.example` (`FIREBASE_PROJECT_ID`, `JAVA_HOME`, `NODE_EXTRA_CA_CERTS`).
  - Updated `README.md` and `docs/firebase-setup.md` with Java PATH and TLS certificate troubleshooting instructions.
- Commands run + result:
  - `npm run firebase:project` -> PASS (`zenith-legal-dev`)
  - `npm run firebase:doctor` -> FAIL/WARN (no Firebase login, Java not on PATH in shell, no TLS cert env, jar cache missing)
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> BLOCKED (Firestore emulator jar download still not completed)
  - `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem firebase setup:emulators:firestore --project zenith-legal-dev --debug` -> PARTIAL PASS (TLS cert error removed; download request returns 200)
- What to test next:
  - Run `firebase login` and confirm authenticated account.
  - Provide `NODE_EXTRA_CA_CERTS` value in shell and rerun `npm run test:rules` until emulator jar fully caches.
  - If download remains too slow, manually download jar into `~/.cache/firebase/emulators/`.
  - Continue with deploy smoke: rules/storage/functions + seed firms on `zenith-legal-dev`.

## Step 17 - Firebase Project Activation + Deploy Retry
- What changed:
  - Completed CLI login and confirmed authenticated Firebase account.
  - Created/activated `zenith-legal-dev` and set it as active project.
  - Created Firebase Web app (`zenith-legal-web`) and pulled SDK config.
  - Updated local `.env` Firebase keys for both `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*`.
  - Removed rejected single-field Firestore index (`messages.createdAt`) from `firestore.indexes.json`.
  - Re-ran Firestore deploy and confirmed rules/indexes are live on `zenith-legal-dev`.
  - Verified admin and mobile startup smoke checks still pass locally.
- Commands run + result:
  - `firebase login --no-localhost` -> PASS
  - `firebase projects:list` -> PASS
  - `firebase use zenith-legal-dev` -> PASS
  - `firebase apps:create WEB zenith-legal-web --project zenith-legal-dev` -> PASS
  - `firebase apps:sdkconfig WEB <appId> --project zenith-legal-dev` -> PASS
  - `firebase deploy --only firestore --project zenith-legal-dev` -> PASS
  - `firebase deploy --only storage --project zenith-legal-dev` -> BLOCKED (Storage not initialized in Console)
  - `firebase deploy --only functions --project zenith-legal-dev` -> BLOCKED (Blaze plan required)
  - `npm run seed:firms` -> BLOCKED (no ADC credentials; `gcloud` not installed)
  - `npm run dev:admin` -> PASS
  - `EXPO_OFFLINE=1 npx expo start --offline` -> PASS
- What to test next:
  - Finish Storage setup in Firebase Console and rerun `firebase deploy --only storage`.
  - Upgrade `zenith-legal-dev` to Blaze and rerun `firebase deploy --only functions`.
  - Install `gcloud` and run `gcloud auth application-default login`, then rerun `npm run seed:firms`.
  - Complete emulator jar download and rerun `npm run test:rules`.

## Step 18 - Emulator Completion + RBAC Validation
- What changed:
  - Finished full manual Firestore emulator jar download into local Firebase cache.
  - Re-ran RBAC smoke test on emulators with dynamic project config.
  - Confirmed Firebase doctor is fully green after login + Java + TLS + cached emulator.
  - Re-checked Storage/Functions deploy status after RBAC completion.
- Commands run + result:
  - `npm run test:rules` -> PASS (`10 passed, 0 failed`)
  - `npm run firebase:doctor` -> PASS (`0 fail`, `0 warn`)
  - `firebase deploy --only storage --project zenith-legal-dev` -> BLOCKED (Storage not initialized)
  - `firebase deploy --only functions --project zenith-legal-dev` -> BLOCKED (Blaze required)
- What to test next:
  - Complete Storage setup and Blaze upgrade in Firebase Console.
  - Retry storage/functions deploy.
  - Install/auth ADC (`gcloud`) and run real-project seed script.

## Step 19 - Final Firebase Deploy + Seed Completion
- What changed:
  - Confirmed Firebase auth/project context and reran deployment pipeline on `zenith-legal-dev`.
  - Deployed Storage rules successfully after bucket initialization.
  - Deployed Functions successfully (no code changes detected, deployment pipeline completed).
  - Seeded canonical firms successfully against real Firestore project after ADC auth setup.
  - Re-validated emulator RBAC test after deploy/seed completion.
- Commands run + result:
  - `firebase deploy --only storage --project zenith-legal-dev` -> PASS
  - `firebase deploy --only functions --project zenith-legal-dev` -> PASS
  - `GOOGLE_CLOUD_PROJECT=zenith-legal-dev npm run seed:firms` -> PASS (`Imported 104 firms`, `Skipped entries: Mc`)
  - `npm run test:rules` -> PASS (`10 passed, 0 failed`)
- What to test next:
  - Manual product acceptance pass in app UI (onboarding, messaging, status workflow, calendar, deletion).
  - Optional: upgrade Functions runtime/dependencies (`firebase-functions` latest, Node runtime plan before deprecation window).

## Step 20 - Mobile Expo SDK 54 Upgrade
- What changed:
  - Upgraded mobile Expo stack to SDK 54 compatible versions in `apps/mobile/package.json`.
  - Added SDK 54 notification handler fields (`shouldShowBanner`, `shouldShowList`) in `apps/mobile/src/lib/notifications.ts`.
  - Removed deprecated `expo-firebase-recaptcha` package and recaptcha modal usage from auth provider.
  - Switched auth entry screen to email-link sign-in only to keep Expo Go device testing unblocked on SDK 54.
- Commands run + result:
  - `cd apps/mobile && npx expo install expo@^54.0.0` -> PASS
  - `npm install` -> PASS
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `npm run typecheck` (root) -> PASS
  - `cd apps/mobile && npx expo-doctor` -> PASS with 1 monorepo duplicate warning (`react`/`react-native` across workspaces)
  - `cd apps/mobile && npx expo start --lan --port 8086` -> PASS (Metro started)
- What to test next:
  - Open app in Expo Go SDK 54 and validate applicant sign-in via email link.
  - Run manual acceptance checks for applicant tabs + messaging + status/calendar flows.
  - Plan follow-up task to re-introduce phone OTP with SDK 54-compatible approach (React Native Firebase or alternate verifier flow).
