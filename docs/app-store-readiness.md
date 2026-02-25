# App Store Readiness Checklist

## Product/Policy
- [ ] App name, subtitle, description finalized.
- [ ] Privacy Policy URL published (placeholder replaced).
- [ ] Support URL published.
- [ ] Terms URL published (recommended).

## Account + Data
- [ ] Candidate account creation path documented (email/password + Google).
- [ ] In-app `Delete my account/data` flow available in Profile tab.
- [ ] Deletion removes candidate Firestore data + auth user + message attachments.

## Permissions Rationale
- [ ] Push notifications reason shown: message + appointment alerts.
- [ ] No extra sensitive permissions requested.

## Metadata
- [ ] iPhone screenshots (core flows).
- [ ] Optional iPad screenshots.
- [ ] App icon and splash assets finalized.

## Operational
- [ ] Firebase production rules deployed.
- [ ] Functions deployed and healthy.
- [ ] Seeded canonical firms dataset imported.

## Placeholder Policy Text
Use a temporary policy page with:
- Data collected: name, email, mobile, preferences, messages, appointments.
- Purpose: legal recruiting workflow and communication.
- Retention: until user requests deletion or business retention policy expires.
- Contact: support email and phone.
