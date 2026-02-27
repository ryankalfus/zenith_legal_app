import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { APPOINTMENT_STATUS_LABELS, AppointmentStatus } from "@zenith/shared";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import {
  formatAdminAppointmentCanceledChat,
  formatAdminAppointmentCreatedChat,
  formatAdminAppointmentDecisionChat,
  formatAdminAppointmentModifiedChat
} from "../../lib/appointmentChat";
import {
  AppointmentRow,
  createAdminAppointment,
  deleteAppointment,
  updateAppointmentDetails,
  updateAppointmentStatus,
  watchAdminAppointmentRequests,
  watchAdminUnattendedRequests
} from "../../services/appointmentService";
import { addAppointmentToDeviceCalendar } from "../../services/calendarService";
import { watchCandidates } from "../../services/adminService";
import { sendMessage } from "../../services/messagingService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";

type CandidateOption = {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function parseDate(input: string) {
  const value = new Date(input);
  return Number.isNaN(value.getTime()) ? null : value;
}

function mergeDateAndTime(datePart: Date, timePart: Date) {
  const merged = new Date(datePart);
  merged.setHours(timePart.getHours());
  merged.setMinutes(timePart.getMinutes());
  merged.setSeconds(0);
  merged.setMilliseconds(0);
  return merged.toISOString();
}

function badgeText(count: number) {
  return count > 9 ? "9+" : String(count);
}

export function AdminAppointmentRequestsScreen() {
  const { session } = useAuth();
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [unattendedRows, setUnattendedRows] = useState<AppointmentRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showCreateCandidateModal, setShowCreateCandidateModal] = useState(false);
  const [unattendedLoading, setUnattendedLoading] = useState(true);
  const [unattendedError, setUnattendedError] = useState<string | null>(null);

  const [createCandidateId, setCreateCandidateId] = useState("");
  const [createDate, setCreateDate] = useState<Date>(new Date());
  const [createTime, setCreateTime] = useState<Date>(new Date());
  const [createPhone, setCreatePhone] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [activeCreatePicker, setActiveCreatePicker] = useState<"date" | "time" | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingRow, setEditingRow] = useState<AppointmentRow | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editTime, setEditTime] = useState<Date>(new Date());
  const [editPhone, setEditPhone] = useState("");
  const [editNote, setEditNote] = useState("");
  const [activeEditPicker, setActiveEditPicker] = useState<"date" | "time" | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const unsubAppointments = watchAdminAppointmentRequests(setRows, () => setRows([]));
    const unsubUnattended = watchAdminUnattendedRequests(
      (next) => {
        setUnattendedRows(next);
        setUnattendedLoading(false);
        setUnattendedError(null);
      },
      (error) => {
        setUnattendedLoading(false);
        setUnattendedError(error.message);
      }
    );
    const unsubCandidates = watchCandidates(
      (next) => {
        const mapped = next.map((entry) => ({
          id: entry.id,
          name: String(entry.fullName ?? "Candidate"),
          phone: String(entry.mobile ?? ""),
          avatarUrl: String(entry.avatarUrl ?? "")
        }));
        setCandidates(mapped);
      },
      () => setCandidates([])
    );

    return () => {
      unsubAppointments();
      unsubUnattended();
      unsubCandidates();
    };
  }, []);

  useEffect(() => {
    if (!createCandidateId) {
      return;
    }

    const selected = candidates.find((entry) => entry.id === createCandidateId);
    if (selected?.phone) {
      setCreatePhone(selected.phone);
    }
  }, [createCandidateId, candidates]);

  const candidateMap = useMemo(() => {
    const map: Record<string, CandidateOption> = {};
    candidates.forEach((entry) => {
      map[entry.id] = entry;
    });
    return map;
  }, [candidates]);

  const sortedRows = useMemo(() => {
    const activeRows = rows.filter((row) => Boolean(candidateMap[row.candidateId]));
    return [...activeRows].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [rows, candidateMap]);

  const now = Date.now();
  const unattendedRequests = useMemo(() => {
    const activeRows = unattendedRows.filter((row) => Boolean(candidateMap[row.candidateId]));
    return [...activeRows].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [unattendedRows, candidateMap]);

  const overdueScheduled = sortedRows.filter((row) => {
    if (row.status !== "scheduled") {
      return false;
    }
    const parsed = parseDate(row.startsAt);
    return parsed ? parsed.getTime() < now : false;
  });

  const upcomingScheduled = sortedRows.filter((row) => {
    if (row.status !== "scheduled") {
      return false;
    }
    const parsed = parseDate(row.startsAt);
    return parsed ? parsed.getTime() >= now : false;
  });

  const setStatus = async (appointmentId: string, status: AppointmentStatus) => {
    if (!session?.user.uid) {
      return;
    }

    try {
      await updateAppointmentStatus({
        appointmentId,
        status,
        updatedBy: session.user.uid,
        updatedByRole: "admin"
      });
    } catch (error: any) {
      Alert.alert("Could not update status", error?.message ?? "Please try again.");
    }
  };

  const handleAcceptRequest = async (row: AppointmentRow) => {
    if (!session?.user.uid) {
      return;
    }
    await setStatus(row.id, "scheduled");
    try {
      await sendMessage({
        candidateId: row.candidateId,
        senderId: session.user.uid,
        senderRole: "admin",
        text: formatAdminAppointmentDecisionChat({
          action: "accepted",
          startsAt: row.startsAt,
          notes: row.notes
        })
      });
    } catch {
      // Keep status update successful even if chat send fails.
    }
  };

  const handleDeclineRequest = async (row: AppointmentRow) => {
    if (!session?.user.uid) {
      return;
    }
    await setStatus(row.id, "canceled");
    try {
      await sendMessage({
        candidateId: row.candidateId,
        senderId: session.user.uid,
        senderRole: "admin",
        text: formatAdminAppointmentDecisionChat({
          action: "declined",
          startsAt: row.startsAt,
          notes: row.notes
        })
      });
    } catch {
      // Keep status update successful even if chat send fails.
    }
  };

  const handleCancelScheduled = async (row: AppointmentRow) => {
    if (!session?.user.uid) {
      return;
    }
    await setStatus(row.id, "canceled");
    try {
      await sendMessage({
        candidateId: row.candidateId,
        senderId: session.user.uid,
        senderRole: "admin",
        text: formatAdminAppointmentCanceledChat({
          startsAt: row.startsAt,
          notes: row.notes
        })
      });
    } catch {
      // Keep status update successful even if chat send fails.
    }
  };

  const confirmIgnoreOverdue = (row: AppointmentRow) => {
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

  const addToCalendar = async (row: AppointmentRow, candidateName: string) => {
    try {
      await addAppointmentToDeviceCalendar({
        title: `Call with ${candidateName}`,
        notes: row.notes,
        startsAt: row.startsAt,
        endsAt: row.endsAt
      });
      Alert.alert("Added", "Appointment added to your phone calendar.");
    } catch (error: any) {
      Alert.alert("Could not add to calendar", error?.message ?? "Please try again.");
    }
  };

  const onCreateDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setCreateDate(selected);
    }
  };

  const onCreateTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setCreateTime(selected);
    }
  };

  const onEditDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setEditDate(selected);
    }
  };

  const onEditTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setEditTime(selected);
    }
  };

  const createAppointment = async () => {
    if (!session?.user.uid) {
      return;
    }

    if (!createCandidateId) {
      Alert.alert("Candidate required", "Please choose a candidate.");
      return;
    }

    if (!createPhone.trim()) {
      Alert.alert("Phone required", "Please enter a phone number.");
      return;
    }

    const startsAt = mergeDateAndTime(createDate, createTime);
    if (new Date(startsAt).getTime() <= Date.now()) {
      Alert.alert("Future time required", "Please select a future date/time so this appears in upcoming appointments.");
      return;
    }

    try {
      setCreating(true);
      await createAdminAppointment({
        candidateId: createCandidateId,
        createdBy: session.user.uid,
        startsAt,
        phoneNumber: createPhone.trim(),
        notes: createNote.trim()
      });
      try {
        await sendMessage({
          candidateId: createCandidateId,
          senderId: session.user.uid,
          senderRole: "admin",
          text: formatAdminAppointmentCreatedChat({
            startsAt,
            notes: createNote.trim()
          })
        });
      } catch {
        // Keep appointment creation successful even if chat send fails.
      }
      setCreateNote("");
      Alert.alert("Saved", "Appointment created and synced.");
    } catch (error: any) {
      Alert.alert("Could not create appointment", error?.message ?? "Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const openModifyModal = (row: AppointmentRow) => {
    const starts = new Date(row.startsAt);
    setEditingRow(row);
    setEditDate(starts);
    setEditTime(starts);
    setEditPhone(String(row.phoneNumber ?? ""));
    setEditNote(String(row.notes ?? ""));
    setActiveEditPicker(null);
  };

  const saveModifiedAppointment = async () => {
    if (!session?.user.uid || !editingRow) {
      return;
    }

    if (!editPhone.trim()) {
      Alert.alert("Phone required", "Please enter a phone number.");
      return;
    }

    const startsAt = mergeDateAndTime(editDate, editTime);
    if (new Date(startsAt).getTime() <= Date.now()) {
      Alert.alert("Future time required", "Please select a future date/time so this appears in upcoming appointments.");
      return;
    }

    try {
      setSavingEdit(true);
      const previousStartsAt = editingRow.startsAt;
      await updateAppointmentDetails({
        appointmentId: editingRow.id,
        startsAt,
        phoneNumber: editPhone.trim(),
        notes: editNote.trim(),
        updatedBy: session.user.uid,
        updatedByRole: "admin"
      });
      if (editingRow.status === "requested") {
        await updateAppointmentStatus({
          appointmentId: editingRow.id,
          status: "scheduled",
          updatedBy: session.user.uid,
          updatedByRole: "admin"
        });
      }
      try {
        await sendMessage({
          candidateId: editingRow.candidateId,
          senderId: session.user.uid,
          senderRole: "admin",
          text: formatAdminAppointmentModifiedChat({
            previousStartsAt,
            nextStartsAt: startsAt,
            notes: editNote.trim()
          })
        });
      } catch {
        // Keep appointment update successful even if chat send fails.
      }
      setEditingRow(null);
      Alert.alert("Updated", "Appointment changes synced.");
    } catch (error: any) {
      Alert.alert("Could not update", error?.message ?? "Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const selectedCandidate = candidateMap[createCandidateId];

  return (
    <AppShell
      title="Appointments"
      subtitle="Create and manage appointments."
      topRightLogoStyle={styles.dashboardHeroLogo}
    >
      <View style={styles.screenBody}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SurfaceCard>
            <Text style={styles.sectionTitle}>Create appointment</Text>

            <Pressable style={styles.dropdownButton} onPress={() => setShowCreateCandidateModal(true)}>
              <View style={styles.dropdownLeft}>
                {selectedCandidate ? (
                  <Avatar uri={selectedCandidate.avatarUrl} name={selectedCandidate.name} size={28} />
                ) : (
                  <Avatar name="?" size={28} showFallbackIcon />
                )}
                <View>
                  <Text style={styles.dropdownLabel}>Candidate</Text>
                  <Text style={styles.dropdownValue}>{selectedCandidate?.name || "Select candidate"}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>▼</Text>
            </Pressable>

            <View style={styles.rowButtons}>
              <Pressable
                style={[styles.pickButton, activeCreatePicker === "date" && styles.pickButtonActive]}
                onPress={() => setActiveCreatePicker((current) => (current === "date" ? null : "date"))}
              >
                <Text style={styles.pickLabel}>Date</Text>
                <Text style={styles.pickValue}>{formatDate(createDate)}</Text>
              </Pressable>
              <Pressable
                style={[styles.pickButton, activeCreatePicker === "time" && styles.pickButtonActive]}
                onPress={() => setActiveCreatePicker((current) => (current === "time" ? null : "time"))}
              >
                <Text style={styles.pickLabel}>Time</Text>
                <Text style={styles.pickValue}>{formatTime(createTime)}</Text>
              </Pressable>
            </View>

            {activeCreatePicker === "date" ? (
              <View style={styles.inlinePickerWrap}>
                <DateTimePicker
                  value={createDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "spinner"}
                  onChange={onCreateDateChange}
                />
              </View>
            ) : null}
            {activeCreatePicker === "time" ? (
              <View style={styles.inlinePickerWrap}>
                <DateTimePicker
                  value={createTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "spinner"}
                  onChange={onCreateTimeChange}
                />
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              value={createPhone}
              onChangeText={setCreatePhone}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor="#7f8b9d"
            />
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={createNote}
              onChangeText={setCreateNote}
              placeholder="Note (optional)"
              placeholderTextColor="#7f8b9d"
              multiline
            />

            <Pressable style={styles.createButton} onPress={createAppointment} disabled={creating}>
              <Text style={styles.createButtonText}>{creating ? "Saving..." : "Create appointment"}</Text>
            </Pressable>
          </SurfaceCard>

          {overdueScheduled.length > 0 ? (
            <SurfaceCard>
              <Text style={styles.overdueTitle}>Overdue Appointments</Text>
              <View style={styles.sectionList}>
                {overdueScheduled.map((row) => {
                  const startsAt = parseDate(row.startsAt) ?? new Date();
                  const candidate = candidateMap[row.candidateId];
                  const hasNote = Boolean(String(row.notes ?? "").trim());
                  const expanded = expandedId === row.id;

                  return (
                    <View key={row.id} style={styles.appointmentRow}>
                      <View style={styles.appointmentHeader}>
                        <Avatar uri={candidate?.avatarUrl} name={candidate?.name || "Candidate"} size={40} />
                        <View style={styles.headerBody}>
                          <Text style={styles.name}>{candidate?.name || "Candidate"}</Text>
                          <Text style={styles.meta}>{row.phoneNumber || candidate?.phone || "n/a"}</Text>
                        </View>
                      </View>
                      <Text style={styles.meta}>
                        {formatDate(startsAt)} {formatTime(startsAt)}
                      </Text>
                      <Text style={styles.meta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                      {hasNote ? (
                        <>
                          <Pressable style={styles.expandButton} onPress={() => setExpandedId(expanded ? null : row.id)}>
                            <Text style={styles.expandButtonText}>{expanded ? "Hide note" : "See note"}</Text>
                          </Pressable>
                          {expanded ? <Text style={styles.noteText}>{row.notes}</Text> : null}
                        </>
                      ) : null}
                      <Pressable style={styles.ignoreButton} onPress={() => confirmIgnoreOverdue(row)}>
                        <Text style={styles.ignoreButtonText}>Ignore</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </SurfaceCard>
          ) : null}

          <SurfaceCard>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {upcomingScheduled.length === 0 ? (
              <EmptyState message="No upcoming appointments." />
            ) : (
              <View style={styles.sectionList}>
                {upcomingScheduled.map((row) => {
                  const startsAt = parseDate(row.startsAt) ?? new Date();
                  const candidate = candidateMap[row.candidateId];
                  const hasNote = Boolean(String(row.notes ?? "").trim());
                  const expanded = expandedId === row.id;

                  return (
                    <View key={row.id} style={styles.appointmentRow}>
                      <View style={styles.appointmentHeader}>
                        <Avatar uri={candidate?.avatarUrl} name={candidate?.name || "Candidate"} size={40} />
                        <View style={styles.headerBody}>
                          <Text style={styles.name}>{candidate?.name || "Candidate"}</Text>
                          <Text style={styles.meta}>{row.phoneNumber || candidate?.phone || "n/a"}</Text>
                        </View>
                      </View>
                      <Text style={styles.meta}>
                        {formatDate(startsAt)} {formatTime(startsAt)}
                      </Text>
                      <Text style={styles.meta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                      {hasNote ? (
                        <>
                          <Pressable style={styles.expandButton} onPress={() => setExpandedId(expanded ? null : row.id)}>
                            <Text style={styles.expandButtonText}>{expanded ? "Hide note" : "See note"}</Text>
                          </Pressable>
                          {expanded ? <Text style={styles.noteText}>{row.notes}</Text> : null}
                        </>
                      ) : null}
                      <Pressable
                        style={styles.calendarButton}
                        onPress={() => addToCalendar(row, candidate?.name || "Candidate")}
                      >
                        <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                      </Pressable>
                      <View style={styles.actionRow}>
                        <Pressable style={styles.cancelButton} onPress={() => handleCancelScheduled(row)}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={styles.modifyButton} onPress={() => openModifyModal(row)}>
                          <Text style={styles.modifyButtonText}>Modify</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </SurfaceCard>
        </ScrollView>

        <Pressable style={styles.requestsFab} onPress={() => setShowRequestsModal(true)}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {unattendedRequests.length > 0 ? (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{badgeText(unattendedRequests.length)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Modal
        visible={showRequestsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={styles.modalTitle}>Unattended Requests</Text>
            {unattendedLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator />
                <Text style={styles.modalLoadingText}>Loading unattended requests...</Text>
              </View>
            ) : null}
            {!unattendedLoading && unattendedError ? <Text style={styles.modalError}>{unattendedError}</Text> : null}
            {!unattendedLoading && !unattendedError && unattendedRequests.length === 0 ? (
              <EmptyState message="No unattended requests." />
            ) : null}
            <ScrollView style={styles.modalList}>
              {!unattendedLoading &&
                !unattendedError &&
                unattendedRequests.map((row) => {
                  const starts = parseDate(row.startsAt) ?? new Date();
                  const candidate = candidateMap[row.candidateId];
                  return (
                    <View key={row.id} style={styles.requestItem}>
                      <View style={styles.appointmentHeader}>
                        <Avatar uri={candidate?.avatarUrl} name={candidate?.name || "Candidate"} size={36} />
                        <View style={styles.headerBody}>
                          <Text style={styles.name}>{candidate?.name || "Candidate"}</Text>
                          <Text style={styles.meta}>{row.phoneNumber || candidate?.phone || "n/a"}</Text>
                        </View>
                      </View>
                      <Text style={styles.meta}>
                        {formatDate(starts)} {formatTime(starts)}
                      </Text>
                      <Text style={styles.meta}>Status: {APPOINTMENT_STATUS_LABELS[row.status]}</Text>
                      {String(row.notes ?? "").trim() ? <Text style={styles.meta}>Note: {row.notes}</Text> : null}
                      <View style={styles.actionRow}>
                        <Pressable style={styles.actionButton} onPress={() => handleAcceptRequest(row)}>
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={() => handleDeclineRequest(row)}>
                          <Text style={styles.cancelButtonText}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
            <Pressable style={styles.closeModalButton} onPress={() => setShowRequestsModal(false)}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCreateCandidateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateCandidateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select candidate</Text>
            <ScrollView style={styles.modalList}>
              {candidates.map((candidate) => (
                <Pressable
                  key={candidate.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setCreateCandidateId(candidate.id);
                    setShowCreateCandidateModal(false);
                  }}
                >
                  <Avatar uri={candidate.avatarUrl} name={candidate.name} size={32} />
                  <View>
                    <Text style={styles.modalOptionTitle}>{candidate.name}</Text>
                    <Text style={styles.modalOptionMeta}>{candidate.phone || "No phone"}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.closeModalButton} onPress={() => setShowCreateCandidateModal(false)}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(editingRow)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRow(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modify appointment</Text>

            <View style={styles.rowButtons}>
              <Pressable
                style={[styles.pickButton, activeEditPicker === "date" && styles.pickButtonActive]}
                onPress={() => setActiveEditPicker((current) => (current === "date" ? null : "date"))}
              >
                <Text style={styles.pickLabel}>Date</Text>
                <Text style={styles.pickValue}>{formatDate(editDate)}</Text>
              </Pressable>
              <Pressable
                style={[styles.pickButton, activeEditPicker === "time" && styles.pickButtonActive]}
                onPress={() => setActiveEditPicker((current) => (current === "time" ? null : "time"))}
              >
                <Text style={styles.pickLabel}>Time</Text>
                <Text style={styles.pickValue}>{formatTime(editTime)}</Text>
              </Pressable>
            </View>

            {activeEditPicker === "date" ? (
              <View style={styles.inlinePickerWrap}>
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "spinner"}
                  onChange={onEditDateChange}
                />
              </View>
            ) : null}
            {activeEditPicker === "time" ? (
              <View style={styles.inlinePickerWrap}>
                <DateTimePicker
                  value={editTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "spinner"}
                  onChange={onEditTimeChange}
                />
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor="#7f8b9d"
            />
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Note"
              placeholderTextColor="#7f8b9d"
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelModalButton}
                onPress={() => {
                  setEditingRow(null);
                  setActiveEditPicker(null);
                }}
              >
                <Text style={styles.cancelModalText}>Close</Text>
              </Pressable>
              <Pressable style={styles.createButton} onPress={saveModifiedAppointment} disabled={savingEdit}>
                <Text style={styles.createButtonText}>{savingEdit ? "Saving..." : "Save changes"}</Text>
              </Pressable>
            </View>
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
  screenBody: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 90,
    gap: 10
  },
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
  dropdownButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  dropdownLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  dropdownValue: {
    marginTop: 2,
    color: theme.colors.textPrimary,
    fontWeight: "700"
  },
  chevron: {
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  rowButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  pickButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: "#f8fafe",
    paddingHorizontal: 10,
    paddingVertical: 10
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
    marginTop: 2,
    color: theme.colors.textPrimary,
    fontWeight: "700"
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
    minHeight: 70,
    textAlignVertical: "top"
  },
  createButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 16
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  sectionList: {
    gap: 8
  },
  appointmentRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff"
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerBody: {
    flex: 1
  },
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
  calendarButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#9dc2ff",
    backgroundColor: "#eef5ff",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  calendarButtonText: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  ignoreButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#f0c18a",
    backgroundColor: "#fff4e9",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  ignoreButtonText: {
    color: "#ba6a00",
    fontWeight: "700"
  },
  requestsFab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  fabBadge: {
    position: "absolute",
    top: -2,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#d32121",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  fabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800"
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(11,18,32,0.42)"
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 8
  },
  modalCardLarge: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 8,
    maxHeight: "84%"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  modalLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2
  },
  modalLoadingText: {
    color: theme.colors.textSecondary
  },
  modalError: {
    color: theme.colors.danger,
    fontWeight: "600"
  },
  modalList: {
    maxHeight: 360,
    marginTop: 6
  },
  modalOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  modalOptionTitle: {
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  modalOptionMeta: {
    marginTop: 3,
    color: theme.colors.textSecondary
  },
  closeModalButton: {
    marginTop: 6,
    alignItems: "center",
    paddingVertical: 8
  },
  closeModalButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  requestItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff"
  },
  actionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  actionButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  actionButtonText: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  cancelButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1b0b0",
    backgroundColor: "#fff1f1",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  cancelButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  },
  modifyButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  modifyButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  modalActions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center"
  },
  cancelModalButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 11,
    paddingHorizontal: 14
  },
  cancelModalText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  }
});
