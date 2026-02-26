export type UserRole = "candidate" | "admin";

export type CandidateFirmStatus =
  | "authorization_pending"
  | "submitted_waiting"
  | "interview"
  | "rejected"
  | "offer";

export type AuthorizationState = "pending" | "approved" | "declined";

export type AppointmentStatus = "requested" | "scheduled" | "canceled" | "completed";

export type MessageSenderRole = "candidate" | "admin" | "system";
export type CandidateStatusRequestType = "authorization" | "cancellation";
export type CandidateStatusRequestState = "pending" | "resolved";

export interface UserPreferences {
  preferredCities: string[];
  practiceArea: string;
}

export interface UserProfile {
  uid: string;
  role: UserRole;
  fullName: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: UserPreferences;
  pushTokens: string[];
  signupSummarySentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Firm {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateFirmStatusRecord {
  id: string;
  candidateId: string;
  firmId: string;
  status: CandidateFirmStatus;
  updatedBy: string;
  updatedAt: string;
  history: {
    status: CandidateFirmStatus;
    updatedBy: string;
    updatedAt: string;
    note?: string;
  }[];
}

export interface Conversation {
  candidateId: string;
  participantIds: string[];
  lastMessageText?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  downloadUrl: string;
}

export interface Message {
  id: string;
  candidateId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  text: string;
  attachments: MessageAttachment[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  candidateId: string;
  createdBy: string;
  createdByRole: UserRole;
  status: AppointmentStatus;
  title: string;
  startsAt: string;
  endsAt: string;
  phoneNumber: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  reminderMinutesBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateStatusRequest {
  id: string;
  candidateId: string;
  firmId: string;
  requestType: CandidateStatusRequestType;
  state: CandidateStatusRequestState;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AuthorizationRequest {
  id: string;
  candidateId: string;
  firmId: string;
  state: AuthorizationState;
  requestedBy: string;
  requestedAt: string;
  respondedAt?: string;
}

export interface DeletionRequest {
  id: string;
  candidateId: string;
  requestedAt: string;
  requestedBy: string;
  status: "requested" | "processing" | "completed" | "failed";
  completedAt?: string;
  errorMessage?: string;
}
