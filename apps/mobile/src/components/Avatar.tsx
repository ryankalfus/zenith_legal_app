import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../ui/theme";

type AvatarProps = {
  uri?: string;
  source?: ImageSourcePropType;
  name?: string;
  size?: number;
  showFallbackIcon?: boolean;
};

function buildInitials(name?: string) {
  const text = String(name ?? "").trim();
  if (!text) {
    return "";
  }
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

export function Avatar({ uri, source, name, size = 40, showFallbackIcon = true }: AvatarProps) {
  const initials = buildInitials(name);
  const radius = size / 2;
  const imageSource = source ?? (uri ? { uri } : undefined);

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#e9edf6" }}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
      {initials ? (
        <Text style={[styles.initials, { fontSize: Math.max(12, Math.floor(size * 0.34)) }]}>{initials}</Text>
      ) : showFallbackIcon ? (
        <Ionicons name="person" size={Math.floor(size * 0.52)} color="#7d8799" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9edf6",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  initials: {
    color: "#465268",
    fontWeight: "700"
  }
});
