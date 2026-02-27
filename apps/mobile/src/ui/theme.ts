import { CandidateFirmStatus } from "@zenith/shared";

export const theme = {
  colors: {
    background: "#f5f5f5",
    card: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
    border: "#d1d5db",
    primary: "#111111",
    primarySoft: "#f3f4f6",
    success: "#1a9c5f",
    warning: "#b97800",
    danger: "#c53333",
    purple: "#5b5fc7"
  },
  radius: {
    lg: 16,
    md: 12,
    sm: 10,
    pill: 999
  },
  shadowCard: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  }
} as const;

export const statusColors: Record<CandidateFirmStatus, { background: string; text: string; border: string }> = {
  authorization_pending: {
    background: "#fff8e8",
    text: "#8a5b00",
    border: "#f3d79f"
  },
  waiting_for_submission: {
    background: "#fff9dc",
    text: "#8d6500",
    border: "#f0dd94"
  },
  submitted_waiting: {
    background: "#edf4ff",
    text: "#1f4b9a",
    border: "#bdd4ff"
  },
  interview: {
    background: "#eef8ef",
    text: "#1f7a45",
    border: "#b7e5c8"
  },
  canceled: {
    background: "#ffecec",
    text: "#b02525",
    border: "#f5b8b8"
  },
  rejected: {
    background: "#ffecec",
    text: "#b02525",
    border: "#f5b8b8"
  },
  offer: {
    background: "#f1ecff",
    text: "#4f3ca8",
    border: "#cfc3ff"
  }
};
