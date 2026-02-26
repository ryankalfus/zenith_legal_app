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
import { useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../state/AuthContext";
import { sendMessage, watchMessages } from "../services/messagingService";
import { RootStackParamList } from "../navigation/types";

export function MessagesScreen() {
  const { session } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "Messages">>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<{ uri: string; mimeType: string; fileName: string } | undefined>();
  const listRef = useRef<ScrollView>(null);
  const candidateId =
    session?.role === "admin" ? route.params?.candidateId ?? "" : (session?.user.uid ?? "");

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    return watchMessages(
      candidateId,
      (rows) => {
        setMessages(rows);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      },
      () => undefined
    );
  }, [candidateId]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={96}
    >
      <ScrollView
        ref={listRef}
        contentContainerStyle={styles.list}
      >
        {messages.map((item) => {
          const mine = item.senderId === session?.user.uid;
          return (
            <View key={item.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={mine ? styles.mineText : styles.theirText}>{item.text || "(attachment)"}</Text>
              {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                <Text style={styles.attachmentText}>Attachment: {item.attachments[0].fileName}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composer}>
        <Pressable style={styles.attachButton} onPress={onPickFile}>
          <Text style={styles.attachText}>+ File</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          multiline
        />
        <Pressable style={[styles.sendButton, busy && styles.disabled]} onPress={onSend} disabled={busy}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
      {!candidateId && session?.role === "admin" && (
        <Text style={styles.fileHint}>Select a candidate conversation from inbox.</Text>
      )}
      {file && <Text style={styles.fileHint}>Attached: {file.fileName}</Text>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  list: { padding: 12, gap: 10 },
  bubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 12
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#1d4ed8"
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "white"
  },
  mineText: {
    color: "white"
  },
  theirText: {
    color: "#111827"
  },
  attachmentText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4b5563"
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
    padding: 10
  },
  attachButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  attachText: {
    color: "#1f2937",
    fontWeight: "600"
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 96
  },
  sendButton: {
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  sendText: {
    color: "white",
    fontWeight: "600"
  },
  disabled: {
    opacity: 0.5
  },
  fileHint: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    color: "#4b5563"
  }
});
