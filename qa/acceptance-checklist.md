# MVP Acceptance Checklist

## Candidate Onboarding
- [ ] Candidate signs in by phone OTP.
- [ ] Candidate signs in by email link flow.
- [ ] First sign-in creates user profile doc.
- [ ] Candidate sets preferred cities and practice area.

## Messaging
- [ ] Candidate sends message to Zenith.
- [ ] Admin sees message in web console.
- [ ] Admin replies from web console.
- [ ] Candidate receives push notification for admin reply.
- [ ] Attachment upload works up to 25MB.

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
- [ ] Automated RBAC smoke test passes (`npm run test:rules`).

## Deletion
- [ ] Candidate can trigger delete account/data from Profile.
- [ ] Deletion removes Firestore user-linked data.
- [ ] Deletion removes auth user.
- [ ] Deletion creates audit entry in `deletionRequests`.
