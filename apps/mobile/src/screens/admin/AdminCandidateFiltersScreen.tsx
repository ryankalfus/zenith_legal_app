import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppShell, SurfaceCard } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { AdminCandidatesStackParamList, CandidateFilterState } from "../../navigation/types";
import { watchRecruiters } from "../../services/adminService";
import { theme } from "../../ui/theme";

type PickerField = "assignedRecruiter" | "statuses" | "practices" | "firmIds" | "preferredCities" | null;
type RecruiterOption = { id: string; label: string; phone?: string; avatarUrl?: string };
type PickerRow = { id: string; label: string; phone?: string; avatarUrl?: string };

function createDefaultFilters(): CandidateFilterState {
  return {
    assignedRecruiter: "any",
    statuses: [],
    practices: [],
    firmIds: [],
    preferredCities: []
  };
}

function joinLabels(labels: string[]) {
  if (labels.length === 0) {
    return "Any";
  }
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  return `${labels.length} selected`;
}

export function AdminCandidateFiltersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminCandidatesStackParamList, "CandidateFilters">>();
  const [filters, setFilters] = useState<CandidateFilterState>(route.params?.filters ?? createDefaultFilters());
  const [activePicker, setActivePicker] = useState<PickerField>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [liveRecruiters, setLiveRecruiters] = useState<RecruiterOption[]>([]);

  const options = route.params?.options ?? {
    recruiters: [],
    statuses: [],
    practices: [],
    firms: [],
    preferredCities: []
  };
  const recruiterOptions: RecruiterOption[] =
    liveRecruiters.length > 0
      ? liveRecruiters
      : options.recruiters.map((entry) => ({ id: entry.id, label: entry.label }));

  useEffect(() => {
    const unsubRecruiters = watchRecruiters(
      (rows) => {
        const unique = new Map<string, RecruiterOption>();
        rows.forEach((row) => {
          const id = String(row.uid ?? row.id).trim();
          const label = String(row.fullName ?? "").trim() || "Recruiter";
          const phone = String(row.mobile ?? "").trim();
          const avatarUrl = String(row.avatarUrl ?? "").trim();
          if (!id) {
            return;
          }
          unique.set(id, { id, label, phone, avatarUrl });
        });
        const mapped = [...unique.values()].sort((a, b) =>
          a.label.localeCompare(b.label, "en", { sensitivity: "base" })
        );
        setLiveRecruiters(mapped);
      },
      () => setLiveRecruiters([])
    );

    return unsubRecruiters;
  }, []);

  const assignedRecruiterLabel = useMemo(() => {
    if (filters.assignedRecruiter === "any") {
      return "Any";
    }
    if (filters.assignedRecruiter === "none") {
      return "None";
    }
    return recruiterOptions.find((item) => item.id === filters.assignedRecruiter)?.label ?? "Any";
  }, [filters.assignedRecruiter, recruiterOptions]);

  const statusLabel = useMemo(
    () => joinLabels(filters.statuses.map((id) => options.statuses.find((item) => item.id === id)?.label ?? id)),
    [filters.statuses, options.statuses]
  );
  const practiceLabel = useMemo(
    () => joinLabels(filters.practices.map((id) => options.practices.find((item) => item.id === id)?.label ?? id)),
    [filters.practices, options.practices]
  );
  const firmLabel = useMemo(
    () => joinLabels(filters.firmIds.map((id) => options.firms.find((item) => item.id === id)?.label ?? id)),
    [filters.firmIds, options.firms]
  );
  const cityLabel = useMemo(
    () => joinLabels(
      filters.preferredCities.map((id) => options.preferredCities.find((item) => item.id === id)?.label ?? id)
    ),
    [filters.preferredCities, options.preferredCities]
  );

  const toggleMulti = (field: "statuses" | "practices" | "firmIds" | "preferredCities", value: string) => {
    setFilters((prev) => {
      const set = new Set(prev[field] as string[]);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      return { ...prev, [field]: [...set] } as CandidateFilterState;
    });
  };

  const applyFilters = () => {
    navigation.navigate("CandidatesList", { filters });
  };

  const clearFilters = () => {
    setFilters(createDefaultFilters());
  };

  const pickerRows: PickerRow[] =
    activePicker === "assignedRecruiter"
      ? [
          { id: "any", label: "Any recruiter" },
          { id: "none", label: "None" },
          ...recruiterOptions
        ]
      : activePicker === "statuses"
        ? [{ id: "any", label: "Any" }, ...options.statuses]
        : activePicker === "practices"
          ? [{ id: "any", label: "Any" }, ...options.practices]
          : activePicker === "firmIds"
            ? [{ id: "any", label: "Any" }, ...options.firms]
            : activePicker === "preferredCities"
              ? [{ id: "any", label: "Any" }, ...options.preferredCities]
              : [];
  const visiblePickerRows = useMemo(() => {
    const term = pickerSearch.trim().toLowerCase();
    if (!term || activePicker !== "firmIds") {
      return pickerRows;
    }
    return pickerRows.filter((row) => row.id === "any" || row.label.toLowerCase().includes(term));
  }, [activePicker, pickerRows, pickerSearch]);

  return (
    <AppShell title="Filter Search" subtitle="Filter candidate results">
      <SurfaceCard>
        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => {
              setPickerSearch("");
              setActivePicker("assignedRecruiter");
            }}
          >
            <Text style={styles.label}>Assigned recruiter</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{assignedRecruiterLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => {
              setPickerSearch("");
              setActivePicker("statuses");
            }}
          >
            <Text style={styles.label}>Current status</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{statusLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => {
              setPickerSearch("");
              setActivePicker("practices");
            }}
          >
            <Text style={styles.label}>Practice</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{practiceLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => {
              setPickerSearch("");
              setActivePicker("firmIds");
            }}
          >
            <Text style={styles.label}>Assigned firms</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{firmLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </View>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => {
              setPickerSearch("");
              setActivePicker("preferredCities");
            }}
          >
            <Text style={styles.label}>Preferred cities</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{cityLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
          <Pressable style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </View>
      </SurfaceCard>

      <Modal visible={Boolean(activePicker)} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activePicker === "assignedRecruiter"
                ? "Assigned recruiter"
                : activePicker === "statuses"
                  ? "Current status"
                  : activePicker === "practices"
                    ? "Practice"
                    : activePicker === "firmIds"
                      ? "Assigned firms"
                      : "Preferred cities"}
            </Text>
            {activePicker === "firmIds" ? (
              <TextInput
                style={styles.searchInput}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search firm name"
                placeholderTextColor="#7f8b9d"
              />
            ) : null}
            <ScrollView style={styles.modalList}>
              {visiblePickerRows.map((row) => {
                const isSelected =
                  activePicker === "assignedRecruiter"
                    ? filters.assignedRecruiter === row.id
                    : activePicker === "statuses"
                      ? row.id === "any"
                        ? filters.statuses.length === 0
                        : filters.statuses.includes(row.id as any)
                      : activePicker === "practices"
                        ? row.id === "any"
                          ? filters.practices.length === 0
                          : filters.practices.includes(row.id)
                        : activePicker === "firmIds"
                          ? row.id === "any"
                            ? filters.firmIds.length === 0
                            : filters.firmIds.includes(row.id)
                          : row.id === "any"
                            ? filters.preferredCities.length === 0
                            : filters.preferredCities.includes(row.id);

                return (
                  <Pressable
                    key={row.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => {
                      if (activePicker === "assignedRecruiter") {
                        setFilters((prev) => ({ ...prev, assignedRecruiter: row.id }));
                        return;
                      }
                      if (activePicker === "statuses") {
                        if (row.id === "any") {
                          setFilters((prev) => ({ ...prev, statuses: [] }));
                          return;
                        }
                        toggleMulti("statuses", row.id);
                        return;
                      }
                      if (activePicker === "practices") {
                        if (row.id === "any") {
                          setFilters((prev) => ({ ...prev, practices: [] }));
                          return;
                        }
                        toggleMulti("practices", row.id);
                        return;
                      }
                      if (activePicker === "firmIds") {
                        if (row.id === "any") {
                          setFilters((prev) => ({ ...prev, firmIds: [] }));
                          return;
                        }
                        toggleMulti("firmIds", row.id);
                        return;
                      }
                      if (row.id === "any") {
                        setFilters((prev) => ({ ...prev, preferredCities: [] }));
                        return;
                      }
                      toggleMulti("preferredCities", row.id);
                    }}
                  >
                    {activePicker === "assignedRecruiter" ? (
                      <View style={styles.optionLeft}>
                        {row.id === "any" || row.id === "none" ? (
                          <Avatar name={row.label} size={32} showFallbackIcon />
                        ) : (
                          <Avatar uri={row.avatarUrl} name={row.label} size={32} />
                        )}
                        <View style={styles.optionBody}>
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{row.label}</Text>
                          <Text style={styles.optionMeta}>
                            {row.id === "any"
                              ? "Show all recruiters"
                              : row.id === "none"
                                ? "Only unassigned candidates"
                                : row.phone || "No phone"}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{row.label}</Text>
                    )}
                    {isSelected ? <Ionicons name="checkmark" size={16} color={theme.colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={() => setActivePicker(null)}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10
  },
  row: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 6
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700"
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  value: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    flex: 1
  },
  actions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  clearButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: theme.colors.primary
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "700"
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
    padding: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8
  },
  modalList: {
    maxHeight: 320
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    color: theme.colors.textPrimary
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
    justifyContent: "space-between",
    marginBottom: 8
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  optionBody: {
    flex: 1
  },
  optionRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  optionText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  optionTextSelected: {
    color: theme.colors.primary
  },
  optionMeta: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  closeButton: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    paddingVertical: 10
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  }
});
