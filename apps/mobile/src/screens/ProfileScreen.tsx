import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PRACTICE_AREAS, PREFERRED_CITIES } from "@zenith/shared";
import { useAuth } from "../state/AuthContext";
import { deleteMyAccount } from "../services/accountService";
import { updatePreferences, watchUser } from "../services/userService";

export function ProfileScreen() {
  const { session, logout } = useAuth();
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    return watchUser(
      session.user.uid,
      (data) => {
        setPreferredCities(data?.preferences?.preferredCities ?? []);
        setPracticeArea(data?.preferences?.practiceArea ?? PRACTICE_AREAS[0]);
      },
      () => undefined
    );
  }, [session?.user.uid]);

  const toggleCity = (city: string) => {
    setPreferredCities((prev) =>
      prev.includes(city) ? prev.filter((entry) => entry !== city) : [...prev, city]
    );
  };

  const onSave = async () => {
    if (!session?.user.uid) {
      return;
    }

    try {
      setSaving(true);
      await updatePreferences(session.user.uid, {
        preferredCities,
        practiceArea
      });
      Alert.alert("Saved", "Preferences updated.");
    } catch (error: any) {
      Alert.alert("Could not update", error?.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Delete account/data", "This will remove your account and related data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMyAccount();
            Alert.alert("Deleted", "Your account and data were removed.");
          } catch (error: any) {
            Alert.alert("Delete failed", error?.message ?? "Please contact support.");
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.heading}>Preferred Cities</Text>
        <View style={styles.wrap}>
          {PREFERRED_CITIES.map((city) => {
            const selected = preferredCities.includes(city);
            return (
              <Pressable
                key={city}
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => toggleCity(city)}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{city}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Practice Area</Text>
        <View style={styles.wrap}>
          {PRACTICE_AREAS.map((area) => {
            const selected = practiceArea === area;
            return (
              <Pressable
                key={area}
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => setPracticeArea(area)}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{area}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onSave} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Preferences"}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={logout}>
        <Text style={styles.secondaryText}>Log Out</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteText}>Delete my account/data</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12 },
  card: {
    borderRadius: 12,
    backgroundColor: "white",
    padding: 12,
    gap: 10
  },
  heading: {
    fontWeight: "700"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  pillSelected: {
    borderColor: "#1d4ed8",
    backgroundColor: "#dbeafe"
  },
  pillText: {
    color: "#374151"
  },
  pillTextSelected: {
    color: "#1e40af",
    fontWeight: "600"
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    paddingVertical: 12
  },
  primaryText: {
    color: "white",
    fontWeight: "600"
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "white"
  },
  secondaryText: {
    color: "#374151"
  },
  deleteButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fee2e2"
  },
  deleteText: {
    color: "#991b1b",
    fontWeight: "600"
  }
});
