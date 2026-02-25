# Zenith Legal Candidate Portal MVP

Monorepo for the Zenith Legal mobile candidate portal + admin web console + Firebase backend.

## Tech Stack
- Mobile: Expo React Native + TypeScript (`apps/mobile`)
- Admin Web: Next.js + TypeScript (`apps/admin`)
- Shared models/schemas: TypeScript + Zod (`packages/shared`)
- Backend: Firebase Auth, Firestore, Storage, Cloud Functions (`functions`)

## Monorepo Structure
- `apps/mobile` unified mobile app (candidate dashboard/chat/calendar/profile plus Zenith admin mobile inbox chat)
- `apps/admin` unified web app (shared auth entry + Zenith admin management dashboard)
- `packages/shared` shared types, constants, and validation
- `functions` Firebase Cloud Functions (push notifications, account deletion, admin-role enforcement, signup summary email, firm seed)
- `docs` setup/deploy/compliance docs
- `qa` acceptance test checklist

## Prerequisites
- Node.js 20+
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`)
- Java runtime (required by Firestore emulator)
- Expo CLI (`npm i -g expo-cli`) or `npx expo`
- EAS CLI (`npm i -g eas-cli`) for App Store builds

## Local Setup
1. Copy env template:
   - `cp .env.example .env`
2. Set project + Firebase values in `.env`:
   - `FIREBASE_PROJECT_ID=zenith-legal-dev`
   - `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` Firebase keys
3. Ensure Java is available before emulator runs:
   - `export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home`
   - `export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"`
4. If Firebase emulator download fails with TLS cert error, set:
   - `export NODE_EXTRA_CA_CERTS=/absolute/path/to/root-ca.pem`
5. Run environment checks:
   - `npm run firebase:doctor`
6. Install dependencies:
   - `npm install`
7. Authenticate CLI:
   - `firebase login`
8. Set Firebase default project:
   - `firebase use <your-project-id>`
9. Run emulators (recommended during development):
   - `firebase emulators:start`
10. If Expo fails in online mode (`fetch failed`), run mobile in offline mode:
   - `cd apps/mobile && EXPO_OFFLINE=1 npx expo start --offline`
11. Optional local emulator mode in app clients:
   - Set `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`
   - Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`
   - Keep emulator host as `127.0.0.1` (or `10.0.2.2` for Android emulator)

## Run Apps
- Mobile:
  - `npm run dev:mobile`
- Admin web:
  - `npm run dev:admin`
- Functions watch build:
  - `npm run dev:functions`

## Seed Canonical Firms
Imports from `firm-list-2026.md` and skips `Mc`.

- Command:
  - `npm run seed:firms`

## RBAC Smoke Test
- Start emulators and run rules smoke test:
  - `npm run test:rules`
- Verify resolved project id:
  - `npm run firebase:project`
- This checks key candidate/admin permissions against `firestore.rules`.

## Deploy
- Firestore rules/indexes/storage/functions:
  - `firebase deploy --only firestore,storage,functions`

Detailed steps:
- [Firebase Setup](./docs/firebase-setup.md)
- [EAS Build + Submit](./docs/eas-build.md)
- [App Store Readiness](./docs/app-store-readiness.md)
- [QA Checklist](./qa/acceptance-checklist.md)

## Notes
- App auth supports email/password and Google sign up/log in flows.
- Only `mason@zenithlegal.com` is eligible for admin access; admin claims and role docs are enforced server-side.
- Candidate signups trigger summary email notifications to Zenith Legal when profile completion occurs.
- Candidate can respond to authorization requests but cannot edit firm statuses directly.
- Messaging supports attachments up to 25MB.
