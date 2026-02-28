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

## Reliability Follow-up (2026-02-27)
- [x] `MVP` Admin appointments bell flow now uses a dedicated unattended (`requested`) data stream so unattended request rows reliably appear with full details.
- [x] `MVP` Admin unattended requests modal now includes explicit loading/error states to avoid silent empty views.
- [x] `MVP` Admin chat preview metadata now updates immediately after each send (`lastMessageText`, `lastMessageAt`, `lastMessageSenderRole`) and no longer depends on race-prone async enrichment.
- [x] `MVP` Mobile chat composer is positioned closer to the tab bar while preserving send/attachment behavior and safe spacing.
- [x] `MVP` Candidate status-request workflow is deprecated in mobile admin detail (status-requests section removed) and new `candidateStatusRequests` writes are disabled in Firestore rules.
- [x] `MVP` Candidate waiting-state decisions continue as direct status transitions (`Authorize` -> `Waiting for submission`, `Cancel` -> `Canceled`) with automatic DM to Zenith Legal.

## Step Log
- 2026-02-27: Added requirement coverage for unattended-request bell reliability, immediate chat preview refresh behavior, low composer placement, and status-request workflow deprecation.

## Reliability Hotfixes (2026-02-27)
- [x] `MVP` Admin unattended bell query no longer requires a new Firestore composite index (requested-only query is index-free and sorted client-side).
- [x] `MVP` Candidate authorize/cancel save path is hardened with ownership/doc checks and merge-write semantics to reduce permission/save failures.
- [x] `MVP` Chat unread counters now update immediately at send-time and avoid duplicate increments by marking client-handled messages.
- [x] `MVP` Chat tab badge behavior remains unread-message-count based (`9+` max) with correct clear semantics on read.
- [x] `MVP` Admin unread DM preview behavior remains blue-dot + bold preview text until thread open.
- [x] `MVP` Firm status `Canceled` is now color-coded red across status chips.

## Step Log
- 2026-02-27: Added requirement coverage for unattended bell index fix, authorize/cancel permission-hardening, unread counter reliability, and canceled-status red mapping.

## Appointment Routing Completion (2026-02-27)
- [x] `MVP` Overdue appointment sections now support `Ignore` (orange) for both candidate and admin, with global hide implemented via appointment deletion.
- [x] `MVP` Overdue cards intentionally have no modify/reschedule controls; only `Ignore` is available.
- [x] `MVP` Zenith admin upcoming appointment cards now support `Modify` and `Cancel` after appointments move out of request queue.
- [x] `MVP` Appointment routing is consistently applied by status/time:
  - `requested` -> unattended requests (bell)
  - `scheduled` future -> upcoming
  - `scheduled` past -> overdue (red)
- [x] `MVP` Candidate authorize/cancel status writes enforce active waiting-state checks and fail with explicit stale-state messaging instead of generic permission ambiguity.

## Step Log
- 2026-02-27: Added requirement coverage for overdue ignore flow, admin upcoming appointment controls, and final appointment routing consistency.

## Candidate Permission Patch (2026-02-27)
- [x] `MVP` Candidate `Authorize` / `Cancel` transition service now enforces only valid target statuses and uses direct status update writes with read-back verification.
- [x] `MVP` Candidate status transition guard rails now explicitly block invalid/non-waiting transitions before write attempts.
- [x] `MVP` Local rules smoke tests confirm candidate can transition `authorization_pending` -> `waiting_for_submission` and cannot perform arbitrary status edits.
- [x] `Ops` Firestore rules deployed live to `zenith-legal-dev` so candidate authorize/cancel permission path is active in hosted environment.
- [x] `Ops` Firebase CLI network TLS trust issue was identified and worked around for deployment execution.

## Step Log
- 2026-02-27: Added requirement coverage for candidate authorize/cancel permission root-cause patch and explicit live deploy blocker tracking.

## Admin Chat Identity + Creation + Delete (2026-02-27)
- [x] `MVP` Zenith admin chat preview name/photo now syncs from live candidate display profile data (display name + avatar), not stale conversation snapshot only.
- [x] `MVP` Zenith admin can tap `+` in chat tab, pick a candidate, and start/open a conversation directly.
- [x] `MVP` Zenith admin can swipe left on chat previews to reveal red `Delete` action with animation-like reveal behavior.
- [x] `MVP` Admin delete is local-only (admin hidden state); candidate conversation data is not globally deleted.
- [x] `MVP` Opening/sending in a conversation unhides it as needed for active side visibility.

## Step Log
- 2026-02-27: Added requirement coverage for live chat identity sync, new-conversation entry flow, and admin-local swipe delete behavior.

## Chat Interaction Polish + Local Message Delete (2026-02-27)
- [x] `MVP` Admin swipe-left delete rows auto-reset closed when leaving inbox or opening a thread.
- [x] `MVP` Admin chat `+` action is aligned with `Chat` heading while search bar remains directly below heading/subtitle.
- [x] `MVP` Message composer is lowered closer to tab bar area with no overlap.
- [x] `MVP` Both admin and candidate can long-press sent/received messages and delete locally (red destructive action, non-global).
- [x] `MVP` Firestore rules permit candidate local message hide updates without allowing message content mutation.
- [x] `Ops` Updated Firestore rules deployed live to `zenith-legal-dev` for local message delete support.

## Step Log
- 2026-02-27: Added requirement coverage for inbox swipe-reset behavior, header-level plus button placement, lower composer position, and per-user long-press message deletion.

## Local Preview Consistency (2026-02-27)
- [x] `MVP` Chat previews are viewer-local after local message delete (latest visible message per side).
- [x] `MVP` Admin inbox preview uses admin-local preview fields with fallback compatibility for older docs.
- [x] `MVP` Local delete now triggers immediate preview recompute/sync so preview text/time stays accurate per viewer.

## Step Log
- 2026-02-27: Added requirement coverage for viewer-local chat preview behavior and realtime preview recompute after local message deletion.

## Admin Unread Visual Adjustment (2026-02-27)
- [x] `MVP` Blue unread dot removed from Zenith admin chat preview rows.
- [x] `MVP` Unread preview bold text + tab notification badge remain active.

## Step Log
- 2026-02-27: Added requirement coverage for admin unread visual update (bold-only unread rows).

## Appointment Picker + Candidate Cleanup (2026-02-27)
- [x] `MVP` Candidate appointment date/time selection now uses inline in-place picker UX.
- [x] `MVP` Zenith create-appointment and modify-appointment date/time selection now uses inline in-place picker UX.
- [x] `MVP` Zenith unattended bell request actions reduced to `Accept` / `Decline` (no `Modify` action).
- [x] `MVP` Deleted Ryan candidate removed from active Zenith candidate feeds and orphaned chat/appointment rows hidden from admin lists.

## Step Log
- 2026-02-27: Added requirement coverage for inline appointment picker UX, unattended action simplification, and deleted-candidate cleanup behavior.

## Candidate DOB + JD Fields (2026-02-27)
- [x] `MVP` Candidate profile setup includes `Date of birth` and optional `JD (Law) degree date` fields.
- [x] `MVP` Candidate profile tab includes editable `Date of birth` and optional `JD (Law) degree date` fields.
- [x] `MVP` DOB/JD date values sync to Zenith admin Candidates view through shared user profile docs.
- [x] `MVP` Zenith Candidates tab displays `Age` (derived from DOB) and `JD degree received` date.
- [x] `MVP` Shared domain/schema/user-service/auth payloads include optional DOB/JD date fields.

## Step Log
- 2026-02-27: Added requirement coverage for candidate DOB/JD profile fields and synced admin age/JD display.

## Profile Photo Source Picker (2026-02-27)
- [x] `MVP` Profile photo selection now opens a single popup with three choices: `Take photo now`, `Choose from camera roll`, `Files`.
- [x] `MVP` Popup flow is wired in both profile setup and candidate profile tab (edit flow).
- [x] `MVP` Existing profile photo upload pipeline stays unchanged after file selection.
- [x] `Tech` Added `expo-image-picker` dependency and iOS permission strings required for camera + library access.

## Step Log
- 2026-02-27: Added requirement coverage for popup-based profile photo source selection flow.

## Candidate Visibility + Upload Reliability (2026-02-27)
- [x] `MVP` Removed temporary mobile admin candidate email hide-filter so Ryan appears in candidate-driven admin views again.
- [x] `MVP` Added profile-photo upload fallback for environments with older Storage rules (`profilePhotos` primary, `messageAttachments` fallback on unauthorized).
- [x] `MVP` Candidate profile setup/profile tab DOB + JD fields remain editable and synced.
- [x] `MVP` Zenith Candidates tab shows synced `Age` + `JD degree received`.
- [ ] `Ops` Deploy latest Storage rules to project (currently blocked by expired Firebase CLI auth in local environment).

## Step Log
- 2026-02-27: Added requirement coverage for Ryan visibility restoration and profile-photo upload unauthorized fallback fix.

## Candidate Duplicate Cleanup + Date Picker UX + Candidate Detail UI (2026-02-27)
- [x] `MVP` Admin candidate watcher now de-duplicates same-email candidate records and keeps one canonical candidate row.
- [x] `MVP` Duplicate `ryan kLfus` candidate row is removed from admin-facing mobile candidate-driven UI lists while canonical `Ryan Kalfus` remains visible.
- [x] `MVP` Candidate DOB and JD fields now use inline calendar pickers in profile setup and profile edit flows.
- [x] `MVP` Candidate detail screen now shows a cleaner full profile summary including DOB, Age, and JD date above firm controls.

## Step Log
- 2026-02-27: Added requirement coverage for same-email candidate de-dup behavior, calendar-based DOB/JD selection, and candidate-detail profile UI polish.

## Profile Setup Gating + Chat Composer Keyboard Position (2026-02-27)
- [x] `MVP` Candidate profile setup now requires `Display name`, `Email`, and `Date of birth` before save/advance.
- [x] `MVP` Candidate profile setup shows explicit validation alerts when required fields are missing.
- [x] `MVP` Chat composer keyboard behavior updated so composer stays closer to keyboard (less vertical gap) on iOS.

## Step Log
- 2026-02-27: Added requirement coverage for required profile setup field gating and chat composer keyboard offset correction.

## Chat Composer Offset Correction (2026-02-27)
- [x] `MVP` Chat composer keyboard offset corrected so composer is no longer over-shifted high while typing.

## Step Log
- 2026-02-27: Added requirement coverage for `MessagesScreen` keyboard offset reset to align composer just above keyboard.

## Calendar + Delete Logout (2026-02-27)
- [x] `MVP` Scheduled upcoming appointments now include `Add to Calendar` on candidate side.
- [x] `MVP` Scheduled upcoming appointments now include `Add to Calendar` on Zenith admin side.
- [x] `MVP` Calendar event mapping uses title `Call with xxx`, notes as description, and appointment date/time values.
- [x] `Tech` Added mobile calendar integration dependency/config (`expo-calendar`) and iOS calendar permission keys.
- [x] `MVP` Account deletion now logs the user out immediately after successful deletion.

## Step Log
- 2026-02-27: Added requirement coverage for appointment calendar export buttons and immediate post-delete logout behavior.

## Status Date + Chat Timeline Metadata (2026-02-27)
- [x] `MVP` Firm assignment rows now show the date each status was most recently updated.
- [x] `MVP` Chat messages now show per-message time logs in small text under each bubble.
- [x] `MVP` Chat timeline now inserts date separators with requested relative/absolute label rules (`Today`/`Yesterday`/weekday, then month/day, then month/day/year).

## Step Log
- 2026-02-27: Added requirement coverage for firm status update-date display and chat date/time timeline formatting.

## Assigned Header + Candidates Date Consistency (2026-02-27)
- [x] `MVP` Zenith Candidates tab age/JD display now uses profile-aligned date parsing to match candidate profile values.
- [x] `MVP` Admin candidate detail includes new `Assigned Header` section between summary and assign-firm controls.
- [x] `MVP` Admin can edit candidate-specific header hyperlink values (email + phone) and save them.
- [x] `MVP` Candidate app header now reads per-candidate assigned contact values in realtime, with Zenith defaults as fallback.
- [x] `Tech` Shared user profile type/schema now includes optional assigned header contact fields.

## Step Log
- 2026-02-27: Added requirement coverage for Assigned Header admin controls and candidate-header realtime linkage.

## Assigned Header Sync Hardening (2026-02-27)
- [x] `MVP` Assigned Header save now syncs across same-email duplicate candidate docs so candidate header links update reliably.

## Step Log
- 2026-02-27: Added requirement coverage for batch sync of assigned header contact values across duplicate candidate records.

## Assigned Header Hyperlink Reliability (2026-02-27)
- [x] `MVP` Candidate header hyperlinks now use sanitized `mailto:`/`tel:` values from assigned header fields.
- [x] `MVP` Default candidate header contact values are enforced as `mason@zenithlegal.com` and `+1 202-486-3535` when assigned values are empty.

## Step Log
- 2026-02-27: Added requirement coverage for assigned-header hyperlink normalization and default contact fallback behavior.

## Assigned Header Active-Account Sync Reliability (2026-02-27)
- [x] `MVP` Assigned Header save now propagates using both normalized candidate email and normalized candidate `uid` to reach active duplicate account docs.
- [x] `MVP` Assigned Header values now normalize `mailto:`/`tel:` prefixes at save/read time so candidate-side hyperlinks stay functional.

## Step Log
- 2026-02-27: Added requirement coverage for uid+email assigned-header propagation and malformed-prefix normalization.

## Assigned Header Legacy Duplicate Fallback (2026-02-27)
- [x] `MVP` Assigned Header propagation now also matches duplicate candidate docs by normalized `fullName + phone digits` fallback when email/uid linkage is inconsistent in legacy rows.

## Step Log
- 2026-02-27: Added requirement coverage for fallback duplicate-account matching used by Assigned Header sync.

## Assigned Header Auth-UID Coverage (2026-02-27)
- [x] `MVP` Assigned Header save now directly updates the auth-linked candidate user doc (`users/{uid}`) when it differs from selected candidate doc id.
- [x] `MVP` Assigned Header propagation no longer depends on `role == candidate` for legacy docs; it now includes all non-admin user docs to cover role-missing candidate rows.

## Step Log
- 2026-02-27: Added requirement coverage for auth-uid direct targeting and legacy role-missing candidate doc propagation.

## Admin Candidate Routing to Real Account Doc (2026-02-27)
- [x] `MVP` Zenith candidate list now routes to candidate detail using auth UID (`uid`) when available, with doc-id fallback.
- [x] `MVP` Candidate-detail actions now consistently target the real logged-in candidate account doc in duplicate-record scenarios.

## Step Log
- 2026-02-27: Added requirement coverage for UID-first admin candidate routing to fix assigned-header updates landing on wrong duplicate docs.

## Candidate De-dup UID Priority (2026-02-27)
- [x] `MVP` Admin candidate de-dup now prioritizes UID-linked docs (`uid` present, `uid == docId`) to reduce duplicate-row mis-targeting.

## Step Log
- 2026-02-27: Added requirement coverage for UID-priority de-dup scoring in Zenith candidates list.

## Assigned Header Resolution Reliability (2026-02-27)
- [x] `MVP` Candidate header now prefers profile-level assigned header values over conversation-level overrides to prevent stale chat metadata from masking recent Assigned Header saves.
- [x] `Tech` Removed stale legacy `ProfileScreen.tsx` merge-conflict file that was breaking mobile typecheck.

## Step Log
- 2026-02-27: Added requirement coverage for assigned-header resolution-order fix and merge-conflict cleanup.

## Canonical Candidate Selection Hardening (2026-02-27)
- [x] `MVP` Admin candidate de-dup now selects UID-canonical row (`uid == docId`) first in same-email groups before fallback scoring, improving Assigned Header target consistency.

## Step Log
- 2026-02-27: Added requirement coverage for canonical candidate-row selection in duplicate data scenarios.

## Appointment-to-Chat Summaries (2026-02-27)
- [x] `MVP` Candidate appointment requests now generate chat summaries to Zenith Legal with candidate-name/date-time format and optional note text.
- [x] `MVP` Zenith admin appointment request actions now auto-send admin-authored chat summaries for `Accept` and `Decline`.
- [x] `MVP` Zenith admin appointment `Create` and `Modify` actions now auto-send candidate-facing chat summaries with formatted schedule details and optional note text.
- [x] `Tech` Finalized request/cancel chat source to client-side sends and removed duplicate server-side request/cancel chat emitters.

## Step Log
- 2026-02-27: Added requirement coverage for appointment create/request/accept/decline/modify chat summary synchronization.

## Candidate/Zenith Cancel Chat Delivery (2026-02-27)
- [x] `MVP` Candidate request submit now sends chat summary to Zenith Legal from candidate side.
- [x] `MVP` Candidate cancel now sends chat summary to Zenith Legal from candidate side.
- [x] `MVP` Zenith admin cancel now sends chat summary to candidate from admin side.
- [x] `Tech` Removed exported request-chat trigger and removed chat write from candidate-cancel email trigger to prevent duplicate appointment summary chats.

## Step Log
- 2026-02-27: Added requirement coverage for candidate request/cancel chat sends and Zenith admin cancel chat send with duplicate-trigger prevention.

## Pending Cancel + Dashboard Copy + Header Logo (2026-02-27)
- [x] `MVP` Candidate cancel of pending request (`requested`) no longer sends chat to Zenith Legal.
- [x] `MVP` Candidate dashboard title/subtitle updated to requested copy and floating brand section removed.
- [x] `MVP` Zenith logo now renders at top-right below the contact header on tab screens (including chat), without layout reflow.

## Step Log
- 2026-02-27: Added requirement coverage for pending-request cancel chat suppression, dashboard copy cleanup, and shared top-right header logo placement.

## Admin Chat Inbox Header Logo Exception (2026-02-27)
- [x] `MVP` Zenith logo remains visible across tabs/screens except Zenith admin chat inbox view where the header `+` action appears.
- [x] `MVP` Candidate chat tab keeps top-right Zenith logo.

## Step Log
- 2026-02-27: Added requirement coverage for admin chat inbox logo exclusion while preserving logo on all other tabs/screens.

## Dashboard Logo Size/Placement Polish (2026-02-27)
- [x] `MVP` Candidate dashboard uses a larger right-side Zenith logo integrated into heading area without content/font shifts.
- [x] `MVP` Zenith main dashboard tab (`Candidates`) uses the same larger right-side Zenith logo size/placement.
- [x] `MVP` Candidate chat header keeps Zenith logo visible.

## Step Log
- 2026-02-27: Added requirement coverage for larger matched dashboard logo placement and candidate-chat logo visibility.

## Expanded Tab Logo Treatment (2026-02-27)
- [x] `MVP` Dashboard logo size tuned down for cleaner integration while keeping high-resolution rendering.
- [x] `MVP` Same right-side logo treatment applied to candidate `Appointments` tab and candidate `Profile` tab.
- [x] `MVP` Same right-side logo treatment applied to Zenith `Appointments` tab.
- [x] `MVP` UI-only change maintained (no typography or content layout shifts).

## Step Log
- 2026-02-27: Added requirement coverage for reduced logo scale and expanded logo treatment across candidate/admin appointment/profile tabs.

## Global Big Logo + Chat Exception (2026-02-27)
- [x] `MVP` Big top-right Zenith logo now applies across all app screens/tabs by default.
- [x] `MVP` Zenith admin chat inbox remains the single exception with no top-right logo (to avoid overlap with `+` action).
- [x] `MVP` Candidate chat tab and admin chat conversation thread both show the big logo.
- [x] `MVP` Top-right logo position moved slightly upward globally.

## Step Log
- 2026-02-27: Added requirement coverage for global big-logo rollout, admin inbox exception, chat-view inclusion, and upward logo position adjustment.

## Login Header Visibility (2026-02-27)
- [x] `MVP` Login/signup screen no longer shows Zenith contact header.
- [x] `MVP` Zenith contact header starts with authenticated app screens after login.

## Step Log
- 2026-02-27: Added requirement coverage for removing header on auth page while preserving post-login header behavior.

## Candidate Chat Header Alignment (2026-02-27)
- [x] `MVP` Candidate chat heading (`Chat` + subtitle) is lowered to align with other tab heading spacing.
- [x] `MVP` Admin chat conversation heading layout remains unchanged.

## Step Log
- 2026-02-27: Added requirement coverage for candidate-only chat header vertical alignment adjustment.

## Admin Chat Header Alignment (2026-02-27)
- [x] `MVP` Admin chat inbox heading (`Chat` + subtitle) is vertically aligned with other tab headings.
- [x] `MVP` Admin chat conversation heading receives matching vertical alignment adjustment.
- [x] `Tech` `AppShell` now supports per-screen heading-wrap offset styling for targeted header alignment tweaks.

## Step Log
- 2026-02-27: Added requirement coverage for admin chat heading vertical alignment in inbox + thread views.

## Global Tab Header Text Alignment (2026-02-27)
- [x] `MVP` Candidate/admin chat heading offsets were normalized to one baseline so chat does not sit lower than other tab headings.
- [x] `MVP` Top-left tab title/subtitle positions are now consistent across dashboard/chat/appointments/profile/candidates tabs.

## Step Log
- 2026-02-27: Added requirement coverage for full tab header text alignment pass.

## Multi-Admin Recruiter Accounts + Admin Profile Tab (2026-02-27)
- [x] `MVP` Admin access is role-based (`admin` claim/doc role), not Mason-email hardcoded in mobile auth session flow.
- [x] `MVP` Admin tab set now includes `Profile` tab (Candidates, Chat, Appointment Requests, Profile).
- [x] `MVP` Admin profile screen supports editable name + phone, secure email change flow (old/new/current password), logout, and delete account.
- [x] `MVP` Candidates tab now shows `Recruiters` section above `Candidates` with shared search behavior.
- [x] `MVP` Recruiter row opens recruiter detail; candidate row opens candidate detail.
- [x] `MVP` Candidate detail now includes `Change role to Recruiter` action with destructive confirmation.
- [x] `MVP` Recruiter detail now includes `Change role to Candidate` action with destructive confirmation.
- [x] `MVP` Self role-change is blocked in callable and UI (`You cannot change your own role`).
- [x] `MVP` Candidate -> recruiter promotion runs server-side candidate-data deletion before role/claim update.
- [x] `MVP` Admin delete account is blocked when requester is the last remaining admin.
- [x] `Tech` Added callable `changeUserRole({ targetUid, targetRole })` with admin-only guard + claim/doc sync.
- [x] `Tech` Updated Firestore rules `isAdmin()` to role claim and removed Mason-only admin gate.
- [x] `Tech` Added Mason owner backfill script with defaults (Mason Kalfus, mason@zenithlegal.com, +12024863535).

## Step Log
- 2026-02-27: Added requirement coverage for multi-admin role model, recruiter management UX, admin profile tab, role-transition callable, and last-admin delete safety.

## Role Picker + Data Preservation (2026-02-27)
- [x] `MVP` Candidate -> recruiter promotion now preserves existing candidate data for future demotion back to candidate.
- [x] `MVP` Role changing UI in admin `Recruiters` and `Candidates` sections now uses dropdown-style picker with current role checked.
- [x] `MVP` Role changes are functional from dropdown picker and sync in realtime across admin lists.
- [x] `MVP` Candidate/recruiter detail screens now use dropdown-style role control instead of role-change button.

## Step Log
- 2026-02-27: Added requirement coverage for role-change data preservation and dropdown role controls with checked current role.

## Role Field Placement + Role Change Error Fix (2026-02-27)
- [x] `MVP` Role dropdown was moved from admin list rows back into detailed profile views as a role field.
- [x] `MVP` Role change now works from detail role field without `not-found` error.
- [x] `Tech` Mobile role updates now use direct admin Firestore path with rules support instead of missing callable endpoint.

## Step Log
- 2026-02-27: Added requirement coverage for detail-only role dropdown placement and `not-found` role change fix.

## Candidate Email + Shared Password Management (2026-02-27)
- [x] `MVP` Candidate profile tab now includes Firebase-backed `Change email` flow (old email + new email + current password).
- [x] `MVP` Candidate profile tab now includes Firebase-backed `Change password` flow (current + new + confirm).
- [x] `MVP` Recruiter/admin profile tab now includes Firebase-backed `Change password` flow (current + new + confirm).
- [x] `MVP` Admin candidates tab heading copy updated to `Zenith Legal` and `Manage candidate and recruiter profiles`.

## Step Log
- 2026-02-27: Added requirement coverage for candidate email-change support, shared password-change support, and admin-candidates heading copy update.

## Admin Profile Photo Field (2026-02-27)
- [x] `MVP` Admin/recruiter profile tab now includes profile photo field with same picker options as candidate profile (`Take photo now`, `Choose from camera roll`, `Files`).
- [x] `MVP` Admin/recruiter profile photo supports upload and remove actions.
- [x] `MVP` Updated admin/recruiter profile photo syncs to recruiter avatar shown in Zenith Legal Candidates tab.

## Step Log
- 2026-02-27: Added requirement coverage for admin/recruiter profile photo parity and recruiter-avatar sync in candidates view.

## Assigned Recruiter + Candidates Filter Search (2026-02-27)
- [x] `MVP` Role dropdown labels are capitalized (`Candidate` / `Recruiter`) in admin detail role pickers.
- [x] `MVP` Candidate Detail view includes `Assigned recruiter` field above `Practice` with dropdown selection (`None` + recruiters).
- [x] `MVP` Candidates preview cards now show `Assigned recruiter` in place of `Age` before opening detailed profile.
- [x] `MVP` Candidates section includes `Filter search` button that opens dedicated filter screen.
- [x] `MVP` Filter screen supports recruiter/status/practice/assigned-firms/preferred-cities filtering with single/multi select behavior.
- [x] `Tech` Added realtime candidate status index watcher to support status + firm filters.

## Step Log
- 2026-02-27: Added requirement coverage for assigned recruiter field sync, preview display update, and multi-field candidate filter screen.

## Filter + Profile Sync Fixes (2026-02-27)
- [x] `MVP` Applying candidate filters no longer throws `GO_BACK not handled` warning.
- [x] `MVP` `Any` option is available as top option in all filter dropdowns and clears that filter field.
- [x] `MVP` Preferred cities filter always includes full shared city list, including `Other`.
- [x] `MVP` Assigned-firms filter includes firm-name search to handle long lists.
- [x] `MVP` Admin profile phone updates now sync reliably to recruiter display in Candidates tab.
- [x] `MVP` Change-email flow now includes old/new/confirm/password validation and sync updates to matching user docs.

## Step Log
- 2026-02-27: Added requirement coverage for filter apply stability, universal `Any` options, full preferred-city coverage, firm search, and admin profile phone/email sync reliability.

## Email Change Verification Handling (2026-02-27)
- [x] `MVP` Email-change flow now supports Firebase projects that require verification of the new email before update.
- [x] `MVP` Candidate/admin profile screens now show explicit verification-next-step guidance instead of a generic error when verification is required.
- [x] `Tech` Added `verifyBeforeUpdateEmail` fallback path in shared user email-change service.

## Step Log
- 2026-02-27: Added requirement coverage for Firebase verification-required email-change handling and improved profile-tab messaging.

## Admin Email Section Alignment (2026-02-27)
- [x] `MVP` Admin profile tab now shows `Current email` at the top of the `Change email` section (same pattern as candidate profile tab).

## Step Log
- 2026-02-27: Added requirement coverage for admin profile `Current email` placement alignment with candidate profile layout.

## Verified Email Sync Across Views (2026-02-27)
- [x] `MVP` After new-email verification and re-login, current email now syncs across candidate/admin data views for that account.
- [x] `Tech` Added auth-session reconciliation to update matching user docs to the current Firebase Auth email and verification state.

## Step Log
- 2026-02-27: Added requirement coverage for post-verification email propagation across user-profile records.

## Current Email Accuracy (2026-02-27)
- [x] `MVP` Candidate/admin `Current email` now always reflects the actual Firebase Auth account email (source-of-truth).
- [x] `Tech` Canonical `users/{uid}` email sync path is hardened to avoid stale old-email display caused by duplicate-doc write permission failures.

## Step Log
- 2026-02-27: Added requirement coverage for current-email source-of-truth alignment and canonical sync reliability.

## Flat UI (No Drop Shadows) (2026-02-27)
- [x] `MVP` Removed all mobile drop shadows from shared card styling and key UI elements (chat composer + admin appointments FAB).

## Step Log
- 2026-02-27: Added requirement coverage for global mobile drop-shadow removal.

## Legacy Candidate Removal (`ryan kLfus`) (2026-02-27)
- [x] `MVP` Added one-time targeted removal for stale candidate record `ryan kLfus` tied to `ryansamuelkalfus@gmail.com`.
- [x] `MVP` Added immediate UI exclusion guard for that exact legacy record while keeping `Ryan Kalfus` visible.

## Step Log
- 2026-02-27: Added requirement coverage for targeted stale-candidate purge and safe UI fallback filtering.

## Remove DOB + Age References (2026-02-27)
- [x] `MVP` Removed Date of Birth fields from candidate profile setup and profile tab.
- [x] `MVP` Removed all Age references/displays from admin candidate views.
- [x] `Tech` Removed DOB from shared user domain/schema definitions and mobile profile write paths.

## Step Log
- 2026-02-27: Added requirement coverage for full DOB and Age removal.
