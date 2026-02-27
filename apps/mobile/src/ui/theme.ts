import { CandidateFirmStatus } from "@zenith/shared";

export const theme = {
  colors: {
    background: "#f4f6fb",
    card: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
    border: "#d4dce8",
    primary: "#0a66ff",
    primarySoft: "#e7f0ff",
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
    shadowColor: "#0b1220",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2
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
    background: "#ecfaef",
    text: "#1f7a45",
    border: "#b8e8c1"
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
