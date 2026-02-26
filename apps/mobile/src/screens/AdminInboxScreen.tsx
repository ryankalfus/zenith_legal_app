import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppShell, EmptyState } from "../components/AppShell";
import { Avatar } from "../components/Avatar";
import { markConversationRead, watchAdminConversations } from "../services/messagingService";
import { theme } from "../ui/theme";

type InboxRow = {
  id: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateAvatarUrl?: string;
  lastMessageText?: string;
  lastMessageAt?: unknown;
  unreadByAdminCount?: number;
};

function toDateValue(input: unknown) {
  if (!input) {
    return null;
  }
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === "string" || typeof input === "number") {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof input === "object" && input && "toDate" in input && typeof (input as any).toDate === "function") {
    try {
      return (input as any).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function formatPreviewTime(input: unknown) {
  const date = toDateValue(input);
  if (!date) {
    return "";
  }

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
}

export function AdminInboxScreen() {
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return watchAdminConversations(
      (next) => setRows(next as InboxRow[]),
      (error) => Alert.alert("Could not load inbox", error.message)
    );
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return rows;
    }
    return rows.filter((row) => {
      const name = String(row.candidateName ?? "").toLowerCase();
      return name.includes(term);
    });
  }, [rows, search]);

  const openThread = async (item: InboxRow) => {
    try {
      await markConversationRead(item.candidateId, "admin");
    } catch {
      // Ignore read-state errors; still open thread.
    }

    navigation.navigate("Messages", {
      candidateId: item.candidateId,
      title: item.candidateName || "Candidate"
    });
  };

  return (
    <AppShell title="Chat" subtitle="Candidate direct messages">
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search chats by name"
          placeholderTextColor="#7f8b9d"
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState message="No candidate conversations yet." />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filtered.map((item, index) => {
            const unread = Number(item.unreadByAdminCount ?? 0) > 0;
            return (
              <Pressable key={item.id} style={styles.row} onPress={() => openThread(item)}>
                <View style={styles.avatarWrap}>
                  {unread ? <View style={styles.unreadDot} /> : null}
                  <Avatar uri={item.candidateAvatarUrl} name={item.candidateName || "Candidate"} size={46} />
                </View>

                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.name, unread && styles.boldText]} numberOfLines={1}>
                      {item.candidateName || "Candidate"}
                    </Text>
                    <Text style={[styles.time, unread && styles.boldTime]}>{formatPreviewTime(item.lastMessageAt)}</Text>
                  </View>
                  <Text style={[styles.preview, unread && styles.boldText]} numberOfLines={2}>
                    {item.lastMessageText || "No message text"}
                  </Text>
                </View>

                {index < filtered.length - 1 ? <View style={styles.divider} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
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
    paddingBottom: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    position: "relative"
  },
  avatarWrap: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#d32121",
    position: "absolute",
    left: 4,
    top: 18
  },
  rowBody: {
    flex: 1,
    paddingRight: 4
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  preview: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    paddingRight: 10
  },
  divider: {
    position: "absolute",
    left: 56,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: theme.colors.border
  },
  boldText: {
    color: theme.colors.textPrimary,
    fontWeight: "800"
  },
  boldTime: {
    color: theme.colors.textPrimary,
    fontWeight: "700"
  }
});
