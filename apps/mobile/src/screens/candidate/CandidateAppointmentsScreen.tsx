import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { APPOINTMENT_STATUS_LABELS, AppointmentStatus } from "@zenith/shared";
import { useNavigation } from "@react-navigation/native";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import {
  createAppointmentRequest,
  watchCandidateAppointments,
  updateAppointmentStatus
} from "../../services/appointmentService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";
import { clearCandidateAppointmentUpdates } from "../../services/userService";

type AppointmentViewRow = {
  id: string;
  startsAt: string;
  status: AppointmentStatus;
  phoneNumber: string;
  notes?: string;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function parseStartsAt(startsAt: string) {
  const date = new Date(startsAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function CandidateAppointmentsScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [rows, setRows] = useState<AppointmentViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDate, setRequestDate] = useState<Date>(new Date());
  const [requestTime, setRequestTime] = useState<Date>(new Date());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [note, setNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    const unsub = watchCandidateAppointments(
      session.user.uid,
      (next) => {
        setRows(next as AppointmentViewRow[]);
        setLoading(false);
      },
      () => setLoading(false)
    );

    clearCandidateAppointmentUpdates(session.user.uid).catch(() => undefined);

    return unsub;
  }, [session?.user.uid]);

  const startsAtIso = useMemo(() => {
    const merged = new Date(requestDate);
    merged.setHours(requestTime.getHours());
    merged.setMinutes(requestTime.getMinutes());
    merged.setSeconds(0);
    merged.setMilliseconds(0);
    return merged.toISOString();
  }, [requestDate, requestTime]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setRequestDate(selectedDate);
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setRequestTime(selectedTime);
    }
  };

  const submitRequest = async () => {
    if (!session?.user.uid) {
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Phone required", "Please provide a phone number.");
      return;
    }

    try {
      setSaving(true);
      await createAppointmentRequest({
        candidateId: session.user.uid,
        createdBy: session.user.uid,
        createdByRole: "candidate",
        startsAt: startsAtIso,
        phoneNumber: phoneNumber.trim(),
        notes: note.trim()
      });
      setNote("");
      Alert.alert("Submitted", "Appointment request sent to Zenith Legal.");
    } catch (error: any) {
      Alert.alert("Could not submit", error?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = (row: AppointmentViewRow) => {
    if (!session?.user.uid) {
      return;
    }

    Alert.alert("Cancel appointment", "Are you sure you want to cancel this appointment?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await updateAppointmentStatus({
              appointmentId: row.id,
              status: "canceled",
              updatedBy: session.user.uid,
              updatedByRole: "candidate"
            });
          } catch (error: any) {
            Alert.alert("Could not cancel", error?.message ?? "Please try again.");
          }
        }
      }
    ]);
  };

  const now = Date.now();
  const sorted = [...rows].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const overdueScheduled = sorted.filter((row) => {
    const date = parseStartsAt(row.startsAt);
    return row.status === "scheduled" && date && date.getTime() < now;
  });
  const upcomingScheduled = sorted.filter((row) => {
    const date = parseStartsAt(row.startsAt);
    return row.status === "scheduled" && date && date.getTime() >= now;
  });
  const pendingRequests = sorted.filter((row) => {
    if (row.status !== "requested") {
      return false;
    }
    const date = parseStartsAt(row.startsAt);
    return date ? date.getTime() >= now : false;
  });

  return (
    <AppShell title="Appointments" subtitle="Request a call with Zenith Legal." scroll>
      <SurfaceCard>
        <Text style={styles.sectionTitle}>Request appointment</Text>

        <View style={styles.rowButtons}>
          <Pressable style={styles.pickButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickLabel}>Date</Text>
            <View style={styles.pickValueRow}>
              <Text style={styles.pickValue}>{formatDate(requestDate)}</Text>
              <Text style={styles.pickChevron}>▼</Text>
            </View>
          </Pressable>
          <Pressable style={styles.pickButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.pickLabel}>Time</Text>
            <View style={styles.pickValueRow}>
              <Text style={styles.pickValue}>{formatTime(requestTime)}</Text>
              <Text style={styles.pickChevron}>▼</Text>
            </View>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="Phone number (required)"
          placeholderTextColor="#7f8b9d"
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Short note (optional)"
          placeholderTextColor="#7f8b9d"
          multiline
        />

        <Pressable style={styles.submitButton} onPress={submitRequest} disabled={saving}>
          <Text style={styles.submitButtonText}>{saving ? "Submitting..." : "Submit request"}</Text>
        </Pressable>

        {showDatePicker ? (
          <DateTimePicker value={requestDate} mode="date" display="default" onChange={onDateChange} />
        ) : null}
        {showTimePicker ? (
          <DateTimePicker value={requestTime} mode="time" display="default" onChange={onTimeChange} />
        ) : null}
      </SurfaceCard>

      {loading ? (
        <SurfaceCard>
          <View style={styles.centeredRow}>
            <ActivityIndicator />
            <Text>Loading appointments...</Text>
          </View>
        </SurfaceCard>
      ) : null}

      {!loading && overdueScheduled.length > 0 ? (
        <SurfaceCard>
          <Text style={styles.overdueTitle}>Overdue Appointments</Text>
          <View style={styles.historyList}>
            {overdueScheduled.map((row) => {
              const starts = parseStartsAt(row.startsAt) ?? new Date();
              return (
                <View key={row.id} style={styles.historyRow}>
                  <Text style={styles.historyTitle}>
                    {formatDate(starts)} at {formatTime(starts)}
                  </Text>
                  <Text style={styles.historyMeta}>Phone: {row.phoneNumber || "n/a"}</Text>
                  <Text style={styles.historyMeta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                  {row.notes ? <Text style={styles.historyMeta}>Note: {row.notes}</Text> : null}
                  <Pressable style={styles.cancelButton} onPress={() => confirmCancel(row)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </SurfaceCard>
      ) : null}

      {!loading ? (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Upcoming appointments</Text>
          {upcomingScheduled.length === 0 ? (
            <EmptyState message="No upcoming appointments." />
          ) : (
            <View style={styles.historyList}>
              {upcomingScheduled.map((row) => {
                const starts = parseStartsAt(row.startsAt) ?? new Date();
                return (
                  <View key={row.id} style={styles.historyRow}>
                    <Text style={styles.historyTitle}>
                      {formatDate(starts)} at {formatTime(starts)}
                    </Text>
                    <Text style={styles.historyMeta}>Phone: {row.phoneNumber || "n/a"}</Text>
                    <Text style={styles.historyMeta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                    {row.notes ? <Text style={styles.historyMeta}>Note: {row.notes}</Text> : null}
                    <Pressable style={styles.cancelButton} onPress={() => confirmCancel(row)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate("Chat")}>
                      <Text style={styles.scheduleLink}>Questions about schedule changes? Chat here.</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </SurfaceCard>
      ) : null}

      {!loading ? (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Pending requests</Text>
          {pendingRequests.length === 0 ? (
            <EmptyState message="No pending requests." />
          ) : (
            <View style={styles.historyList}>
              {pendingRequests.map((row) => {
                const starts = parseStartsAt(row.startsAt) ?? new Date();
                return (
                  <View key={row.id} style={styles.historyRow}>
                    <Text style={styles.historyTitle}>
                      {formatDate(starts)} at {formatTime(starts)}
                    </Text>
                    <Text style={styles.historyMeta}>Phone: {row.phoneNumber || "n/a"}</Text>
                    <Text style={styles.historyMeta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                    {row.notes ? <Text style={styles.historyMeta}>Note: {row.notes}</Text> : null}
                    <Pressable style={styles.cancelButton} onPress={() => confirmCancel(row)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8
  },
  overdueTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.danger,
    marginBottom: 8
  },
  rowButtons: {
    flexDirection: "row",
    gap: 8
  },
  pickButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#f8fafe",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10
  },
  pickLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  pickValue: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    marginTop: 2
  },
  pickValueRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pickChevron: {
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 10,
    backgroundColor: "#fff"
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: "top"
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 12
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  centeredRow: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8
  },
  historyList: {
    gap: 8
  },
  historyRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff"
  },
  historyTitle: {
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  historyMeta: {
    color: theme.colors.textSecondary,
    marginTop: 4
  },
  cancelButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#f1b0b0",
    backgroundColor: "#fff1f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  cancelButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  },
  scheduleLink: {
    marginTop: 10,
    color: "#2f68e8",
    fontSize: 12,
    fontWeight: "600"
  }
});
