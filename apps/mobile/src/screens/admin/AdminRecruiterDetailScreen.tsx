import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppShell, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { changeUserRoleByAdmin, watchRecruiterById } from "../../services/adminService";
import { useAuth } from "../../state/AuthContext";
import { AdminCandidatesStackParamList } from "../../navigation/types";
import { theme } from "../../ui/theme";

export function AdminRecruiterDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminCandidatesStackParamList, "RecruiterDetail">>();
  const { session } = useAuth();
  const recruiterId = route.params.recruiterId;

  const [recruiter, setRecruiter] = useState<any | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => {
    return watchRecruiterById(recruiterId, setRecruiter, () => setRecruiter(null));
  }, [recruiterId]);

  const resolvedUid = String(recruiter?.uid ?? recruiterId).trim();
  const isSelf = session?.user.uid === resolvedUid;

  const updateRole = (nextRole: "candidate" | "admin") => {
    if (nextRole === "admin") {
      setRoleModalOpen(false);
      return;
    }

    if (isSelf) {
      Alert.alert("Blocked", "You cannot change your own role.");
      return;
    }

    Alert.alert(
      "Change role to candidate",
      "This will remove admin access and switch this user to candidate.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              setSavingRole(true);
              await changeUserRoleByAdmin({
                targetUid: resolvedUid,
                targetRole: "candidate"
              });
              setRoleModalOpen(false);
              Alert.alert("Updated", "Role changed to candidate.");
              navigation.goBack();
            } catch (error: any) {
              Alert.alert("Could not change role", error?.message ?? "Please try again.");
            } finally {
              setSavingRole(false);
            }
          }
        }
      ]
    );
  };

  return (
    <AppShell title="Recruiter Detail" subtitle="Review recruiter account details.">
      <SurfaceCard>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Back to candidates</Text>
        </Pressable>

        <View style={styles.profileRow}>
          <Avatar uri={String(recruiter?.avatarUrl ?? "")} name={recruiter?.fullName || "Recruiter"} size={56} />
          <View style={styles.profileBody}>
            <Text style={styles.name}>{recruiter?.fullName || "Recruiter"}</Text>
            <Text style={styles.meta}>{recruiter?.email || "No email"}</Text>
            <Text style={styles.meta}>{recruiter?.mobile || "No phone"}</Text>
          </View>
        </View>

        <View style={styles.detailGroup}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{recruiter?.fullName || "Not set"}</Text>

          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{recruiter?.email || "Not set"}</Text>

          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{recruiter?.mobile || "Not set"}</Text>

          <Pressable
            style={[styles.roleButton, (savingRole || isSelf) && styles.disabledButton]}
            onPress={() => setRoleModalOpen(true)}
            disabled={savingRole || isSelf}
          >
            <Text style={styles.roleButtonText}>Role: Recruiter</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
          </Pressable>
          {isSelf ? <Text style={styles.selfHint}>You cannot change your own role.</Text> : null}
        </View>
      </SurfaceCard>

      <Modal visible={roleModalOpen} transparent animationType="fade" onRequestClose={() => setRoleModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Role</Text>
            <Text style={styles.modalSubtitle}>{recruiter?.fullName || "Recruiter"}</Text>

            {([
              { role: "admin" as const, label: "Recruiter" },
              { role: "candidate" as const, label: "Candidate" }
            ]).map((option) => {
              const selected = option.role === "admin";
              return (
                <Pressable
                  key={option.role}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => updateRole(option.role)}
                  disabled={savingRole}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={16} color={theme.colors.primary} /> : null}
                </Pressable>
              );
            })}

            <Pressable style={styles.cancelButton} onPress={() => setRoleModalOpen(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: 10
  },
  profileRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  profileBody: {
    flex: 1
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  meta: {
    marginTop: 2,
    color: theme.colors.textSecondary
  },
  detailGroup: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    gap: 8
  },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontSize: 16
  },
  roleButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  roleButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  selfHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  disabledButton: {
    opacity: 0.55
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11,18,32,0.42)",
    justifyContent: "center",
    padding: 18
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
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  optionRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  optionRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  optionText: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  optionTextSelected: {
    color: theme.colors.primary
  },
  cancelButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  }
});
