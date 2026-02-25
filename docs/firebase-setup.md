# Firebase Setup

## 1) Create Firebase Project
1. Create a Firebase project in Firebase Console.
2. Enable these products:
   - Authentication
   - Firestore Database
   - Cloud Storage
   - Cloud Functions

## 2) Authentication Providers
- Enable `Phone` provider.
- Enable `Email link (passwordless sign-in)` under Email/Password provider.
- Add authorized domains for web admin and Expo deep links.

## 3) App Registrations
- Create Web app and copy Firebase config into `NEXT_PUBLIC_*` vars.
- Create iOS app and Android app for Expo build IDs.

## 4) Environment Variables
- Copy `.env.example` to `.env` and fill all required values.

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
