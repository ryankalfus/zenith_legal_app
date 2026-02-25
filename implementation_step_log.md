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
