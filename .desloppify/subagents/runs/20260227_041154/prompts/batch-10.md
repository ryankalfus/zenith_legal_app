You are a focused subagent reviewer for a single holistic investigation batch.

Repository root: /Users/ryankalfus/Downloads/zenith_legal_app
Blind packet: /Users/ryankalfus/Downloads/zenith_legal_app/.desloppify/review_packet_blind.json
Batch index: 10
Batch name: Full Codebase Sweep
Batch dimensions: cross_module_architecture, convention_outlier, error_consistency, abstraction_fitness, api_surface_coherence, authorization_consistency, ai_generated_debt, incomplete_migration, package_organization, high_level_elegance, mid_level_elegance, low_level_elegance, design_coherence
Batch rationale: thorough default: evaluate cross-cutting quality across all production files

Files assigned:
- apps/admin/app/app/page.tsx
- apps/admin/app/auth/page.tsx
- apps/admin/app/dashboard/candidates/[candidateId]/page.tsx
- apps/admin/app/dashboard/page.tsx
- apps/admin/app/layout.tsx
- apps/admin/app/page.tsx
- apps/admin/src/lib/auth.ts
- apps/admin/src/lib/firebase.ts
- apps/mobile/App.tsx
- apps/mobile/src/components/AppShell.tsx
- apps/mobile/src/components/Avatar.tsx
- apps/mobile/src/components/StatusChip.tsx
- apps/mobile/src/lib/firebase.ts
- apps/mobile/src/lib/notifications.ts
- apps/mobile/src/lib/zenithContact.ts
- apps/mobile/src/navigation/RootNavigator.tsx
- apps/mobile/src/navigation/types.ts
- apps/mobile/src/screens/AdminInboxScreen.tsx
- apps/mobile/src/screens/AuthScreen.tsx
- apps/mobile/src/screens/MessagesScreen.tsx
- apps/mobile/src/screens/ProfileSetupScreen.tsx
- apps/mobile/src/screens/admin/AdminAppointmentRequestsScreen.tsx
- apps/mobile/src/screens/admin/AdminCandidateDetailScreen.tsx
- apps/mobile/src/screens/admin/AdminCandidatesScreen.tsx
- apps/mobile/src/screens/admin/AdminNewConversationScreen.tsx
- apps/mobile/src/screens/candidate/CandidateAppointmentsScreen.tsx
- apps/mobile/src/screens/candidate/CandidateDashboardScreen.tsx
- apps/mobile/src/screens/candidate/CandidateProfileScreen.tsx
- apps/mobile/src/services/accountService.ts
- apps/mobile/src/services/adminService.ts
- apps/mobile/src/services/appointmentService.ts
- apps/mobile/src/services/authorizationService.ts
- apps/mobile/src/services/calendarService.ts
- apps/mobile/src/services/messagingService.ts
- apps/mobile/src/services/statusService.ts
- apps/mobile/src/services/userService.ts
- apps/mobile/src/state/AuthContext.tsx
- apps/mobile/src/ui/theme.ts
- apps/mobile/src/utils/profilePhotoSourcePicker.ts
- functions/src/callable/adminRole.ts
- functions/src/callable/deleteAccount.ts
- functions/src/callable/ensureZenithAdmin.ts
- functions/src/config/env.ts
- functions/src/index.ts
- functions/src/scripts/backfillConversationMeta.ts
- functions/src/scripts/enforceSingleAdmin.ts
- functions/src/scripts/seedFirms.ts
- functions/src/triggers/appointmentCancelNotify.ts
- functions/src/triggers/appointmentPush.ts
- functions/src/triggers/appointmentRequestExpiry.ts
- functions/src/triggers/appointmentRequestMessage.ts
- functions/src/triggers/appointmentUpdateFlag.ts
- functions/src/triggers/conversationMeta.ts
- functions/src/triggers/messagePush.ts
- functions/src/triggers/signupSummaryEmail.ts
- functions/src/utils/push.ts
- packages/shared/src/constants/options.ts
- packages/shared/src/index.ts
- packages/shared/src/schemas/index.ts
- packages/shared/src/types/domain.ts

Task requirements:
1. Read the blind packet and follow `system_prompt` constraints exactly.
1a. If previously flagged issues are listed above, use them as context for your review.
    Verify whether each still applies to the current code. Do not re-report fixed or
    wontfix issues. Use them as starting points to look deeper — inspect adjacent code
    and related modules for defects the prior review may have missed.
1c. Think structurally: when you spot multiple individual issues that share a common
    root cause (missing abstraction, duplicated pattern, inconsistent convention),
    explain the deeper structural issue in the finding, not just the surface symptom.
    If the pattern is significant enough, report the structural issue as its own finding
    with appropriate fix_scope ('multi_file_refactor' or 'architectural_change') and
    use `root_cause_cluster` to connect related symptom findings together.
2. Evaluate ONLY listed files and ONLY listed dimensions for this batch.
3. Return 0-13 high-quality findings for this batch (empty array allowed).
3a. Do not suppress real defects to keep scores high; report every material issue you can support with evidence.
3b. Do not default to 100. Reserve 100 for genuinely exemplary evidence in this batch.
4. Score/finding consistency is required: broader or more severe findings MUST lower dimension scores.
4a. Any dimension scored below 85.0 MUST include explicit feedback: add at least one finding with the same `dimension` and a non-empty actionable `suggestion`.
5. Every finding must include `related_files` with at least 2 files when possible.
6. Every finding must include `dimension`, `identifier`, `summary`, `evidence`, `suggestion`, and `confidence`.
7. Every finding must include `impact_scope` and `fix_scope`.
8. Every scored dimension MUST include dimension_notes with concrete evidence.
9. If a dimension score is >85.0, include `issues_preventing_higher_score` in dimension_notes.
10. Use exactly one decimal place for every assessment and abstraction sub-axis score.
9a. For package_organization, ground scoring in objective structure signals from `holistic_context.structure` (root_files fan_in/fan_out roles, directory_profiles, coupling_matrix). Prefer thresholded evidence (for example: fan_in < 5 for root stragglers, import-affinity > 60%, directories > 10 files with mixed concerns).
9b. Suggestions must include a staged reorg plan (target folders, move order, and import-update/validation commands).
11. Ignore prior chat context and any target-threshold assumptions.
12. Do not edit repository files.
13. Return ONLY valid JSON, no markdown fences.

Scope enums:
- impact_scope: "local" | "module" | "subsystem" | "codebase"
- fix_scope: "single_edit" | "multi_file_refactor" | "architectural_change"

Output schema:
{
  "batch": "Full Codebase Sweep",
  "batch_index": 10,
  "assessments": {"<dimension>": <0-100 with one decimal place>},
  "dimension_notes": {
    "<dimension>": {
      "evidence": ["specific code observations"],
      "impact_scope": "local|module|subsystem|codebase",
      "fix_scope": "single_edit|multi_file_refactor|architectural_change",
      "confidence": "high|medium|low",
      "issues_preventing_higher_score": "required when score >85.0",
      "sub_axes": {"abstraction_leverage": 0-100 with one decimal place, "indirection_cost": 0-100 with one decimal place, "interface_honesty": 0-100 with one decimal place}  // required for abstraction_fitness when evidence supports it
    }
  },
  "findings": [{
    "dimension": "<dimension>",
    "identifier": "short_id",
    "summary": "one-line defect summary",
    "related_files": ["relative/path.py"],
    "evidence": ["specific code observation"],
    "suggestion": "concrete fix recommendation",
    "confidence": "high|medium|low",
    "impact_scope": "local|module|subsystem|codebase",
    "fix_scope": "single_edit|multi_file_refactor|architectural_change",
    "root_cause_cluster": "optional_cluster_name_when_supported_by_history"
  }],
  "retrospective": {
    "root_causes": ["optional: concise root-cause hypotheses"],
    "likely_symptoms": ["optional: identifiers that look symptom-level"],
    "possible_false_positives": ["optional: prior concept keys likely mis-scoped"]
  }
}
