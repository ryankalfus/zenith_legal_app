import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell, EmptyState } from "../components/AppShell";
import { Avatar } from "../components/Avatar";
import {
  deleteConversationForAdmin,
  markConversationRead,
  watchAdminConversations
} from "../services/messagingService";
import { watchCandidates } from "../services/adminService";
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
  const [candidateDirectory, setCandidateDirectory] = useState<Record<string, { name: string; avatarUrl: string }>>({});
  const [rowWidth, setRowWidth] = useState(320);
  const rowRefs = useRef<Record<string, ScrollView | null>>({});
  const isFocused = useIsFocused();

  useEffect(() => {
    return watchAdminConversations(
      (next) => setRows(next as InboxRow[]),
      (error) => Alert.alert("Could not load inbox", error.message)
    );
  }, []);

  useEffect(() => {
    return watchCandidates(
      (next) => {
        const directory: Record<string, { name: string; avatarUrl: string }> = {};
        next.forEach((entry) => {
          directory[entry.id] = {
            name: String(entry.fullName ?? "Candidate"),
            avatarUrl: String(entry.avatarUrl ?? "")
          };
        });
        setCandidateDirectory(directory);
      },
      () => setCandidateDirectory({})
    );
  }, []);

  const getDisplayName = (row: InboxRow) => candidateDirectory[row.candidateId]?.name || row.candidateName || "Candidate";
  const getDisplayAvatar = (row: InboxRow) =>
    candidateDirectory[row.candidateId]?.avatarUrl || row.candidateAvatarUrl || "";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return rows;
    }
    return rows.filter((row) => {
      const name = getDisplayName(row).toLowerCase();
      return name.includes(term);
    });
  }, [rows, search, candidateDirectory]);

  const openThread = async (item: InboxRow) => {
    Object.values(rowRefs.current).forEach((ref) => ref?.scrollTo({ x: 0, y: 0, animated: false }));
    try {
      await markConversationRead(item.candidateId, "admin");
    } catch {
      // Ignore read-state errors; still open thread.
    }

    navigation.navigate("Messages", {
      candidateId: item.candidateId,
      title: getDisplayName(item)
    });
  };

  useEffect(() => {
    if (isFocused) {
      return;
    }
    Object.values(rowRefs.current).forEach((ref) => ref?.scrollTo({ x: 0, y: 0, animated: false }));
  }, [isFocused]);

  const confirmDelete = (item: InboxRow) => {
    Alert.alert("Delete chat", "Delete this conversation from Zenith Legal chat list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConversationForAdmin(item.candidateId);
          } catch (error: any) {
            Alert.alert("Could not delete", error?.message ?? "Please try again.");
          }
        }
      }
    ]);
  };

  return (
    <AppShell
      title="Chat"
      subtitle="Candidate direct messages"
      headerRight={(
        <Pressable style={styles.plusButton} onPress={() => navigation.navigate("NewConversation")}>
          <Ionicons name="add" size={18} color={theme.colors.primary} />
        </Pressable>
      )}
    >
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
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onLayout={(event) => setRowWidth(Math.max(220, Math.floor(event.nativeEvent.layout.width)))}
        >
          {filtered.map((item, index) => {
            const unread = Number(item.unreadByAdminCount ?? 0) > 0;
            return (
              <ScrollView
                key={item.id}
                horizontal
                ref={(ref) => {
                  rowRefs.current[item.id] = ref;
                }}
                showsHorizontalScrollIndicator={false}
                bounces={false}
                decelerationRate="fast"
                snapToOffsets={[0, 92]}
                directionalLockEnabled
                contentContainerStyle={[styles.swipeContent, { width: rowWidth + 92 }]}
              >
                <Pressable style={[styles.row, { width: rowWidth }]} onPress={() => openThread(item)}>
                  <View style={styles.avatarWrap}>
                    <Avatar uri={getDisplayAvatar(item)} name={getDisplayName(item)} size={46} />
                  </View>

                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.name, unread && styles.boldText]} numberOfLines={1}>
                        {getDisplayName(item)}
                      </Text>
                      <Text style={[styles.time, unread && styles.boldTime]}>{formatPreviewTime(item.lastMessageAt)}</Text>
                    </View>
                    <Text style={[styles.preview, unread && styles.boldText]} numberOfLines={2}>
                      {item.lastMessageText || "No message text"}
                    </Text>
                  </View>

                  {index < filtered.length - 1 ? <View style={styles.divider} /> : null}
                </Pressable>

                <Pressable style={styles.deleteAction} onPress={() => confirmDelete(item)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </ScrollView>
            );
          })}
        </ScrollView>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
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
  swipeContent: {
    flexDirection: "row"
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
  deleteAction: {
    width: 92,
    backgroundColor: "#d73636",
    alignItems: "center",
    justifyContent: "center"
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700"
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
