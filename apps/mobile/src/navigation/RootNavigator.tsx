import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../state/AuthContext";
import { AuthScreen } from "../screens/AuthScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { AdminInboxScreen } from "../screens/AdminInboxScreen";
import { CandidateDashboardScreen } from "../screens/candidate/CandidateDashboardScreen";
import { CandidateAppointmentsScreen } from "../screens/candidate/CandidateAppointmentsScreen";
import { CandidateProfileScreen } from "../screens/candidate/CandidateProfileScreen";
import { AdminCandidatesScreen } from "../screens/admin/AdminCandidatesScreen";
import { AdminCandidateDetailScreen } from "../screens/admin/AdminCandidateDetailScreen";
import { AdminAppointmentRequestsScreen } from "../screens/admin/AdminAppointmentRequestsScreen";
import { AdminNewConversationScreen } from "../screens/admin/AdminNewConversationScreen";
import { AdminRecruiterDetailScreen } from "../screens/admin/AdminRecruiterDetailScreen";
import { AdminProfileScreen } from "../screens/admin/AdminProfileScreen";
import {
  AdminAppointmentsStackParamList,
  AdminCandidatesStackParamList,
  AdminChatStackParamList,
  AdminProfileStackParamList,
  AdminTabParamList,
  CandidateAppointmentsStackParamList,
  CandidateChatStackParamList,
  CandidateDashboardStackParamList,
  CandidateProfileStackParamList,
  CandidateTabParamList,
  RootStackParamList
} from "./types";
import { theme } from "../ui/theme";
import {
  watchAdminUnreadChatsCount,
  watchCandidateUnreadMessageCount
} from "../services/messagingService";
import { watchAdminUnattendedRequestCount } from "../services/appointmentService";
import { watchUser } from "../services/userService";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const CandidateTabs = createBottomTabNavigator<CandidateTabParamList>();
const AdminTabsNavigator = createBottomTabNavigator<AdminTabParamList>();
const CandidateDashboardStack = createNativeStackNavigator<CandidateDashboardStackParamList>();
const CandidateChatStack = createNativeStackNavigator<CandidateChatStackParamList>();
const CandidateAppointmentsStack = createNativeStackNavigator<CandidateAppointmentsStackParamList>();
const CandidateProfileStack = createNativeStackNavigator<CandidateProfileStackParamList>();
const AdminCandidatesStack = createNativeStackNavigator<AdminCandidatesStackParamList>();
const AdminChatStack = createNativeStackNavigator<AdminChatStackParamList>();
const AdminAppointmentsStack = createNativeStackNavigator<AdminAppointmentsStackParamList>();
const AdminProfileStack = createNativeStackNavigator<AdminProfileStackParamList>();

function CandidateDashboardStackScreen() {
  return (
    <CandidateDashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <CandidateDashboardStack.Screen name="DashboardHome" component={CandidateDashboardScreen} />
    </CandidateDashboardStack.Navigator>
  );
}

function CandidateChatStackScreen() {
  return (
    <CandidateChatStack.Navigator screenOptions={{ headerShown: false }}>
      <CandidateChatStack.Screen name="Messages" component={MessagesScreen} />
    </CandidateChatStack.Navigator>
  );
}

function CandidateAppointmentsStackScreen() {
  return (
    <CandidateAppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
      <CandidateAppointmentsStack.Screen name="AppointmentsHome" component={CandidateAppointmentsScreen} />
    </CandidateAppointmentsStack.Navigator>
  );
}

function CandidateProfileStackScreen() {
  return (
    <CandidateProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <CandidateProfileStack.Screen name="ProfileHome" component={CandidateProfileScreen} />
    </CandidateProfileStack.Navigator>
  );
}

function AdminCandidatesStackScreen() {
  return (
    <AdminCandidatesStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminCandidatesStack.Screen name="CandidatesList" component={AdminCandidatesScreen} />
      <AdminCandidatesStack.Screen name="CandidateDetail" component={AdminCandidateDetailScreen} />
      <AdminCandidatesStack.Screen name="RecruiterDetail" component={AdminRecruiterDetailScreen} />
    </AdminCandidatesStack.Navigator>
  );
}

function AdminChatStackScreen() {
  return (
    <AdminChatStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminChatStack.Screen name="Inbox" component={AdminInboxScreen} />
      <AdminChatStack.Screen name="NewConversation" component={AdminNewConversationScreen} />
      <AdminChatStack.Screen name="Messages" component={MessagesScreen} />
    </AdminChatStack.Navigator>
  );
}

function AdminAppointmentsStackScreen() {
  return (
    <AdminAppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminAppointmentsStack.Screen name="AppointmentRequestsHome" component={AdminAppointmentRequestsScreen} />
    </AdminAppointmentsStack.Navigator>
  );
}

function AdminProfileStackScreen() {
  return (
    <AdminProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminProfileStack.Screen name="AdminProfileHome" component={AdminProfileScreen} />
    </AdminProfileStack.Navigator>
  );
}

const tabBarBaseStyle = {
  borderTopColor: theme.colors.border,
  backgroundColor: "#fff",
  height: 66,
  paddingBottom: 10,
  paddingTop: 8
} as const;

const tabBaseOptions = {
  headerShown: false,
  tabBarShowLabel: false,
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: "#7b8496",
  tabBarStyle: tabBarBaseStyle
} as const;

function TabIconWithBadge({
  name,
  color,
  size,
  badgeCount,
  showDot
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  size: number;
  badgeCount?: number;
  showDot?: boolean;
}) {
  const showBadge = Number(badgeCount ?? 0) > 0;
  const text = Number(badgeCount ?? 0) > 9 ? "9+" : String(badgeCount);

  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={size + 2} color={color} />
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{text}</Text>
        </View>
      ) : null}
      {!showBadge && showDot ? <View style={styles.dot} /> : null}
    </View>
  );
}

function CandidateTabsScreen() {
  const { session } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [appointmentUpdates, setAppointmentUpdates] = useState(false);

  useEffect(() => {
    if (!session?.user.uid || session.role !== "candidate") {
      setChatUnreadCount(0);
      setAppointmentUpdates(false);
      return;
    }

    const unsubUnread = watchCandidateUnreadMessageCount(
      session.user.uid,
      (count) => setChatUnreadCount(count),
      () => setChatUnreadCount(0)
    );

    const unsubUser = watchUser(
      session.user.uid,
      (data) => setAppointmentUpdates(Boolean(data?.hasAppointmentUpdates)),
      () => setAppointmentUpdates(false)
    );

    return () => {
      unsubUnread();
      unsubUser();
    };
  }, [session?.role, session?.user.uid]);

  return (
    <CandidateTabs.Navigator screenOptions={tabBaseOptions}>
      <CandidateTabs.Screen
        name="Dashboard"
        component={CandidateDashboardStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIconWithBadge name="home-outline" color={color} size={size} />
        }}
      />
      <CandidateTabs.Screen
        name="Chat"
        component={CandidateChatStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              name="chatbubble-ellipses-outline"
              color={color}
              size={size}
              badgeCount={chatUnreadCount}
            />
          )
        }}
      />
      <CandidateTabs.Screen
        name="Appointments"
        component={CandidateAppointmentsStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge name="calendar-outline" color={color} size={size} showDot={appointmentUpdates} />
          )
        }}
      />
      <CandidateTabs.Screen
        name="Profile"
        component={CandidateProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIconWithBadge name="person-outline" color={color} size={size} />
        }}
      />
    </CandidateTabs.Navigator>
  );
}

function AdminTabs() {
  const { session } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [unattendedCount, setUnattendedCount] = useState(0);

  useEffect(() => {
    if (session?.role !== "admin") {
      setChatUnreadCount(0);
      setUnattendedCount(0);
      return;
    }

    const unsubChats = watchAdminUnreadChatsCount(
      (count) => setChatUnreadCount(count),
      () => setChatUnreadCount(0)
    );

    const unsubRequests = watchAdminUnattendedRequestCount(
      (count) => setUnattendedCount(count),
      () => setUnattendedCount(0)
    );

    return () => {
      unsubChats();
      unsubRequests();
    };
  }, [session?.role]);

  return (
    <AdminTabsNavigator.Navigator screenOptions={tabBaseOptions}>
      <AdminTabsNavigator.Screen
        name="Candidates"
        component={AdminCandidatesStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIconWithBadge name="people-outline" color={color} size={size} />
        }}
      />
      <AdminTabsNavigator.Screen
        name="Chat"
        component={AdminChatStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge name="chatbubbles-outline" color={color} size={size} badgeCount={chatUnreadCount} />
          )
        }}
      />
      <AdminTabsNavigator.Screen
        name="AppointmentRequests"
        component={AdminAppointmentsStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge name="time-outline" color={color} size={size} badgeCount={unattendedCount} />
          )
        }}
      />
      <AdminTabsNavigator.Screen
        name="Profile"
        component={AdminProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIconWithBadge name="person-circle-outline" color={color} size={size} />
        }}
      />
    </AdminTabsNavigator.Navigator>
  );
}

export function RootNavigator() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <RootStack.Navigator>
      {!session ? (
        <RootStack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      ) : session.role === "admin" ? (
        <RootStack.Screen name="AdminApp" component={AdminTabs} options={{ headerShown: false }} />
      ) : !session.profileComplete ? (
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: false }} />
      ) : (
        <RootStack.Screen name="CandidateApp" component={CandidateTabsScreen} options={{ headerShown: false }} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 28,
    height: 28
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#d32121",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800"
  },
  dot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d32121"
  }
});
