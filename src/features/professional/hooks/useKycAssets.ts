import { useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";

export type FileAsset = { uri: string; name: string; type: string };

// Hook reutilizable para los 5 archivos de KYC (documento, video de rostro,
// selfie derivado, matrícula, título) + sus selectores. Lo comparten los flujos
// de registro y de upgrade profesional para no duplicar la lógica de captura.
export function useKycAssets(onError: (msg: string) => void) {
  const [idDoc, setIdDoc] = useState<FileAsset | null>(null);
  const [kycVideo, setKycVideo] = useState<FileAsset | null>(null);
  const [kycSelfie, setKycSelfie] = useState<FileAsset | null>(null);
  const [matricula, setMatricula] = useState<FileAsset | null>(null);
  const [tituloProfesional, setTituloProfesional] = useState<FileAsset | null>(null);

  async function pickDocument(setter: (asset: FileAsset) => void, errorMsg: string, fallbackName: string) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setter({ uri: asset.uri, name: asset.name ?? fallbackName, type: asset.mimeType ?? "application/octet-stream" });
    } catch {
      onError(errorMsg);
    }
  }

  const handlePickIdDoc = () => pickDocument(setIdDoc, "No se pudo seleccionar el documento.", "id-doc");
  const handlePickMatricula = () => pickDocument(setMatricula, "No se pudo seleccionar la matrícula.", "matricula");
  const handlePickTitulo = () => pickDocument(setTituloProfesional, "No se pudo seleccionar el título.", "titulo");

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

      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 500 });
        setKycSelfie({ uri: thumb.uri, name: "kyc_selfie.jpg", type: "image/jpeg" });
      } catch {
        // Sin thumbnail: la comparación facial se SALTA en el backend.
      }

      Alert.alert("Video grabado", "Video de rostro registrado correctamente.");
    } catch {
      onError("No se pudo grabar el video.");
    }
  }

  return {
    idDoc,
    kycVideo,
    kycSelfie,
    matricula,
    tituloProfesional,
    handlePickIdDoc,
    handlePickMatricula,
    handlePickTitulo,
    handleRecordFaceVideo,
  };
}
