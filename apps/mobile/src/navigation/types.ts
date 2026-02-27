export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  CandidateApp: undefined;
  AdminApp: undefined;
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
  Profile: undefined;
};

export type MessageThreadParams = { candidateId?: string; title?: string } | undefined;

export type CandidateDashboardStackParamList = {
  DashboardHome: undefined;
};

export type CandidateChatStackParamList = {
  Messages: MessageThreadParams;
};

export type CandidateAppointmentsStackParamList = {
  AppointmentsHome: undefined;
};

export type CandidateProfileStackParamList = {
  ProfileHome: undefined;
};

export type AdminCandidatesStackParamList = {
  CandidatesList: undefined;
  CandidateDetail: { candidateId: string };
  RecruiterDetail: { recruiterId: string };
};

export type AdminChatStackParamList = {
  Inbox: undefined;
  NewConversation: undefined;
  Messages: MessageThreadParams;
};

export type AdminAppointmentsStackParamList = {
  AppointmentRequestsHome: undefined;
};

export type AdminProfileStackParamList = {
  AdminProfileHome: undefined;
};
