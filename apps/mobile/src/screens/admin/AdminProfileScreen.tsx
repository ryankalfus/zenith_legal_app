import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppShell, SurfaceCard } from "../../components/AppShell";
import { deleteMyAccount } from "../../services/accountService";
import {
  changeAdminEmailWithPassword,
  updateAdminOwnProfile
} from "../../services/adminService";
import { watchUser } from "../../services/userService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";

export function AdminProfileScreen() {
  const { session, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    return watchUser(
      session.user.uid,
      (data) => {
        const nextEmail = String(data?.email ?? session.user.email ?? "");
        setFullName(String(data?.fullName ?? ""));
        setMobile(String(data?.mobile ?? ""));
        setEmail(nextEmail);
        setOldEmail(nextEmail);
      },
      () => undefined
    );
  }, [session?.user.email, session?.user.uid]);

  const saveProfile = async () => {
    if (!session?.user.uid) {
      return;
    }
    if (!fullName.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    try {
      setSavingProfile(true);
      await updateAdminOwnProfile({
        uid: session.user.uid,
        fullName: fullName.trim(),
        mobile: mobile.trim()
      });
      Alert.alert("Saved", "Profile updated.");
    } catch (error: any) {
      Alert.alert("Could not save", error?.message ?? "Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveEmail = async () => {
    try {
      setSavingEmail(true);
      await changeAdminEmailWithPassword({
        oldEmail,
        newEmail,
        currentPassword
      });
      setOldEmail(newEmail.trim().toLowerCase());
      setEmail(newEmail.trim().toLowerCase());
      setNewEmail("");
      setCurrentPassword("");
      Alert.alert("Email updated", "Your login email has been changed.");
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

  const onDelete = () => {
    Alert.alert("Delete account", "This will permanently delete your admin account.", [
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

  return (
    <AppShell title="Profile" subtitle="Manage your admin account." scroll>
      <SurfaceCard>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#7f8b9d"
        />

        <Text style={styles.label}>Email</Text>
        <View style={styles.emailDisplayBox}>
          <Text style={styles.emailDisplayText}>{email || "Not set"}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={saveProfile} disabled={savingProfile}>
          <Text style={styles.primaryButtonText}>{savingProfile ? "Saving..." : "Save profile"}</Text>
        </Pressable>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.sectionTitle}>Change email</Text>
        <Text style={styles.helperText}>To change email, enter your old email, new email, and current password.</Text>

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

        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Current password"
          placeholderTextColor="#7f8b9d"
        />

        <Pressable style={styles.primaryButton} onPress={saveEmail} disabled={savingEmail}>
          <Text style={styles.primaryButtonText}>{savingEmail ? "Updating..." : "Update email"}</Text>
        </Pressable>
      </SurfaceCard>

      <SurfaceCard>
        <Pressable style={styles.secondaryButton} onPress={() => logout()}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete account</Text>
        </Pressable>
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 8,
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
  primaryButton: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff"
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  deleteButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#f1b6b6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff3f3"
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontWeight: "700"
  }
});
