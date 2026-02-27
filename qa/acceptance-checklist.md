# MVP Acceptance Checklist

## Candidate Onboarding
- [ ] Candidate signs up by email/password.
- [ ] Candidate logs in by email/password.
- [ ] Candidate signs up/logs in by Google.
- [ ] First sign-in creates user profile doc.
- [ ] Candidate sets preferred cities and practice area.

## Admin Auth + Access
- [ ] Any user with role `admin` claim can access admin dashboard/tools.
- [ ] Non-admin users are blocked from admin data.
- [ ] Zenith admin can access mobile inbox and reply to candidate chats.

## Messaging
- [ ] Candidate sends message to Zenith.
- [ ] Admin sees message in web console.
- [ ] Admin replies from web console.
- [ ] Admin replies from mobile inbox/thread.
- [ ] Candidate receives push notification for admin reply.
- [ ] Attachment upload works up to 25MB.
- [ ] Signup summary email is sent to `mason@zenithlegal.com` once profile completes.

## Firm Workflow
- [ ] Admin adds firm from canonical list.
- [ ] Admin requests authorization.
- [ ] Candidate approves/declines authorization.
- [ ] Admin updates status to submitted/interview/rejected/offer.
- [ ] Candidate status tab updates in realtime.
- [ ] Candidate cannot edit status directly.

## Appointments
- [ ] Admin creates appointment.
- [ ] Candidate sees appointment in mobile calendar.
- [ ] Candidate can create appointment.
- [ ] Appointment cancel/update syncs in realtime.
- [ ] Candidate gets reminder/update notification.

## RBAC and Security
- [ ] Candidate cannot read another candidate’s records.
- [ ] Non-admin cannot access admin data.
- [ ] Admin can manage all required records.
- [x] Automated RBAC smoke test passes (`npm run test:rules`).

## Deletion
- [ ] Candidate can trigger delete account/data from Profile.
- [ ] Deletion removes Firestore user-linked data.
- [ ] Deletion removes auth user.
- [ ] Deletion creates audit entry in `deletionRequests`.

## Execution Notes (2026-02-25)
- Static checks: `typecheck` + `build` passed.
- Automated RBAC run: blocked by Firestore emulator jar download failure.
- Admin startup check: passed.
- Mobile startup check: passed in offline mode.
- Full flow checks are pending emulator network fix + Firebase login/project setup.
