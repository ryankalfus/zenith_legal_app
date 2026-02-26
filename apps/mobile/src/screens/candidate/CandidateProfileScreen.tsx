import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PRACTICE_AREAS, PREFERRED_CITIES } from "@zenith/shared";
import { AppShell, SurfaceCard } from "../../components/AppShell";
import { deleteMyAccount } from "../../services/accountService";
import { updateCandidateProfile, watchUser } from "../../services/userService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";

export function CandidateProfileScreen() {
  const { session, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    return watchUser(
      session.user.uid,
      (data) => {
        setFullName(String(data?.fullName ?? ""));
        setMobile(String(data?.mobile ?? ""));
        setPracticeArea(String(data?.preferences?.practiceArea ?? PRACTICE_AREAS[0]));
        setPreferredCities(Array.isArray(data?.preferences?.preferredCities) ? data.preferences.preferredCities : []);
      },
      () => undefined
    );
  }, [session?.user.uid]);

  const toggleCity = (city: string) => {
    setPreferredCities((prev) => (prev.includes(city) ? prev.filter((entry) => entry !== city) : [...prev, city]));
  };

  const save = async () => {
    if (!session?.user.uid) {
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Display name required", "Please enter your display name.");
      return;
    }

    try {
      setSaving(true);
      await updateCandidateProfile(session.user.uid, {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        preferredCities,
        practiceArea
      });
      Alert.alert("Saved", "Profile updated.");
    } catch (error: any) {
      Alert.alert("Could not save", error?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Delete account/data", "This will permanently remove your account and data.", [
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
    <AppShell title="Profile" subtitle="Manage your candidate details." showCandidateContactBar scroll>
      <SurfaceCard>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your display name"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>What you work in</Text>
        <View style={styles.wrap}>
          {PRACTICE_AREAS.map((area) => {
            const selected = area === practiceArea;
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

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Preferred cities</Text>
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

        <Pressable style={styles.primaryButton} onPress={save} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save profile"}</Text>
        </Pressable>
      </SurfaceCard>

      <SurfaceCard>
        <Pressable style={styles.secondaryButton} onPress={() => logout()}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete my account/data</Text>
        </Pressable>
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  pill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff"
  },
  pillSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  pillText: {
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  pillTextSelected: {
    color: theme.colors.primary
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: 12
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#fff"
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: "600"
  },
  deleteButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f4bcbc",
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#fff3f3"
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  }
});
