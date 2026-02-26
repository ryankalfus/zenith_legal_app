## 1) Analysis of what the idea of the app is (lengthy but simple)

This app is a **private “candidate portal” for Zenith Legal** that replaces scattered texting/emailing with a single, structured place where (1) candidates can **communicate with Mason Kalfus + team** and (2) candidates can **track their recruiting progress firm-by-firm**.

Right now, the recruiting workflow is basically:

* Mason finds (or receives) a role at a firm.
* Candidate confirms interest + sends materials.
* Mason submits the candidate through the firm’s process/portal.
* Firms respond (interview / reject / offer), and Mason coordinates scheduling and next steps.

The app’s purpose is to make that workflow **transparent and organized for the candidate** while making it **easy for Mason to manage many candidates** without losing context in iMessage/email threads.

Based on your transcript, the “center of gravity” is:

* **One Zenith Legal communication channel** (so messages/files/notes don’t live in one person’s texts; your whole team can see the history).
* A **dashboard** that only shows the firms relevant to that candidate (not the entire universe of firms), and shows a simple status for each firm.
* A **recruiter-controlled backend** where Mason updates statuses and manages the process. (Future: integrate with a CRM, but not required for v1.)
* Optional but powerful next step: **push targeted job alerts** to candidates based on **city + practice area**, so when you have a relevant role, the candidate can respond quickly. (Your transcript frames this as a big growth lever.)

From the email requirements, the MVP is intentionally lightweight:

* **No traditional signup** (no passwords, no long onboarding) — just collect **name, email, mobile** and get them into the portal.
* Candidate sets **preferred cities** and **practice area**, which later enables targeted alerts.
* **Messaging** is one-tap and stored in an iMessage-style thread.
* **Calendar appointments** can be created by either side with alerts.
* Mason’s **phone/email** is prominent at the top (tap-to-call).
* The **status dashboard** only shows firms in certain statuses (authorization needed, submitted, interview, rejected, offer). These statuses are **controlled by Mason**, not the candidate.

You also already have a **Firm List 2026** (105 firms) that should become a **canonical database table/collection** so the whole app uses the same firm names. The candidate shouldn’t scroll a random list every time; instead, the app should surface:

* Firms Mason adds for that candidate, and/or
* Firms the candidate requests/authorizes from the master list.

Finally, because you want to ship to the App Store, the app must be treated like a real product:

* Clear privacy disclosures (you’re collecting contact info and storing messages/appointments).
* A “delete my account/data” option if you treat the candidate as having an account record.
* A stable build/submission pipeline and review-ready metadata/screenshots.

**Bottom line:** This is a focused “recruiting operations + communication” app with two roles (Candidate + Recruiter/Admin). The MVP is small, but the structure makes it expandable into a job-alert platform later.

---

## 2) Formal plan (step-by-step list)

### Phase 0 — Product definition (no coding yet)

1. **Lock MVP scope** (what ships to App Store on v1):

   * Candidate onboarding (name/email/mobile + verification)
   * Preferred cities + practice area
   * Messaging thread (candidate ↔ Zenith team)
   * Firm-by-firm status dashboard (only specific statuses visible)
   * Authorization requests (candidate can approve being submitted to a firm)
   * Calendar appointments + alerts
   * Recruiter/admin console to manage candidates, firms, statuses, messages, appointments
2. **Define data rules** (written spec):

   * Candidate cannot edit firm status (except “Authorize/Decline” when asked).
   * Only firms in the allowed statuses appear on the dashboard.
   * Messaging is visible to the team (role-based).
3. **Write the “App Review readiness” checklist**:

   * Privacy policy URL + in-app privacy summary
   * Account/data deletion flow
   * Support contact
   * Basic moderation/abuse handling (at minimum: “Report a problem”)

### Phase 1 — UX + architecture

4. Create a simple wireframe for:

   * Candidate tab layout + recruiter/admin layout
5. Pick stack (recommended below) and define:

   * Collections/tables
   * API endpoints (if using your own backend) or Firebase/Supabase rules (if using managed backend)
   * Push notification approach
6. Prepare assets:

   * Zenith Legal logo
   * Brand colors + typography
   * App Store screenshots plan (5–8 screens)

### Phase 2 — Build MVP (coding)

7. **Repo setup + baseline app** (navigation, auth, empty screens)
8. Implement **candidate onboarding** (OTP verification), profile fields, preferences
9. Implement **firm list + candidate dashboard**:

   * Import Firm List 2026 into DB
   * CandidateFirmStatus records
   * Recruiter-only status editing
   * Candidate authorization action
10. Implement **messaging**:

* Single conversation per candidate (or per candidate per team)
* Push notifications on new messages

11. Implement **calendar appointments**:

* Create/edit/cancel appointments
* Alerts + reminders

12. Implement **recruiter/admin console**:

* Candidate list + search
* Candidate detail: profile, firms/statuses, messages, appointments
* Ability to add firm to candidate and request authorization

13. QA pass:

* Permissions (candidate vs admin)
* Offline/poor network handling
* Notification reliability

### Phase 3 — Beta + App Store submission

14. Internal beta (TestFlight) + fix issues
15. External beta (small pilot group of candidates)
16. App Store assets + compliance:

* App Privacy “nutrition label”
* Account deletion flow
* Support URLs

17. Submit to App Store review and iterate on any feedback

### Phase 4 — Post-launch + growth features

18. Add “job alerts” module (your transcript’s big upside):

* Admin creates a job posting (city/practice filters)
* Push to matching candidates
* Candidate taps “Interested” → creates a lead/task in admin console

19. CRM integration (optional) after MVP is stable

**Developer account requirements to plan for now:**

* Apple Developer Program is **$99/year**. ([Apple Developer][1])
* Google Play Console is **$25 one-time** (if/when you publish Android). ([Google Help][2])
* For App Store submissions starting **April 28, 2026**, Apple requires iOS apps uploaded to App Store Connect to be built with **iOS/iPadOS 26 SDK+** (via Xcode 26). ([Apple Developer][3])

---

## 3) Layout of the app (Mason Kalfus + applicants)

### A) Applicant (Candidate) app layout

**Bottom tabs (simple, predictable):**

1. **Home**

   * Zenith Legal header card with logo
   * Mason’s phone + email (tap-to-call, tap-to-email)
   * Big button: “Message Zenith Legal”
2. **Status**

   * List of firms *only* in allowed dashboard statuses:

     * Waiting on your authorization to contact/submit
     * Submitted, waiting to hear from firm
     * Interview Stage
     * Rejected by firm
     * Offer received!
   * Each firm row shows: Firm name + status badge + last updated time
   * Firm detail screen (read-only history + notes)
3. **Calendar**

   * Upcoming appointments list + calendar view
   * Appointment detail: time, location/Zoom, notes, “Add to device calendar”
4. **Profile**

   * Name / email / mobile (read-only or lightly editable)
   * Preferred Cities (multi-select)
   * Practice Area (single-select)
   * **Delete my account/data** (important for App Store compliance if you store an account record) ([Apple Developer][4])

**Key candidate flows:**

* **First open:** enter mobile/email → receive OTP → set name + preferences
* **Authorization request:** Mason adds firm → candidate sees “Authorize submission” prompt → candidate approves → Mason can mark as submitted
* **Messaging:** one continuous iMessage-style thread with the team

### B) Mason Kalfus (Recruiter/Admin) layout

This can be either:

* **A web admin portal** (fastest for day-to-day recruiting work), and/or
* **An admin mode inside the mobile app** (useful on the go)

**Admin primary screens:**

1. **Candidates (list + search)**

   * Search by name, city, practice area
   * Filters: “Needs authorization”, “Interview stage”, “Offers”
2. **Candidate Detail**

   * Profile: contact info + preferences
   * Firms panel:

     * Add firm (from Firm List 2026 master list)
     * Request authorization (sends candidate prompt)
     * Update status (submitted/interview/rejected/offer)
   * Messages panel (same thread candidate sees)
   * Appointments panel (create/update/cancel + send alerts)
3. **Jobs / Alerts (phase 2)**

   * Create posting: city + practice + short description
   * Push to matching candidates
   * View responses (“Interested” / “Not now”)
4. **Team / Settings**

   * Team members access (who can read/respond)
   * Default message templates (optional)
   * Audit log (who changed a status)

**Data separation rules (non-negotiable):**

* Candidate cannot edit firm statuses (except responding to an authorization request).
* Admin changes are timestamped and attributed (helps if anything is questioned later).
* Every candidate sees only their own record.

---

---

## 4) Implementation update bullets (02.25.2026)

- Monorepo has been scaffolded with mobile, admin, shared package, and Firebase functions workspaces.
- Core data models and validation schemas were added for users, firms, statuses, messages, appointments, and deletion requests.
- Candidate mobile app baseline now includes auth, messaging, statuses, appointments, profile preferences, and delete-account entry point.
- Admin web console baseline now includes login, candidate management, status controls, authorization request creation, messaging, and appointments.
- Firebase rules/indexes/storage rules and backend function hooks have been added for RBAC, notifications, and account deletion.
- Seed script has been added to import canonical firm data from the markdown source list.
- Added local emulator toggle support and an RBAC smoke-test harness to improve verification before App Store submission.
- Validation execution update (02.25.2026): toolchain prerequisites installed (Firebase CLI + Java), static checks passed, emulator RBAC run blocked by Firestore jar network download issue, and real-project checks blocked pending `firebase login` + valid project id.

---

## Mobile Redesign Plan Update (2026-02-26)
- Focus remains mobile-first only for this phase.
- Candidate mobile experience is now standardized around four tabs: Dashboard, Chat, Appointments, Profile.
- Zenith admin mobile experience now uses three tabs: Candidates, Chat, Appointment Requests.
- Candidate waiting-status actions are implemented through `candidateStatusRequests` with backend DM/email automation.
- Appointment requests are now first-class records with status lifecycle (`requested`, `scheduled`, `completed`, `canceled`) and required phone number capture.
- 02.26.2026 Plan Update: Mobile appointment workflow now includes admin-side candidate dropdown appointment creation, request accept/decline mapping (`scheduled`/`canceled`), and synchronized detail modification.
- 02.26.2026 Plan Update: Mobile firm assignment UX updated to explicit 2-step flow (`Assign Firm` then `Firm Assigned` status selection) while preserving one-record-per-candidate+firm data model.
- 02.26.2026 Plan Update: Mobile message composer visual language refined toward cleaner rounded iOS-style controls without changing core messaging backend behavior.
