import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppShell, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { deleteMyAccount } from "../../services/accountService";
import {
  updateAdminOwnProfile
} from "../../services/adminService";
import {
  changeMyEmailWithPassword,
  changeMyPasswordWithCurrentPassword,
  removeCandidateProfilePhoto,
  uploadCandidateProfilePhoto,
  watchUser
} from "../../services/userService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";
import { openProfilePhotoSourcePicker } from "../../utils/profilePhotoSourcePicker";

export function AdminProfileScreen() {
  const { session, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

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
        setEmail(nextEmail);
        setAvatarUrl(String(data?.avatarUrl ?? ""));
        setAvatarPath(String(data?.avatarPath ?? ""));
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
        mobile: mobile.trim(),
        email
      });
      Alert.alert("Saved", "Profile updated.");
    } catch (error: any) {
      Alert.alert("Could not save", error?.message ?? "Please try again.");
    } finally {
      setSavingProfile(false);
    }
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

  return (
    <AppShell title="Profile" subtitle="Manage your admin account." scroll>
      <SurfaceCard>
        <Text style={styles.label}>Profile photo</Text>
        <View style={styles.photoRow}>
          <Avatar uri={avatarUrl} name={fullName || "Admin"} size={64} />
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

        <Pressable style={styles.primaryButton} onPress={saveProfile} disabled={savingProfile}>
          <Text style={styles.primaryButtonText}>{savingProfile ? "Saving..." : "Save profile"}</Text>
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

        <Pressable
          style={styles.primaryButton}
          onPress={async () => {
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
          }}
          disabled={savingPassword}
        >
          <Text style={styles.primaryButtonText}>{savingPassword ? "Updating..." : "Update password"}</Text>
        </Pressable>
      </SurfaceCard>

      <View style={styles.accountActions}>
        <Pressable style={styles.secondaryButton} onPress={() => logout()}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete account</Text>
        </Pressable>
      </View>
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
  accountActions: {
    marginTop: 2
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
