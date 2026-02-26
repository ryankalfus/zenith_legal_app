import Constants from "expo-constants";
import { Alert, Linking } from "react-native";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const _unused = extra; // Keep constants loaded for Expo env compatibility checks.

export const ZENITH_EMAIL = "mason@zenithlegal.com";
export const ZENITH_PHONE = "+1 202-486-3535";

export async function openExternalUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert("Not available", "This action is not supported on this device.");
    return;
  }
  await Linking.openURL(url);
}
