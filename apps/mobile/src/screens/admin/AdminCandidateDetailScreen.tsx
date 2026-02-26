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
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_VISIBLE_STATUSES,
  CandidateFirmStatus
} from "@zenith/shared";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import { StatusChip } from "../../components/StatusChip";
import { watchCandidateById, watchFirms, FirmRow } from "../../services/adminService";
import {
  resolveCandidateStatusRequest,
  watchAdminPendingCandidateStatusRequests,
  CandidateStatusRequestRecord
} from "../../services/candidateStatusRequestService";
import {
  saveCandidateFirmStatus,
  updateCandidateFirmStatus,
  watchAdminCandidateStatuses,
  CandidateFirmStatusRow
} from "../../services/statusService";
import { useAuth } from "../../state/AuthContext";
import { RootStackParamList } from "../../navigation/types";
import { theme } from "../../ui/theme";

export function AdminCandidateDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const candidateId = (route.params as RootStackParamList["AdminCandidateDetail"]).candidateId;

  const [candidate, setCandidate] = useState<any | null>(null);
  const [firms, setFirms] = useState<FirmRow[]>([]);
  const [statuses, setStatuses] = useState<CandidateFirmStatusRow[]>([]);
  const [requests, setRequests] = useState<CandidateStatusRequestRecord[]>([]);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignStep, setAssignStep] = useState<"pickFirm" | "pickStatus">("pickFirm");
  const [assignFirmSearch, setAssignFirmSearch] = useState("");
  const [assignFirmId, setAssignFirmId] = useState("");
  const [assignStatus, setAssignStatus] = useState<CandidateFirmStatus>("authorization_pending");

  const [editingStatusRow, setEditingStatusRow] = useState<CandidateFirmStatusRow | null>(null);

  useEffect(() => {
    const unsubCandidate = watchCandidateById(candidateId, setCandidate, () => setCandidate(null));
    const unsubFirms = watchFirms(setFirms, () => setFirms([]));
    const unsubStatuses = watchAdminCandidateStatuses(candidateId, setStatuses, () => setStatuses([]));
    const unsubRequests = watchAdminPendingCandidateStatusRequests(candidateId, setRequests, () => setRequests([]));

    return () => {
      unsubCandidate();
      unsubFirms();
      unsubStatuses();
      unsubRequests();
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

  const resolveRequest = async (requestId: string) => {
    if (!session?.user.uid) {
      return;
    }

    try {
      await resolveCandidateStatusRequest(requestId, session.user.uid);
    } catch (error: any) {
      Alert.alert("Could not resolve", error?.message ?? "Please try again.");
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

  return (
    <AppShell title="Candidate Detail" subtitle="Manage firms, statuses, and requests.">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SurfaceCard>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back to candidates</Text>
          </Pressable>
          <Text style={styles.candidateName}>{candidate?.fullName || "Candidate"}</Text>
          <Text style={styles.meta}>{candidate?.email || "No email"}</Text>
          <Text style={styles.meta}>{candidate?.mobile || "No phone"}</Text>
          <Text style={styles.meta}>Work: {candidate?.preferences?.practiceArea || "Not set"}</Text>
          <Text style={styles.meta}>
            Cities: {(candidate?.preferences?.preferredCities ?? []).join(", ") || "None"}
          </Text>

          <Pressable style={styles.assignButton} onPress={openAssignFlow}>
            <Text style={styles.assignButtonText}>Assign Firm</Text>
          </Pressable>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Assigned firms</Text>
          {statuses.length === 0 ? <EmptyState message="No firms assigned yet." /> : null}
          {statuses.map((statusRow) => (
            <View key={statusRow.id} style={styles.statusRow}>
              <Text style={styles.firmName}>{firmMap[statusRow.firmId] ?? statusRow.firmId}</Text>
              <StatusChip status={statusRow.status} />
              <Pressable style={styles.changeButton} onPress={() => setEditingStatusRow(statusRow)}>
                <Text style={styles.changeButtonText}>Change status</Text>
              </Pressable>
            </View>
          ))}
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Candidate status requests</Text>
          {requests.length === 0 ? <EmptyState message="No requests." /> : null}
          {requests.map((request) => (
            <View key={request.id} style={styles.requestRow}>
              <Text style={styles.firmName}>{firmMap[request.firmId] ?? request.firmId}</Text>
              <Text style={styles.meta}>Type: {request.requestType}</Text>
              <Text style={styles.meta}>State: {request.state}</Text>
              {request.state === "pending" ? (
                <Pressable style={styles.resolveButton} onPress={() => resolveRequest(request.id)}>
                  <Text style={styles.resolveButtonText}>Mark resolved</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </SurfaceCard>
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
                <Text style={styles.choiceText}>{CANDIDATE_STATUS_LABELS[status]}</Text>
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
  meta: {
    marginTop: 3,
    color: theme.colors.textSecondary
  },
  assignButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 11
  },
  assignButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8
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
