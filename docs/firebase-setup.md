# Firebase Setup

## 1) Create Firebase Project
1. Create a Firebase project in Firebase Console.
2. Enable these products:
   - Authentication
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
3. Authenticate CLI:
   - `firebase login`
4. Set target project:
   - `firebase use <your-project-id>`

## Java Requirement (Emulators)
- Firestore emulator requires Java.
- Verify locally:
  - `java -version`

## 2) Authentication Providers
- Enable `Phone` provider.
- Enable `Email link (passwordless sign-in)` under Email/Password provider.
- Add authorized domains for web admin and Expo deep links.

## 3) App Registrations
- Create Web app and copy Firebase config into `NEXT_PUBLIC_*` vars.
- Create iOS app and Android app for Expo build IDs.

## 4) Environment Variables
- Copy `.env.example` to `.env` and fill all required values.
- For local emulator testing set:
  - `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`
  - `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`
  - `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1` (Android emulator often needs `10.0.2.2`)
  - `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1`

## 5) Firestore + Storage Rules
Deploy rules and indexes:
```bash
firebase deploy --only firestore,storage
```

## 6) Functions Deploy
```bash
npm run build --workspace @zenith/functions
firebase deploy --only functions
```

## 7) Admin Claim Bootstrap
Use callable `setAdminRoleByEmail` from an account in `SUPER_ADMIN_EMAILS`.

Expected result:
- Target user gets custom claim `role=admin`
- Target user document role is set to `admin`

## 8) Seed Firms
```bash
npm run seed:firms
```

## 9) RBAC Smoke Test
Run rules validation with emulators:
```bash
npm run test:rules
```
