import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAuth } from "../state/AuthContext";
import {
  createAppointment,
  updateAppointmentStatus,
  watchAppointments
} from "../services/appointmentService";

export function CalendarScreen() {
  const { session } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    const unsubscribe = watchAppointments(
      session.user.uid,
      (rows) => {
        setAppointments(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [session?.user.uid]);

  const onCreate = async () => {
    if (!session?.user.uid || !title || !startsAt || !endsAt) {
      Alert.alert("Missing fields", "Title, start, and end are required.");
      return;
    }

    try {
      await createAppointment({
        candidateId: session.user.uid,
        createdBy: session.user.uid,
        createdByRole: "candidate",
        title,
        startsAt,
        endsAt
      });
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      Alert.alert("Saved", "Appointment created.");
    } catch (error: any) {
      Alert.alert("Could not create appointment", error?.message ?? "Try again.");
    }
  };

  const onCancel = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, "canceled");
    } catch (error: any) {
      Alert.alert("Could not cancel", error?.message ?? "Try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create appointment</Text>
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput
          style={styles.input}
          placeholder="Start (ISO, ex: 2026-03-01T10:00:00Z)"
          value={startsAt}
          onChangeText={setStartsAt}
        />
        <TextInput
          style={styles.input}
          placeholder="End (ISO, ex: 2026-03-01T10:30:00Z)"
          value={endsAt}
          onChangeText={setEndsAt}
        />
        <Pressable style={styles.button} onPress={onCreate}>
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {appointments.length === 0 ? <Text style={styles.empty}>No appointments yet.</Text> : null}
        {appointments.map((item) => (
          <View key={item.id} style={styles.appointmentRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.startsAt}</Text>
            <Text style={styles.itemMeta}>Status: {item.status}</Text>
            {item.status !== "canceled" && (
              <Pressable style={styles.cancelButton} onPress={() => onCancel(item.id)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
    gap: 12
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    borderRadius: 12,
    backgroundColor: "white",
    padding: 12,
    gap: 8
  },
  listContent: {
    paddingBottom: 12
  },
  sectionTitle: {
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "white"
  },
  button: {
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    paddingVertical: 10
  },
  buttonText: {
    color: "white",
    fontWeight: "600"
  },
  appointmentRow: {
    borderRadius: 10,
    backgroundColor: "white",
    padding: 12,
    marginBottom: 8,
    gap: 4
  },
  itemTitle: {
    fontWeight: "700"
  },
  itemMeta: {
    color: "#374151"
  },
  empty: {
    textAlign: "center",
    color: "#6b7280"
  },
  cancelButton: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 8,
    alignItems: "center"
  },
  cancelText: {
    color: "#dc2626",
    fontWeight: "600"
  }
});
