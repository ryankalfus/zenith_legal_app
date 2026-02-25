import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PRACTICE_AREAS, PREFERRED_CITIES } from "@zenith/shared";
import { useAuth } from "../state/AuthContext";

export function ProfileSetupScreen() {
  const { session, completeProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [mobile, setMobile] = useState(session?.user.phoneNumber ?? "");
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(() => fullName.trim().length > 0 && email.trim().length > 0, [fullName, email]);

  const toggleCity = (city: string) => {
    setPreferredCities((prev) =>
      prev.includes(city) ? prev.filter((value) => value !== city) : [...prev, city]
    );
  };

  const onSave = async () => {
    try {
      setSaving(true);
      await completeProfile({
        fullName,
        email,
        mobile,
        preferredCities,
        practiceArea
      });
    } catch (error: any) {
      Alert.alert("Could not save profile", error?.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Finish your profile</Text>
      <Text style={styles.subtitle}>This lets Zenith match you with the right opportunities.</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Mobile</Text>
      <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />

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

      <Text style={styles.label}>Practice area</Text>
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

      <Pressable style={[styles.button, !isValid && styles.buttonDisabled]} disabled={!isValid || saving} onPress={onSave}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save profile"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#4b5563", marginBottom: 8 },
  label: { fontWeight: "600", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white"
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
    paddingHorizontal: 12,
    backgroundColor: "white"
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
  button: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    paddingVertical: 12
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600"
  }
});
