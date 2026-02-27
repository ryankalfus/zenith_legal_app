import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useIsFocused, useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../state/AuthContext";
import { markConversationRead, sendMessage, watchMessages } from "../services/messagingService";
import { AdminChatStackParamList } from "../navigation/types";
import { CandidateContactBar } from "../components/AppShell";
import { Avatar } from "../components/Avatar";
import { theme } from "../ui/theme";
import { db } from "../lib/firebase";
import { watchUser } from "../services/userService";
import { SafeAreaView } from "react-native-safe-area-context";

const ZENITH_LOGO = require("../../assets/zenith-legal-logo.png");

export function MessagesScreen() {
  const { session } = useAuth();
  const route = useRoute<RouteProp<AdminChatStackParamList, "Messages">>();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<{ uri: string; mimeType: string; fileName: string } | undefined>();
  const [candidateProfile, setCandidateProfile] = useState<{ name: string; avatarUrl: string }>({
    name: "Candidate",
    avatarUrl: ""
  });
  const [selfProfile, setSelfProfile] = useState<{ name: string; avatarUrl: string }>({
    name: "You",
    avatarUrl: ""
  });
  const listRef = useRef<ScrollView>(null);

  const candidateId =
    session?.role === "admin" ? route.params?.candidateId ?? "" : (session?.user.uid ?? "");

  useEffect(() => {
    if (!candidateId) {
      setMessages([]);
      return;
    }

    return watchMessages(
      candidateId,
      (rows) => {
        setMessages(rows);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      },
      () => undefined
    );
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId || !session?.role || !isFocused) {
      return;
    }
    markConversationRead(candidateId, session.role).catch(() => undefined);
  }, [candidateId, isFocused, session?.role]);

  useEffect(() => {
    if (!candidateId || !session?.role || !isFocused || messages.length === 0) {
      return;
    }
    markConversationRead(candidateId, session.role).catch(() => undefined);
  }, [candidateId, isFocused, messages.length, session?.role]);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    if (session?.role === "admin") {
      getDoc(doc(db, "users", candidateId))
        .then((snapshot) => {
          const data = snapshot.data();
          setCandidateProfile({
            name: String(data?.fullName ?? route.params?.title ?? "Candidate"),
            avatarUrl: String(data?.avatarUrl ?? "")
          });
        })
        .catch(() => undefined);
    } else {
      setCandidateProfile({
        name: "Zenith Legal",
        avatarUrl: ""
      });
    }
  }, [candidateId, route.params?.title, session?.role]);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    return watchUser(
      session.user.uid,
      (data) =>
        setSelfProfile({
          name: String(data?.fullName ?? (session.role === "admin" ? "Zenith Legal" : "You")),
          avatarUrl: String(data?.avatarUrl ?? "")
        }),
      () => undefined
    );
  }, [session?.role, session?.user.uid]);

  const onPickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setFile({
      uri: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType ?? "application/octet-stream"
    });
  };

  const onSend = async () => {
    if (!session?.user.uid || !candidateId || (!text.trim() && !file)) {
      return;
    }

    try {
      setBusy(true);
      await sendMessage({
        candidateId,
        senderId: session.user.uid,
        senderRole: session.role === "admin" ? "admin" : "candidate",
        text: text.trim(),
        file
      });
      setText("");
      setFile(undefined);
    } catch (error: any) {
      Alert.alert("Send failed", error?.message ?? "Please retry.");
    } finally {
      setBusy(false);
    }
  };

  if (session?.role === "admin" && !candidateId) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
        <CandidateContactBar />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Open a candidate chat</Text>
          <Text style={styles.emptyBody}>Choose a candidate from the chat inbox.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
      <CandidateContactBar />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={96}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.title}>{session?.role === "admin" ? route.params?.title ?? "Candidate" : "Chat"}</Text>
          <Text style={styles.subtitle}>
            {session?.role === "admin" ? "Direct message thread" : "Direct message with Zenith Legal"}
          </Text>
        </View>

        <ScrollView ref={listRef} contentContainerStyle={[styles.list, { paddingBottom: Math.max(14, tabBarHeight - 8) }]}>
          {messages.map((item) => {
            const mine = item.senderId === session?.user.uid;
            const otherIsZenith = session?.role === "candidate";
            const mineIsZenith = session?.role === "admin";
            return (
              <View key={item.id} style={[styles.messageRow, mine ? styles.mineRow : styles.theirRow]}>
                {!mine ? (
                  <Avatar
                    uri={otherIsZenith ? undefined : candidateProfile.avatarUrl}
                    source={otherIsZenith ? ZENITH_LOGO : undefined}
                    name={otherIsZenith ? "Zenith Legal" : candidateProfile.name}
                    size={30}
                  />
                ) : null}

                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={mine ? styles.mineText : styles.theirText}>{item.text || "(attachment)"}</Text>
                  {Array.isArray(item.attachments) && item.attachments.length > 0 ? (
                    <Text style={styles.attachmentText}>Attachment: {item.attachments[0].fileName}</Text>
                  ) : null}
                </View>

                {mine ? (
                  <Avatar
                    uri={mineIsZenith ? undefined : selfProfile.avatarUrl}
                    source={mineIsZenith ? ZENITH_LOGO : undefined}
                    name={mineIsZenith ? "Zenith Legal" : selfProfile.name}
                    size={30}
                  />
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.composerWrap, { paddingBottom: Math.max(6, tabBarHeight - 18) }]}>
          <View style={styles.composer}>
            <Pressable style={styles.attachButton} onPress={onPickFile}>
              <Text style={styles.attachText}>+</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message"
              placeholderTextColor="#7f8b9d"
              multiline
            />
            <Pressable style={[styles.sendButton, busy && styles.disabled]} onPress={onSend} disabled={busy}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
        {file ? <Text style={styles.fileHint}>Attached: {file.fileName}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  headerWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  subtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary
  },
  list: {
    paddingHorizontal: 12,
    gap: 10
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7
  },
  mineRow: {
    justifyContent: "flex-end"
  },
  theirRow: {
    justifyContent: "flex-start"
  },
  bubble: {
    maxWidth: "76%",
    padding: 11,
    borderRadius: 16,
    borderWidth: 1
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
    borderColor: "#4387ff"
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderColor: theme.colors.border
  },
  mineText: {
    color: "#fff"
  },
  theirText: {
    color: theme.colors.textPrimary
  },
  attachmentText: {
    marginTop: 6,
    fontSize: 12,
    color: "#61708a"
  },
  composerWrap: {
    paddingHorizontal: 10
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    shadowColor: "#0b1220",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2
  },
  attachButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f4fb",
    alignItems: "center",
    justifyContent: "center"
  },
  attachText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 20
  },
  input: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
    backgroundColor: "#f3f5fa",
    color: theme.colors.textPrimary
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.5
  },
  fileHint: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    color: theme.colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    gap: 6,
    paddingHorizontal: 18
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  emptyBody: {
    color: theme.colors.textSecondary
  }
});
