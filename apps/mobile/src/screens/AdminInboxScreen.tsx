import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppShell, EmptyState, SurfaceCard } from "../components/AppShell";
import { watchAdminConversations } from "../services/messagingService";
import { theme } from "../ui/theme";

export function AdminInboxScreen() {
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    return watchAdminConversations(
      (next) => setRows(next),
      (error) => Alert.alert("Could not load inbox", error.message)
    );
  }, []);

  return (
    <AppShell title="Chat" subtitle="Candidate direct messages" scroll>
      {rows.length === 0 ? <EmptyState message="No candidate conversations yet." /> : null}
      {rows.map((item) => (
        <SurfaceCard key={item.id}>
          <Pressable
            onPress={() =>
              navigation.navigate("Messages", {
                candidateId: item.candidateId,
                title: item.candidateName || "Candidate"
              })
            }
          >
            <Text style={styles.name}>{item.candidateName || "Candidate"}</Text>
            <Text style={styles.meta}>{item.candidateEmail || item.candidateId}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessageText || "No message text"}
            </Text>
          </Pressable>
        </SurfaceCard>
      ))}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  meta: {
    color: theme.colors.textSecondary,
    marginTop: 3
  },
  preview: {
    marginTop: 6,
    color: theme.colors.textPrimary
  }
});
