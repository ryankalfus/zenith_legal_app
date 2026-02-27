import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppShell } from "../../components/AppShell";
import { Avatar } from "../../components/Avatar";
import { watchCandidates } from "../../services/adminService";
import { markConversationRead, startConversationAsAdmin } from "../../services/messagingService";
import { theme } from "../../ui/theme";

type CandidateOption = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

export function AdminNewConversationScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);

  useEffect(() => {
    return watchCandidates(
      (rows) => {
        const mapped = rows.map((row) => ({
          id: row.id,
          name: String(row.fullName ?? "Candidate"),
          email: String(row.email ?? ""),
          avatarUrl: String(row.avatarUrl ?? "")
        }));
        setCandidates(mapped);
      },
      () => setCandidates([])
    );
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return candidates;
    }
    return candidates.filter((row) => row.name.toLowerCase().includes(term) || row.email.toLowerCase().includes(term));
  }, [candidates, search]);

  const startConversation = async (candidate: CandidateOption) => {
    try {
      await startConversationAsAdmin({
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateAvatarUrl: candidate.avatarUrl
      });
      await markConversationRead(candidate.id, "admin");
      navigation.replace("Messages", { candidateId: candidate.id, title: candidate.name });
    } catch (error: any) {
      Alert.alert("Could not start chat", error?.message ?? "Please try again.");
    }
  };

  return (
    <AppShell title="New Chat" subtitle="Choose a candidate to start a conversation.">
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search candidates"
          placeholderTextColor="#7f8b9d"
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filtered.map((candidate) => (
          <Pressable key={candidate.id} style={styles.row} onPress={() => startConversation(candidate)}>
            <Avatar uri={candidate.avatarUrl} name={candidate.name} size={44} />
            <View style={styles.rowBody}>
              <Text style={styles.name}>{candidate.name}</Text>
              {candidate.email ? <Text style={styles.meta}>{candidate.email}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: 4
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  list: {
    flex: 1
  },
  listContent: {
    paddingBottom: 14
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  rowBody: {
    flex: 1
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  meta: {
    marginTop: 2,
    color: theme.colors.textSecondary
  }
});
