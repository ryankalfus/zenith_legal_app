import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../state/AuthContext";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { StatusScreen } from "../screens/StatusScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { AdminInboxScreen } from "../screens/AdminInboxScreen";
import { AdminTabParamList, MainTabParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const AdminTabsNavigator = createBottomTabNavigator<AdminTabParamList>();

function MainTabs() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Status" component={StatusScreen} />
      <Tabs.Screen name="Calendar" component={CalendarScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function AdminTabs() {
  return (
    <AdminTabsNavigator.Navigator>
      <AdminTabsNavigator.Screen name="AdminInbox" component={AdminInboxScreen} options={{ title: "Inbox" }} />
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
          <RootStack.Screen name="Messages" component={MessagesScreen} />
        </>
      ) : !session.profileComplete ? (
        <RootStack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{ title: "Finish profile" }}
        />
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="Messages" component={MessagesScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}
