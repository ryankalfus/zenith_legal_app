import Constants from "expo-constants";
import { Alert, Linking } from "react-native";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const _unused = extra; // Keep constants loaded for Expo env compatibility checks.

export const ZENITH_EMAIL = "mason@zenithlegal.com";
export const ZENITH_PHONE = "+1 202-486-3535";

export function normalizeAssignedEmail(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  return raw.replace(/^mailto:/i, "").trim();
}

export function normalizeAssignedPhone(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  return raw.replace(/^tel:/i, "").trim();
}

export function buildEmailHref(email?: string) {
  const value = normalizeAssignedEmail(email) || ZENITH_EMAIL;
  return `mailto:${value}`;
}

export function buildPhoneHref(phone?: string) {
  const display = normalizeAssignedPhone(phone) || ZENITH_PHONE;
  const digitsOnly = display.replace(/[^\d]/g, "");
  const withPlus = display.startsWith("+");
  const normalized = digitsOnly ? (withPlus ? `+${digitsOnly}` : digitsOnly) : ZENITH_PHONE.replace(/[^\d+]/g, "");
  return `tel:${normalized}`;
}

export async function openExternalUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("Not available", "This action is not supported on this device.");
    return;
  }
  await Linking.openURL(url);
}
