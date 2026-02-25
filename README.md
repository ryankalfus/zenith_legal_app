# Zenith Legal Candidate Portal MVP

Monorepo for the Zenith Legal mobile candidate portal + admin web console + Firebase backend.

## Tech Stack
- Mobile: Expo React Native + TypeScript (`apps/mobile`)
- Admin Web: Next.js + TypeScript (`apps/admin`)
- Shared models/schemas: TypeScript + Zod (`packages/shared`)
- Backend: Firebase Auth, Firestore, Storage, Cloud Functions (`functions`)

## Monorepo Structure
- `apps/mobile` candidate app (OTP auth, status dashboard, messaging, appointments, profile, delete account)
- `apps/admin` recruiter/admin console (candidate management, firms, statuses, authorizations, messages, appointments)
- `packages/shared` shared types, constants, and validation
- `functions` Firebase Cloud Functions (push notifications, account deletion, admin role helper, firm seed)
- `docs` setup/deploy/compliance docs
- `qa` acceptance test checklist

## Prerequisites
- Node.js 20+
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`)
- Expo CLI (`npm i -g expo-cli`) or `npx expo`
- EAS CLI (`npm i -g eas-cli`) for App Store builds

## Local Setup
1. Copy env template:
   - `cp .env.example .env`
2. Fill Firebase values for your project in `.env`.
3. Install dependencies:
   - `npm install`
4. Set Firebase default project:
   - `firebase use <your-project-id>`
5. Run emulators (recommended during development):
   - `firebase emulators:start`
6. Optional local emulator mode in app clients:
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
- Admin access is protected by Google sign-in allowlist and admin custom claims.
- Candidate can respond to authorization requests but cannot edit firm statuses directly.
- Messaging supports attachments up to 25MB.
