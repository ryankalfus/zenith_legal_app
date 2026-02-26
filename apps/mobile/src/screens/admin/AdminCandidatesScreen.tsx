import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { watchCandidates, CandidateRow } from "../../services/adminService";
import { useAuth } from "../../state/AuthContext";
import { theme } from "../../ui/theme";

export function AdminCandidatesScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CandidateRow[]>([]);

  useEffect(() => {
    return watchCandidates(
      (next) => setRows(next),
      () => setRows([])
    );
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }

    const term = search.toLowerCase();
    return rows.filter((row) => {
      return (
        String(row.fullName ?? "").toLowerCase().includes(term) ||
        String(row.email ?? "").toLowerCase().includes(term) ||
        String(row.mobile ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  return (
    <AppShell title="Candidates" subtitle="Manage candidate profiles and firms." scroll>
      <SurfaceCard>
        <View style={styles.headerRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name/email/phone"
            placeholderTextColor="#7f8b9d"
          />
          <Pressable style={styles.logoutButton} onPress={() => logout()}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </SurfaceCard>

      {filtered.length === 0 ? <EmptyState message="No candidates found." /> : null}

      {filtered.map((candidate) => (
        <SurfaceCard key={candidate.id}>
          <Pressable onPress={() => navigation.navigate("CandidateDetail", { candidateId: candidate.id })}>
            <View style={styles.row}>
              <Avatar uri={candidate.avatarUrl} name={candidate.fullName || "Candidate"} size={44} />
              <View style={styles.rowBody}>
                <Text style={styles.name}>{candidate.fullName || "(No display name)"}</Text>
                <Text style={styles.meta}>{candidate.email || "No email"}</Text>
                <Text style={styles.meta}>{candidate.mobile || "No phone"}</Text>
                <Text style={styles.meta}>
                  Work: {candidate.preferences?.practiceArea || "Not set"}
                </Text>
                <Text style={styles.meta}>
                  Cities: {(candidate.preferences?.preferredCities ?? []).join(", ") || "None"}
                </Text>
                <Text style={styles.link}>Open candidate profile</Text>
              </View>
            </View>
          </Pressable>
        </SurfaceCard>
      ))}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  logoutText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  rowBody: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  meta: {
    marginTop: 3,
    color: theme.colors.textSecondary
  },
  link: {
    marginTop: 8,
    color: theme.colors.primary,
    fontWeight: "700"
  }
});
