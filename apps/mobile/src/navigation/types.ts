export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  AdminTabs: undefined;
  Messages: { candidateId?: string } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Status: undefined;
  Calendar: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminInbox: undefined;
};
