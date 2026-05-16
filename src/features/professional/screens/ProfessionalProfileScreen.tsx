import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import {
  getMyProfessionalProfile,
  getMyProfessionalSpecialtyIds,
  getProfessionalSpecialtiesCatalog,
  updateMyProfessionalProfile,
  updateMyProfessionalSpecialties,
} from "../api/professionalApi";

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const { hydrate, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [catalog, setCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; type: string } | undefined>(undefined);

  const [editingBio, setEditingBio] = useState(false);
  const [editingSpecialties, setEditingSpecialties] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [profile, specialtiesCatalog, mySpecialtyIds] = await Promise.all([
        getMyProfessionalProfile(),
        getProfessionalSpecialtiesCatalog(),
        getMyProfessionalSpecialtyIds(),
      ]);

      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setIsOnline(Boolean(profile.isOnline));
      setAvatarUrl(profile.avatarUrl ?? null);

      const trimmed = specialtiesCatalog.slice(0, 48).map((item) => ({ id: item.id, name: item.name }));
      setCatalog(trimmed);
      setSelectedSpecialties(Array.from(new Set(mySpecialtyIds)));
    } catch {
      setError("No se pudo cargar el perfil profesional.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const selectedSpecialtyNames = useMemo(
    () =>
      selectedSpecialties
        .map((id) => catalog.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [catalog, selectedSpecialties],
  );

  const displayName = useMemo(() => {
    const full = `${firstName} ${lastName}`.trim();
    if (!full) return "Profesional";
    return full.startsWith("Dra.") || full.startsWith("Dr.") ? full : `Dra. ${full}`;
  }, [firstName, lastName]);

  const visibleSpecialties = selectedSpecialtyNames.length > 0 ? selectedSpecialtyNames : catalog.slice(0, 4).map((item) => item.name);
  const readonlySpecialties = selectedSpecialties.length > 0 ? catalog.filter((item) => selectedSpecialties.includes(item.id)) : catalog.slice(0, 4);

  function toggleSpecialty(id: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function pickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      };

      setAvatarFile(file);
      setAvatarUrl(asset.uri);
    } catch {
      setError("No se pudo seleccionar la imagen.");
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

      const updatedProfile = await updateMyProfessionalProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          isOnline,
        },
        avatarFile,
      );

      const updatedSpecialtyIds = await updateMyProfessionalSpecialties(selectedSpecialties);

      setFirstName(updatedProfile.firstName || "");
      setLastName(updatedProfile.lastName || "");
      setUsername(updatedProfile.username || "");
      setBio(updatedProfile.bio || "");
      setIsOnline(Boolean(updatedProfile.isOnline));
      setAvatarUrl(updatedProfile.avatarUrl ?? null);
      setAvatarFile(undefined);
      setSelectedSpecialties(Array.from(new Set(updatedSpecialtyIds)));
      await hydrate();

      Alert.alert("Perfil actualizado", "Tus cambios se guardaron correctamente.");
      setEditingBio(false);
      setEditingSpecialties(false);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      setError(Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo guardar tu perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/(public)/auth");
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Mi perfil</Text>
          <Pressable onPress={() => Alert.alert("Proximamente", "Vista publica en la siguiente iteracion.")}> 
            <Text style={styles.publicLink}>Vista publica</Text>
          </Pressable>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : require("../../../../assets/no_image.jpg")}
              style={styles.avatar}
            />
            <Pressable style={styles.avatarEdit} onPress={pickAvatar}>
              <Ionicons name="create" size={12} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.roleSubtitle}>{visibleSpecialties[0] ?? "Psicologia clinica"}</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>Verificada</Text>
            </View>
          </View>
        </View>

        {loading ? <Text style={styles.infoText}>Cargando perfil...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Datos del perfil</Text>
            <Pressable onPress={() => setEditingBio((prev) => !prev)}>
              <Text style={styles.editLink}>{editingBio ? "Listo" : "Editar"}</Text>
            </Pressable>
          </View>

          {editingBio ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellido"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Describe tu enfoque terapeutico"
                placeholderTextColor="#7A8EA8"
                style={styles.textArea}
              />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Text style={styles.cardBodyText}>
                Nombre: {`${firstName} ${lastName}`.trim() || "Sin definir"}
              </Text>
              <Text style={styles.cardBodyText}>
                Username: {username ? `@${username}` : "Sin definir"}
              </Text>
              <Text style={styles.cardBodyText} numberOfLines={4}>
                {bio || "Agrega una descripcion profesional para que los clientes conozcan tu enfoque terapeutico."}
              </Text>
            </View>
          )}
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Especialidades</Text>
            <Pressable onPress={() => setEditingSpecialties((prev) => !prev)}>
              <Text style={styles.editLink}>{editingSpecialties ? "Listo" : "Editar"}</Text>
            </Pressable>
          </View>

          <View style={styles.specialtiesWrap}>
            {(editingSpecialties ? catalog : readonlySpecialties).map((item) => (
              <AppChip
                key={item.id}
                label={item.name}
                active={selectedSpecialties.includes(item.id)}
                onPress={editingSpecialties ? () => toggleSpecialty(item.id) : undefined}
              />
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Estado de disponibilidad</Text>
          </View>

          <View style={styles.onlineRow}>
            <Text style={styles.onlineLabel}>Mostrarme como disponible para clientes</Text>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: "#CFD8E5", true: "#A7D6BB" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.cardBodyText}>{isOnline ? "Disponible" : "No disponible"}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardBodyText}>Gestiona tus sesiones en Mis sesiones.</Text>
          <Pressable style={styles.linkBtn} onPress={() => router.push("/(professional)/sessions" as any)}>
            <Text style={styles.linkBtnText}>Ir a Mis sesiones</Text>
          </Pressable>

          <Text style={styles.cardBodyText}>Gestiona tus horarios en Disponibilidad.</Text>
          <Pressable style={styles.linkBtn} onPress={() => router.push("/(professional)/availability" as any)}>
            <Text style={styles.linkBtnText}>Ir a Disponibilidad</Text>
          </Pressable>
        </AppCard>

        <AppButton title="Guardar cambios" onPress={handleSave} loading={saving} />

        <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 6,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: appTheme.colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 33,
    fontWeight: "700",
    flex: 1,
    marginLeft: 6,
  },
  publicLink: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  identityCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 22,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  avatarEdit: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27,
  },
  roleSubtitle: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    marginTop: 2,
  },
  verifiedPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#EAF6EF",
  },
  verifiedText: {
    color: "#69AF8A",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  infoText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  sectionCard: {
    marginHorizontal: 14,
    borderRadius: 16,
    gap: 10,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#2A405B",
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  editLink: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  cardBodyText: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  specialtiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D5DFEB",
    backgroundColor: "#F8FBFF",
    borderRadius: 12,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    textAlignVertical: "top",
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: "#D5DFEB",
    backgroundColor: "#F8FBFF",
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  onlineRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  onlineLabel: {
    color: "#394F67",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#ECF1F7",
  },
  linkBtn: {
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  linkBtnText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  logoutBtn: {
    marginHorizontal: 14,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F5CACA",
    backgroundColor: "#FFF4F4",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#DC2626",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },
});
