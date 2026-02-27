import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { CandidateFirmStatus } from "@zenith/shared";
import { collection, onSnapshot } from "firebase/firestore";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import { StatusChip } from "../../components/StatusChip";
import { db } from "../../lib/firebase";
import { useAuth } from "../../state/AuthContext";
import { sendMessage } from "../../services/messagingService";
import {
  updateCandidateFirmStatusByCandidate,
  watchCandidateStatuses
} from "../../services/statusService";
import { watchUser } from "../../services/userService";
import { theme } from "../../ui/theme";

const LOGO = require("../../../assets/zenith-legal-logo.png");

type DashboardRow = {
  id: string;
  candidateId: string;
  firmId: string;
  status: CandidateFirmStatus;
};

export function CandidateDashboardScreen() {
  const { session } = useAuth();
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [firmMap, setFirmMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("Candidate");
  const [selectedRow, setSelectedRow] = useState<DashboardRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    const unsubscribeStatus = watchCandidateStatuses(
      session.user.uid,
      (next) => {
        setRows(next as DashboardRow[]);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubscribeUser = watchUser(
      session.user.uid,
      (profile) => setCandidateName(String(profile?.fullName ?? "Candidate")),
      () => setCandidateName("Candidate")
    );

    const unsubscribeFirms = onSnapshot(
      collection(db, "firms"),
      (snapshot) => {
        const next: Record<string, string> = {};
        snapshot.docs.forEach((entry) => {
          next[entry.id] = String(entry.data().name ?? entry.id);
        });
        setFirmMap(next);
      },
      () => setFirmMap({})
    );

    return () => {
      unsubscribeStatus();
      unsubscribeUser();
      unsubscribeFirms();
    };
  }, [session?.user.uid]);

  const selectedFirmName = useMemo(() => {
    if (!selectedRow) {
      return "";
    }
    return firmMap[selectedRow.firmId] ?? selectedRow.firmId;
  }, [firmMap, selectedRow]);

  const submitDecision = async (decision: "authorize" | "cancel") => {
    if (!session?.user.uid || !selectedRow) {
      return;
    }

    const nextStatus = decision === "authorize" ? "waiting_for_submission" : "canceled";
    const detailText =
      decision === "authorize"
        ? `Candidate ${candidateName} has authorized submission for ${selectedFirmName}`
        : `Candidate ${candidateName} has canceled assignment to ${selectedFirmName}`;

    try {
      setSubmitting(true);
      await updateCandidateFirmStatusByCandidate({
        statusRecordId: selectedRow.id,
        status: nextStatus,
        candidateUid: session.user.uid
      });
      try {
        await sendMessage({
          candidateId: session.user.uid,
          senderId: session.user.uid,
          senderRole: "candidate",
          text: detailText
        });
      } catch {
        // Keep status save successful even if DM transport fails once.
      }
      setSelectedRow(null);
      Alert.alert("Saved", "Your choice was sent to Zenith Legal.");
    } catch (err: any) {
      const message =
        err?.code === "permission-denied"
          ? "You no longer have permission for this status change. Refresh and try again."
          : err?.message ?? "Please try again.";
      Alert.alert("Could not save", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Dashboard"
      subtitle="Track your assigned firms and request action when needed."
      showCandidateContactBar
      scroll
    >
      <SurfaceCard>
        <View style={styles.brandRow}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandTitle}>Zenith Legal</Text>
            <Text style={styles.brandSubtitle}>Your live candidate status board</Text>
          </View>
        </View>
      </SurfaceCard>

      {loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator />
          <Text>Loading dashboard...</Text>
        </View>
      ) : null}

      {error && rows.length === 0 ? (
        <SurfaceCard>
          <Text style={styles.errorText}>
            {String(error).toLowerCase().includes("insufficient permissions")
              ? "Dashboard is syncing. Assigned firms will appear here shortly."
              : `Could not load dashboard: ${error}`}
          </Text>
        </SurfaceCard>
      ) : null}

      {!loading && rows.length === 0 ? <EmptyState message="No firms assigned yet." /> : null}

      {!loading &&
        rows.map((row) => {
          const isWaiting = row.status === "authorization_pending";

          return (
            <SurfaceCard key={row.id}>
              <View style={styles.rowHeader}>
                <Text style={styles.firmName}>{firmMap[row.firmId] ?? row.firmId}</Text>
              </View>
              <StatusChip status={row.status} />
              {isWaiting ? (
                <Pressable
                  style={styles.requestButton}
                  onPress={() => setSelectedRow(row)}
                >
                  <Text style={styles.requestButtonText}>Choose authorize/cancel</Text>
                </Pressable>
              ) : null}
            </SurfaceCard>
          );
        })}

      <Modal visible={Boolean(selectedRow)} transparent animationType="fade" onRequestClose={() => setSelectedRow(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedFirmName || "Selected firm"}</Text>
            <Text style={styles.modalSubtitle}>Choose one action.</Text>
            <Pressable
              style={styles.authorizeAction}
              onPress={() => submitDecision("authorize")}
              disabled={submitting}
            >
              <Text style={styles.authorizeActionText}>Authorize</Text>
            </Pressable>
            <Pressable
              style={styles.cancelAction}
              onPress={() => submitDecision("cancel")}
              disabled={submitting}
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.closeAction} onPress={() => setSelectedRow(null)}>
              <Text style={styles.closeActionText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logo: {
    width: 56,
    height: 56
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  brandSubtitle: {
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  centerBlock: {
    alignItems: "center",
    gap: 8,
    marginTop: 12
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: "600"
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8
  },
  firmName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  requestButton: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 10
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.55
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11,18,32,0.4)",
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 10
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  authorizeAction: {
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    alignItems: "center",
    paddingVertical: 11
  },
  authorizeActionText: {
    color: "#fff",
    fontWeight: "700"
  },
  cancelAction: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef9c9c",
    backgroundColor: "#fff2f2",
    alignItems: "center",
    paddingVertical: 11
  },
  cancelActionText: {
    color: theme.colors.danger,
    fontWeight: "700"
  },
  closeAction: {
    alignItems: "center",
    paddingVertical: 8
  },
  closeActionText: {
    color: theme.colors.textSecondary,
    fontWeight: "600"
  }
});
