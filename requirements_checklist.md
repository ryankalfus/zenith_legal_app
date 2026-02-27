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
- [x] `MVP` Mobile authenticated app now uses persistent bottom tab shell for both candidate and Zenith admin roles (tab bar remains visible on nested screens).
- [x] `MVP` Admin `Candidate Detail` and admin message thread routes moved inside tab-owned stacks to avoid tab bar disappearance.
- [x] `MVP` Bottom tab UI switched to icon-only controls with unique icons per tab and no text labels.

## Step Log
- 2026-02-26: Added requirement coverage for persistent tab shell + icon-only tab bar redesign across candidate/admin mobile navigation.
- [x] `MVP` Candidate profile setup/profile now supports optional profile photo upload, replacement, and removal with reusable avatar fallback UI.
- [x] `MVP` Admin chat preview list now uses iMessage-like seamless rows (avatar/name/preview/time), includes search by candidate name, and highlights unread chats with bold + red dot.
- [x] `MVP` Conversation unread metadata + read-state behavior now powers tab badges for admin/candidate chat (`9+` max) and per-thread clearing rules.
- [x] `MVP` Message thread UI now shows side avatars for sent/received rows and uses up-arrow send control.
- [x] `MVP` Candidate/admin appointment tabs now support overdue (scheduled-only) + chronological upcoming sections and avatar-rich previews.
- [x] `MVP` Admin appointments now include floating unattended-requests bell queue with `Accept`/`Decline`/`Modify` quick actions and count badge (`9+` max).
- [x] `MVP` Candidate appointments now require cancel confirmation, include schedule-change chat hyperlink, and rely on backend auto chat/email on cancellation.
- [x] `MVP` Backend scheduler now auto-cancels stale `requested` appointments after their requested time passes.
- [x] `MVP` Candidate appointments tab now supports update-notification red-dot state (dot clears on tab open).
- [x] `MVP` Zenith contact bar (email + phone) is now persistent on active mobile flows and candidate profile label now uses `Practice` wording.

## Step Log
- 2026-02-26: Added requirement coverage for profile photos, iMessage-like chat previews, unread badge systems, overdue appointment sections, unattended request bell workflow, cancellation notifications, requested-expiry scheduler, and persistent Zenith contact bar behavior.
- 2026-02-27: Added stabilization coverage for shared contact header height, chat unread badge restoration, appointment request visibility reliability, and admin firm-removal workflow.

## Stabilization Update (2026-02-27)
- [x] `MVP` Contact header bar uses one consistent height and safe-area placement across auth/profile/chat/app-shell mobile screens.
- [x] `MVP` Candidate/admin chat unread badges are restored with correct clear rules (`candidate clears on chat open`, `admin clears per thread`).
- [x] `MVP` Zenith admin can remove assigned firms with a red destructive action + confirmation.
- [x] `MVP` Requested appointments remain visible until attended/canceled, improving end-to-end request reliability.
- [x] `MVP` Added conversation metadata backfill command (`npm run backfill:conversations`) for older chat docs missing unread/snapshot fields.

## Candidate Decision + Badge Update (2026-02-27)
- [x] `MVP` Candidate waiting-state action labels updated to `Authorize` (green) and `Cancel` (red) with immediate persistence.
- [x] `MVP` Candidate authorization decision now writes real shared firm statuses (`waiting_for_submission`, `canceled`) visible to both candidate and admin.
- [x] `MVP` Candidate decision auto-sends direct DM detail text to Zenith Legal using candidate + firm names.
- [x] `MVP` Chat tab badge logic updated to message-count semantics (`total unread messages`, `9+` cap) for admin-side tab indicator.
- [x] `MVP` Admin inbox unread styling updated to blue-dot + bold preview behavior for unread conversations.

## Step Log
- 2026-02-27: Added requirement coverage for direct candidate authorize/cancel status transitions, shared status-model expansion, and message-count-based chat badge behavior.
