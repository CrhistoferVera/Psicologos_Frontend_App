import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { apiGetMyProfileUser, apiUpdateMyProfileUser } from "../../../api/userProfile";

type AvatarFile = { uri?: string; name?: string; type?: string; file?: File };

export function useUserSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<AvatarFile | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const profile = await apiGetMyProfileUser();
        setFirstName(profile.firstName ?? "");
        setLastName(profile.lastName ?? "");
        setEmail(profile.email ?? "");
        const profileData = profile.UserProfile ?? profile.userProfile ?? null;
        setUserName(profileData?.userName ?? "");
        setBio(profileData?.bio ?? "");
        setAvatarUrl(profileData?.avatarUrl ?? null);
      } catch {
        setError("No se pudo cargar tu configuración.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function pickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset: any = result.assets[0];
      setAvatarUrl(asset.uri);
      setAvatarFile({
        uri: asset.uri,
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
        file: asset.file,
      });
    } catch {
      Alert.alert("No se pudo seleccionar la imagen.");
    }
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      // email es el identificador de Google: no se envía para que no pueda cambiarse.
      await apiUpdateMyProfileUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userName: userName.trim(),
        bio: bio.trim(),
        avatar: avatarFile ?? undefined,
      });
      Alert.alert("Perfil actualizado", "Tus cambios se guardaron correctamente.");
      router.back();
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      setError(Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo guardar tu perfil.");
    } finally {
      setSaving(false);
    }
  }

  const initials =
    `${firstName.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase() || "U";

  return {
    router,
    loading,
    saving,
    error,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    userName,
    setUserName,
    bio,
    setBio,
    email,
    avatarUrl,
    initials,
    pickAvatar,
    handleSave,
  };
}
