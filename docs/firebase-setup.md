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
- Enable `Email/Password` provider.
- Enable `Google` provider.
- Phone + password is deferred in this implementation pass.
- Add authorized domains for web and Expo deep links.

## 3) App Registrations
- Create Web app and copy Firebase config into `NEXT_PUBLIC_*` vars.
- Create iOS app and Android app for Expo build IDs.

## 4) Environment Variables
- Copy `.env.example` to `.env` and fill all required values.
- Required for CLI scripts:
  - `FIREBASE_PROJECT_ID=zenith-legal-dev`
- Required auth/admin values:
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
  - `NEXT_PUBLIC_ZENITH_ADMIN_EMAIL=mason@zenithlegal.com`
  - `EXPO_PUBLIC_ZENITH_ADMIN_EMAIL=mason@zenithlegal.com`
  - `ZENITH_ADMIN_EMAIL=mason@zenithlegal.com`
  - `SUPER_ADMIN_EMAILS=mason@zenithlegal.com`
  - `RESEND_API_KEY=<resend-api-key>`
  - `SIGNUP_ALERT_TO=mason@zenithlegal.com`
  - `SIGNUP_ALERT_FROM=onboarding@resend.dev`
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

## 7) Admin Claim Bootstrap + Multi-Admin Management
- Admin access is role-based (`role=admin` custom claim + user doc role).
- `mason@zenithlegal.com` remains the owner bootstrap account.
- Use callable `ensureZenithAdminClaim` while signed in as Mason to guarantee owner admin claim/doc.
- Optional one-time owner backfill:
```bash
npm run ts-node --workspace @zenith/functions src/scripts/backfillMasonAdminProfile.ts
```
- Use callable `changeUserRole` (from admin UI) to promote/demote users.
- New users default to candidate until promoted.

Expected result:
- Any promoted recruiter with `role=admin` can use admin mobile tabs
- User document role is aligned with custom claim
- Last-admin delete is blocked

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
