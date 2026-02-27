import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import {
  watchCandidates,
  watchRecruiters,
  CandidateRow,
  RecruiterRow
} from "../../services/adminService";
import { theme } from "../../ui/theme";

function parseIsoDate(input?: string) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }
  const parsed = new Date(`${input}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAge(dateOfBirth?: string) {
  const dob = parseIsoDate(dateOfBirth);
  if (!dob) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function formatShortDate(input?: string) {
  const parsed = parseIsoDate(input);
  if (!parsed) {
    return null;
  }
  return parsed.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function matchesSearch(term: string, row: { fullName?: string; email?: string; mobile?: string }) {
  const safeTerm = term.trim().toLowerCase();
  if (!safeTerm) {
    return true;
  }
  return (
    String(row.fullName ?? "").toLowerCase().includes(safeTerm) ||
    String(row.email ?? "").toLowerCase().includes(safeTerm) ||
    String(row.mobile ?? "").toLowerCase().includes(safeTerm)
  );
}

export function AdminCandidatesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([]);
  const [recruiterRows, setRecruiterRows] = useState<RecruiterRow[]>([]);

  useEffect(() => {
    const unsubCandidates = watchCandidates(
      (next) => setCandidateRows(next),
      () => setCandidateRows([])
    );

    const unsubRecruiters = watchRecruiters(
      (next) => setRecruiterRows(next),
      () => setRecruiterRows([])
    );

    return () => {
      unsubCandidates();
      unsubRecruiters();
    };
  }, []);

  const filteredRecruiters = useMemo(
    () => recruiterRows.filter((row) => matchesSearch(search, row)),
    [recruiterRows, search]
  );
  const filteredCandidates = useMemo(
    () => candidateRows.filter((row) => matchesSearch(search, row)),
    [candidateRows, search]
  );

  return (
    <AppShell
      title="Candidates"
      subtitle="Manage recruiter accounts, candidate profiles, and firms."
      topRightLogoStyle={styles.dashboardHeroLogo}
      scroll
    >
      <SurfaceCard>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name/email/phone"
          placeholderTextColor="#7f8b9d"
        />
      </SurfaceCard>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Recruiters</Text>
        {filteredRecruiters.length === 0 ? <EmptyState message="No recruiters found." /> : null}
        {filteredRecruiters.map((recruiter) => {
          return (
            <SurfaceCard key={recruiter.id}>
              <Pressable onPress={() => navigation.navigate("RecruiterDetail", { recruiterId: recruiter.id })}>
                <View style={styles.row}>
                  <Avatar uri={recruiter.avatarUrl} name={recruiter.fullName || "Recruiter"} size={44} />
                  <View style={styles.rowBody}>
                    <Text style={styles.name}>{recruiter.fullName || "(No name)"}</Text>
                    <Text style={styles.meta}>{recruiter.email || "No email"}</Text>
                    <Text style={styles.meta}>{recruiter.mobile || "No phone"}</Text>
                    <Text style={styles.link}>Open admin profile</Text>
                  </View>
                </View>
              </Pressable>
            </SurfaceCard>
          );
        })}
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Candidates</Text>
        {filteredCandidates.length === 0 ? <EmptyState message="No candidates found." /> : null}
        {filteredCandidates.map((candidate) => {
          const age = getAge(candidate.dateOfBirth);
          const jdDate = formatShortDate(candidate.jdDegreeDate);
          const targetCandidateId = String(candidate.uid ?? candidate.id);
          return (
            <SurfaceCard key={candidate.id}>
              <Pressable onPress={() => navigation.navigate("CandidateDetail", { candidateId: targetCandidateId })}>
                <View style={styles.row}>
                  <Avatar uri={candidate.avatarUrl} name={candidate.fullName || "Candidate"} size={44} />
                  <View style={styles.rowBody}>
                    <Text style={styles.name}>{candidate.fullName || "(No display name)"}</Text>
                    <Text style={styles.meta}>{candidate.email || "No email"}</Text>
                    <Text style={styles.meta}>{candidate.mobile || "No phone"}</Text>
                    <Text style={styles.meta}>Age: {age ?? "Not set"}</Text>
                    <Text style={styles.meta}>JD degree received: {jdDate ?? "Not set"}</Text>
                    <Text style={styles.meta}>Work: {candidate.preferences?.practiceArea || "Not set"}</Text>
                    <Text style={styles.meta}>
                      Cities: {(candidate.preferences?.preferredCities ?? []).join(", ") || "None"}
                    </Text>
                    <Text style={styles.link}>Open candidate profile</Text>
                  </View>
                </View>
              </Pressable>
            </SurfaceCard>
          );
        })}
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
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  sectionWrap: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 6
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
