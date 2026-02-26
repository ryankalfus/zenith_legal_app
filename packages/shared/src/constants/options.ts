export const PREFERRED_CITIES = [
  "DC",
  "NYC",
  "Boston",
  "Houston",
  "Dallas",
  "Chicago",
  "LA / Southern Cal",
  "SF / Northern Cal",
  "Miami",
  "Denver",
  "Philadelphia",
  "Seattle",
  "Other"
] as const;

export const PRACTICE_AREAS = [
  "Antitrust",
  "Regulatory / White Collar",
  "Labor & Employment",
  "General Litigation",
  "Corporate: M&A/PE",
  "Corporate: Finance",
  "Real Estate",
  "Tax & Benefits",
  "Other"
] as const;

export const CANDIDATE_VISIBLE_STATUSES = [
  "authorization_pending",
  "submitted_waiting",
  "interview",
  "rejected",
  "offer"
] as const;

export const CANDIDATE_STATUS_LABELS: Record<(typeof CANDIDATE_VISIBLE_STATUSES)[number], string> = {
  authorization_pending: "Waiting on your authorization to contact/submit",
  submitted_waiting: "Submitted, waiting to hear from firm",
  interview: "Interview Stage",
  rejected: "Rejected by firm",
  offer: "Offer received!"
};

export const APPOINTMENT_STATUS_LABELS = {
  requested: "Requested",
  scheduled: "Scheduled",
  canceled: "Canceled",
  completed: "Completed"
} as const;
