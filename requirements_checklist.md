# Zenith Legal MVP Requirements Checklist

Source files reviewed:
- `email-app-requirements.md`
- `zl-app-transcropt.md`
- `firm-list-2026.md`
- `PROJECT_LOG.md`

Legend:
- `MVP` = required for first release
- `Later` = planned after MVP
- `Out` = not in scope now

## Product & Access
- [ ] `MVP` Candidate onboarding collects name, email, mobile.
- [ ] `MVP` Authentication supports email/password and Google sign up/log in.
- [ ] `Later` Phone + password authentication.
- [ ] `MVP` Role-based access control (`candidate`, `admin`).
- [ ] `MVP` Only `mason@zenithlegal.com` can hold admin role/claim.
- [ ] `MVP` Candidate profile stores preferred cities + practice area.

## Candidate Mobile App
- [ ] `MVP` Home tab with Zenith branding.
- [ ] `MVP` Prominent tap-to-call and tap-to-email Mason CTA.
- [ ] `MVP` “Message Zenith” entry point.
- [ ] `MVP` Status tab shows only allowed statuses:
  - authorization pending
  - submitted waiting
  - interview
  - rejected
  - offer
- [ ] `MVP` Candidate only sees firms assigned to their own account.
- [ ] `MVP` Candidate can approve/decline authorization requests.
- [ ] `MVP` Candidate cannot directly edit firm status values.
- [ ] `MVP` Calendar tab shows appointments with reminders.
- [ ] `MVP` Profile tab supports preference updates.
- [ ] `MVP` Delete my account/data flow.

## Messaging & Notifications
- [ ] `MVP` One thread per candidate with Zenith team.
- [ ] `MVP` Real-time message history persistence.
- [ ] `MVP` Candidate and admin can send messages.
- [ ] `MVP` Zenith admin can use mobile inbox + chat reply tools.
- [ ] `MVP` Message attachments support upload (any type, max 25MB).
- [ ] `MVP` Push notifications to candidates on new messages.
- [ ] `MVP` Signup/profile-complete summary email sends to `mason@zenithlegal.com`.
- [ ] `Later` Push alerts for targeted new job opportunities.

## Admin / Recruiter Web Console
- [ ] `MVP` Candidate list + search.
- [ ] `MVP` Candidate details view with profile and preferences.
- [ ] `MVP` Add firms to candidate from canonical firm master list.
- [ ] `MVP` Create authorization requests.
- [ ] `MVP` Update candidate firm statuses.
- [ ] `MVP` Admin messages panel for candidate thread.
- [ ] `MVP` Admin appointments panel (create/update/cancel).

## Backend & Data
- [ ] `MVP` Firestore collections:
  - `users`
  - `firms`
  - `candidateFirmStatuses`
  - `conversations/{candidateId}/messages`
  - `appointments`
  - `authorizationRequests`
  - `deletionRequests`
- [ ] `MVP` Firestore rules enforce RBAC and ownership.
- [ ] `MVP` Storage rules enforce RBAC for attachments.
- [ ] `MVP` Cloud Functions for push notifications + deletion flow.
- [ ] `MVP` Seed script imports canonical firms from `firm-list-2026.md`.
- [ ] `MVP` Seed script skips `Mc` value and logs skip reason.

## Compliance & Release
- [ ] `MVP` Privacy policy placeholder and support contact in docs.
- [ ] `MVP` Account deletion path documented for App Store review.
- [ ] `MVP` Local setup docs and env template.
- [ ] `MVP` Firebase emulator and deployment docs.
- [ ] `MVP` EAS build and submit docs.
- [ ] `MVP` QA checklist and acceptance test matrix.
- [ ] `Later` CRM integration.
- [ ] `Later` Auto-matching job alerts by profile criteria.
- [ ] `Out` Public anonymous job board feed in MVP.

## Step Log
- 2026-02-25: Created initial checklist and categorized scope as MVP/Later/Out.
- 2026-02-25: Updated auth/admin requirements to unified email/password + Google flows with Zenith-only admin and signup summary email trigger.
