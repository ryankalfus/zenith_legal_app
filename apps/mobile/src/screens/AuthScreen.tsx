import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as Linking from "expo-linking";
import { useAuth } from "../state/AuthContext";

export function AuthScreen() {
  const { sendEmailLink, completeEmailLinkSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSendEmailLink = async () => {
    try {
      setBusy(true);
      await sendEmailLink(email);
      Alert.alert("Email sent", "Open the link from your email on this device.");
    } catch (error: any) {
      Alert.alert("Could not send link", error?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onCompleteEmailLink = async () => {
    try {
      setBusy(true);
      const url = await Linking.getInitialURL();
      if (!url) {
        Alert.alert("No link found", "Open the sign-in link from your email first.");
      } else {
        await completeEmailLinkSignIn(email, url);
      }
    } catch (error: any) {
      Alert.alert("Could not complete email login", error?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Text style={styles.title}>Zenith Legal Candidate Portal</Text>
      <Text style={styles.subtitle}>Sign in with an email link.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Email Link</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholder="you@example.com"
        />
        <Pressable style={styles.button} onPress={onSendEmailLink} disabled={busy}>
          <Text style={styles.buttonText}>Send Email Link</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={onCompleteEmailLink} disabled={busy}>
          <Text style={styles.buttonSecondaryText}>I opened the link, continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
    paddingHorizontal: 16,
    justifyContent: "center",
    gap: 16
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    color: "#374151"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  button: {
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600"
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonSecondaryText: {
    color: "#1d4ed8",
    fontWeight: "600"
  }
});
