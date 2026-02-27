import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { APPOINTMENT_STATUS_LABELS, AppointmentStatus } from "@zenith/shared";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import {
  formatCandidateAppointmentCanceledChat,
  formatCandidateAppointmentRequestChat
} from "../../lib/appointmentChat";
import {
  createAppointmentRequest,
  deleteAppointment,
  watchCandidateAppointments,
  updateAppointmentStatus
} from "../../services/appointmentService";
import { watchRecruiters } from "../../services/adminService";
import { addAppointmentToDeviceCalendar } from "../../services/calendarService";
import { sendMessage } from "../../services/messagingService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";
import { clearCandidateAppointmentUpdates, watchUser } from "../../services/userService";

type AppointmentViewRow = {
  id: string;
  startsAt: string;
  endsAt?: string;
  status: AppointmentStatus;
  phoneNumber: string;
  recruiterId: string;
  recruiterName: string;
  notes?: string;
};

type RecruiterOption = {
  id: string;
  label: string;
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
  const isFocused = useIsFocused();
  const { session } = useAuth();
  const [rows, setRows] = useState<AppointmentViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDate, setRequestDate] = useState<Date>(new Date());
  const [requestTime, setRequestTime] = useState<Date>(new Date());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [note, setNote] = useState("");
  const [candidateName, setCandidateName] = useState("Candidate");
  const [activePicker, setActivePicker] = useState<"date" | "time" | null>(null);
  const [recruiters, setRecruiters] = useState<RecruiterOption[]>([]);
  const [requestRecruiterId, setRequestRecruiterId] = useState("");
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
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

    return unsub;
  }, [session?.user.uid]);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    return watchUser(
      session.user.uid,
      (data) => setCandidateName(String(data?.fullName ?? "Candidate")),
      () => setCandidateName("Candidate")
    );
  }, [session?.user.uid]);

  useEffect(() => {
    if (!session?.user.uid || !isFocused) {
      return;
    }
    clearCandidateAppointmentUpdates(session.user.uid).catch(() => undefined);
  }, [isFocused, session?.user.uid]);

  useEffect(() => {
    const unsubscribe = watchRecruiters(
      (rows) => {
        const unique = new Map<string, RecruiterOption>();
        rows.forEach((row) => {
          const id = String(row.uid ?? row.id).trim();
          const label = String(row.fullName ?? "").trim() || "Recruiter";
          if (!id) {
            return;
          }
          unique.set(id, { id, label });
        });
        const next = [...unique.values()].sort((a, b) =>
          a.label.localeCompare(b.label, "en", { sensitivity: "base" })
        );
        setRecruiters(next);
      },
      () => setRecruiters([])
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!requestRecruiterId && recruiters.length > 0) {
      setRequestRecruiterId(recruiters[0].id);
    }
  }, [recruiters, requestRecruiterId]);

  const startsAtIso = useMemo(() => {
    const merged = new Date(requestDate);
    merged.setHours(requestTime.getHours());
    merged.setMinutes(requestTime.getMinutes());
    merged.setSeconds(0);
    merged.setMilliseconds(0);
    return merged.toISOString();
  }, [requestDate, requestTime]);

  const recruiterLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    recruiters.forEach((entry) => {
      map[entry.id] = entry.label;
    });
    return map;
  }, [recruiters]);

  const selectedRecruiterLabel =
    recruiterLabelById[requestRecruiterId] ||
    recruiters[0]?.label ||
    "Recruiter";

  const getRecruiterLabel = (row: AppointmentViewRow) =>
    String(row.recruiterName ?? "").trim() ||
    recruiterLabelById[String(row.recruiterId ?? "")] ||
    selectedRecruiterLabel;

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setRequestDate(selectedDate);
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
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
    if (!requestRecruiterId) {
      Alert.alert("Recruiter required", "Please choose a recruiter.");
      return;
    }

    try {
      setSaving(true);
      const trimmedNote = note.trim();
      await createAppointmentRequest({
        candidateId: session.user.uid,
        createdBy: session.user.uid,
        createdByRole: "candidate",
        startsAt: startsAtIso,
        phoneNumber: phoneNumber.trim(),
        recruiterId: requestRecruiterId,
        recruiterName: selectedRecruiterLabel,
        notes: trimmedNote
      });
      try {
        await sendMessage({
          candidateId: session.user.uid,
          senderId: session.user.uid,
          senderRole: "candidate",
          text: formatCandidateAppointmentRequestChat({
            candidateName,
            startsAt: startsAtIso,
            recruiterName: selectedRecruiterLabel,
            notes: trimmedNote
          })
        });
      } catch {
        // Keep appointment request successful even if chat send fails.
      }
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
            if (row.status === "requested") {
              return;
            }
            try {
              await sendMessage({
                candidateId: session.user.uid,
                senderId: session.user.uid,
                senderRole: "candidate",
                text: formatCandidateAppointmentCanceledChat({
                  candidateName,
                  startsAt: row.startsAt,
                  recruiterName: getRecruiterLabel(row),
                  notes: row.notes
                })
              });
            } catch {
              // Keep cancel successful even if chat send fails.
            }
          } catch (error: any) {
            Alert.alert("Could not cancel", error?.message ?? "Please try again.");
          }
        }
      }
    ]);
  };

  const confirmIgnoreOverdue = (row: AppointmentViewRow) => {
    Alert.alert(
      "Ignore overdue appointment",
      "Are you sure? This will hide it for both sides permanently.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Ignore",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAppointment(row.id);
            } catch (error: any) {
              Alert.alert("Could not ignore", error?.message ?? "Please try again.");
            }
          }
        }
      ]
    );
  };

  const addToCalendar = async (row: AppointmentViewRow) => {
    try {
      await addAppointmentToDeviceCalendar({
        title: "Call with Zenith Legal",
        notes: row.notes,
        startsAt: row.startsAt,
        endsAt: row.endsAt
      });
      Alert.alert("Added", "Appointment added to your phone calendar.");
    } catch (error: any) {
      Alert.alert("Could not add to calendar", error?.message ?? "Please try again.");
    }
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
    return row.status === "requested";
  });

  return (
    <AppShell
      title="Appointments"
      subtitle="Request a call with Zenith Legal."
      topRightLogoStyle={styles.dashboardHeroLogo}
      scroll
    >
      <SurfaceCard>
        <Text style={styles.sectionTitle}>Request appointment</Text>

        <Pressable style={styles.dropdownButton} onPress={() => setShowRecruiterModal(true)}>
          <Text style={styles.dropdownLabel}>Recruiter</Text>
          <View style={styles.dropdownValueRow}>
            <Text style={styles.dropdownValue}>{selectedRecruiterLabel}</Text>
            <Text style={styles.pickChevron}>▼</Text>
          </View>
        </Pressable>

        <View style={styles.rowButtons}>
          <Pressable
            style={[styles.pickButton, activePicker === "date" && styles.pickButtonActive]}
            onPress={() => setActivePicker((current) => (current === "date" ? null : "date"))}
          >
            <Text style={styles.pickLabel}>Date</Text>
            <View style={styles.pickValueRow}>
              <Text style={styles.pickValue}>{formatDate(requestDate)}</Text>
              <Text style={styles.pickChevron}>▼</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.pickButton, activePicker === "time" && styles.pickButtonActive]}
            onPress={() => setActivePicker((current) => (current === "time" ? null : "time"))}
          >
            <Text style={styles.pickLabel}>Time</Text>
            <View style={styles.pickValueRow}>
              <Text style={styles.pickValue}>{formatTime(requestTime)}</Text>
              <Text style={styles.pickChevron}>▼</Text>
            </View>
          </Pressable>
        </View>

        {activePicker === "date" ? (
          <View style={styles.inlinePickerWrap}>
            <DateTimePicker
              value={requestDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "spinner"}
              onChange={onDateChange}
            />
          </View>
        ) : null}
        {activePicker === "time" ? (
          <View style={styles.inlinePickerWrap}>
            <DateTimePicker
              value={requestTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "spinner"}
              onChange={onTimeChange}
            />
          </View>
        ) : null}

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
        {recruiters.length === 0 ? (
          <Text style={styles.recruiterHint}>Recruiters are syncing. Please wait.</Text>
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
                  <Text style={styles.historyMeta}>Recruiter: {getRecruiterLabel(row)}</Text>
                  <Text style={styles.historyMeta}>Phone: {row.phoneNumber || "n/a"}</Text>
                  <Text style={styles.historyMeta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                  {row.notes ? <Text style={styles.historyMeta}>Note: {row.notes}</Text> : null}
                  <Pressable style={styles.ignoreButton} onPress={() => confirmIgnoreOverdue(row)}>
                    <Text style={styles.ignoreButtonText}>Ignore</Text>
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
                  <Text style={styles.historyMeta}>Recruiter: {getRecruiterLabel(row)}</Text>
                  <Text style={styles.historyMeta}>Phone: {row.phoneNumber || "n/a"}</Text>
                  <Text style={styles.historyMeta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                  {row.notes ? <Text style={styles.historyMeta}>Note: {row.notes}</Text> : null}
                    <Pressable style={styles.calendarButton} onPress={() => addToCalendar(row)}>
                      <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                    </Pressable>
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
                  <Text style={styles.historyMeta}>Recruiter: {getRecruiterLabel(row)}</Text>
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

      <Modal
        visible={showRecruiterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecruiterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select recruiter</Text>
            {recruiters.length === 0 ? <Text style={styles.modalEmptyText}>No recruiters available.</Text> : null}
            {recruiters.map((entry) => {
              const selected = requestRecruiterId === entry.id;
              return (
                <Pressable
                  key={entry.id}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    setRequestRecruiterId(entry.id);
                    setShowRecruiterModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{entry.label}</Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.closeModalButton} onPress={() => setShowRecruiterModal(false)}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  dashboardHeroLogo: {
    width: 90,
    height: 90,
    top: -6,
    right: 8
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 10
  },
  dropdownLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  dropdownValueRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dropdownValue: {
    color: theme.colors.textPrimary,
    fontWeight: "700"
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
  pickButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#eef4ff"
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
  inlinePickerWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden"
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
  recruiterHint: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 12
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
  calendarButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#9dc2ff",
    backgroundColor: "#eef5ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  calendarButtonText: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  cancelButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  },
  ignoreButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#f0c18a",
    backgroundColor: "#fff4e9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  ignoreButtonText: {
    color: "#ba6a00",
    fontWeight: "700"
  },
  scheduleLink: {
    marginTop: 10,
    color: "#2f68e8",
    fontSize: 12,
    fontWeight: "600"
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(11,18,32,0.42)"
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 8
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700"
  },
  modalEmptyText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4
  },
  modalOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  modalOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  modalOptionText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  modalOptionTextSelected: {
    color: theme.colors.primary
  },
  closeModalButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  closeModalButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  }
});
