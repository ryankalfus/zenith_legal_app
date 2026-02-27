function asDate(input: string | Date) {
  const value = input instanceof Date ? input : new Date(input);
  return Number.isNaN(value.getTime()) ? null : value;
}

function formatDateTime(input: string | Date) {
  const value = asDate(input);
  if (!value) {
    return "an unknown date/time";
  }
  const dateText = value.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
  const timeText = value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  return `${dateText} at ${timeText}`;
}

function noteSuffix(notes?: string) {
  const trimmed = String(notes ?? "").trim();
  return trimmed ? ` Note: ${trimmed}` : "";
}

function recruiterSuffix(recruiterName?: string) {
  const trimmed = String(recruiterName ?? "").trim();
  return trimmed ? ` Recruiter: ${trimmed}.` : "";
}

export function formatCandidateAppointmentRequestChat(input: {
  candidateName: string;
  startsAt: string;
  recruiterName?: string;
  notes?: string;
}) {
  const candidateName = String(input.candidateName ?? "").trim() || "Candidate";
  return `${candidateName} has requested an appointment on ${formatDateTime(input.startsAt)}.${recruiterSuffix(input.recruiterName)}${noteSuffix(input.notes)}`;
}

export function formatCandidateAppointmentCanceledChat(input: {
  candidateName: string;
  startsAt: string;
  recruiterName?: string;
  notes?: string;
}) {
  const candidateName = String(input.candidateName ?? "").trim() || "Candidate";
  return `${candidateName} has canceled the appointment scheduled for ${formatDateTime(input.startsAt)}.${recruiterSuffix(input.recruiterName)}${noteSuffix(input.notes)}`;
}

export function formatAdminAppointmentDecisionChat(input: {
  action: "accepted" | "declined";
  startsAt: string;
  recruiterName?: string;
  notes?: string;
}) {
  const actionText = input.action === "accepted" ? "accepted" : "declined";
  return `Zenith Legal has ${actionText} your appointment request for ${formatDateTime(input.startsAt)}.${recruiterSuffix(input.recruiterName)}${noteSuffix(input.notes)}`;
}

export function formatAdminAppointmentCreatedChat(input: {
  startsAt: string;
  recruiterName?: string;
  notes?: string;
}) {
  return `Zenith Legal scheduled a new appointment for ${formatDateTime(input.startsAt)}.${recruiterSuffix(input.recruiterName)}${noteSuffix(input.notes)}`;
}

export function formatAdminAppointmentModifiedChat(input: {
  previousStartsAt: string;
  nextStartsAt: string;
  previousRecruiterName?: string;
  nextRecruiterName?: string;
  notes?: string;
}) {
  const previousRecruiter = String(input.previousRecruiterName ?? "").trim();
  const nextRecruiter = String(input.nextRecruiterName ?? "").trim();
  const recruiterChanged =
    Boolean(previousRecruiter || nextRecruiter) && previousRecruiter.toLowerCase() !== nextRecruiter.toLowerCase();

  const scheduleText =
    input.previousStartsAt === input.nextStartsAt
      ? `Your appointment details were updated for ${formatDateTime(input.nextStartsAt)}.`
      : `Your appointment has been updated from ${formatDateTime(input.previousStartsAt)} to ${formatDateTime(input.nextStartsAt)}.`;
  const recruiterText = recruiterChanged
    ? ` Recruiter changed from ${previousRecruiter || "Not set"} to ${nextRecruiter || "Not set"}.`
    : recruiterSuffix(nextRecruiter);

  return `${scheduleText}${recruiterText}${noteSuffix(input.notes)}`;
}

export function formatAdminAppointmentCanceledChat(input: {
  startsAt: string;
  recruiterName?: string;
  notes?: string;
}) {
  return `Zenith Legal has canceled your appointment scheduled for ${formatDateTime(input.startsAt)}.${recruiterSuffix(input.recruiterName)}${noteSuffix(input.notes)}`;
}
