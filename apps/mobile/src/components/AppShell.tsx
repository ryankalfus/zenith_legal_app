import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { openExternalUrl, ZENITH_EMAIL, ZENITH_PHONE } from "../lib/zenithContact";
import { theme } from "../ui/theme";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showCandidateContactBar?: boolean;
  showZenithContactBar?: boolean;
  scroll?: boolean;
};

export function AppShell({
  children,
  title,
  subtitle,
  showCandidateContactBar,
  showZenithContactBar,
  scroll = false
}: AppShellProps) {
  const shouldShowContactBar = showZenithContactBar ?? showCandidateContactBar ?? true;
  const content = (
    <View style={styles.contentArea}>
      {title ? (
        <View style={styles.headingWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {shouldShowContactBar ? <CandidateContactBar /> : null}
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function CandidateContactBar() {
  return (
    <View style={styles.contactBar}>
      <Pressable onPress={() => openExternalUrl(`mailto:${ZENITH_EMAIL}`)}>
        <Text style={styles.contactText}>{ZENITH_EMAIL}</Text>
      </Pressable>
      <Pressable onPress={() => openExternalUrl(`tel:${ZENITH_PHONE}`)}>
        <Text style={styles.contactText}>{ZENITH_PHONE}</Text>
      </Pressable>
    </View>
  );
}

export function SurfaceCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function EmptyState({ message }: { message: string }) {
  return <Text style={styles.emptyText}>{message}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    paddingBottom: 24
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10
  },
  headingWrap: {
    gap: 3,
    marginTop: 4,
    marginBottom: 2
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14
  },
  contactBar: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: "#fff"
  },
  contactText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 12
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadowCard
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginTop: 22
  }
});
