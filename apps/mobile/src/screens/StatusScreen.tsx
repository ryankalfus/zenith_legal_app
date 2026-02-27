import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CANDIDATE_STATUS_LABELS, CandidateFirmStatus } from "@zenith/shared";
import { useAuth } from "../state/AuthContext";
import { watchCandidateStatuses } from "../services/statusService";
import { respondToAuthorization, watchPendingAuthorizations } from "../services/authorizationService";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function StatusScreen() {
  const { session } = useAuth();
  const [statusRows, setStatusRows] = useState<any[]>([]);
  const [pendingRows, setPendingRows] = useState<any[]>([]);
  const [firmMap, setFirmMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    const unsubStatuses = watchCandidateStatuses(
      session.user.uid,
      (rows) => {
        setStatusRows(rows);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubAuth = watchPendingAuthorizations(
      session.user.uid,
      (rows) => setPendingRows(rows),
      (err) => setError(err.message)
    );

    const unsubFirms = onSnapshot(collection(db, "firms"), (snapshot) => {
      const next: Record<string, string> = {};
      snapshot.docs.forEach((docSnapshot) => {
        next[docSnapshot.id] = String(docSnapshot.data().name ?? docSnapshot.id);
      });
      setFirmMap(next);
    });

    return () => {
      unsubStatuses();
      unsubAuth();
      unsubFirms();
    };
  }, [session?.user.uid]);

  const pendingCount = useMemo(() => pendingRows.length, [pendingRows]);

  const onRespond = async (requestId: string, state: "approved" | "declined") => {
    try {
      await respondToAuthorization(requestId, state);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message ?? "Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Could not load status: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Firm Status Dashboard</Text>
        <Text style={styles.headerSubtitle}>Pending authorizations: {pendingCount}</Text>
      </View>

      {pendingRows.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Authorization requests</Text>
          {pendingRows.map((row) => (
            <View key={row.id} style={styles.pendingRow}>
              <Text style={styles.pendingText}>{firmMap[row.firmId] ?? row.firmId}</Text>
              <View style={styles.pendingActions}>
                <Pressable style={styles.approveButton} onPress={() => onRespond(row.id, "approved")}>
                  <Text style={styles.actionText}>Approve</Text>
                </Pressable>
                <Pressable style={styles.declineButton} onPress={() => onRespond(row.id, "declined")}>
                  <Text style={styles.actionText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.listContent}>
        {statusRows.length === 0 ? <Text style={styles.empty}>No firm statuses yet.</Text> : null}
        {statusRows.map((item) => (
          <View key={item.id} style={styles.statusRow}>
            <Text style={styles.firmName}>{firmMap[item.firmId] ?? item.firmId}</Text>
            <Text style={styles.statusLabel}>
              {CANDIDATE_STATUS_LABELS[item.status as CandidateFirmStatus] ?? item.status}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 12
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  error: {
    color: "#b91c1c"
  },
  headerCard: {
    borderRadius: 12,
    backgroundColor: "white",
    padding: 16,
    gap: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  headerSubtitle: {
    color: "#4b5563"
  },
  sectionCard: {
    borderRadius: 12,
    backgroundColor: "white",
    padding: 12,
    gap: 10
  },
  listContent: {
    paddingBottom: 12
  },
  sectionTitle: {
    fontWeight: "700"
  },
  pendingRow: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 10,
    gap: 10
  },
  pendingText: {
    fontWeight: "600"
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8
  },
  approveButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
    paddingVertical: 10
  },
  declineButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    alignItems: "center",
    paddingVertical: 10
  },
  actionText: {
    color: "white",
    fontWeight: "600"
  },
  statusRow: {
    borderRadius: 12,
    backgroundColor: "white",
    padding: 12,
    marginBottom: 10,
    gap: 5
  },
  firmName: {
    fontWeight: "700"
  },
  statusLabel: {
    color: "#111827"
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 20
  }
});
