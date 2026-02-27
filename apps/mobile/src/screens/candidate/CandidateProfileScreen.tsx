import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { PRACTICE_AREAS, PREFERRED_CITIES } from "@zenith/shared";
import { AppShell, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { deleteMyAccount } from "../../services/accountService";
import {
  changeMyEmailWithPassword,
  changeMyPasswordWithCurrentPassword,
  removeCandidateProfilePhoto,
  updateCandidateProfile,
  uploadCandidateProfilePhoto,
  watchUser
} from "../../services/userService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";
import { openProfilePhotoSourcePicker } from "../../utils/profilePhotoSourcePicker";

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

export function CandidateProfileScreen() {
  const { session, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [jdDegreeDate, setJdDegreeDate] = useState("");
  const [practiceArea, setPracticeArea] = useState<string>(PRACTICE_AREAS[0]);
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [email, setEmail] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState<"dob" | "jd" | null>(null);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    return watchUser(
      session.user.uid,
      (data) => {
        const authEmail = String(session.user.email ?? "").trim().toLowerCase();
        const storedEmail = String(data?.email ?? "").trim().toLowerCase();
        const nextEmail = authEmail || storedEmail;
        setFullName(String(data?.fullName ?? ""));
        setMobile(String(data?.mobile ?? ""));
        setDateOfBirth(String(data?.dateOfBirth ?? ""));
        setJdDegreeDate(String(data?.jdDegreeDate ?? ""));
        setAvatarUrl(String(data?.avatarUrl ?? ""));
        setAvatarPath(String(data?.avatarPath ?? ""));
        setEmail(nextEmail);
        setOldEmail(nextEmail);
        setPracticeArea(String(data?.preferences?.practiceArea ?? PRACTICE_AREAS[0]));
        setPreferredCities(Array.isArray(data?.preferences?.preferredCities) ? data.preferences.preferredCities : []);
      },
      () => undefined
    );
  }, [session?.user.email, session?.user.uid]);

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
    if (dateOfBirth.trim() && !isIsoDate(dateOfBirth.trim())) {
      Alert.alert("Invalid date of birth", "Use YYYY-MM-DD format.");
      return;
    }
    if (jdDegreeDate.trim() && !isIsoDate(jdDegreeDate.trim())) {
      Alert.alert("Invalid JD date", "Use YYYY-MM-DD format.");
      return;
    }

    try {
      setSaving(true);
      await updateCandidateProfile(session.user.uid, {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        dateOfBirth: dateOfBirth.trim() || undefined,
        jdDegreeDate: jdDegreeDate.trim() || undefined,
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

  const onDobChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }
    setDateOfBirth(formatIsoDate(selectedDate));
  };

  const onJdChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }
    setJdDegreeDate(formatIsoDate(selectedDate));
  };

  const pickPhoto = () => {
    if (!session?.user.uid) {
      return;
    }

    openProfilePhotoSourcePicker(
      async (selectedPhoto) => {
        try {
          setPhotoBusy(true);
          const uploaded = await uploadCandidateProfilePhoto(session.user.uid, selectedPhoto);
          setAvatarUrl(uploaded.avatarUrl);
          setAvatarPath(uploaded.avatarPath);
        } catch (error: any) {
          Alert.alert("Could not upload photo", error?.message ?? "Please try again.");
        } finally {
          setPhotoBusy(false);
        }
      },
      (error) => {
        Alert.alert("Could not choose photo", error?.message ?? "Please try again.");
      }
    );
  };

  const removePhoto = async () => {
    if (!session?.user.uid) {
      return;
    }

    try {
      setPhotoBusy(true);
      await removeCandidateProfilePhoto(session.user.uid, avatarPath);
      setAvatarUrl("");
      setAvatarPath("");
    } catch (error: any) {
      Alert.alert("Could not remove photo", error?.message ?? "Please try again.");
    } finally {
      setPhotoBusy(false);
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
            await logout();
          } catch (error: any) {
            Alert.alert("Delete failed", error?.message ?? "Please contact support.");
          }
        }
      }
    ]);
  };

  const saveEmail = async () => {
    if (!oldEmail.trim() || !newEmail.trim() || !confirmNewEmail.trim() || !emailCurrentPassword.trim()) {
      Alert.alert("Missing fields", "Please fill out all email fields.");
      return;
    }
    if (newEmail.trim().toLowerCase() !== confirmNewEmail.trim().toLowerCase()) {
      Alert.alert("Emails do not match", "New email and confirm new email must match.");
      return;
    }

    try {
      setSavingEmail(true);
      const result = await changeMyEmailWithPassword({
        oldEmail,
        newEmail,
        currentPassword: emailCurrentPassword
      });
      if (result.mode === "verify_pending") {
        setNewEmail("");
        setConfirmNewEmail("");
        setEmailCurrentPassword("");
        Alert.alert(
          "Verify new email",
          "A verification link was sent to your new email. Open that email, confirm the change, then log out and back in."
        );
      } else {
        setOldEmail(newEmail.trim().toLowerCase());
        setEmail(newEmail.trim().toLowerCase());
        setNewEmail("");
        setConfirmNewEmail("");
        setEmailCurrentPassword("");
        Alert.alert("Email updated", "Your login email has been changed.");
      }
    } catch (error: any) {
      const code = String(error?.code ?? "");
      if (code === "auth/wrong-password") {
        Alert.alert("Wrong password", "Current password is incorrect.");
      } else if (code === "auth/email-already-in-use") {
        Alert.alert("Email already in use", "That email is already linked to another account.");
      } else if (code === "auth/invalid-email") {
        Alert.alert("Invalid email", "Please enter a valid new email.");
      } else if (code === "auth/requires-recent-login") {
        Alert.alert("Please log in again", "For security, log out and log in before changing email.");
      } else {
        Alert.alert("Could not change email", error?.message ?? "Please try again.");
      }
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please refresh and try again.");
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert("Missing fields", "Please fill out all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Passwords do not match", "New password and confirm password must match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "New password must be at least 6 characters.");
      return;
    }

    try {
      setSavingPassword(true);
      await changeMyPasswordWithCurrentPassword({
        email,
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      Alert.alert("Password updated", "Your password was changed successfully.");
    } catch (error: any) {
      const code = String(error?.code ?? "");
      if (code === "auth/wrong-password") {
        Alert.alert("Wrong password", "Current password is incorrect.");
      } else if (code === "auth/weak-password") {
        Alert.alert("Weak password", "Please use a stronger password.");
      } else if (code === "auth/requires-recent-login") {
        Alert.alert("Please log in again", "For security, log out and log in before changing password.");
      } else {
        Alert.alert("Could not change password", error?.message ?? "Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppShell
      title="Profile"
      subtitle="Manage your candidate details."
      showCandidateContactBar
      topRightLogoStyle={styles.dashboardHeroLogo}
      scroll
    >
      <SurfaceCard>
        <Text style={styles.label}>Profile photo</Text>
        <View style={styles.photoRow}>
          <Avatar uri={avatarUrl} name={fullName || "Candidate"} size={64} />
          <View style={styles.photoButtons}>
            <Pressable style={styles.secondaryButton} onPress={pickPhoto} disabled={photoBusy}>
              <Text style={styles.secondaryButtonText}>{photoBusy ? "Uploading..." : "Upload photo"}</Text>
            </Pressable>
            {avatarUrl ? (
              <Pressable style={styles.deleteButton} onPress={removePhoto} disabled={photoBusy}>
                <Text style={styles.deleteButtonText}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your display name"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Practice</Text>
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

        <Text style={styles.label}>Date of birth</Text>
        <Pressable
          style={[styles.pickButton, activeDatePicker === "dob" && styles.pickButtonActive]}
          onPress={() => setActiveDatePicker((current) => (current === "dob" ? null : "dob"))}
        >
          <Text style={styles.pickLabel}>Date of birth</Text>
          <Text style={styles.pickValue}>{formatDisplayDate(dateOfBirth)}</Text>
        </Pressable>
        {activeDatePicker === "dob" ? (
          <View style={styles.inlinePickerWrap}>
            <DateTimePicker
              value={parseIsoDate(dateOfBirth) ?? new Date(1998, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "spinner"}
              onChange={onDobChange}
            />
          </View>
        ) : null}

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

        <Pressable style={styles.primaryButton} onPress={save} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save profile"}</Text>
        </Pressable>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Change email</Text>
        <Text style={styles.helperText}>
          To change email, enter old email, new email, confirm new email, and current password.
        </Text>

        <Text style={styles.label}>Current email</Text>
        <View style={styles.emailDisplayBox}>
          <Text style={styles.emailDisplayText}>{email || "Not set"}</Text>
        </View>

        <Text style={styles.label}>Old email</Text>
        <TextInput
          style={styles.input}
          value={oldEmail}
          onChangeText={setOldEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Old email"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>New email</Text>
        <TextInput
          style={styles.input}
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="New email"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Confirm new email</Text>
        <TextInput
          style={styles.input}
          value={confirmNewEmail}
          onChangeText={setConfirmNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Confirm new email"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          value={emailCurrentPassword}
          onChangeText={setEmailCurrentPassword}
          secureTextEntry
          placeholder="Current password"
          placeholderTextColor="#7f8b9d"
        />

        <Pressable style={styles.primaryButton} onPress={saveEmail} disabled={savingEmail}>
          <Text style={styles.primaryButtonText}>{savingEmail ? "Updating..." : "Update email"}</Text>
        </Pressable>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Change password</Text>
        <Text style={styles.helperText}>Enter your current password and your new password.</Text>

        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Current password"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>New password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="New password"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Confirm new password</Text>
        <TextInput
          style={styles.input}
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          placeholder="Confirm new password"
          placeholderTextColor="#7f8b9d"
        />

        <Pressable style={styles.primaryButton} onPress={savePassword} disabled={savingPassword}>
          <Text style={styles.primaryButtonText}>{savingPassword ? "Updating..." : "Update password"}</Text>
        </Pressable>
      </SurfaceCard>

      <View style={styles.accountActions}>
        <Pressable style={styles.secondaryButton} onPress={() => logout()}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete my account/data</Text>
        </Pressable>
      </View>
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
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4
  },
  helperText: {
    color: theme.colors.textSecondary,
    marginBottom: 10
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  photoButtons: {
    flex: 1,
    gap: 8
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff"
  },
  emailDisplayBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f8fafc"
  },
  emailDisplayText: {
    color: theme.colors.textPrimary,
    fontWeight: "600"
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
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 3
  },
  pickButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  pickLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  pickValue: {
    color: theme.colors.textPrimary,
    fontWeight: "700"
  },
  inlinePickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
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
    color: theme.colors.danger,
    fontWeight: "700"
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
  accountActions: {
    marginTop: 2
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
