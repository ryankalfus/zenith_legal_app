import type { CandidateFirmStatus } from "@zenith/shared";

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

export type CandidateFilterState = {
  assignedRecruiter: string; // "any" | "none" | recruiter uid/doc id
  statuses: CandidateFirmStatus[];
  practices: string[];
  firmIds: string[];
  preferredCities: string[];
};

export type CandidateFilterOptions = {
  recruiters: Array<{ id: string; label: string }>;
  statuses: Array<{ id: CandidateFirmStatus; label: string }>;
  practices: Array<{ id: string; label: string }>;
  firms: Array<{ id: string; label: string }>;
  preferredCities: Array<{ id: string; label: string }>;
};

export type AdminCandidatesStackParamList = {
  CandidatesList: { filters?: CandidateFilterState } | undefined;
  CandidateDetail: { candidateId: string };
  RecruiterDetail: { recruiterId: string };
  CandidateFilters: {
    filters: CandidateFilterState;
    options: CandidateFilterOptions;
  };
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
