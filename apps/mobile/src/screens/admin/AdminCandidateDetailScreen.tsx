import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_VISIBLE_STATUSES,
  CandidateFirmStatus
} from "@zenith/shared";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppShell, EmptyState } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { StatusChip } from "../../components/StatusChip";
import {
  changeUserRoleByAdmin,
  updateCandidateAssignedRecruiter,
  updateCandidateAssignedHeader,
  watchCandidateById,
  watchFirms,
  watchRecruiters,
  FirmRow
} from "../../services/adminService";
import {
  removeCandidateFirmStatus,
  saveCandidateFirmStatus,
  updateCandidateFirmStatus,
  watchAdminCandidateStatuses,
  CandidateFirmStatusRow
} from "../../services/statusService";
import { useAuth } from "../../state/AuthContext";
import { AdminCandidatesStackParamList } from "../../navigation/types";
import { theme } from "../../ui/theme";
import { ZENITH_EMAIL, ZENITH_PHONE } from "../../lib/zenithContact";

function parseIsoDate(input?: string) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }
  const parsed = new Date(`${input}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShortDate(input?: string) {
  const parsed = parseIsoDate(input);
  if (!parsed) {
    return "Not set";
  }
  return parsed.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function getAge(input?: string) {
  const dob = parseIsoDate(input);
  if (!dob) {
    return "Not set";
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "Not set";
}

function formatStatusUpdatedDate(input: unknown) {
  if (!input) {
    return "Not set";
  }
  if (typeof input === "object" && input && "toDate" in input && typeof (input as any).toDate === "function") {
    try {
      return (input as any).toDate().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      });
    } catch {
      return "Not set";
    }
  }
  const parsed = new Date(String(input));
  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }
  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

type RecruiterOption = {
  id: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
};

export function AdminCandidateDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminCandidatesStackParamList, "CandidateDetail">>();
  const { session } = useAuth();
  const candidateId = route.params.candidateId;

  const [candidate, setCandidate] = useState<any | null>(null);
  const [firms, setFirms] = useState<FirmRow[]>([]);
  const [statuses, setStatuses] = useState<CandidateFirmStatusRow[]>([]);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignStep, setAssignStep] = useState<"pickFirm" | "pickStatus">("pickFirm");
  const [assignFirmSearch, setAssignFirmSearch] = useState("");
  const [assignFirmId, setAssignFirmId] = useState("");
  const [assignStatus, setAssignStatus] = useState<CandidateFirmStatus>("authorization_pending");

  const [editingStatusRow, setEditingStatusRow] = useState<CandidateFirmStatusRow | null>(null);
  const [assignedHeaderEmail, setAssignedHeaderEmail] = useState(ZENITH_EMAIL);
  const [assignedHeaderPhone, setAssignedHeaderPhone] = useState(ZENITH_PHONE);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [recruiters, setRecruiters] = useState<RecruiterOption[]>([]);
  const [recruiterModalOpen, setRecruiterModalOpen] = useState(false);
  const [savingAssignedRecruiter, setSavingAssignedRecruiter] = useState(false);

  useEffect(() => {
    const unsubCandidate = watchCandidateById(candidateId, setCandidate, () => setCandidate(null));
    const unsubFirms = watchFirms(setFirms, () => setFirms([]));
    const unsubStatuses = watchAdminCandidateStatuses(candidateId, setStatuses, () => setStatuses([]));
    const unsubRecruiters = watchRecruiters(
      (rows) => {
        const unique = new Map<string, RecruiterOption>();
        rows.forEach((row) => {
          const id = String(row.uid ?? row.id).trim();
          if (!id) {
            return;
          }
          unique.set(id, {
            id,
            fullName: String(row.fullName ?? "").trim() || "Recruiter",
            phone: String(row.mobile ?? "").trim(),
            avatarUrl: String(row.avatarUrl ?? "").trim()
          });
        });
        const mapped = [...unique.values()].sort((a, b) =>
          a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" })
        );
        setRecruiters(mapped);
      },
      () => setRecruiters([])
    );

    return () => {
      unsubCandidate();
      unsubFirms();
      unsubStatuses();
      unsubRecruiters();
    };
  }, [candidateId]);

  const filteredFirms = useMemo(() => {
    if (!assignFirmSearch.trim()) {
      return firms.slice(0, 20);
    }
    const term = assignFirmSearch.toLowerCase();
    return firms.filter((firm) => firm.name.toLowerCase().includes(term)).slice(0, 20);
  }, [firms, assignFirmSearch]);

  const firmMap = useMemo(() => {
    const map: Record<string, string> = {};
    firms.forEach((firm) => {
      map[firm.id] = firm.name;
    });
    return map;
  }, [firms]);

  const preferredCities = Array.isArray(candidate?.preferences?.preferredCities)
    ? candidate.preferences.preferredCities.join(", ")
    : "";
  const selectedRecruiterId = String(candidate?.assignedRecruiterId ?? "").trim();
  const selectedRecruiterName = String(candidate?.assignedRecruiterName ?? "").trim();
  const selectedRecruiterLabel =
    selectedRecruiterName ||
    recruiters.find((row) => row.id === selectedRecruiterId)?.fullName ||
    "None";

  useEffect(() => {
    setAssignedHeaderEmail(String(candidate?.assignedHeaderEmail ?? ZENITH_EMAIL));
    setAssignedHeaderPhone(String(candidate?.assignedHeaderPhone ?? ZENITH_PHONE));
  }, [candidate?.assignedHeaderEmail, candidate?.assignedHeaderPhone]);

  const openAssignFlow = () => {
    setAssignModalOpen(true);
    setAssignStep("pickFirm");
    setAssignFirmSearch("");
    setAssignFirmId("");
    setAssignStatus("authorization_pending");
  };

  const confirmFirmAssignment = async () => {
    if (!session?.user.uid || !assignFirmId) {
      return;
    }

    try {
      await saveCandidateFirmStatus({
        candidateId,
        firmId: assignFirmId,
        status: assignStatus,
        adminUid: session.user.uid
      });
      setAssignModalOpen(false);
      Alert.alert("Saved", "Firm assignment/status synced to candidate.");
    } catch (error: any) {
      Alert.alert("Could not save", error?.message ?? "Please try again.");
    }
  };

  const updateStatus = async (status: CandidateFirmStatus) => {
    if (!session?.user.uid || !editingStatusRow) {
      return;
    }

    try {
      await updateCandidateFirmStatus({
        statusRecordId: editingStatusRow.id,
        status,
        adminUid: session.user.uid
      });
      setEditingStatusRow(null);
    } catch (error: any) {
      Alert.alert("Could not update", error?.message ?? "Please try again.");
    }
  };

  const confirmRemoveFirm = (statusRow: CandidateFirmStatusRow) => {
    Alert.alert(
      "Remove firm assignment",
      "Are you sure you want to remove this firm from the candidate?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeCandidateFirmStatus(statusRow.id);
            } catch (error: any) {
              Alert.alert("Could not remove", error?.message ?? "Please try again.");
            }
          }
        }
      ]
    );
  };

  const saveAssignedHeader = async () => {
    const nextEmail = assignedHeaderEmail.trim() || ZENITH_EMAIL;
    const nextPhone = assignedHeaderPhone.trim() || ZENITH_PHONE;
    if (!nextEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email link value.");
      return;
    }

    try {
      setSavingHeader(true);
      await updateCandidateAssignedHeader(candidateId, {
        assignedHeaderEmail: nextEmail,
        assignedHeaderPhone: nextPhone
      });
      Alert.alert("Saved", "Assigned header links updated for this candidate.");
    } catch (error: any) {
      Alert.alert("Could not save header", error?.message ?? "Please try again.");
    } finally {
      setSavingHeader(false);
    }
  };

  const promoteToRecruiter = () => {
    const targetUid = String(candidate?.uid ?? candidateId).trim();
    Alert.alert(
      "Change role to Recruiter",
      "This will promote this candidate to recruiter access. Candidate data is kept and will return if demoted back.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              setSavingRole(true);
              await changeUserRoleByAdmin({
                targetUid,
                targetRole: "admin"
              });
              setRoleModalOpen(false);
              Alert.alert("Updated", "Candidate is now a recruiter.");
              navigation.goBack();
            } catch (error: any) {
              Alert.alert("Could not change role", error?.message ?? "Please try again.");
            } finally {
              setSavingRole(false);
            }
          }
        }
      ]
    );
  };

  const saveAssignedRecruiter = async (nextRecruiterId: string) => {
    const resolvedId = nextRecruiterId === "none" ? "" : String(nextRecruiterId).trim();
    const matchedRecruiter = recruiters.find((row) => row.id === resolvedId);
    const resolvedName = resolvedId ? String(matchedRecruiter?.fullName ?? "").trim() : "";

    try {
      setSavingAssignedRecruiter(true);
      await updateCandidateAssignedRecruiter(candidateId, {
        assignedRecruiterId: resolvedId || null,
        assignedRecruiterName: resolvedName || null
      });
      setRecruiterModalOpen(false);
    } catch (error: any) {
      Alert.alert("Could not save recruiter", error?.message ?? "Please try again.");
    } finally {
      setSavingAssignedRecruiter(false);
    }
  };

  return (
    <AppShell title="Candidate Detail" subtitle="Full profile + firm management.">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Back to candidates</Text>
        </Pressable>
        <View style={styles.profileHeader}>
          <Avatar uri={String(candidate?.avatarUrl ?? "")} name={candidate?.fullName || "Candidate"} size={56} />
          <View style={styles.profileBody}>
            <Text style={styles.candidateName}>{candidate?.fullName || "Candidate"}</Text>
            <Text style={styles.meta}>{candidate?.email || "No email"}</Text>
            <Text style={styles.meta}>{candidate?.mobile || "No phone"}</Text>
          </View>
        </View>

        <View style={styles.profileDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned recruiter</Text>
            <Pressable
              style={[styles.roleFieldButton, savingAssignedRecruiter && styles.disabled]}
              onPress={() => setRecruiterModalOpen(true)}
              disabled={savingAssignedRecruiter}
            >
              <Text style={styles.roleFieldText}>{selectedRecruiterLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Practice</Text>
            <Text style={styles.detailValue}>{candidate?.preferences?.practiceArea || "Not set"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred cities</Text>
            <Text style={styles.detailValue}>{preferredCities || "None"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date of birth</Text>
            <Text style={styles.detailValue}>{formatShortDate(String(candidate?.dateOfBirth ?? ""))}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{getAge(String(candidate?.dateOfBirth ?? ""))}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>JD degree received</Text>
            <Text style={styles.detailValue}>{formatShortDate(String(candidate?.jdDegreeDate ?? ""))}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role</Text>
            <Pressable
              style={[styles.roleFieldButton, savingRole && styles.disabled]}
              onPress={() => setRoleModalOpen(true)}
              disabled={savingRole}
            >
              <Text style={styles.roleFieldText}>Candidate</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.assignedHeaderSection}>
          <Text style={styles.assignedHeaderTitle}>Assigned Header</Text>
          <Text style={styles.assignedHeaderSubtitle}>
            Candidate app header links shown at the top of their screens.
          </Text>
          <Text style={styles.inputLabel}>Email hyperlink</Text>
          <TextInput
            style={styles.input}
            value={assignedHeaderEmail}
            onChangeText={setAssignedHeaderEmail}
            placeholder={ZENITH_EMAIL}
            placeholderTextColor="#7f8b9d"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.inputLabel}>Phone hyperlink</Text>
          <TextInput
            style={styles.input}
            value={assignedHeaderPhone}
            onChangeText={setAssignedHeaderPhone}
            placeholder={ZENITH_PHONE}
            placeholderTextColor="#7f8b9d"
            keyboardType="phone-pad"
          />
          <Pressable style={styles.saveHeaderButton} onPress={saveAssignedHeader} disabled={savingHeader}>
            <Text style={styles.saveHeaderButtonText}>{savingHeader ? "Saving..." : "Save Assigned Header"}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Assigned firms</Text>
        {statuses.length === 0 ? <EmptyState message="No firms assigned yet." /> : null}
        {statuses.map((statusRow) => (
          <View key={statusRow.id} style={styles.statusRow}>
            <Text style={styles.firmName}>{firmMap[statusRow.firmId] ?? statusRow.firmId}</Text>
            <StatusChip status={statusRow.status} />
            <Text style={styles.statusDate}>Status updated: {formatStatusUpdatedDate(statusRow.updatedAt)}</Text>
            <View style={styles.statusActionsRow}>
              <Pressable style={styles.changeButton} onPress={() => setEditingStatusRow(statusRow)}>
                <Text style={styles.changeButtonText}>Change status</Text>
              </Pressable>
              <Pressable style={styles.removeButton} onPress={() => confirmRemoveFirm(statusRow)}>
                <Text style={styles.removeButtonText}>Remove firm</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable style={styles.assignButton} onPress={openAssignFlow}>
          <Text style={styles.assignButtonText}>Assign Firm</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={assignModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {assignStep === "pickFirm" ? (
              <>
                <Text style={styles.modalTitle}>Assign Firm</Text>
                <TextInput
                  style={styles.input}
                  value={assignFirmSearch}
                  onChangeText={setAssignFirmSearch}
                  placeholder="Search firm"
                  placeholderTextColor="#7f8b9d"
                />
                <ScrollView style={styles.modalList}>
                  {filteredFirms.map((firm) => {
                    const selected = assignFirmId === firm.id;
                    return (
                      <Pressable
                        key={firm.id}
                        style={[styles.choice, selected && styles.choiceSelected]}
                        onPress={() => setAssignFirmId(firm.id)}
                      >
                        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{firm.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelModalButton} onPress={() => setAssignModalOpen(false)}>
                    <Text style={styles.cancelModalText}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.nextButton, !assignFirmId && styles.disabled]}
                    disabled={!assignFirmId}
                    onPress={() => setAssignStep("pickStatus")}
                  >
                    <Text style={styles.nextButtonText}>Continue</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Firm Assigned</Text>
                <Text style={styles.modalSubtitle}>{firmMap[assignFirmId] ?? "Selected firm"}</Text>

                <View style={styles.statusChoices}>
                  {CANDIDATE_VISIBLE_STATUSES.map((status) => {
                    const selected = assignStatus === status;
                    return (
                      <Pressable
                        key={status}
                        style={[styles.choice, selected && styles.choiceSelected]}
                        onPress={() => setAssignStatus(status)}
                      >
                        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                          {CANDIDATE_STATUS_LABELS[status]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelModalButton} onPress={() => setAssignStep("pickFirm")}>
                    <Text style={styles.cancelModalText}>Back</Text>
                  </Pressable>
                  <Pressable style={styles.nextButton} onPress={confirmFirmAssignment}>
                    <Text style={styles.nextButtonText}>Save assignment</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={roleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Role</Text>
            <Text style={styles.modalSubtitle}>{candidate?.fullName || "Candidate"}</Text>

            <Pressable style={[styles.choice, styles.choiceSelected]} onPress={() => setRoleModalOpen(false)}>
              <Text style={[styles.choiceText, styles.choiceTextSelected]}>Candidate</Text>
            </Pressable>
            <Pressable style={styles.choice} onPress={promoteToRecruiter} disabled={savingRole}>
              <Text style={styles.choiceText}>{savingRole ? "Saving..." : "Recruiter"}</Text>
            </Pressable>

            <Pressable style={styles.cancelModalButton} onPress={() => setRoleModalOpen(false)}>
              <Text style={styles.cancelModalText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={recruiterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRecruiterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assigned Recruiter</Text>
            <Text style={styles.modalSubtitle}>{candidate?.fullName || "Candidate"}</Text>

            <Pressable
              style={[styles.choice, styles.recruiterChoiceRow, !selectedRecruiterId && styles.choiceSelected]}
              onPress={() => saveAssignedRecruiter("none")}
              disabled={savingAssignedRecruiter}
            >
              <Avatar name="None" size={32} showFallbackIcon />
              <View style={styles.recruiterChoiceBody}>
                <Text style={[styles.choiceText, !selectedRecruiterId && styles.choiceTextSelected]}>None</Text>
                <Text style={styles.recruiterChoiceMeta}>No assigned recruiter</Text>
              </View>
            </Pressable>

            {recruiters.map((row) => {
              const recruiterKey = row.id;
              const selected = selectedRecruiterId === recruiterKey;
              return (
                <Pressable
                  key={recruiterKey}
                  style={[styles.choice, styles.recruiterChoiceRow, selected && styles.choiceSelected]}
                  onPress={() => saveAssignedRecruiter(recruiterKey)}
                  disabled={savingAssignedRecruiter}
                >
                  <Avatar uri={row.avatarUrl} name={row.fullName || "Recruiter"} size={32} />
                  <View style={styles.recruiterChoiceBody}>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {String(row.fullName || "Recruiter")}
                    </Text>
                    <Text style={styles.recruiterChoiceMeta}>{row.phone || "No phone"}</Text>
                  </View>
                </Pressable>
              );
            })}

            <Pressable style={styles.cancelModalButton} onPress={() => setRecruiterModalOpen(false)}>
              <Text style={styles.cancelModalText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(editingStatusRow)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingStatusRow(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select status</Text>
            {CANDIDATE_VISIBLE_STATUSES.map((status) => (
              <Pressable key={status} style={styles.choice} onPress={() => updateStatus(status)}>
                <StatusChip status={status} />
              </Pressable>
            ))}
            <Pressable style={styles.cancelModalButton} onPress={() => setEditingStatusRow(null)}>
              <Text style={styles.cancelModalText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 28,
    gap: 10
  },
  backLink: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: 8
  },
  candidateName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  profileHeader: {
    flexDirection: "row",
    gap: 12
  },
  profileBody: {
    flex: 1
  },
  profileDetails: {
    marginTop: 12,
    gap: 8
  },
  detailRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  detailValue: {
    marginTop: 3,
    color: theme.colors.textPrimary,
    fontWeight: "700"
  },
  meta: {
    marginTop: 3,
    color: theme.colors.textSecondary
  },
  assignButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 11
  },
  roleFieldButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  roleFieldText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  assignButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 4,
    marginBottom: 2
  },
  statusRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 8
  },
  firmName: {
    color: theme.colors.textPrimary,
    fontWeight: "700"
  },
  statusDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  changeButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  changeButtonText: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  statusActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  removeButton: {
    borderWidth: 1,
    borderColor: "#ef9c9c",
    backgroundColor: "#fff2f2",
    borderRadius: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  removeButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  },
  requestRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 4
  },
  resolveButton: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  resolveButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11,18,32,0.42)",
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 8
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4
  },
  modalList: {
    maxHeight: 280
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  assignedHeaderSection: {
    marginTop: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    gap: 8
  },
  assignedHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  assignedHeaderSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700"
  },
  saveHeaderButton: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 10
  },
  saveHeaderButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  statusChoices: {
    gap: 6
  },
  choice: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#fff"
  },
  choiceSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  choiceText: {
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  recruiterChoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  recruiterChoiceBody: {
    flex: 1
  },
  recruiterChoiceMeta: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  choiceTextSelected: {
    color: theme.colors.primary
  },
  modalActions: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  cancelModalButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  cancelModalText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  nextButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.5
  }
});
