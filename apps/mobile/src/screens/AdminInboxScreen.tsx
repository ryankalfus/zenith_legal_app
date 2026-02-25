import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../state/AuthContext";
import { watchAdminConversations } from "../services/messagingService";

export function AdminInboxScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    return watchAdminConversations(
      (next) => setRows(next),
      (error) => Alert.alert("Could not load inbox", error.message)
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Zenith Inbox</Text>
          <Text style={styles.subtitle}>Mobile admin chat tools</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={() => logout()}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No candidate conversations yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("Messages", { candidateId: item.candidateId })}
          >
            <Text style={styles.name}>{item.candidateName || "Candidate"}</Text>
            <Text style={styles.meta}>{item.candidateEmail || item.candidateId}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessageText || "No message text"}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 12
  },
  header: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 20,
    fontWeight: "700"
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 2
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  logoutText: {
    color: "#374151",
    fontWeight: "600"
  },
  row: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 4
  },
  name: {
    fontWeight: "700"
  },
  meta: {
    color: "#4b5563"
  },
  preview: {
    color: "#111827"
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 24
  }
});
