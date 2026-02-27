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
import {
  createCandidateStatusRequest,
  watchPendingCandidateStatusRequests
} from "../../services/candidateStatusRequestService";
import { watchCandidateStatuses } from "../../services/statusService";
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
  const [pendingRows, setPendingRows] = useState<Array<{ id: string; firmId: string }>>([]);
  const [firmMap, setFirmMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
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

    const unsubscribePending = watchPendingCandidateStatusRequests(
      session.user.uid,
      (next) => setPendingRows(next.map((entry) => ({ id: entry.id, firmId: entry.firmId }))),
      () => setPendingRows([])
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
      unsubscribePending();
      unsubscribeFirms();
    };
  }, [session?.user.uid]);

  const pendingByFirm = useMemo(() => {
    const map: Record<string, boolean> = {};
    pendingRows.forEach((entry) => {
      map[entry.firmId] = true;
    });
    return map;
  }, [pendingRows]);

  const submitRequest = async (requestType: "authorization" | "cancellation") => {
    if (!session?.user.uid || !selectedFirmId) {
      return;
    }

    try {
      setSubmitting(true);
      await createCandidateStatusRequest({
        candidateId: session.user.uid,
        firmId: selectedFirmId,
        requestType
      });
      setSelectedFirmId(null);
      Alert.alert("Sent", "Zenith Legal has been notified.");
    } catch (err: any) {
      Alert.alert("Request failed", err?.message ?? "Please try again.");
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
          const hasPending = Boolean(pendingByFirm[row.firmId]);

          return (
            <SurfaceCard key={row.id}>
              <View style={styles.rowHeader}>
                <Text style={styles.firmName}>{firmMap[row.firmId] ?? row.firmId}</Text>
                {hasPending ? (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending request</Text>
                  </View>
                ) : null}
              </View>
              <StatusChip status={row.status} />
              {isWaiting ? (
                <Pressable
                  style={[styles.requestButton, hasPending && styles.disabled]}
                  disabled={hasPending}
                  onPress={() => setSelectedFirmId(row.firmId)}
                >
                  <Text style={styles.requestButtonText}>
                    {hasPending ? "Awaiting Zenith action" : "Open request actions"}
                  </Text>
                </Pressable>
              ) : null}
            </SurfaceCard>
          );
        })}

      <Modal visible={Boolean(selectedFirmId)} transparent animationType="fade" onRequestClose={() => setSelectedFirmId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{firmMap[selectedFirmId ?? ""] ?? "Selected firm"}</Text>
            <Text style={styles.modalSubtitle}>Choose one action to notify Zenith Legal.</Text>
            <Pressable
              style={styles.primaryAction}
              onPress={() => submitRequest("authorization")}
              disabled={submitting}
            >
              <Text style={styles.primaryActionText}>Request authorization</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryAction}
              onPress={() => submitRequest("cancellation")}
              disabled={submitting}
            >
              <Text style={styles.secondaryActionText}>Request cancellation</Text>
            </Pressable>
            <Pressable style={styles.closeAction} onPress={() => setSelectedFirmId(null)}>
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
  pendingBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: "#bcd1ff"
  },
  pendingBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "700"
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
  primaryAction: {
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 11
  },
  primaryActionText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryAction: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    paddingVertical: 11
  },
  secondaryActionText: {
    color: theme.colors.primary,
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
