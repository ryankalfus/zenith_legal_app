import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
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
import { useAuth } from "../state/AuthContext";
import {
  hideMessageForViewer,
  markConversationRead,
  sendMessage,
  watchMessages
} from "../services/messagingService";
import { AdminChatStackParamList } from "../navigation/types";
import { CandidateContactBar } from "../components/AppShell";
import { Avatar } from "../components/Avatar";
import { theme } from "../ui/theme";
import { watchUser } from "../services/userService";
import { SafeAreaView } from "react-native-safe-area-context";

const ZENITH_LOGO = require("../../assets/zenith-legal-logo.png");

type TimelineItem =
  | { type: "divider"; id: string; label: string }
  | { type: "message"; id: string; message: any; timeLabel: string };

function asDate(input: unknown) {
  if (!input) {
    return null;
  }
  if (typeof input === "object" && input && "toDate" in input && typeof (input as any).toDate === "function") {
    try {
      return (input as any).toDate() as Date;
    } catch {
      return null;
    }
  }
  if (typeof input === "string" || typeof input === "number") {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function dayKey(value: Date | null) {
  if (!value) {
    return "unknown";
  }
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDividerDate(value: Date | null) {
  if (!value) {
    return "Unknown date";
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  if (isSameDay(value, today)) {
    return "Today";
  }
  if (isSameDay(value, yesterday)) {
    return "Yesterday";
  }
  if (value >= weekStart && value < today) {
    return value.toLocaleDateString("en-US", { weekday: "long" });
  }
  if (value.getFullYear() === now.getFullYear()) {
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMessageTime(value: Date | null) {
  if (!value) {
    return "";
  }
  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export function MessagesScreen() {
  const { session } = useAuth();
  const route = useRoute<RouteProp<AdminChatStackParamList, "Messages">>();
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
      return watchUser(
        candidateId,
        (data) => {
          setCandidateProfile({
            name: String(data?.fullName ?? route.params?.title ?? "Candidate"),
            avatarUrl: String(data?.avatarUrl ?? "")
          });
        },
        () =>
          setCandidateProfile({
            name: String(route.params?.title ?? "Candidate"),
            avatarUrl: ""
          })
      );
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

  const confirmDeleteMessage = (messageId: string) => {
    if (!candidateId || !session?.role) {
      return;
    }

    Alert.alert("Delete message", "Delete this message for your view only?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await hideMessageForViewer({
              candidateId,
              messageId,
              role: session.role
            });
          } catch (error: any) {
            Alert.alert("Could not delete", error?.message ?? "Please retry.");
          }
        }
      }
    ]);
  };

  const visibleMessages = messages.filter((item) => {
    if (session?.role === "admin") {
      return !Boolean(item.hiddenForAdmin);
    }
    return !Boolean(item.hiddenForCandidate);
  });

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    let prevKey = "";

    visibleMessages.forEach((message) => {
      const createdDate = asDate(message.createdAt);
      const key = dayKey(createdDate);
      if (key !== prevKey) {
        items.push({
          type: "divider",
          id: `divider-${key}-${message.id}`,
          label: formatDividerDate(createdDate)
        });
        prevKey = key;
      }

      items.push({
        type: "message",
        id: `message-${message.id}`,
        message,
        timeLabel: formatMessageTime(createdDate)
      });
    });

    return items;
  }, [visibleMessages]);

  if (session?.role === "admin" && !candidateId) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <CandidateContactBar />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Open a candidate chat</Text>
          <Text style={styles.emptyBody}>Choose a candidate from the chat inbox.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <CandidateContactBar />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={0}
      >
        <View style={styles.headerWrap}>
          <Image source={ZENITH_LOGO} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.title}>{session?.role === "admin" ? candidateProfile.name : "Chat"}</Text>
          <Text style={styles.subtitle}>
            {session?.role === "admin" ? "Direct message thread" : "Direct message with Zenith Legal"}
          </Text>
        </View>

        <ScrollView ref={listRef} style={styles.listScroll} contentContainerStyle={styles.list}>
          {timelineItems.map((entry) => {
            if (entry.type === "divider") {
              return (
                <View key={entry.id} style={styles.dividerWrap}>
                  <Text style={styles.dividerText}>{entry.label}</Text>
                </View>
              );
            }

            const item = entry.message;
            const mine = item.senderId === session?.user.uid;
            const otherIsZenith = session?.role === "candidate";
            const mineIsZenith = session?.role === "admin";
            return (
              <View key={entry.id} style={[styles.messageRow, mine ? styles.mineRow : styles.theirRow]}>
                {!mine ? (
                  <Avatar
                    uri={otherIsZenith ? undefined : candidateProfile.avatarUrl}
                    source={otherIsZenith ? ZENITH_LOGO : undefined}
                    name={otherIsZenith ? "Zenith Legal" : candidateProfile.name}
                    size={30}
                  />
                ) : null}

                <Pressable
                  style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                  onLongPress={() => confirmDeleteMessage(item.id)}
                  delayLongPress={250}
                >
                  <Text style={mine ? styles.mineText : styles.theirText}>{item.text || "(attachment)"}</Text>
                  {Array.isArray(item.attachments) && item.attachments.length > 0 ? (
                    <Text style={styles.attachmentText}>Attachment: {item.attachments[0].fileName}</Text>
                  ) : null}
                  {entry.timeLabel ? (
                    <Text style={[styles.messageTime, mine ? styles.messageTimeMine : styles.messageTimeTheirs]}>
                      {entry.timeLabel}
                    </Text>
                  ) : null}
                </Pressable>

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

        <View style={styles.composerWrap}>
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
    position: "relative",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8
  },
  headerLogo: {
    position: "absolute",
    right: 8,
    top: -6,
    width: 90,
    height: 90
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
    gap: 10,
    paddingBottom: 10
  },
  listScroll: {
    flex: 1
  },
  dividerWrap: {
    alignItems: "center",
    marginVertical: 4
  },
  dividerText: {
    fontSize: 12,
    color: "#7f8b9d",
    fontWeight: "700"
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
  messageTime: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600"
  },
  messageTimeMine: {
    color: "#dce8ff",
    textAlign: "right"
  },
  messageTimeTheirs: {
    color: "#8391a6",
    textAlign: "left"
  },
  composerWrap: {
    paddingHorizontal: 10,
    paddingBottom: 0
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
    borderRadius: 999
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
    paddingBottom: 2,
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
