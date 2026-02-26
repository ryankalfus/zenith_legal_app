import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APPOINTMENT_STATUS_LABELS, AppointmentStatus } from "@zenith/shared";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import {
  updateAppointmentStatus,
  watchAdminAppointmentRequests,
  AppointmentRow
} from "../../services/appointmentService";
import { watchCandidates } from "../../services/adminService";
import { theme } from "../../ui/theme";

export function AdminAppointmentRequestsScreen() {
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [candidateMap, setCandidateMap] = useState<Record<string, { name: string; phone: string }>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAppointments = watchAdminAppointmentRequests(setRows, () => setRows([]));
    const unsubCandidates = watchCandidates(
      (next) => {
        const map: Record<string, { name: string; phone: string }> = {};
        next.forEach((entry) => {
          map[entry.id] = {
            name: String(entry.fullName ?? "Candidate"),
            phone: String(entry.mobile ?? "")
          };
        });
        setCandidateMap(map);
      },
      () => setCandidateMap({})
    );

    return () => {
      unsubAppointments();
      unsubCandidates();
    };
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [rows]);

  const setStatus = async (appointmentId: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(appointmentId, status);
  };

  return (
    <AppShell title="Appointment Requests" subtitle="Review and manage candidate call requests." scroll>
      {sortedRows.length === 0 ? <EmptyState message="No appointment requests yet." /> : null}

      {sortedRows.map((row) => {
        const startsAt = new Date(row.startsAt);
        const isExpanded = expandedId === row.id;
        const candidate = candidateMap[row.candidateId];

        return (
          <SurfaceCard key={row.id}>
            <Text style={styles.name}>{candidate?.name || "Candidate"}</Text>
            <Text style={styles.meta}>Phone: {row.phoneNumber || candidate?.phone || "n/a"}</Text>
            <Text style={styles.meta}>
              {startsAt.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric"
              })}{" "}
              {startsAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              })}
            </Text>
            <Text style={styles.meta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>

            <Pressable style={styles.expandButton} onPress={() => setExpandedId(isExpanded ? null : row.id)}>
              <Text style={styles.expandButtonText}>{isExpanded ? "Hide note" : "See note"}</Text>
            </Pressable>
            {isExpanded ? <Text style={styles.noteText}>{row.notes || "No note"}</Text> : null}

            <View style={styles.actionRow}>
              <Pressable style={styles.actionButton} onPress={() => setStatus(row.id, "scheduled")}>
                <Text style={styles.actionButtonText}>Schedule</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => setStatus(row.id, "completed")}>
                <Text style={styles.actionButtonText}>Complete</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setStatus(row.id, "canceled")}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </SurfaceCard>
        );
      })}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  meta: {
    marginTop: 4,
    color: theme.colors.textSecondary
  },
  expandButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  expandButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  noteText: {
    marginTop: 6,
    color: theme.colors.textPrimary
  },
  actionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    paddingVertical: 9
  },
  actionButtonText: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1b0b0",
    backgroundColor: "#fff1f1",
    alignItems: "center",
    paddingVertical: 9
  },
  cancelButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  }
});
