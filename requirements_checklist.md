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
- 2026-02-26: Added auth reliability repair notes: Zenith admin custom claim/doc enforcement, Google OAuth config verification, and improved web/mobile auth error handling.

## Redesign Update (2026-02-26)
- [x] `MVP` Mobile auth screen now uses email/password-only entry and shows motto `A HIGHER LEVEL OF LEGAL SEARCH`.
- [x] `MVP` Candidate mobile tabs updated to `Dashboard`, `Chat`, `Appointments`, `Profile`.
- [x] `MVP` Zenith admin mobile tabs updated to `Candidates`, `Chat`, `Appointment Requests`.
- [x] `MVP` Candidate dashboard waiting-status popup supports `Request authorization` and `Request cancellation` with pending badge state.
- [x] `MVP` New `candidateStatusRequests` data flow added for candidate request logging and admin resolution.
- [x] `MVP` Candidate status request trigger sends DM + email notification to Zenith Legal.
- [x] `MVP` Candidate appointment request flow updated with required phone number and optional note.
- [x] `MVP` Appointment lifecycle supports `requested`, `scheduled`, `completed`, `canceled` and both sides can cancel.
- [x] `MVP` Appointment request trigger auto-sends required chat message format (`APPOINTMENT REQUESTED...`).
- [x] `MVP` Firestore rules/indexes updated for new status-request and appointment-request query/security paths.

## Step Log
- 2026-02-26: Added full mobile redesign requirement tracking notes for candidate/admin tab changes, status request automation, and appointment request lifecycle updates.
- [x] `MVP` Candidate appointment request form uses clean dropdown-style date/time selectors and sends request to Zenith admin appointment queue.
- [x] `MVP` Zenith admin appointment tab supports create-from-candidate-dropdown flow and end-to-end sync to candidate records.
- [x] `MVP` Zenith admin can accept/decline appointment requests via status mapping (`scheduled` / `canceled`) and complete/modify appointments.
- [x] `MVP` Appointment detail edits (date/time/phone/note) sync end-to-end between admin and candidate views.
- [x] `MVP` Candidate detail `Assign Firm` flow uses 2-step UX (`Assign Firm` -> `Firm Assigned` status selection).
- [x] `MVP` Candidate+firm assignment model remains one record per firm with status/history updates (no duplicate same-firm records).
- [x] `MVP` Mobile chat composer UI updated to cleaner rounded/oval controls while preserving send + attachment functionality.

## Step Log
- 2026-02-26: Added checklist coverage for synced admin/candidate appointment lifecycle updates, 2-step firm assignment flow, and modernized mobile chat composer UI.
