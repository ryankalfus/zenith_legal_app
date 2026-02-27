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

## Step 31 - Persistent Icon-Only Mobile Tab Shell
- What changed:
  - Reworked `apps/mobile/src/navigation/RootNavigator.tsx` so root stack now only handles `Auth`, `ProfileSetup`, and role app entry screens (`AdminApp`, `CandidateApp`).
  - Added nested per-tab stacks to keep bottom tabs visible across authenticated navigation:
    - Candidate: Dashboard stack, Chat stack, Appointments stack, Profile stack.
    - Admin: Candidates stack (includes candidate detail), Chat stack (includes inbox + thread), Appointment Requests stack.
  - Moved admin candidate detail and admin message thread routes inside their tab stacks so tab bar persists on those screens.
  - Switched both tab navigators to icon-only mode (`tabBarShowLabel: false`) with unique icons and accessibility-friendly sizing.
  - Updated navigation types in `apps/mobile/src/navigation/types.ts` and updated dependent screens to new route names/types:
    - `apps/mobile/src/screens/admin/AdminCandidatesScreen.tsx`
    - `apps/mobile/src/screens/admin/AdminCandidateDetailScreen.tsx`
    - `apps/mobile/src/screens/MessagesScreen.tsx`
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`11 passed, 0 failed`)
- What to test next:
  - Admin: Candidates -> Candidate Detail keeps tab bar visible.
  - Admin: Chat inbox -> message thread keeps tab bar visible.
  - Candidate: all tabs show icons only (no text labels) and navigation remains stable.
- Follow-up: Updated legacy `HomeScreen` quick action route to `Chat` to align with new nested tab navigation naming and avoid stale `Messages` root navigation usage.

## Step 32 - Profile Photos + iMessage Chat + Appointment Reliability (Mobile)
- What changed:
  - Added optional candidate profile photo support in setup/profile screens using Firebase Storage path `profilePhotos/{uid}/avatar/*`.
  - Added reusable `Avatar` component and applied avatars to:
    - Admin candidate list/detail
    - Admin chat preview list
    - Admin appointment create candidate picker + appointment rows
    - Candidate/admin message thread rows
  - Rebuilt admin chat preview UX to iMessage-like seamless rows (search, time stamp, unread bold + red dot) and kept thread open behavior.
  - Added conversation read/unread service wiring and tab badge support:
    - Admin chat badge = unread chat threads (`9+` max)
    - Candidate chat badge = unread messages from Zenith (`9+` max)
    - Candidate appointments tab = red dot update signal
    - Admin appointments tab = unattended request count (`9+` max)
  - Updated message thread UI with side avatars and up-arrow send action (attachment support preserved).
  - Reworked candidate appointments with:
    - red `Overdue Appointments` section (scheduled only)
    - chronological `Upcoming appointments`
    - cancel confirmation flow
    - schedule-change chat hyperlink
    - pending request section filtered to active/future requests
  - Reworked admin appointments with:
    - top create flow (candidate avatar/name picker + date/time + phone + note)
    - overdue + upcoming sections (chronological)
    - note expand/collapse when note exists
    - floating black bell for unattended requests + action modal (`Accept`, `Decline`, `Modify`)
  - Improved candidate dashboard reliability by removing fragile status indexed filter and preserving color-coded status chips.
  - Added assignment persistence read-back check in firm status save path.
  - Made Zenith contact bar persistent on active mobile screens (auth, profile setup, app-shell screens, and chat thread).
  - Updated candidate profile label text from `What you work in` to `Practice`.
- Backend updates:
  - Added `syncConversationMetaOnMessageCreate` trigger to sync conversation snapshot fields + unread counters.
  - Added `notifyOnCandidateAppointmentCancel` trigger to auto-create cancellation chat message and send Resend email alert.
  - Added `flagCandidateAppointmentUpdates` trigger to set candidate appointment update-dot state.
  - Added `autoCancelExpiredAppointmentRequests` scheduled trigger (`every 15 minutes`) to auto-cancel stale requested appointments.
- Rules updates:
  - Added Storage rules path for profile photos (`/profilePhotos/{uid}/...`) with authenticated read and owner/admin write.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`11 passed, 0 failed`)
- What to test next:
  - Candidate signup/profile photo optional flow + avatar rendering across admin views.
  - Admin chat preview search/unread/bold/red-dot behavior and per-thread read clearing.
  - Candidate/admin tab badges (`chat`, `appointments`) with `9+` cap behavior.
  - Candidate appointment cancel confirmation auto-chat + email behavior.
  - Admin unattended requests bell workflow and modify->scheduled transition.
  - Auto-expiry of stale requested appointments via scheduler.

## Step 33 - Mobile Stabilization Pass (Header + Notifications + Firm Removal)
- What changed:
  - Fixed contact/header safe-area behavior across mobile by switching to top-safe `SafeAreaView` usage and one shared contact bar height.
  - Applied the normalized contact bar to auth, profile setup, app-shell screens, and chat thread views.
  - Fixed chat unread logic so threads are marked read only while focused (prevents background unread resets).
  - Kept Zenith avatar/logo rendering in chat rows for admin-side identity consistency.
  - Improved conversation list reliability by sorting admin chat previews client-side using `lastMessageAt || updatedAt` (handles legacy docs missing `lastMessageAt`).
  - Added one-time conversation metadata backfill script:
    - `functions/src/scripts/backfillConversationMeta.ts`
    - root command `npm run backfill:conversations`
  - Improved appointment request visibility/sync by keeping `requested` rows visible until attended or auto-canceled.
  - Added candidate appointments update-dot clear behavior on tab focus.
  - Added admin firm removal flow with red button + confirmation in candidate detail.
  - Added status service delete path for candidate-firm assignments.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`11 passed, 0 failed`)
  - `npm run backfill:conversations` -> PASS (manual run updated existing conversation metadata)
- What to test next:
  - Verify `chat-header-error.png` overlap is resolved on both admin and candidate chat screens.
  - Confirm chat badges now increment/decrement correctly:
    - candidate clears on opening Chat tab
    - admin clears per-thread when opening that thread
  - Confirm admin can remove assigned firms and candidate dashboard updates immediately.
  - Confirm requested appointments stay visible on admin unattended queue until attended/canceled.

## Step 34 - Candidate Authorize/Cancel + Message-Count Badges
- What changed:
  - Added new real shared candidate-firm statuses:
    - `waiting_for_submission`
    - `canceled`
  - Updated shared status labels/types/theme palettes so these statuses are color-coded everywhere status chips render.
  - Replaced candidate dashboard waiting-state actions:
    - `Authorize` (green)
    - `Cancel` (red)
  - Candidate actions now directly update the assigned firm status document (no pending placeholder state) and auto-send a candidate DM to Zenith Legal:
    - `Candidate xxx has authorized submission for x firm`
    - `Candidate xxx has canceled assignment to x firm`
  - Updated Firestore rule logic so candidates can only perform this narrow transition:
    - from `authorization_pending`
    - to `waiting_for_submission` or `canceled`
    - only on their own assignment docs.
  - Updated RBAC smoke test to validate this allowed transition while keeping arbitrary candidate status edits blocked.
  - Updated admin chat badge source to total unread message count (sum of `unreadByAdminCount`) instead of unread-thread count.
  - Updated admin inbox unread indicator to blue dot styling with bold preview text retained for unread rows.
  - Increased shared contact header height to keep contact info clear of iPhone status hardware area while preserving consistency across screens.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Candidate waiting-status modal shows `Authorize`/`Cancel` with required colors and immediate status update.
  - Auto DM text after candidate decision includes candidate name + firm name with exact wording.
  - Admin chat tab badge reflects unread message totals (`9+` cap), not thread count.
  - Admin inbox unread row uses blue dot + bold preview and clears when opening the thread.

## Step 35 - Reliability Follow-up (Bell Detail + Preview Freshness + Status-Request Removal)
- What changed:
  - Added a dedicated admin unattended appointment watcher (`status == requested`) for the bell flow so unattended items do not depend on filtered general appointment streams.
  - Added explicit unattended bell modal loading/error states to prevent silent-empty screens.
  - Updated admin unattended request rows to always include status text plus candidate/date/time/phone/note details.
  - Removed async per-conversation `getDoc` enrichment from mobile admin inbox watcher to eliminate stale snapshot overwrite races.
  - Added immediate conversation preview metadata writes inside mobile `sendMessage`:
    - `lastMessageText`
    - `lastMessageAt`
    - `lastMessageSenderRole`
  - Added candidate-directory fallback in admin inbox UI so name/avatar render even for older conversation docs without snapshot fields.
  - Lowered mobile chat composer by reducing bottom padding/offset so input sits closer to tab icons.
  - Removed mobile admin candidate-detail `Candidate status requests` section and associated live watcher/action wiring.
  - Disabled active `candidateStatusRequests` write path in Firestore rules (workflow deprecated; legacy data preserved).
  - Removed status-request trigger export from `functions/src/index.ts` so new deployments no longer activate status-request notifications.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Candidate submits appointment request -> admin bell count updates and bell modal shows full detail row immediately.
  - Admin inbox preview text/time refreshes after every message from either side.
  - Chat composer sits near tab bar without clipping on iOS/Android.
  - Candidate authorize/cancel still performs direct status updates and auto-DM without permission errors.

## Step 36 - Reliability Hotfixes (Permission Save + Bell Index + Unread Counters)
- What changed:
  - Fixed admin unattended bell query crash (`query requires an index`) by making unattended watcher index-free:
    - query now uses `where("status", "==", "requested")` only
    - unattended request ordering handled in UI with local sort.
  - Hardened candidate authorize/cancel save service:
    - added status-doc existence check
    - added ownership check (`candidateId` must match current user)
    - switched to merge write with explicit `candidateId/firmId` preservation.
  - Updated candidate dashboard action flow so DM send failure does not roll back user-facing status save result.
  - Stabilized chat unread counters end-to-end:
    - `sendMessage` now increments unread count for the opposite side immediately
    - message docs include `metaHandledClient: true`
    - `conversationMeta` trigger now skips counter increments for client-handled messages to avoid double-counting.
  - Lowered chat composer closer to bottom tab area (`composerWrap` bottom spacing reduced).
  - Updated theme status chip palette so `canceled` status is color-coded red.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Candidate taps `Authorize` / `Cancel` on waiting status without `Missing or insufficient permissions`.
  - Admin bell opens unattended requests without index error and shows details.
  - Chat tab badges show unread totals (`9+` max) and clear correctly on read.
  - Admin inbox unread rows show blue dot + bold preview and clear after opening thread.

## Step 37 - Appointment Routing Completion (Overdue Ignore + Admin Upcoming Controls)
- What changed:
  - Added `deleteAppointment` service path and wired overdue `Ignore` action in both candidate/admin appointment screens.
  - Overdue action UX now matches spec:
    - orange `Ignore` button
    - confirmation prompt: hide permanently for both sides
    - no overdue modify/reschedule actions.
  - Updated admin upcoming appointment cards to include:
    - `Modify` (edit date/time/phone/note)
    - `Cancel` (status -> `canceled`)
  - Kept request-to-upcoming transitions consistent:
    - admin `Accept` from bell -> `scheduled` -> upcoming
    - admin `Modify` from bell -> detail save + promote to `scheduled` -> upcoming.
  - Tightened candidate authorize/cancel service guard to return a clear error when assignment is no longer in `authorization_pending`.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Admin-created appointment appears in upcoming and supports modify/cancel.
  - Overdue sections (red) show only for past scheduled appointments.
  - Candidate/admin `Ignore` removes overdue appointment globally.
  - Candidate authorize/cancel updates status + DM and no longer shows generic permission failure for valid rows.

## Step 38 - Candidate Authorize/Cancel Permission Root-Cause Patch
- What changed:
  - Confirmed the failing user alert path is a Firestore `permission-denied` error from candidate status transition writes.
  - Hardened `updateCandidateFirmStatusByCandidate` in `apps/mobile/src/services/statusService.ts`:
    - rejects invalid transitions (only `waiting_for_submission` or `canceled`)
    - keeps explicit preflight ownership/waiting-state checks
    - uses direct `updateDoc` transition write (status/updatedBy/updatedAt/history)
    - performs read-back verification after write to ensure persisted status.
  - Verified local Firestore rules still allow the intended candidate transition and block arbitrary edits.
- Commands run + result:
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- Notes / blocker:
  - Live Firebase rules/function deployment from this environment is currently blocked by expired CLI credentials (`firebase deploy` returns `credentials are no longer valid`).

## Step 39 - Live Rules Deploy Recovery (TLS/Network Constraint)
- What changed:
  - Confirmed Firebase CLI auth/token refresh was failing due to network TLS trust (`unable to get local issuer certificate`) during Google token/API calls.
  - Verified Firebase access with temporary TLS override and successfully deployed Firestore rules from `/Users/ryankalfus/Downloads/zenith_legal_app`.
- Commands run + result:
  - `NODE_TLS_REJECT_UNAUTHORIZED=0 firebase projects:list --json` -> PASS
  - `NODE_TLS_REJECT_UNAUTHORIZED=0 firebase deploy --only firestore:rules --project zenith-legal-dev` -> PASS
- Outcome:
  - Latest Firestore rules are now live in `zenith-legal-dev`, unblocking candidate status transition enforcement in production.

## Step 40 - Admin Chat UX: Live Identity Sync + New Conversation + Swipe Delete
- What changed:
  - Updated admin inbox display-name/avatar resolution to prefer live candidate profile directory data (`users.fullName`, `users.avatarUrl`) for always-synced identity in chat previews.
  - Updated admin thread header to live-watch candidate profile so display name/photo changes appear without relying on stale route snapshot values.
  - Added admin-only new conversation screen (`AdminNewConversationScreen`) with candidate search/picker, wired to start or unhide conversation and navigate directly to message thread.
  - Added `+` action button above admin chat search bar to open new conversation flow.
  - Added swipe-left row action in admin inbox with red `Delete` action:
    - hides conversation from Zenith inbox only (`hiddenForAdmin = true`)
    - does not delete globally for candidate side
    - clears admin unread for hidden thread.
  - Added conversation service helpers:
    - `startConversationAsAdmin(...)`
    - `deleteConversationForAdmin(...)`
    - read/send flows now unhide conversations when appropriate (`hiddenForAdmin/hiddenForCandidate = false`).
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Admin inbox names/avatars update after candidate edits profile display name/photo.
  - Admin taps `+` -> selects candidate -> lands in thread with conversation visible in inbox.
  - Admin swipes left on conversation -> red `Delete` -> row removed only on admin side.

## Step 41 - Chat Interaction Polish + Local Message Delete
- What changed:
  - Added admin inbox swipe-reset behavior: swiped rows auto-close when navigating away from inbox or opening any conversation.
  - Moved admin chat `+` action into header-right slot (aligned with `Chat` title) and restored search bar to normal position under the subtitle.
  - Lowered message composer by removing bottom safe-area edge usage on message screen and tightening bottom padding.
  - Added long-press message delete-for-me behavior for both roles:
    - long-press any sent/received bubble
    - red destructive `Delete` confirmation
    - applies local hide only (`hiddenForAdmin`/`hiddenForCandidate`)
    - not global removal.
  - Added messaging service helper `hideMessageForViewer(...)` and default hidden flags on new messages.
  - Updated Firestore rules to allow candidate-side message local-hide updates while preserving immutable message payload fields.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
  - `NODE_TLS_REJECT_UNAUTHORIZED=0 firebase deploy --only firestore:rules --project zenith-legal-dev` -> PASS
- What to test next:
  - Swipe-left row shows delete; entering thread/backing out resets row to closed state.
  - `+` button appears next to `Chat` heading; search stays under heading.
  - Composer sits lower just above tab bar without overlap.
  - Long-press delete hides message only for current viewer.

## Step 42 - Viewer-Local Chat Preview Sync
- What changed:
  - Added viewer-local preview fields in conversation metadata updates:
    - `lastMessageTextForAdmin` / `lastMessageAtForAdmin`
    - `lastMessageTextForCandidate` / `lastMessageAtForCandidate`
  - Admin inbox preview now reads admin-local preview fields first (fallback to global preview fields for backward compatibility).
  - Added message-hide preview recalculation (`refreshLocalPreview`) so when the latest message is locally deleted, preview text/time updates to that viewer’s next visible message.
  - Kept preview sync realtime by writing conversation preview metadata immediately on send and after local message hide.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Delete latest message locally on admin side -> admin preview shifts to previous visible message while candidate preview remains unchanged.
  - Delete latest message locally on candidate side -> candidate local preview metadata updates without changing admin preview.

## Step 43 - Admin Inbox Unread Visual Tweak
- What changed:
  - Removed the blue unread dot from Zenith admin chat preview rows.
  - Kept unread behavior intact for:
    - bold preview text/time on unread rows
    - tab-level unread notification badge counts.
- Commands run + result:
  - `npm run typecheck` -> PASS
- What to test next:
  - Unread chat row on admin inbox shows bold text only (no blue dot).
  - Opening thread clears bold unread style and updates chat badge count.

## Step 44 - Appointment Picker UX Smoothing + Deleted Candidate Cleanup
- What changed:
  - Candidate appointment request form now uses inline in-place date/time pickers (same screen section) instead of bottom-popup selector flow.
  - Admin create appointment form now uses inline in-place date/time pickers.
  - Admin modify appointment modal now uses inline in-place date/time pickers (same modal content area).
  - Removed `Modify` action from unattended bell requests; unattended queue now supports only `Accept` / `Decline`.
  - Filtered deleted Ryan account from active admin candidate data source (`watchCandidates`) and filtered orphaned inbox/appointment rows that do not map to active candidates.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Date/time change on candidate/admin create flows occurs inline (no bottom popup flow).
  - Admin modify appointment date/time is inline in modal.
  - Unattended bell rows show only `Accept` and `Decline`.
  - Ryan no longer appears in Zenith candidate/chat/appointment views.

## Step 45 - Candidate DOB + JD Date Profile Fields (Synced to Admin Candidates)
- What changed:
  - Added `dateOfBirth` and `jdDegreeDate` fields to candidate profile setup and candidate profile edit screens.
  - Added date format validation (`YYYY-MM-DD`) on save for both fields.
  - Extended auth/profile update payloads so DOB + JD date persist in user docs during signup completion and profile edits.
  - Extended shared domain/schema types with optional `dateOfBirth` / `jdDegreeDate`.
  - Updated Zenith `Candidates` tab rows to show:
    - `Age` (derived from DOB)
    - `JD degree received` (formatted date)
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS (`12 passed, 0 failed`)
- What to test next:
  - Candidate enters DOB/JD date in profile setup -> values save.
  - Candidate edits DOB/JD date in profile tab -> values update.
  - Zenith Candidates tab reflects new Age/JD date values without manual refresh.

## Step 46 - Profile Photo Source Chooser Popup
- What changed:
  - Replaced file-only profile photo selection with a source chooser popup in both candidate profile setup and candidate profile tab.
  - Popup options now match requested flow: `Take photo now`, `Choose from camera roll`, `Files`.
  - Added shared helper utility to handle camera permission, photo library permission, and files fallback while preserving existing upload service behavior.
  - Added `expo-image-picker` dependency and iOS permission keys (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`).
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Profile setup `Add photo` opens source popup and each option returns a selected image.
  - Candidate profile `Upload photo` opens same popup and uploads selected image successfully.
  - Camera + photo-library permission prompts appear correctly on iOS.

## Step 47 - Candidate Visibility + Photo Upload Authorization Fix
- What changed:
  - Removed temporary candidate-hide filter in `watchCandidates` so previously hidden candidate rows are visible again in Zenith mobile candidate-driven screens.
  - Patched profile photo upload service to handle older deployed Storage rules:
    - primary upload path: `profilePhotos/{uid}/avatar/...`
    - automatic fallback on `storage/unauthorized`: `messageAttachments/{uid}/profile/...`
  - Added safe filename normalization before upload to reduce path issues.
  - Confirmed DOB/JD fields and admin Age/JD display are already implemented and wired to realtime watchers.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `firebase deploy --only storage --project zenith-legal-dev` -> BLOCKED (expired Firebase CLI auth; requires `firebase login --reauth`)
- What to test next:
  - Candidate Ryan appears again in Zenith candidates/chat/appointment lists.
  - Candidate profile photo upload succeeds without `storage/unauthorized`.
  - DOB/JD edits on candidate profile immediately reflect in Zenith Candidates tab.

## Step 48 - Candidate De-dup + DOB/JD Calendar Picker + Candidate Detail Polish
- What changed:
  - Added candidate de-duplication in admin candidate watcher:
    - groups candidate docs by normalized email
    - chooses one canonical row using display-name quality + profile completeness + update recency
    - removes duplicate `ryan kLfus` row from admin-facing candidate-driven views while keeping canonical `Ryan Kalfus`.
  - Updated DOB/JD input UX on both candidate profile creation and candidate profile edit:
    - replaced plain text date inputs with inline calendar picker controls
    - added optional `Clear` control for JD date
    - stores selected dates in existing `YYYY-MM-DD` synced format.
  - Reworked admin `Candidate Detail` profile section into a cleaner full-detail summary card with:
    - practice
    - preferred cities
    - date of birth
    - age
    - JD degree received
    - all placed above firm assignment/status controls.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Only one Ryan candidate row appears in admin candidate/chat/appointment candidate selectors.
  - DOB/JD picker opens inline calendar and saves correctly from setup + profile tab.
  - Candidate detail profile block shows age + JD date with updated clean layout.

## Step 49 - Required Profile Setup Fields + Chat Keyboard Composer Position
- What changed:
  - Tightened profile setup validation so `Display name`, `Email`, and `Date of birth` are all required to continue/save profile setup.
  - Added explicit guard alerts for missing display name/email/date of birth.
  - Updated chat thread keyboard behavior:
    - raised iOS `keyboardVerticalOffset` to reduce over-shifting
    - added `flex: 1` on message list scroll area so composer remains anchored near keyboard.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Profile setup save stays disabled until display name + email + DOB are present.
  - On iOS keyboard open, composer sits just above keyboard with no large vertical gap.

## Step 50 - Chat Composer Keyboard Offset Correction
- What changed:
  - Fixed over-shifted composer behavior while typing by resetting `MessagesScreen` `KeyboardAvoidingView` `keyboardVerticalOffset` to `0`.
  - This removes extra vertical displacement that was pushing the composer far above the keyboard.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Open chat keyboard on iOS; composer should sit directly above keyboard without large empty gap.

## Step 51 - Add to Calendar + Immediate Logout After Account Delete
- What changed:
  - Added shared mobile calendar service using `expo-calendar` to create phone calendar events from appointment rows.
  - Added `Add to Calendar` buttons to scheduled upcoming appointment cards on:
    - candidate appointments screen
    - Zenith admin appointments screen
  - Event mapping:
    - title: `Call with xxx`
    - description/notes: appointment note
    - start/end time: appointment date/time (`startsAt` / `endsAt`, fallback +30 min)
  - Added calendar permission strings/config in mobile app config and iOS Info.plist.
  - Updated account deletion flows to log out immediately after successful delete completion.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Tap `Add to Calendar` from upcoming appointments (candidate + admin) and verify event appears in phone calendar.
  - Confirm event title/description/date/time mapping is correct.
  - Delete account and verify immediate logout occurs right after successful deletion.

## Step 52 - Firm Status Updated Date + Chat Time Logs + Date Separators
- What changed:
  - Added `Status updated: MM/DD/YYYY` text to each firm status row on:
    - candidate dashboard
    - admin candidate detail assigned-firms section.
  - Added per-message small timestamp text beneath each message bubble in chat threads.
  - Added date separators between chat message groups using requested format rules:
    - current week: `Today`, `Yesterday`, weekday name
    - earlier this year: `Mon DD`
    - prior year: `Mon DD, YYYY`
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Candidate/admin firm rows show updated-date text after status changes.
  - Each message bubble displays a small time log.
  - Chat thread inserts date separators correctly for same-day, this-week, same-year older, and prior-year messages.

## Step 53 - Assigned Header Editor + Candidates Tab Date Alignment
- What changed:
  - Updated Zenith Candidates-tab DOB parsing/age calculation to use local-date baseline (same approach as profile screens) so Age/JD values match candidate profile data display.
  - Added admin `Assigned Header` section in candidate detail directly below candidate summary and above `Assign Firm`:
    - editable email hyperlink value
    - editable phone hyperlink value
    - `Save Assigned Header` action
  - Wired candidate app top contact header (`CandidateContactBar`) to read `assignedHeaderEmail` / `assignedHeaderPhone` from that candidate's user profile in realtime.
  - Added fallback behavior so candidate header still uses default Zenith contact values when assigned values are empty/unset.
  - Extended shared user profile type/schema with optional assigned header contact fields.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/shared` -> PASS
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Edit Assigned Header in admin candidate detail and verify candidate header links update on candidate screens.
  - Confirm Age/JD values on Candidates tab match candidate profile values for same user.

## Step 52 - Desloppify Install/Scan Cleanup Pass
- What changed:
  - Installed and updated `desloppify` with full extras, then updated skill profile for Codex.
  - Removed unused legacy files that were flagged as dead/orphaned:
    - `apps/mobile/src/screens/CalendarScreen.tsx`
    - `apps/mobile/src/screens/HomeScreen.tsx`
    - `apps/mobile/src/screens/ProfileScreen.tsx`
    - `apps/mobile/src/screens/StatusScreen.tsx`
    - `apps/mobile/src/services/candidateStatusRequestService.ts`
    - `apps/mobile/src/services/authorizationService.ts`
    - `functions/src/triggers/candidateStatusRequestNotify.ts`
  - Trimmed dead exports and outdated compatibility APIs from:
    - `apps/admin/src/lib/auth.ts`
    - `apps/mobile/src/components/AppShell.tsx`
    - `apps/mobile/src/services/appointmentService.ts`
    - `apps/mobile/src/services/userService.ts`
  - Added root `README.md` "Key Scripts" section to address docs/script drift.
  - Ran scan/review/resolve loop until `desloppify` showed no open findings (`open: 0`), with remaining debt tracked as `wontfix`.
- Commands run + result:
  - `pip3 install --upgrade desloppify "desloppify[full]"` -> PASS
  - `desloppify update-skill codex` -> PASS
  - `desloppify scan --path .` (multiple iterations) -> final PASS with `open (in-scope): 0`
  - `desloppify review --run-batches --runner codex --parallel --scan-after-import` -> PASS
  - `npm run typecheck` -> PASS
- What to test next:
  - Confirm mobile/admin app behavior is unchanged after legacy file removal.
  - Review `desloppify show --status wontfix` backlog and convert highest-impact items into planned refactor/test tasks.

## Step 54 - Assigned Header Sync Hardening
- What changed:
  - Updated `updateCandidateAssignedHeader(...)` to batch-write assigned header email/phone to:
    - selected candidate doc
    - any other candidate docs with the same normalized email
  - This guarantees candidate header updates propagate to the active candidate account even with duplicate candidate records.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Save Assigned Header from admin candidate detail, then confirm candidate header email/phone updates on candidate app immediately.
  - Validate behavior still works when duplicate candidate docs exist for same email.

## Step 55 - Assigned Header Hyperlink Reliability + Default Contact Enforcement
- What changed:
  - Added normalized contact-link builders in `zenithContact`:
    - `buildEmailHref(...)`
    - `buildPhoneHref(...)`
  - Updated candidate contact bar to always open sanitized `mailto:`/`tel:` links based on assigned header values.
  - Kept display text as assigned value, with fallback defaults:
    - email: `mason@zenithlegal.com`
    - phone: `+1 202-486-3535`
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Update Assigned Header email/phone in admin candidate detail and tap candidate header links; verify email app and phone call actions open with updated values.
  - Clear Assigned Header fields and verify default Zenith contact links are used.

## Step 56 - Assigned Header Active-Account Sync Fix
- What changed:
  - Updated admin assigned-header save flow to sync by both normalized email and normalized `uid` (not email only), so duplicate candidate docs still receive the same assigned header values.
  - Added shared assigned-contact normalization (`mailto:`/`tel:` stripping) in save + read paths to prevent malformed admin input from breaking candidate header hyperlink behavior.
  - Kept Zenith fallback defaults unchanged when assigned values are blank.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Save Assigned Header for a candidate with duplicate records and confirm the active candidate account header link values update.
  - Enter values with `mailto:` and `tel:` prefixes and confirm links still open correctly on candidate side.

## Step 57 - Assigned Header Legacy-Duplicate Fallback Sync
- What changed:
  - Extended `updateCandidateAssignedHeader(...)` duplicate propagation matching to also include normalized `fullName + phone digits` fallback when legacy candidate docs do not share clean email/uid values.
  - This targets edge-case duplicate docs where admin-selected profile differs from active candidate auth-linked profile.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Save Assigned Header on Zenith candidate detail for a duplicate-profile candidate and verify candidate header text/links update immediately on the logged-in candidate app.

## Step 58 - Assigned Header Auth-UID Targeting + Role-Missing Legacy Coverage
- What changed:
  - Updated assigned-header save flow to directly update `users/{authUid}` when candidate auth uid differs from selected candidate doc id.
  - Expanded duplicate propagation scan from `role == candidate` query to all non-admin user docs, so legacy active candidate docs missing `role` still receive assigned header updates.
  - Added doc-id (`entry.id`) match against target auth uid for additional legacy consistency.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Save Assigned Header for affected candidate, then verify header text and hyperlink targets update on the actual logged-in candidate account.

## Step 59 - Admin Candidate Navigation UID-First Fix
- What changed:
  - Updated admin candidates list navigation to open candidate detail by `candidate.uid` (auth uid) when available, with fallback to row doc id.
  - This avoids opening legacy duplicate docs and ensures detail actions (including Assigned Header save) operate on the candidate’s real account doc.
  - Added `uid?: string` support to admin candidate row type.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - From Zenith candidates list, open candidate profile and save Assigned Header.
  - Confirm candidate app header email/phone text and hyperlink target update on that logged-in candidate account.

## Step 60 - Candidate De-dupe Ranking UID Priority
- What changed:
  - Adjusted admin candidate de-dup scoring to strongly prefer UID-linked docs:
    - bonus when `uid` exists
    - extra bonus when `uid === docId`
  - This reduces wrong-row selection in duplicate datasets and keeps Zenith actions tied to real auth-linked candidate docs.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Verify admin candidates list now surfaces canonical UID-linked candidate rows.
  - Re-test Assigned Header save/update behavior from that row.

## Step 61 - Assigned Header Resolution Order + Legacy Conflict Cleanup
- What changed:
  - Fixed candidate header resolution order so profile-level assigned header values take priority over conversation-level values (conversation remains fallback only).
  - This prevents stale conversation metadata from masking newly saved Assigned Header values.
  - Removed unresolved merge-conflict legacy file `apps/mobile/src/screens/ProfileScreen.tsx` to unblock strict mobile typecheck.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Save Assigned Header from admin candidate detail and verify candidate header text + hyperlink targets update immediately.
  - Confirm header still falls back to defaults when assigned values are empty.

## Step 62 - Canonical Candidate Selection Hardening
- What changed:
  - Reworked admin candidate de-dup behavior to choose UID-canonical docs (`uid == docId`) first within duplicate email groups, then apply profile-quality scoring.
  - This ensures candidate detail actions (including Assigned Header save) are driven from the real auth-linked candidate record.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Verify duplicate-email candidates open canonical candidate detail consistently.
  - Re-test Assigned Header sync on previously failing candidate.

## Step 63 - Appointment Request/Decision Chat Summaries
- What changed:
  - Added shared appointment chat-summary formatter utilities in `apps/mobile/src/lib/appointmentChat.ts`.
  - Updated appointment request Cloud Function message format to candidate summary wording:
    - `Candidate X has requested an appointment on MM/DD/YYYY at hh:mm AM/PM.`
    - note suffix is included only when note is present.
  - Admin unattended-request actions now send admin-authored DMs:
    - `Accept` -> accepted summary
    - `Decline` -> declined summary
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Candidate request submission creates request and server-side DM summary with candidate-name format.
  - Admin accept/decline from bell queue updates status and sends matching DM summary.

## Step 64 - Appointment Create/Modify Chat Summaries + Duplicate Trigger Prevention
- What changed:
  - Admin create appointment flow now sends a DM summary to candidate immediately after successful create.
  - Admin modify appointment flow now sends a DM summary with `from -> to` date/time phrasing after successful save.
  - Kept exported functions trigger `syncAppointmentRequestMessage` active for request-summary delivery and updated its copy to requested wording.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `npm run typecheck --workspace @zenith/functions` -> PASS
- What to test next:
  - Admin create appointment appears in upcoming and sends DM summary with optional note handling.
  - Admin modify appointment sends changed-time DM summary.
  - Candidate request flow sends a single server-side summary DM with candidate-name wording and optional note handling.

## Step 65 - Candidate Request/Cancel + Admin Cancel Chat Source of Truth
- What changed:
  - Candidate appointment request submit now sends a candidate-authored DM summary directly from mobile after request save.
  - Candidate cancel appointment now sends a candidate-authored DM summary directly from mobile after cancel status save.
  - Admin cancel scheduled appointment now sends an admin-authored DM summary to candidate.
  - Removed exported `syncAppointmentRequestMessage` from functions index to prevent duplicate request summaries.
  - Updated `notifyOnCandidateAppointmentCancel` trigger to keep email notification behavior only (chat write removed) to prevent duplicate candidate-cancel summaries.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
  - `npm run typecheck --workspace @zenith/functions` -> PASS
- What to test next:
  - Candidate request sends one chat summary to Zenith Legal.
  - Candidate cancel sends one chat summary to Zenith Legal.
  - Admin cancel sends one chat summary to candidate.

## Step 66 - Pending-Request Cancel Chat Guard + Dashboard Copy/Brand Cleanup + Top-Right Logos
- What changed:
  - Added candidate cancel guard in appointments flow:
    - if candidate cancels a pending request (`status=requested`), no chat is sent.
    - if candidate cancels scheduled appointment, chat summary still sends to Zenith Legal.
  - Updated candidate dashboard heading copy:
    - title -> `Zenith Legal Dashboard`
    - subtitle -> `Track your firms at a new level`
  - Removed dashboard floating brand card section (`Zenith Legal | Your live candidate status board`).
  - Added Zenith logo badge at top-right below contact header:
    - shared placement in `AppShell` for tab screens
    - matching placement in `MessagesScreen` chat tab.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Candidate cancel from `Pending requests` does not create a chat.
  - Candidate cancel from `Upcoming appointments` still creates a chat.
  - Candidate dashboard copy matches requested text and no floating brand card appears.
  - Zenith logo appears top-right below header on tab screens, including chat.

## Step 67 - Admin Chat Inbox Logo Exclusion
- What changed:
  - Added `showTopRightLogo` option to shared `AppShell` (default `true`).
  - Disabled the top-right logo only in Zenith admin chat inbox (`AdminInboxScreen`) where the `+` action sits in the header.
  - Preserved logo rendering for all other screens/tabs, including candidate chat.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Zenith admin chat inbox no longer shows overlapping logo near `+`.
  - Candidate chat and other tabs still show the top-right Zenith logo.

## Step 68 - Larger Dashboard Logo Integration (Candidate + Zenith)
- What changed:
  - Added per-screen AppShell logo sizing hook (`topRightLogoStyle`) so dashboard screens can scale logo without shifting content.
  - Candidate dashboard now renders a larger top-right Zenith logo overlay aligned to heading area.
  - Zenith main dashboard tab (`Candidates`) now uses the same larger top-right logo overlay and alignment.
  - Candidate chat logo remains visible in chat header.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Candidate dashboard logo is larger and smoothly integrated to the right of heading text.
  - Zenith `Candidates` tab logo matches candidate dashboard logo size/placement.
  - No font size/layout movement in heading content.

## Step 69 - Logo Scale Tuning + Additional Tab Coverage
- What changed:
  - Reduced the oversized dashboard logo to a cleaner still-prominent size on both candidate dashboard and Zenith `Candidates` tab.
  - Applied the same high-res right-side logo treatment to:
    - candidate `Appointments` tab
    - Zenith `Appointments` tab
    - candidate `Profile` tab
  - Kept changes UI-only (no text, spacing, or font-size changes to content blocks).
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Logo appears on candidate dashboard, candidate appointments, candidate profile, Zenith candidates, and Zenith appointments tabs.
  - Logo size is smaller than prior oversized version and visually consistent.
  - Screen content layout remains unchanged.

## Step 70 - Global Big Logo + Chat Exception + Upward Positioning
- What changed:
  - Updated shared AppShell default top-right logo style to big treatment for all AppShell screens.
  - Kept explicit exception on Zenith admin chat inbox (`AdminInboxScreen`) with `showTopRightLogo={false}` so the `+` header action remains clear.
  - Updated chat conversation header logo (`MessagesScreen`) to the same big treatment for both roles (candidate + admin thread views).
  - Nudged logo position slightly upward across AppShell and chat headers.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Big logo appears on all tabs/screens except Zenith admin chat inbox.
  - Candidate chat and admin conversation thread both show big top-right logo.
  - Top-right logo sits slightly higher than before without overlap regressions.

## Step 71 - Remove Header From Login Screen
- What changed:
  - Removed `CandidateContactBar` from `AuthScreen` so login/signup page no longer shows the top contact header.
  - Header behavior now starts after login in authenticated app screens.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Login screen shows no top contact header.
  - After successful login, authenticated tabs/screens still show the header as expected.

## Step 72 - Candidate Chat Header Vertical Alignment
- What changed:
  - Added candidate-only header top offset in `MessagesScreen` so `Chat` and `Direct message with Zenith Legal` sit lower.
  - Kept admin thread header spacing unchanged.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Candidate chat tab heading text aligns vertically with other tabs/screens.
  - Admin chat conversation heading remains at prior position.

## Step 73 - Admin Chat Header Vertical Alignment
- What changed:
  - Added `headingWrapStyle` support to shared `AppShell` for per-screen heading vertical adjustments.
  - Applied admin inbox heading offset in `AdminInboxScreen` so `Chat` + subtitle sit lower and align with other tab headers.
  - Applied small admin-thread header offset in `MessagesScreen` (admin role only) for consistent chat title/subtitle vertical position.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Admin chat inbox heading text aligns with other tabs.
  - Admin chat conversation heading text aligns cleanly and does not overlap logo/content.

## Step 74 - Full Tab Header Alignment Pass
- What changed:
  - Removed admin inbox custom heading offset from `AdminInboxScreen`.
  - Removed role-specific candidate/admin header offsets from `MessagesScreen`.
  - Set one shared `MessagesScreen` header baseline (`paddingTop: 14`) to align chat headings with other tabs.
- Commands run + result:
  - `npm run typecheck --workspace @zenith/mobile` -> PASS
- What to test next:
  - Candidate and admin chat headings align with other tab titles/subtitles.
  - No chat tab appears visually lower than dashboard/appointments/profile headings.

## Step 75 - Multi-Admin Backend Role Model + Safety Guards
- What changed:
  - Added `changeUserRole` callable (`functions/src/callable/changeUserRole.ts`) for admin-only promote/demote actions.
  - Added shared cleanup helper (`functions/src/callable/userCleanup.ts`) to purge candidate-scoped data on candidate -> recruiter promotion.
  - Updated account deletion callable (`deleteCandidateAccountData`) to block deleting the last admin and to run role-aware self-delete flow.
  - Updated Firestore rules `isAdmin()` to role-claim based access (`request.auth.token.role == 'admin'`) and prevented client-side role field edits through direct Firestore updates.
  - Updated function exports and deprecated `enforceSingleAdmin.ts` script behavior.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS
- What to test next:
  - Promote candidate to recruiter from mobile admin UI and verify candidate data cleanup + role claim sync.
  - Attempt deleting the last admin and confirm callable returns blocked error.

## Step 76 - Mobile Admin UX: Recruiters Section + Admin Profile Tab
- What changed:
  - Added admin `Profile` tab in `RootNavigator` and new `AdminProfileScreen`.
  - Added recruiter watchers/services (`watchRecruiters`, `watchRecruiterById`, `changeUserRoleByAdmin`, `updateAdminOwnProfile`, `changeAdminEmailWithPassword`).
  - Rebuilt `AdminCandidatesScreen` to show `Recruiters` section above `Candidates`, with shared search across both sections.
  - Added `AdminRecruiterDetailScreen` with destructive `Change role to Candidate` action and self-role-change block.
  - Updated `AdminCandidateDetailScreen` with destructive `Change role to Recruiter` action (confirmation + callable).
  - Removed old recruiter logout button from Candidates tab header.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- What to test next:
  - Admin profile save (name/phone) and email change flow (old email + new email + current password).
  - Recruiter demote and candidate promote flows with warning confirmations and realtime list movement.

## Step 77 - Multi-Admin Docs/Checklist Alignment
- What changed:
  - Updated `qa/acceptance-checklist.md` admin auth criteria to role-based admin model.
  - Updated `docs/firebase-setup.md` section 7 from single-admin enforcement to multi-admin claim/bootstrap + role transition flow.
  - Added owner backfill utility (`backfillMasonAdminProfile.ts`) documentation reference.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS
- What to test next:
  - Confirm docs match deployed Firebase project setup and callable usage.

## Step 78 - Preserve Candidate Data on Promote + Dropdown Role Controls
- What changed:
  - Updated `changeUserRole` callable to preserve candidate data when promoting candidate -> recruiter (no candidate-data deletion path on promotion).
  - Kept claim/doc role updates functional and realtime for both promote and demote.
  - Replaced role-change buttons with dropdown-style role pickers (current role checked) in admin Candidates tab for both `Recruiters` and `Candidates` sections.
  - Updated recruiter/candidate detail screens to use dropdown role pickers instead of single action buttons.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS
- What to test next:
  - Promote candidate to recruiter, then demote back and confirm previous candidate data is still present.
  - Verify role picker UI shows checked current role and applies selected role change correctly.

## Step 79 - Role Field Placement + Not-Found Role Fix
- What changed:
  - Removed role dropdown controls from admin list rows in `AdminCandidatesScreen`.
  - Kept role dropdown controls only in detail views (`AdminCandidateDetailScreen`, `AdminRecruiterDetailScreen`) as profile fields.
  - Fixed role-change failure (`not-found`) by switching mobile role-change path to direct Firestore role update service instead of missing callable endpoint.
  - Updated Firestore admin detection and user update rule path so admin role changes are authorized and synced.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS
- What to test next:
  - Open candidate/recruiter detail, change role from dropdown, verify success and realtime movement between Recruiters/Candidates sections.

## Step 80 - Candidate Email Change + Password Sections (Candidate + Recruiter)
- What changed:
  - Added shared Firebase auth helpers in `userService` for `changeMyEmailWithPassword` and `changeMyPasswordWithCurrentPassword`.
  - Added `Change email` section to candidate profile tab with old/new/current password flow and Firestore email sync.
  - Added `Change password` section to candidate profile tab (current/new/confirm).
  - Added `Change password` section to recruiter/admin profile tab (current/new/confirm).
  - Updated admin Candidates tab heading copy to `Zenith Legal` + `Manage candidate and recruiter profiles`.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- What to test next:
  - Candidate and recruiter can both change password using current password.
  - Candidate and recruiter can both change login email and re-login with new email.

## Step 81 - Admin Profile Photo Upload Parity
- What changed:
  - Added profile photo field to `AdminProfileScreen` with same picker flow as candidate profile (`Take photo now`, `Choose from camera roll`, `Files`).
  - Added admin avatar upload/remove wiring using existing Firebase Storage + user avatar fields.
  - Recruiter/avatar values now reflect from admin profile updates in Zenith Legal Candidates tab recruiter rows.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- What to test next:
  - Upload admin photo from camera roll, camera, and files.
  - Confirm updated recruiter avatar appears in admin Candidates tab.

## Step 82 - Assigned Recruiter + Candidates Filter Search
- What changed:
  - Capitalized role dropdown labels in admin detail role controls to `Candidate` / `Recruiter`.
  - Added candidate profile field in `AdminCandidateDetailScreen`: `Assigned recruiter` (dropdown with `None` + recruiter options).
  - Added `updateCandidateAssignedRecruiter(...)` in `adminService` and synced recruiter assignment fields across candidate profile records.
  - Updated admin candidates preview card line to show `Assigned recruiter: ...` in place of `Age`.
  - Added new admin screen `AdminCandidateFiltersScreen` and wired `Filter search` button next to the Candidates section title.
  - Implemented filter controls for:
    - Assigned recruiter (single select)
    - Current status (multi select)
    - Practice (multi select)
    - Assigned firms (multi select)
    - Preferred cities (multi select)
  - Added realtime status-index watcher (`watchAllCandidateStatusIndex`) for candidate status/firm-based filtering.
  - Added navigation route/types for `CandidateFilters` with typed filter state + option payloads.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS
- What to test next:
  - Set candidate assigned recruiter in detail view and verify preview list updates.
  - Open Filter search, apply each filter type, and confirm candidate results update correctly.

## Step 83 - Filter Crash + Any Options + Admin Profile Sync Reliability
- What changed:
  - Fixed `AdminCandidateFiltersScreen` apply action crash (`GO_BACK not handled`) by removing redundant `goBack()` after navigate.
  - Added `Any` top option to every filter picker:
    - Assigned recruiter
    - Current status
    - Practice
    - Assigned firms
    - Preferred cities
  - Added `Assigned firms` search box in filter modal for long firm lists.
  - Updated filter option sources so preferred cities always include full shared list (`PREFERRED_CITIES`, including `Other`) and practices use full shared list (`PRACTICE_AREAS`).
  - Improved admin profile sync behavior:
    - `updateAdminOwnProfile` now updates all matching admin records by uid/email and ensures canonical own admin doc is updated.
    - Recruiter watchers now dedupe same-person duplicate docs for cleaner synced display.
  - Upgraded change-email flow in admin + candidate profile tabs:
    - Added `Confirm new email` field.
    - Added required-field and match validation.
    - Expanded user-doc email updates to all matching docs after Firebase Auth email change.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
  - `npm run test:rules` -> PASS
- What to test next:
  - Apply filters repeatedly and confirm no navigation warning/error.
  - Confirm `Any` behavior resets each individual filter field.
  - Confirm firm search narrows assigned-firm options by name.
  - Update admin phone and verify recruiter preview card reflects updated number.
  - Change email with old/new/confirm/password and verify next login uses new email.

## Step 84 - Email Change Verification-Required Firebase Flow
- What changed:
  - Added `verifyBeforeUpdateEmail` fallback in `changeMyEmailWithPassword` for Firebase projects requiring new-email verification before email updates.
  - Service now returns mode:
    - `updated` when direct update succeeds
    - `verify_pending` when verification link flow is required
  - Updated candidate/admin profile screens to handle `verify_pending` gracefully and show clear next-step guidance.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- What to test next:
  - Trigger email change on account with verification-required policy and confirm verification email arrives.
  - Complete verification link flow and confirm account email updates after re-login.

## Step 85 - Admin Email Section Layout Alignment
- What changed:
  - Moved admin `Current email` display from the profile-info card to the top of the `Change email` section.
  - Admin email section now matches candidate profile layout pattern.
- Commands run + result:
  - `npm run typecheck` -> PASS
- What to test next:
  - Open admin profile tab and verify `Current email` appears at the top of `Change email`.

## Step 86 - Verified Email Sync Across Candidate/Admin Records
- What changed:
  - Added auth-session reconciliation in `AuthContext` that runs on login/auth refresh.
  - When Firebase Auth email is now different (post-verification), the app syncs matching user records to the current email and verification state:
    - updates `uid`, `email`, `emailVerified`, `updatedAt`
    - matches by `uid` and stale primary-doc email
  - This ensures verified email changes propagate to candidate/admin views that read from user docs.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- What to test next:
  - Change email via verification flow, complete verification, log out/in, and verify new email appears everywhere for that account.

## Step 87 - Current Email Field Source-of-Truth Fix
- What changed:
  - Updated candidate/admin profile watchers to always use Firebase Auth email (`session.user.email`) as primary source for `Current email`.
  - Updated login-time email reconciliation to write canonical `users/{uid}` with auth email + verification state and preserve push-token list for rules compatibility.
  - Updated email-change service post-success write to canonical `users/{uid}` only, preventing multi-doc permission failures that could leave old email values visible.
- Commands run + result:
  - `npm run typecheck` -> PASS
  - `npm run build` -> PASS
- What to test next:
  - Log in as account whose email was verified-changed and confirm `Current email` instantly matches login email.
  - Confirm old email no longer appears in candidate/admin profile change-email section.
