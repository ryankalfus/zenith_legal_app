import { z } from "zod";
import {
  CANDIDATE_VISIBLE_STATUSES,
  PRACTICE_AREAS,
  PREFERRED_CITIES
} from "../constants/options";

export const userRoleSchema = z.enum(["candidate", "admin"]);
export const candidateFirmStatusSchema = z.enum(CANDIDATE_VISIBLE_STATUSES);
export const authorizationStateSchema = z.enum(["pending", "approved", "declined"]);
export const appointmentStatusSchema = z.enum(["requested", "scheduled", "canceled", "completed"]);
export const appointmentRecruiterIdSchema = z.string().min(1);
export const candidateStatusRequestTypeSchema = z.enum(["authorization", "cancellation"]);
export const candidateStatusRequestStateSchema = z.enum(["pending", "resolved"]);

export const userPreferencesSchema = z.object({
  preferredCities: z.array(z.enum(PREFERRED_CITIES)).default([]),
  practiceArea: z.enum(PRACTICE_AREAS)
});

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  role: userRoleSchema,
  fullName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(7),
  jdDegreeDate: z.string().optional(),
  assignedHeaderEmail: z.string().email().optional(),
  assignedHeaderPhone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  avatarPath: z.string().min(1).optional(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  preferences: userPreferencesSchema,
  pushTokens: z.array(z.string()).default([]),
  hasAppointmentUpdates: z.boolean().optional(),
  signupSummarySentAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const firmSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const candidateFirmStatusRecordSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().min(1),
  firmId: z.string().min(1),
  status: candidateFirmStatusSchema,
  updatedBy: z.string().min(1),
  updatedAt: z.string(),
  history: z.array(
    z.object({
      status: candidateFirmStatusSchema,
      updatedBy: z.string().min(1),
      updatedAt: z.string(),
      note: z.string().optional()
    })
  )
});

export const authorizationRequestSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().min(1),
  firmId: z.string().min(1),
  state: authorizationStateSchema,
  requestedBy: z.string().min(1),
  requestedAt: z.string(),
  respondedAt: z.string().optional()
});

export const messageAttachmentSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  storagePath: z.string().min(1),
  downloadUrl: z.string().url()
});

export const messageSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().min(1),
  senderId: z.string().min(1),
  senderRole: z.enum(["candidate", "admin", "system"]),
  text: z.string(),
  attachments: z.array(messageAttachmentSchema).default([]),
  createdAt: z.string()
});

export const conversationSchema = z.object({
  candidateId: z.string().min(1),
  participantIds: z.array(z.string().min(1)),
  candidateNameSnapshot: z.string().optional(),
  candidateAvatarUrlSnapshot: z.string().optional(),
  lastMessageText: z.string().optional(),
  lastMessageAt: z.string().optional(),
  lastMessageSenderRole: z.enum(["candidate", "admin", "system"]).optional(),
  unreadByAdminCount: z.number().int().nonnegative().optional(),
  unreadByCandidateCount: z.number().int().nonnegative().optional(),
  adminLastReadAt: z.string().optional(),
  candidateLastReadAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const appointmentSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().min(1),
  createdBy: z.string().min(1),
  createdByRole: userRoleSchema,
  updatedBy: z.string().min(1).optional(),
  updatedByRole: z.enum(["candidate", "admin", "system"]).optional(),
  status: appointmentStatusSchema,
  title: z.string().min(1),
  startsAt: z.string(),
  endsAt: z.string(),
  phoneNumber: z.string().min(7),
  recruiterId: appointmentRecruiterIdSchema,
  recruiterName: z.string().min(1),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
  reminderMinutesBefore: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const candidateStatusRequestSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().min(1),
  firmId: z.string().min(1),
  requestType: candidateStatusRequestTypeSchema,
  state: candidateStatusRequestStateSchema,
  requestedAt: z.string(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.string().optional()
});

export const deletionRequestSchema = z.object({
  id: z.string().min(1),
  candidateId: z.string().min(1),
  requestedAt: z.string(),
  requestedBy: z.string().min(1),
  status: z.enum(["requested", "processing", "completed", "failed"]),
  completedAt: z.string().optional(),
  errorMessage: z.string().optional()
});
