import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { PRACTICE_AREAS, PREFERRED_CITIES } from "@zenith/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { CandidateContactBar } from "../components/AppShell";
import { uploadCandidateProfilePhoto } from "../services/userService";
import { useAuth } from "../state/AuthContext";
import { openProfilePhotoSourcePicker, ProfilePhotoFile } from "../utils/profilePhotoSourcePicker";

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string) {
  if (!isIsoDate(value)) {
    return null;
  }
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "Not set";
  }
  return parsed.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export function ProfileSetupScreen() {
  const { session, completeProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [mobile, setMobile] = useState(session?.user.phoneNumber ?? "");
  const [jdDegreeDate, setJdDegreeDate] = useState("");
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [photoFile, setPhotoFile] = useState<ProfilePhotoFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState<"jd" | null>(null);

  const isValid = useMemo(() => {
    return fullName.trim().length > 0 && email.trim().length > 0;
  }, [email, fullName]);

  const toggleCity = (city: string) => {
    setPreferredCities((prev) =>
      prev.includes(city) ? prev.filter((value) => value !== city) : [...prev, city]
    );
  };

  const onSave = async () => {
    if (!session?.user.uid) {
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Display name required", "Please enter your display name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email.");
      return;
    }
    if (jdDegreeDate.trim() && !isIsoDate(jdDegreeDate.trim())) {
      Alert.alert("Invalid JD date", "Use YYYY-MM-DD format.");
      return;
    }

    try {
      setSaving(true);
      await completeProfile({
        fullName,
        email,
        mobile,
        jdDegreeDate: jdDegreeDate.trim() || undefined,
        preferredCities,
        practiceArea
      });
      if (photoFile) {
        await uploadCandidateProfilePhoto(session.user.uid, photoFile);
      }
    } catch (error: any) {
      Alert.alert("Could not save profile", error?.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = () => {
    openProfilePhotoSourcePicker(
      (selectedPhoto) => {
        setPhotoFile(selectedPhoto);
      },
      (error) => {
        Alert.alert("Could not choose photo", error?.message ?? "Try again.");
      }
    );
  };

  const onJdChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }
    setJdDegreeDate(formatIsoDate(selectedDate));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <CandidateContactBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Finish your profile</Text>
        <Text style={styles.subtitle}>This lets Zenith match you with the right opportunities.</Text>

        <Text style={styles.label}>Profile photo (optional)</Text>
        <View style={styles.photoRow}>
          <Avatar uri={photoFile?.uri} name={fullName} size={62} />
          <Pressable style={styles.photoButton} onPress={onPickPhoto}>
            <Text style={styles.photoButtonText}>{photoFile ? "Replace photo" : "Add photo"}</Text>
          </Pressable>
        </View>

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

        <Text style={styles.label}>JD (Law) degree date (optional)</Text>
        <View style={styles.optionalPickerRow}>
          <Pressable
            style={[styles.pickButton, styles.optionalPickerMain, activeDatePicker === "jd" && styles.pickButtonActive]}
            onPress={() => setActiveDatePicker((current) => (current === "jd" ? null : "jd"))}
          >
            <Text style={styles.pickLabel}>JD degree date</Text>
            <Text style={styles.pickValue}>{formatDisplayDate(jdDegreeDate)}</Text>
          </Pressable>
          {jdDegreeDate ? (
            <Pressable style={styles.clearButton} onPress={() => setJdDegreeDate("")}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        {activeDatePicker === "jd" ? (
          <View style={styles.inlinePickerWrap}>
            <DateTimePicker
              value={parseIsoDate(jdDegreeDate) ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "spinner"}
              onChange={onJdChange}
            />
          </View>
        ) : null}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#4b5563", marginBottom: 8 },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  photoButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white"
  },
  photoButtonText: {
    color: "#1f2a3c",
    fontWeight: "700"
  },
  label: { fontWeight: "600", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white"
  },
  optionalPickerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch"
  },
  optionalPickerMain: {
    flex: 1
  },
  pickButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 3
  },
  pickButtonActive: {
    borderColor: "#111111",
    backgroundColor: "#f3f4f6"
  },
  pickLabel: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "600"
  },
  pickValue: {
    color: "#1f2a3c",
    fontWeight: "700"
  },
  inlinePickerWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  clearButton: {
    borderWidth: 1,
    borderColor: "#f1b6b6",
    borderRadius: 10,
    backgroundColor: "#fff3f3",
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  clearButtonText: {
    color: "#dc2626",
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
    paddingHorizontal: 12,
    backgroundColor: "white"
  },
  pillSelected: {
    borderColor: "#111111",
    backgroundColor: "#f3f4f6"
  },
  pillText: {
    color: "#374151"
  },
  pillTextSelected: {
    color: "#111111",
    fontWeight: "600"
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#111111",
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
