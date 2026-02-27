import React, { useEffect, useState } from "react";
import { Image, ImageStyle, Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  buildEmailHref,
  buildPhoneHref,
  normalizeAssignedEmail,
  normalizeAssignedPhone,
  openExternalUrl,
  ZENITH_EMAIL,
  ZENITH_PHONE
} from "../lib/zenithContact";
import { theme } from "../ui/theme";
import { useAuth } from "../state/AuthContext";
import { watchUser } from "../services/userService";
import { watchConversationHeaderOverride } from "../services/messagingService";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  showCandidateContactBar?: boolean;
  showZenithContactBar?: boolean;
  showTopRightLogo?: boolean;
  topRightLogoStyle?: StyleProp<ImageStyle>;
  headingWrapStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export const CONTACT_BAR_CONTENT_HEIGHT = 44;
const ZENITH_LOGO = require("../../assets/zenith-legal-logo.png");

export function AppShell({
  children,
  title,
  subtitle,
  headerRight,
  showCandidateContactBar,
  showZenithContactBar,
  showTopRightLogo = true,
  topRightLogoStyle,
  headingWrapStyle,
  scroll = false
}: AppShellProps) {
  const shouldShowContactBar = showZenithContactBar ?? showCandidateContactBar ?? true;
  const content = (
    <View style={styles.contentArea}>
      {showTopRightLogo ? (
        <Image source={ZENITH_LOGO} style={[styles.topRightLogo, topRightLogoStyle]} resizeMode="contain" />
      ) : null}
      {title ? (
        <View style={[styles.headingWrap, headingWrapStyle]}>
          <View style={styles.headingRow}>
            <Text style={styles.title}>{title}</Text>
            {headerRight ? <View style={styles.headingRight}>{headerRight}</View> : null}
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      {shouldShowContactBar ? <CandidateContactBar /> : null}
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function CandidateContactBar() {
  const { session } = useAuth();
  const [profileAssignedEmail, setProfileAssignedEmail] = useState("");
  const [profileAssignedPhone, setProfileAssignedPhone] = useState("");
  const [conversationAssignedEmail, setConversationAssignedEmail] = useState("");
  const [conversationAssignedPhone, setConversationAssignedPhone] = useState("");

  useEffect(() => {
    if (session?.role !== "candidate" || !session?.user.uid) {
      setProfileAssignedEmail("");
      setProfileAssignedPhone("");
      return;
    }

    return watchUser(
      session.user.uid,
      (data) => {
        const email = normalizeAssignedEmail(data?.assignedHeaderEmail);
        const phone = normalizeAssignedPhone(data?.assignedHeaderPhone);
        setProfileAssignedEmail(email);
        setProfileAssignedPhone(phone);
      },
      () => {
        setProfileAssignedEmail("");
        setProfileAssignedPhone("");
      }
    );
  }, [session?.role, session?.user.uid]);

  useEffect(() => {
    if (session?.role !== "candidate" || !session?.user.uid) {
      setConversationAssignedEmail("");
      setConversationAssignedPhone("");
      return;
    }

    return watchConversationHeaderOverride(
      session.user.uid,
      (data) => {
        const email = normalizeAssignedEmail(data.assignedHeaderEmail);
        const phone = normalizeAssignedPhone(data.assignedHeaderPhone);
        setConversationAssignedEmail(email);
        setConversationAssignedPhone(phone);
      },
      () => {
        setConversationAssignedEmail("");
        setConversationAssignedPhone("");
      }
    );
  }, [session?.role, session?.user.uid]);

  const resolvedEmail = profileAssignedEmail || conversationAssignedEmail || ZENITH_EMAIL;
  const resolvedPhone = profileAssignedPhone || conversationAssignedPhone || ZENITH_PHONE;

  return (
    <View style={styles.contactBar}>
      <Pressable onPress={() => openExternalUrl(buildEmailHref(resolvedEmail))}>
        <Text style={styles.contactText}>{resolvedEmail}</Text>
      </Pressable>
      <Pressable onPress={() => openExternalUrl(buildPhoneHref(resolvedPhone))}>
        <Text style={styles.contactText}>{resolvedPhone}</Text>
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
    gap: 10,
    position: "relative"
  },
  headingWrap: {
    gap: 3,
    marginTop: 4,
    marginBottom: 2
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  headingRight: {
    alignItems: "flex-end",
    justifyContent: "center"
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
    minHeight: CONTACT_BAR_CONTENT_HEIGHT,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: "#fff"
  },
  contactText: {
    color: "#111",
    fontWeight: "700",
    textDecorationLine: "underline",
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
  },
  topRightLogo: {
    position: "absolute",
    right: 8,
    top: -6,
    width: 90,
    height: 90
  }
});
