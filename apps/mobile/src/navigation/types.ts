export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  CandidateTabs: undefined;
  AdminTabs: undefined;
  Messages: { candidateId?: string; title?: string } | undefined;
  AdminCandidateDetail: { candidateId: string };
};

export type CandidateTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Appointments: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Candidates: undefined;
  Chat: undefined;
  AppointmentRequests: undefined;
};
