import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CANDIDATE_STATUS_LABELS, CANDIDATE_VISIBLE_STATUSES, PRACTICE_AREAS, PREFERRED_CITIES } from "@zenith/shared";
import { AppShell, EmptyState, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import {
  purgeLegacyRyanKlfusCandidate,
  watchCandidates,
  watchRecruiters,
  watchFirms,
  CandidateRow,
  RecruiterRow,
  FirmRow
} from "../../services/adminService";
import { watchAllCandidateStatusIndex, CandidateStatusIndex } from "../../services/statusService";
import {
  AdminCandidatesStackParamList,
  CandidateFilterOptions,
  CandidateFilterState
} from "../../navigation/types";
import { theme } from "../../ui/theme";

function parseIsoDate(input?: string) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }
  const parsed = new Date(`${input}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function createDefaultFilters(): CandidateFilterState {
  return {
    assignedRecruiter: "any",
    statuses: [],
    practices: [],
    firmIds: [],
    preferredCities: []
  };
}

export function AdminCandidatesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminCandidatesStackParamList, "CandidatesList">>();
  const [search, setSearch] = useState("");
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>([]);
  const [recruiterRows, setRecruiterRows] = useState<RecruiterRow[]>([]);
  const [firmRows, setFirmRows] = useState<FirmRow[]>([]);
  const [statusIndex, setStatusIndex] = useState<CandidateStatusIndex>({});
  const [filters, setFilters] = useState<CandidateFilterState>(route.params?.filters ?? createDefaultFilters());

  useEffect(() => {
    purgeLegacyRyanKlfusCandidate().catch(() => undefined);

    const unsubCandidates = watchCandidates(
      (next) => setCandidateRows(next),
      () => setCandidateRows([])
    );

    const unsubRecruiters = watchRecruiters(
      (next) => setRecruiterRows(next),
      () => setRecruiterRows([])
    );
    const unsubFirms = watchFirms(
      (next) => setFirmRows(next),
      () => setFirmRows([])
    );
    const unsubStatusIndex = watchAllCandidateStatusIndex(
      (next) => setStatusIndex(next),
      () => setStatusIndex({})
    );

    return () => {
      unsubCandidates();
      unsubRecruiters();
      unsubFirms();
      unsubStatusIndex();
    };
  }, []);

  useEffect(() => {
    if (route.params?.filters) {
      setFilters(route.params.filters);
    }
  }, [route.params?.filters]);

  const recruiterMap = useMemo(() => {
    const map: Record<string, string> = {};
    recruiterRows.forEach((row) => {
      map[String(row.id)] = String(row.fullName || "Recruiter");
      if (row.uid) {
        map[String(row.uid)] = String(row.fullName || "Recruiter");
      }
    });
    return map;
  }, [recruiterRows]);

  const filterOptions = useMemo<CandidateFilterOptions>(() => {
    return {
      recruiters: recruiterRows.map((row) => ({
        id: String(row.uid ?? row.id),
        label: String(row.fullName || "Recruiter")
      })),
      statuses: CANDIDATE_VISIBLE_STATUSES.map((id) => ({ id, label: CANDIDATE_STATUS_LABELS[id] })),
      practices: [...PRACTICE_AREAS].map((entry) => ({ id: entry, label: entry })),
      firms: firmRows.map((firm) => ({ id: firm.id, label: firm.name })),
      preferredCities: [...PREFERRED_CITIES].map((entry) => ({ id: entry, label: entry }))
    };
  }, [firmRows, recruiterRows]);

  const filteredRecruiters = useMemo(
    () => recruiterRows.filter((row) => matchesSearch(search, row)),
    [recruiterRows, search]
  );
  const filteredCandidates = useMemo(
    () =>
      candidateRows.filter((row) => {
        if (!matchesSearch(search, row)) {
          return false;
        }

        const rowIds = [String(row.id), String(row.uid ?? "")].filter(Boolean);
        const rowStatus = rowIds.map((id) => statusIndex[id]).find(Boolean) ?? { statuses: [], firmIds: [] };

        if (filters.assignedRecruiter !== "any") {
          if (filters.assignedRecruiter === "none") {
            if (row.assignedRecruiterId || row.assignedRecruiterName) {
              return false;
            }
          } else {
            const assignedId = String(row.assignedRecruiterId ?? "");
            const assignedName = String(row.assignedRecruiterName ?? "");
            const selectedName = recruiterMap[filters.assignedRecruiter] ?? "";
            if (
              assignedId !== filters.assignedRecruiter &&
              (!selectedName || assignedName.toLowerCase() !== selectedName.toLowerCase())
            ) {
              return false;
            }
          }
        }

        if (filters.statuses.length > 0 && !filters.statuses.some((status) => rowStatus.statuses.includes(status))) {
          return false;
        }
        if (filters.practices.length > 0 && !filters.practices.includes(String(row.preferences?.practiceArea ?? ""))) {
          return false;
        }
        if (filters.firmIds.length > 0 && !filters.firmIds.some((firmId) => rowStatus.firmIds.includes(firmId))) {
          return false;
        }
        if (
          filters.preferredCities.length > 0 &&
          !filters.preferredCities.some((city) => (row.preferences?.preferredCities ?? []).includes(city))
        ) {
          return false;
        }

        return true;
      }),
    [candidateRows, filters, recruiterMap, search, statusIndex]
  );

  const openFilters = () => {
    navigation.navigate("CandidateFilters", {
      filters,
      options: filterOptions
    });
  };

  return (
    <AppShell
      title="Zenith Legal"
      subtitle="Manage candidate and recruiter profiles"
      topRightLogoStyle={styles.dashboardHeroLogo}
      scroll
    >
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name/email/phone"
        placeholderTextColor="#7f8b9d"
      />

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
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Candidates</Text>
          <Pressable style={styles.filterButton} onPress={openFilters}>
            <Text style={styles.filterButtonText}>Filter search</Text>
          </Pressable>
        </View>
        {filteredCandidates.length === 0 ? <EmptyState message="No candidates found." /> : null}
        {filteredCandidates.map((candidate) => {
          const jdDate = formatShortDate(candidate.jdDegreeDate);
          const targetCandidateId = String(candidate.uid ?? candidate.id);
          const assignedRecruiter =
            String(candidate.assignedRecruiterName ?? "").trim() ||
            recruiterMap[String(candidate.assignedRecruiterId ?? "")] ||
            "None";
          return (
            <SurfaceCard key={candidate.id}>
              <Pressable onPress={() => navigation.navigate("CandidateDetail", { candidateId: targetCandidateId })}>
                <View style={styles.row}>
                  <Avatar uri={candidate.avatarUrl} name={candidate.fullName || "Candidate"} size={44} />
                  <View style={styles.rowBody}>
                    <Text style={styles.name}>{candidate.fullName || "(No display name)"}</Text>
                    <Text style={styles.meta}>{candidate.email || "No email"}</Text>
                    <Text style={styles.meta}>{candidate.mobile || "No phone"}</Text>
                    <Text style={styles.meta}>Assigned recruiter: {assignedRecruiter}</Text>
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
  sectionTitleRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  filterButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  filterButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12
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
