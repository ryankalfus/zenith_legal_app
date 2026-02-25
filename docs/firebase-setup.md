# Firebase Setup

## 1) Create Firebase Project
1. Create a Firebase project in Firebase Console (dev target: `zenith-legal-dev`).
2. Enable these products:
   - Authentication
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
3. Set project in `.env`:
   - `FIREBASE_PROJECT_ID=zenith-legal-dev`
4. Authenticate CLI:
   - `firebase login`
5. Set target project:
   - `firebase use zenith-legal-dev`
6. Confirm project resolution source:
   - `npm run firebase:project`

## Java Requirement (Emulators)
- Firestore emulator requires Java.
- On macOS (Homebrew OpenJDK), set once per shell:
  - `export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home`
  - `export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"`
- Verify:
  - `java -version`

## TLS Certificate Requirement (if emulator download fails)
- Symptom:
  - `unable to get local issuer certificate` during `firebase setup:emulators:firestore` or `npm run test:rules`
- Preferred fix:
  - Try system CA file first:
  - `export NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem`
  - Or set your local CA chain file:
  - `export NODE_EXTRA_CA_CERTS=/absolute/path/to/root-ca.pem`
- Verify download path:
  - `firebase setup:emulators:firestore --project zenith-legal-dev --debug`
- Fallback:
  - Manually download jar and place at:
  - `~/.cache/firebase/emulators/cloud-firestore-emulator-v1.20.2.jar`

## 2) Authentication Providers
- Enable `Phone` provider.
- Enable `Email link (passwordless sign-in)` under Email/Password provider.
- Add authorized domains for web admin and Expo deep links.

## 3) App Registrations
- Create Web app and copy Firebase config into `NEXT_PUBLIC_*` vars.
- Create iOS app and Android app for Expo build IDs.

## 4) Environment Variables
- Copy `.env.example` to `.env` and fill all required values.
- Required for CLI scripts:
  - `FIREBASE_PROJECT_ID=zenith-legal-dev`
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
Run a full environment check first:
```bash
npm run firebase:doctor
```

Run rules validation with emulators:
```bash
npm run test:rules
```
