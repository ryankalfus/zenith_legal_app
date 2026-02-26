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
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import {
  createAppointmentRequest,
  watchCandidateAppointments,
  updateAppointmentStatus
} from "../../services/appointmentService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";

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

export function CandidateAppointmentsScreen() {
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

    return watchCandidateAppointments(
      session.user.uid,
      (next) => {
        setRows(next as AppointmentViewRow[]);
        setLoading(false);
      },
      () => setLoading(false)
    );
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

  const cancelRequest = async (appointmentId: string) => {
    if (!session?.user.uid) {
      return;
    }
    try {
      await updateAppointmentStatus({
        appointmentId,
        status: "canceled",
        updatedBy: session.user.uid,
        updatedByRole: "candidate"
      });
    } catch (error: any) {
      Alert.alert("Could not cancel", error?.message ?? "Please try again.");
    }
  };

  return (
    <AppShell
      title="Appointments"
      subtitle="Request a call with Zenith Legal."
      showCandidateContactBar
      scroll
    >
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

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Request history</Text>
        {loading ? (
          <View style={styles.centeredRow}>
            <ActivityIndicator />
            <Text>Loading requests...</Text>
          </View>
        ) : rows.length === 0 ? (
          <EmptyState message="No appointment requests yet." />
        ) : (
          <View style={styles.historyList}>
            {rows.map((row) => {
              const starts = new Date(row.startsAt);
              return (
                <View key={row.id} style={styles.historyRow}>
                  <Text style={styles.historyTitle}>
                    {formatDate(starts)} at {formatTime(starts)}
                  </Text>
                  <Text style={styles.historyMeta}>Phone: {row.phoneNumber || "n/a"}</Text>
                  <Text style={styles.historyMeta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                  {row.notes ? <Text style={styles.historyMeta}>Note: {row.notes}</Text> : null}
                  {(row.status === "requested" || row.status === "scheduled") ? (
                    <Pressable style={styles.cancelButton} onPress={() => cancelRequest(row.id)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </SurfaceCard>
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
  }
});
