import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import { apiGetMyProfileUser, apiUpdateMyProfileUser } from "../../../api/userProfile";
import { appTheme } from "../../../theme/appTheme";

export default function UserSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri?: string; name?: string; type?: string; file?: File } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const profile = await apiGetMyProfileUser();
        setFirstName(profile.firstName ?? "");
        setLastName(profile.lastName ?? "");
        setEmail(profile.email ?? "");
        setPhoneNumber(profile.phoneNumber ?? "");
        const profileData = profile.UserProfile ?? null;
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
      await apiUpdateMyProfileUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
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

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Configuración</Text>
        </View>

        {loading ? <Text style={styles.info}>Cargando...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.avatarWrap} onPress={() => void pickAvatar()}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>U</Text></View>}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        <TextInput value={firstName} onChangeText={setFirstName} placeholder="Nombre" placeholderTextColor={appTheme.colors.textMuted} style={styles.input} />
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Apellido" placeholderTextColor={appTheme.colors.textMuted} style={styles.input} />
        <TextInput value={userName} onChangeText={setUserName} placeholder="Username" placeholderTextColor={appTheme.colors.textMuted} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={appTheme.colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        <TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Teléfono" placeholderTextColor={appTheme.colors.textMuted} keyboardType="phone-pad" style={styles.input} />
        <TextInput value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor={appTheme.colors.textMuted} style={[styles.input, styles.textArea]} multiline />
        <Pressable onPress={() => router.push("/terms" as any)}>
          <Text style={styles.termsLink}>Ver Términos y Condiciones</Text>
        </Pressable>

        <AppButton title={saving ? "Guardando..." : "Guardar cambios"} onPress={handleSave} loading={saving} disabled={saving} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  avatarWrap: {
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    marginVertical: 8,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  termsLink: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
});
