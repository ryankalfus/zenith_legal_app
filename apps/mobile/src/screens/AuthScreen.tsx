import React, { useEffect, useState } from "react";
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
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "../state/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export function AuthScreen() {
  const { signupWithEmailPassword, loginWithEmailPassword, loginWithGoogleIdToken } = useAuth();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.googleWebClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.googleIosClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? extra.googleAndroidClientId
  });

  useEffect(() => {
    const runGoogle = async () => {
      if (response?.type !== "success") {
        return;
      }

      const idToken = response.authentication?.idToken ?? response.params?.id_token;
      if (!idToken) {
        Alert.alert("Google sign-in failed", "No ID token returned by Google.");
        return;
      }

      try {
        setGoogleBusy(true);
        await loginWithGoogleIdToken(idToken);
      } catch (error: any) {
        Alert.alert("Google sign-in failed", error?.message ?? "Try again.");
      } finally {
        setGoogleBusy(false);
      }
    };

    runGoogle().catch(() => undefined);
  }, [response, loginWithGoogleIdToken]);

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

  const onGoogle = async () => {
    try {
      setGoogleBusy(true);
      await promptAsync();
    } catch (error: any) {
      Alert.alert("Google sign-in failed", error?.message ?? "Try again.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Text style={styles.title}>Zenith Legal</Text>
      <Text style={styles.subtitle}>One account flow for candidates and team.</Text>

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

        <Text style={styles.sectionTitle}>Email + Password</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholder="you@example.com"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="Password"
        />
        <Pressable style={styles.button} onPress={onEmailPassword} disabled={busy}>
          <Text style={styles.buttonText}>
            {busy ? "Please wait..." : mode === "signup" ? "Sign Up" : "Log In"}
          </Text>
        </Pressable>

        <Text style={styles.orText}>or</Text>

        <Pressable
          style={styles.buttonSecondary}
          onPress={onGoogle}
          disabled={googleBusy || !request}
        >
          <Text style={styles.buttonSecondaryText}>
            {googleBusy ? "Please wait..." : mode === "signup" ? "Sign Up with Google" : "Log In with Google"}
          </Text>
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
  modeRow: {
    flexDirection: "row",
    gap: 8
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  modeButtonActive: {
    borderColor: "#1d4ed8",
    backgroundColor: "#dbeafe"
  },
  modeText: {
    color: "#374151",
    fontWeight: "600"
  },
  modeTextActive: {
    color: "#1e40af"
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
  },
  orText: {
    textAlign: "center",
    color: "#6b7280"
  }
});
