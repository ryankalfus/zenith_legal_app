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

## Step 21 - Metro Resolver Fix for Expo Go Runtime
- What changed:
  - Added `apps/mobile/metro.config.js` to force React Native module resolution from `apps/mobile/node_modules`.
  - Disabled hierarchical lookup in Metro to avoid pulling incompatible root workspace `react-native` version.
  - Cleared Metro cache and restarted bundler for a clean runtime bundle.
- Commands run + result:
  - `cd apps/mobile && npx expo start --lan --clear --port 8087` -> PASS (Metro starts with cache rebuild)
- What to test next:
  - Re-open app in Expo Go and confirm runtime no longer throws `PlatformConstants` TurboModule error.
  - If stale bundle remains on device, close Expo Go app completely and rescan QR.
  - If Metro cannot resolve `expo`, include root workspace `node_modules` in Metro resolver paths while keeping mobile path first.

## Step 22 - Unified Auth + Single Admin + Signup Email + Mobile Admin Inbox
- What changed:
  - Replaced mobile email-link auth flow with email/password + Google auth options.
  - Added web auth options for email/password and Google sign up/log in.
  - Removed recruiter-only login wording and added shared app entry behavior.
  - Added callable `ensureZenithAdminClaim` and strict admin identity enforcement for `mason@zenithlegal.com`.
  - Added one-time admin cleanup script (`enforce:single-admin`) to demote non-Zenith admin claims/docs.
  - Hardened Firestore rules so admin checks require `role=admin` and Zenith admin email.
  - Added mobile admin inbox screen for chat-only admin tools (list conversations + reply in thread).
  - Added signup summary email trigger via Resend with idempotency and one-time send marker.
  - Updated env template and docs for Google auth client IDs, Zenith admin env values, and Resend settings.
  - Updated QA/RBAC checklists and smoke test coverage for Zenith-only admin behavior.
- What to test:
  - Candidate sign up/log in (email/password + Google) works end-to-end on mobile and web.
  - Candidate dashboard/status/chat/calendar/profile behavior remains unchanged.
  - Zenith admin account can access web dashboard and mobile inbox chat tools.
  - Non-Zenith users cannot perform admin reads/writes even with spoofed role claims.
  - Signup summary email sends once on profile completion to `mason@zenithlegal.com`.

## Step 23 - Desktop Web Runtime Enablement (Expo)
- What changed:
  - Installed missing Expo web runtime packages in `@zenith/mobile`: `react-native-web`, `react-dom`, and `@expo/metro-runtime`.
  - Fixed web bundling dependency gap by adding `expo-crypto` and aligning `@expo/metro-runtime` with Expo SDK 54 (`~6.1.2`).
  - Retried desktop web startup after dependency failure from `expo start --web`.
- Commands run + result:
  - `npm run dev --workspace @zenith/mobile -- --web` -> BLOCKED first run (missing `react-native-web`)
  - `npm install --workspace @zenith/mobile react-native-web@^0.21.0 react-dom@19.1.0 @expo/metro-runtime` -> PASS
  - `npm install --workspace @zenith/mobile expo-crypto@~15.0.7 @expo/metro-runtime@~6.1.2` -> PASS
  - `npm run dev --workspace @zenith/mobile -- --web` -> PASS (web server live at `http://localhost:8082`)
- What to test next:
  - Open `http://localhost:8082` on desktop and verify auth + dashboard render.
  - Confirm Google auth flow behavior on web after dependency updates.

## Step 24 - Admin Web Firebase Env Check Fix
- What changed:
  - Updated `apps/admin/src/lib/firebase.ts` to validate required Firebase env vars from direct config values rather than dynamic `process.env[key]` lookup.
  - Removed false-positive runtime error where Next.js client bundle reported missing `NEXT_PUBLIC_*` vars even when `.env.local` was set.
- Commands run + result:
  - `npm run dev --workspace @zenith/admin` -> verify app boot after config check fix.
- What to test next:
  - Open admin web URL and confirm auth page renders without missing-env runtime error.
  - Sign in with allowed admin account and verify dashboard loads.

## Step 23 - Auth Runtime Debug (Localhost Web)
- What changed:
  - Investigated web auth click/no-op + Google `invalid_client` failures on localhost.
  - Verified backend auth endpoint responses returned `CONFIGURATION_NOT_FOUND` for both `accounts:signUp` and `accounts:createAuthUri`.
  - Updated local runtime env to non-emulator auth mode for app login checks.
  - Added clearer auth error mapping and emulator-mode warning in web auth UI.
- What to test:
  - In Firebase Console, initialize Authentication and enable Email/Password + Google providers.
  - Confirm localhost auth works for email/password and Google popup after restarting `npm run dev:admin`.

- Additional auth UX hardening: web email/password auth now pushes to `/app` immediately after successful sign-in/sign-up instead of waiting solely on observer redirect.

- Hotfix: created `apps/admin/.env.local` with `NEXT_PUBLIC_*` Firebase keys because Next.js workspace dev server was not reading root `.env`, causing missing Firebase env runtime error on `/auth`.

## Step 24 - Web Candidate Access + Admin Mode Reliability
- What changed:
  - Improved web admin bootstrap so `mason@zenithlegal.com` reliably enters admin mode after sign-in.
  - Added fallback callable path for admin claim assignment when strict callable is unavailable.
  - Updated auth page to route immediately to dashboard for admin and to candidate desktop for non-admin users.
  - Implemented candidate desktop app route (`/app`) with standard features: Home contact, status/authorization actions, messaging, appointments, profile editing, logout/delete account.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/admin` -> PASS
  - `npm run build --workspace @zenith/admin` -> PASS
- What to test:
  - Admin login as `mason@zenithlegal.com` lands on `/dashboard` with management access.
  - Candidate login lands on `/app` and can use standard candidate desktop features.

- Admin-mode fix: updated `apps/admin/src/lib/auth.ts` so Zenith account (`mason@zenithlegal.com`) forces `users/{uid}.role=admin` fallback and returns admin authorization even when claim propagation lags.
- Validation: `npm run typecheck --workspace @zenith/admin` and `npm run build --workspace @zenith/admin` passed.

## Step 25 - Auth Reliability + Zenith Admin Enforcement Repair
- What changed:
  - Repaired admin authorization logic in `apps/admin/src/lib/auth.ts` to prevent false-positive admin mode when claim bootstrap fails.
  - Added retry path for Zenith admin claim bootstrap and only authorize admin when claim/doc checks actually pass.
  - Improved auth screen feedback in `apps/admin/app/auth/page.tsx` with visible status text and clearer mappings for OAuth/config errors (`invalid_client`, `unauthorized-domain`).
  - Updated `firestore.rules` `isAdmin()` function to allow Zenith admin access when token email is `mason@zenithlegal.com` and role claim is either `admin` or temporarily unset.
  - Updated `functions/src/scripts/enforceSingleAdmin.ts` to always promote Zenith account to admin claim/doc before demoting others.
  - Added mobile Google OAuth client-id fallback logic in `apps/mobile/src/screens/AuthScreen.tsx` and wrote `apps/mobile/.env` so Expo runtime has Firebase + Google IDs.
  - Enforced admin claim/doc immediately in live project for `mason@zenithlegal.com` using Firebase Admin SDK (custom claim + display name + users doc sync).
- Commands run + result:
  - Firebase Identity Toolkit config check (`GET /admin/v2/projects/.../config`) -> PASS (email/password enabled, localhost authorized).
  - Firebase Google IdP config check (`GET /defaultSupportedIdpConfigs/google.com`) -> PASS (enabled with client id/secret).
  - OAuth client validation (`oauth2.googleapis.com/token` with fake code) -> PASS (`invalid_grant` confirms client exists; not invalid_client).
  - Admin claim/doc live repair script -> PASS (`admin claim/doc enforced for pYQZ68Td2PcC3c191b11AmTY1Ax2`).
  - ID token decode validation -> PASS (`role: "admin"` present for `mason@zenithlegal.com`).
  - `npm run typecheck --workspace @zenith/admin` -> PASS
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `npm run typecheck --workspace @zenith/functions` -> PASS
  - `npm run build --workspace @zenith/admin` -> PASS
  - `npm run build --workspace @zenith/functions` -> PASS
  - `npm run test:rules` -> PASS (`11 passed, 0 failed`) after RBAC harness switched to emulator email/password sign-in + custom claims.
  - `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem firebase deploy --only firestore:rules --project zenith-legal-dev` -> PASS
  - `GOOGLE_CLOUD_PROJECT=zenith-legal-dev npm run enforce:single-admin` -> PASS (`Promoted Zenith admin=true`, `Demoted 0`)
- What to test next:
  - Restart web app and verify email/password sign-up + login now transitions off `/auth`.
  - Re-test Google login on web after hard refresh (stale cached OAuth flow can show old invalid_client).
  - Login as `mason@zenithlegal.com` and verify immediate access to `/dashboard` with candidate list query permissions.

## Step 26 - Mobile Login Crash Guard (React Native Feature Flags)
- What changed:
  - Added `apps/mobile/src/lib/reactNativeCompatibility.ts` to safely patch missing React Native feature flags used by virtualized list rendering.
  - Wired compatibility patch into app startup (`apps/mobile/App.tsx`) so login flow cannot crash before auth actions run.
  - Updated `apps/mobile/metro.config.js` with explicit `extraNodeModules` aliases for `react`, `react-dom`, `react-native`, and `@react-native/virtualized-lists` to keep mobile runtime package resolution consistent.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Restart Metro with cache clear (`npm run dev --workspace @zenith/mobile -- --clear`) and re-test login on iOS device.
  - Confirm opening Auth screen no longer shows `enableOptimisedVirtualizedCells` render error.

## Step 27 - Mobile Hotfix for Invalid Dynamic Require
- What changed:
  - Replaced dynamic `require(modulePath)` with static literal `require("react-native/Libraries/ReactNative/ReactNativeFeatureFlags")` in `apps/mobile/src/lib/reactNativeCompatibility.ts`.
  - Updated `apps/mobile/metro.config.js` alias resolution to check filesystem paths first, then safely fall back to root workspace paths.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `node -e "require('./apps/mobile/metro.config.js'); console.log('metro-config-ok')"` -> PASS
- What to test next:
  - Restart Metro with cache clear and reload iOS app.
  - Confirm login screen opens without `Invalid call ... require(modulePath)` fatal.

## Step 28 - Mobile Startup Crash Recovery (`PlatformConstants`)
- What changed:
  - Reinstalled mobile-local runtime versions in workspace: `react@19.1.0`, `react-dom@19.1.0`, `react-native@0.81.5`.
  - Removed React Native internal startup hook from `apps/mobile/App.tsx`.
  - Deleted `apps/mobile/src/lib/reactNativeCompatibility.ts` because it was introducing unstable early runtime behavior.
  - Kept Metro resolver hardening in `apps/mobile/metro.config.js` so mobile dependencies resolve consistently.
- Commands run + result:
  - `npm install --workspace @zenith/mobile react@19.1.0 react-dom@19.1.0 react-native@0.81.5 --save-exact` -> PASS
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `CI=1 EXPO_OFFLINE=1 npm run dev --workspace @zenith/mobile -- --clear --port 8084` -> PASS (Metro starts)
- What to test next:
  - Run `npm run dev --workspace @zenith/mobile -- --clear`.
  - Re-open app in Expo Go and confirm auth screen loads without `PlatformConstants` crash.

## Step 29 - Admin Inbox Crash Fix (`enableOptimisedVirtualizedCells`)
- What changed:
  - Updated `apps/mobile/src/screens/AdminInboxScreen.tsx` to use `ScrollView` + `rows.map(...)` instead of `FlatList`.
  - This removes dependency on `VirtualizedListCellRenderer` in the admin inbox route, which was triggering `ReactNativeFeatureFlags.enableOptimisedVirtualizedCells is not a function`.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `npm ls @react-native/virtualized-lists --workspace @zenith/mobile --depth=4` -> shows both versions in workspace tree; admin screen now avoids the crashing `FlatList` path.
- What to test next:
  - Start app with cache clear (`npm run dev --workspace @zenith/mobile -- --clear`).
  - Log in as Zenith admin and open Inbox.
  - Confirm inbox list renders and opens candidate message threads without red-screen render error.

## Step 30 - Global Mobile List Crash Fix (Admin Navigation Paths)
- What changed:
  - Replaced `FlatList` with `ScrollView` in:
    - `apps/mobile/src/screens/MessagesScreen.tsx`
    - `apps/mobile/src/screens/StatusScreen.tsx`
    - `apps/mobile/src/screens/CalendarScreen.tsx`
  - This removes direct app usage of `VirtualizedListCellRenderer`, which was the crashing source in the red screen.
- Commands run + result:
  - `rg -n "\\bFlatList\\b|\\bSectionList\\b|\\bVirtualizedList\\b" apps/mobile/src --glob '*.tsx' --glob '*.ts'` -> no matches
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Start Metro with cache clear (`npm run dev --workspace @zenith/mobile -- --clear`).
  - Login as Zenith admin.
  - Open Inbox, then open Messages, Status, and Calendar tabs/screens.
  - Confirm no `enableOptimisedVirtualizedCells` red-screen appears.

## Step 26 - Full Mobile App Redesign (Candidate + Zenith Admin)
- What changed:
  - Added new mobile design system layers (`theme`, reusable shell/cards/status chip) and integrated `zenith-legal-logo.png` into the redesigned auth/dashboard UI.
  - Replaced mobile auth UI with email/password-only sign up + log in and updated motto text to `A HIGHER LEVEL OF LEGAL SEARCH`.
  - Replaced role-based mobile navigation:
    - Candidate tabs: `Dashboard`, `Chat`, `Appointments`, `Profile`
    - Admin tabs: `Candidates`, `Chat`, `Appointment Requests`
    - Added admin candidate detail screen for firm assignment/status management.
  - Implemented candidate dashboard status-request workflow using new Firestore collection `candidateStatusRequests` with pending badges and action modal (`authorization` or `cancellation`).
  - Implemented admin candidate management flow for viewing candidate profile data, assigning firms, updating statuses, and resolving candidate status requests.
  - Implemented candidate appointment-request form with date/time picker, required phone, optional note, and status lifecycle support.
  - Implemented admin appointment requests tab with preview rows, expandable notes, and status action buttons (`scheduled`, `completed`, `canceled`).
  - Updated shared schema/types for appointment `requested` status and required `phoneNumber`; added candidate status request model.
  - Added function triggers:
    - `notifyOnCandidateStatusRequestCreate` (DM + email alert)
    - `syncAppointmentRequestMessage` (auto-chat message: `APPOINTMENT REQUESTED... mm/dd/yyyy... xx:xx am/pm... xxx-xxx-xxxx`)
  - Updated Firestore rules and indexes to cover candidate status request access/update paths and appointment request query patterns.
- What to test:
  - Candidate:
    - Email signup/login works and auth screen displays new motto + logo.
    - Top bar contact links show `mason@zenithlegal.com` and `+1 202-486-3535` on all candidate tabs.
    - Dashboard `Waiting on your authorization...` flow creates pending status request and shows pending badge.
    - Appointment request creates appointment record and auto-creates required DM message format.
    - Candidate can cancel requested/scheduled appointments.
  - Zenith admin:
    - Candidate list/detail screens load and allow firm assignment/status edits.
    - Chat inbox opens candidate DM threads.
    - Appointment Requests tab supports note expansion and status changes.
  - System validation:
    - `npm run typecheck` passes.
    - `npm run build` passes.
    - `npm run test:rules` passes (`11 passed, 0 failed`).

## Step 27 - Appointment + Firm Assignment + Chat UI Sync Improvements (Mobile)
- What changed:
  - Candidate appointment request UI kept date/time picker controls but refined to cleaner dropdown-style selectors.
  - Admin appointment tab now includes top create flow with candidate dropdown selection, date/time, phone, and note.
  - Admin appointment request cards now support explicit Accept (`scheduled`) and Decline (`canceled`) actions, plus Complete and Modify actions.
  - Added appointment detail editing support (date/time/phone/note) with immediate sync to candidate view.
  - Updated appointment service APIs:
    - `createAdminAppointment(...)`
    - `updateAppointmentDetails(...)`
    - actor-aware `updateAppointmentStatus(...)` payload
  - Updated firm assignment flow in candidate detail to dedicated 2-step path:
    - Step 1: `Assign Firm` (pick firm)
    - Step 2: `Firm Assigned` (pick status and confirm)
  - Preserved one-document-per-candidate+firm model (`candidateId_firmId`) with history updates for repeated same-firm assignments.
  - Refined chat composer styling in mobile messages screen to cleaner modern rounded/oval controls with circular send affordance.
  - Tightened Firestore appointment update rules to restrict candidate update path to cancel-only on `requested/scheduled` records while preserving admin full edit rights.
  - Extended appointment push trigger logic to notify candidates on admin status/detail changes (accept/decline/modify).
- What to test:
  - Candidate can submit appointment request and see live status updates after admin accept/decline/modify.
  - Admin can create appointment directly from appointment tab using candidate dropdown and values sync on candidate end.
  - Admin can modify appointment details and candidate receives updated appointment state/details.
  - Candidate can cancel only pending/scheduled appointments; candidate cannot edit appointment details.
  - Assign Firm flow follows 2-step UX and updates candidate dashboard statuses correctly.
  - Chat composer renders rounded/oval controls and still sends text/attachments successfully.
  - Validation commands pass:
    - `npm run typecheck`
    - `npm run build`
    - `npm run test:rules`
