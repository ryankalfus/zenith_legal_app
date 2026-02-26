import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
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
import { AdminTabParamList, CandidateTabParamList, RootStackParamList } from "./types";
import { theme } from "../ui/theme";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const CandidateTabs = createBottomTabNavigator<CandidateTabParamList>();
const AdminTabsNavigator = createBottomTabNavigator<AdminTabParamList>();

function CandidateTabsScreen() {
  return (
    <CandidateTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#7b8496",
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          backgroundColor: "#fff",
          height: 62,
          paddingBottom: 6,
          paddingTop: 6
        }
      }}
    >
      <CandidateTabs.Screen name="Dashboard" component={CandidateDashboardScreen} />
      <CandidateTabs.Screen name="Chat" component={MessagesScreen} />
      <CandidateTabs.Screen name="Appointments" component={CandidateAppointmentsScreen} />
      <CandidateTabs.Screen name="Profile" component={CandidateProfileScreen} />
    </CandidateTabs.Navigator>
  );
}

function AdminTabs() {
  return (
    <AdminTabsNavigator.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#7b8496",
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          backgroundColor: "#fff",
          height: 62,
          paddingBottom: 6,
          paddingTop: 6
        }
      }}
    >
      <AdminTabsNavigator.Screen name="Candidates" component={AdminCandidatesScreen} />
      <AdminTabsNavigator.Screen name="Chat" component={AdminInboxScreen} />
      <AdminTabsNavigator.Screen name="AppointmentRequests" component={AdminAppointmentRequestsScreen} options={{ title: "Appointments" }} />
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
        <>
          <RootStack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="Messages" component={MessagesScreen} options={{ title: "Chat" }} />
          <RootStack.Screen
            name="AdminCandidateDetail"
            component={AdminCandidateDetailScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : !session.profileComplete ? (
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: "Finish profile" }} />
      ) : (
        <>
          <RootStack.Screen name="CandidateTabs" component={CandidateTabsScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="Messages" component={MessagesScreen} options={{ title: "Chat" }} />
        </>
      )}
    </RootStack.Navigator>
  );
}
