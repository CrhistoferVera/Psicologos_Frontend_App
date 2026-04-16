import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import {
  getMyProfessionalPrices,
  getMyProfessionalProfile,
  getProfessionalSpecialtiesCatalog,
  updateMyProfessionalProfile,
  upsertProfessionalPrices,
} from "../api/professionalApi";

export default function ProfessionalProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [chatPrice, setChatPrice] = useState("0");
  const [callPrice, setCallPrice] = useState("0");
  const [videoPrice, setVideoPrice] = useState("0");

  const [catalog, setCatalog] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; type: string } | undefined>(undefined);
  const [coverFile, setCoverFile] = useState<{ uri: string; name: string; type: string } | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [profile, prices, specialties] = await Promise.all([
          getMyProfessionalProfile(),
          getMyProfessionalPrices(),
          getProfessionalSpecialtiesCatalog(),
        ]);

        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setIsOnline(Boolean(profile.isOnline));
        setAvatarUrl(profile.avatarUrl ?? null);
        setCoverUrl(profile.coverUrl ?? null);

        setChatPrice(String(prices.chat ?? 0));
        setCallPrice(String(prices.call ?? 0));
        setVideoPrice(String(prices.video ?? 0));

        setCatalog(specialties.slice(0, 24));
      } catch {
        setError("No se pudo cargar el perfil profesional.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleSpecialty(tag: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  }

  async function pickImage(target: "avatar" | "cover") {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? `${target}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      };

      if (target === "avatar") {
        setAvatarFile(file);
        setAvatarUrl(asset.uri);
      } else {
        setCoverFile(file);
        setCoverUrl(asset.uri);
      }
    } catch {
      setError("No se pudo seleccionar la imagen.");
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      await updateMyProfessionalProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          isOnline,
        },
        avatarFile,
        coverFile,
      );

      await upsertProfessionalPrices({
        chat: Number(chatPrice || 0),
        call: Number(callPrice || 0),
        video: Number(videoPrice || 0),
      });

      // TODO(backend): add self-service endpoint to persist professional specialties.
      Alert.alert("Perfil actualizado", "Tus cambios se guardaron correctamente.");
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
        <Text style={styles.title}>Editar perfil profesional</Text>
        <Text style={styles.subtitle}>Configura tu informacion publica y tarifas de atencion.</Text>

        {loading ? <Text style={styles.info}>Cargando perfil...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.sectionTitle}>Imagenes de perfil</Text>
          <View style={styles.imageRow}>
            <Pressable style={styles.imageWrap} onPress={() => pickImage("avatar")}>
              <Image
                source={avatarUrl ? { uri: avatarUrl } : require("../../../../assets/no_image.jpg")}
                style={styles.avatar}
              />
              <Text style={styles.imageLabel}>Avatar</Text>
            </Pressable>
            <Pressable style={styles.imageWrap} onPress={() => pickImage("cover")}>
              <Image
                source={coverUrl ? { uri: coverUrl } : require("../../../../assets/no_image.jpg")}
                style={styles.cover}
              />
              <Text style={styles.imageLabel}>Portada</Text>
            </Pressable>
          </View>
        </AppCard>

        <View style={styles.form}>
          <AppInput label="Nombre" value={firstName} onChangeText={setFirstName} />
          <AppInput label="Apellido" value={lastName} onChangeText={setLastName} />
          <AppInput label="Username" value={username} onChangeText={setUsername} />
          <AppInput label="Bio profesional" value={bio} onChangeText={setBio} placeholder="Describe tu enfoque terapeutico" />
        </View>

        <AppCard>
          <View style={styles.onlineRow}>
            <View>
              <Text style={styles.sectionTitle}>Disponibilidad</Text>
              <Text style={styles.helperText}>Define si apareces como disponible para nuevos chats.</Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: "#CBD5E1", true: "#A7D6BB" }}
              thumbColor={isOnline ? appTheme.colors.success : "#FFFFFF"}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <Text style={styles.helperText}>Seleccion visible en frontend. Persistencia definitiva pendiente de endpoint dedicado.</Text>
          <View style={styles.tagsWrap}>
            {catalog.map((tag) => (
              <AppChip key={tag} label={tag} active={selectedSpecialties.includes(tag)} onPress={() => toggleSpecialty(tag)} />
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Tarifas</Text>
          <View style={styles.form}>
            <AppInput label="Chat (creditos)" value={chatPrice} onChangeText={setChatPrice} keyboardType="number-pad" />
            <AppInput label="Llamada (creditos)" value={callPrice} onChangeText={setCallPrice} keyboardType="number-pad" />
            <AppInput label="Video (creditos)" value={videoPrice} onChangeText={setVideoPrice} keyboardType="number-pad" />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Vista previa publica</Text>
          <Text style={styles.previewName}>{firstName} {lastName}</Text>
          <Text style={styles.previewBio}>{bio || "Agrega una descripcion para tu perfil publico."}</Text>
          <Text style={styles.previewMeta}>Estado: {isOnline ? "Disponible" : "No disponible"}</Text>
          <Text style={styles.previewMeta}>Tarifa chat: {Number(chatPrice || 0).toFixed(0)} cr</Text>
        </AppCard>

        <AppButton title="Guardar cambios" onPress={handleSave} loading={saving} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  helperText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  imageRow: {
    flexDirection: "row",
    gap: 12,
  },
  imageWrap: {
    flex: 1,
    gap: 8,
  },
  avatar: {
    width: "100%",
    height: 120,
    borderRadius: appTheme.radius.lg,
    backgroundColor: "#E2E8F0",
  },
  cover: {
    width: "100%",
    height: 120,
    borderRadius: appTheme.radius.lg,
    backgroundColor: "#E2E8F0",
  },
  imageLabel: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  form: {
    gap: 10,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewName: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  previewBio: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  previewMeta: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 12,
  },
});
