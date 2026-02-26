import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAuth } from "../state/AuthContext";
import { theme } from "../ui/theme";

const LOGO = require("../../assets/zenith-legal-logo.png");

export function AuthScreen() {
  const { signupWithEmailPassword, loginWithEmailPassword } = useAuth();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onEmailPassword = async () => {
    try {
      setBusy(true);
      if (!email.trim() || !password.trim()) {
        Alert.alert("Missing fields", "Email and password are required.");
        return;
      }

      if (mode === "signup") {
        await signupWithEmailPassword(email, password);
      } else {
        await loginWithEmailPassword(email, password);
      }
    } catch (error: any) {
      Alert.alert("Authentication failed", error?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.heroWrap}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Zenith Legal</Text>
        <Text style={styles.subtitle}>A HIGHER LEVEL OF LEGAL SEARCH</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, mode === "signup" && styles.modeButtonActive]}
            onPress={() => setMode("signup")}
          >
            <Text style={[styles.modeText, mode === "signup" && styles.modeTextActive]}>Sign Up</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === "login" && styles.modeButtonActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.modeText, mode === "login" && styles.modeTextActive]}>Log In</Text>
          </Pressable>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#7f8b9d"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#7f8b9d"
        />
        <Pressable style={styles.button} onPress={onEmailPassword} disabled={busy}>
          <Text style={styles.buttonText}>
            {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 18,
    justifyContent: "center",
    gap: 16
  },
  heroWrap: {
    alignItems: "center",
    gap: 6
  },
  logo: {
    width: 108,
    height: 108
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.4
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 12,
    ...theme.shadowCard
  },
  modeRow: {
    flexDirection: "row",
    gap: 8
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff"
  },
  modeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft
  },
  modeText: {
    color: theme.colors.textSecondary,
    fontWeight: "700"
  },
  modeTextActive: {
    color: theme.colors.primary
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: "#fff"
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  }
});
