import React from "react";
import { Pressable, StyleSheet, Text, View, Linking, Alert } from "react-native";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const masonPhone = process.env.EXPO_PUBLIC_MASON_PHONE ?? extra.masonPhone ?? "+15551234567";
const masonEmail = process.env.EXPO_PUBLIC_MASON_EMAIL ?? extra.masonEmail ?? "mason@zenithlegal.com";

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Not available", "This action is not supported on this device.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Zenith Legal</Text>
        <Text style={styles.subtitle}>Candidate Portal</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Mason Kalfus</Text>
        <Pressable style={styles.cta} onPress={() => openUrl(`tel:${masonPhone}`)}>
          <Text style={styles.ctaText}>Tap to Call: {masonPhone}</Text>
        </Pressable>
        <Pressable style={styles.ctaSecondary} onPress={() => openUrl(`mailto:${masonEmail}`)}>
          <Text style={styles.ctaSecondaryText}>Tap to Email: {masonEmail}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Chat")}>
        <Text style={styles.primaryButtonText}>Message Zenith</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
    padding: 16,
    gap: 16
  },
  hero: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#111111"
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    color: "#d1d5db",
    marginTop: 4
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  label: {
    fontWeight: "700",
    fontSize: 18
  },
  cta: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12
  },
  ctaText: {
    color: "#111111",
    fontWeight: "600"
  },
  ctaSecondary: {
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12
  },
  ctaSecondaryText: {
    color: "#111111",
    fontWeight: "600"
  },
  primaryButton: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700"
  }
});
