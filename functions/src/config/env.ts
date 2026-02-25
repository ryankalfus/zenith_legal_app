const defaultZenithAdminEmail = "mason@zenithlegal.com";
const defaultSignupAlertTo = "mason@zenithlegal.com";
const defaultSignupAlertFrom = "onboarding@resend.dev";

export function getSuperAdminAllowlist(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getZenithAdminEmail() {
  return (process.env.ZENITH_ADMIN_EMAIL ?? defaultZenithAdminEmail).trim().toLowerCase();
}

export function getSignupAlertConfig() {
  return {
    apiKey: (process.env.RESEND_API_KEY ?? "").trim(),
    to: (process.env.SIGNUP_ALERT_TO ?? defaultSignupAlertTo).trim(),
    from: (process.env.SIGNUP_ALERT_FROM ?? defaultSignupAlertFrom).trim()
  };
}
