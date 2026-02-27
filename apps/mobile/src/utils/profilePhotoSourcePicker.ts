import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export type ProfilePhotoFile = {
  uri: string;
  mimeType: string;
  fileName: string;
};

function mapPickerAssetToPhoto(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  name?: string | null;
}): ProfilePhotoFile {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
    fileName: asset.fileName ?? asset.name ?? `profile-photo-${Date.now()}.jpg`
  };
}

async function pickFromCamera(): Promise<ProfilePhotoFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Camera permission needed", "Please allow camera access to take a profile photo.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  return mapPickerAssetToPhoto(result.assets[0]);
}

async function pickFromLibrary(): Promise<ProfilePhotoFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Photos permission needed", "Please allow photo library access to choose a profile photo.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  return mapPickerAssetToPhoto(result.assets[0]);
}

async function pickFromFiles(): Promise<ProfilePhotoFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: "image/*"
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }
  return mapPickerAssetToPhoto(result.assets[0]);
}

export function openProfilePhotoSourcePicker(
  onPhotoSelected: (photo: ProfilePhotoFile) => void | Promise<void>,
  onError: (error: Error) => void
) {
  const run = async (picker: () => Promise<ProfilePhotoFile | null>) => {
    try {
      const selected = await picker();
      if (!selected) {
        return;
      }
      await onPhotoSelected(selected);
    } catch (error: any) {
      onError(error as Error);
    }
  };

  Alert.alert(
    "Profile photo",
    "Choose a source.",
    [
      { text: "Take photo now", onPress: () => void run(pickFromCamera) },
      { text: "Choose from camera roll", onPress: () => void run(pickFromLibrary) },
      { text: "Files", onPress: () => void run(pickFromFiles) }
    ],
    { cancelable: true }
  );
}
