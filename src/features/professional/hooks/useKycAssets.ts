import { useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { VerificationDocType } from "../types";

export type FileAsset = { uri: string; name: string; type: string };

// Hook reutilizable para el KYC: un VIDEO de rostro (obligatorio) + UN documento a
// elegir (CI / TITULO / MATRICULA). El tipo elegido define si podrá cobrar
// (TITULO/MATRICULA) o solo ofrecer sesiones gratuitas (CI). Lo comparten los
// flujos de registro y de upgrade profesional.
export function useKycAssets(onError: (msg: string) => void) {
  const [kycVideo, setKycVideo] = useState<FileAsset | null>(null);
  const [verificationDocType, setVerificationDocType] = useState<VerificationDocType | null>(null);
  const [verificationDoc, setVerificationDoc] = useState<FileAsset | null>(null);

  async function handleRecordFaceVideo() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara para grabar el video.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "videos",
        videoMaxDuration: 10,
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      setKycVideo({ uri: asset.uri, name: "kyc_video.mp4", type: "video/mp4" });
      Alert.alert("Video grabado", "Video de rostro registrado correctamente.");
    } catch {
      onError("No se pudo grabar el video.");
    }
  }

  async function handlePickVerificationDoc() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setVerificationDoc({
        uri: asset.uri,
        name: asset.name ?? "documento",
        type: asset.mimeType ?? "application/octet-stream",
      });
    } catch {
      onError("No se pudo seleccionar el documento.");
    }
  }

  return {
    kycVideo,
    handleRecordFaceVideo,
    verificationDocType,
    setVerificationDocType,
    verificationDoc,
    handlePickVerificationDoc,
  };
}
