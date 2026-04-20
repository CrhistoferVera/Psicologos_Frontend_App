import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
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
  getMyProfessionalPrices,
  getMyProfessionalProfile,
  getMyProfessionalSpecialtyIds,
  getProfessionalSpecialtiesCatalog,
  updateMyProfessionalProfile,
  updateMyProfessionalSpecialties,
  upsertProfessionalPrices,
} from "../api/professionalApi";

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

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

  const [monFriHours, setMonFriHours] = useState("09:00 - 19:00");
  const [satHours, setSatHours] = useState("09:00 - 19:00");
  const [sunHours, setSunHours] = useState("No disponible");

  const [catalog, setCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; type: string } | undefined>(undefined);

  const [editingBio, setEditingBio] = useState(false);
  const [editingSpecialties, setEditingSpecialties] = useState(false);

  const [editingAvailability, setEditingAvailability] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [profile, prices, specialtiesCatalog, mySpecialtyIds] = await Promise.all([
          getMyProfessionalProfile(),
          getMyProfessionalPrices(),
          getProfessionalSpecialtiesCatalog(),
          getMyProfessionalSpecialtyIds(),
        ]);

        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setIsOnline(Boolean(profile.isOnline));
        setAvatarUrl(profile.avatarUrl ?? null);

        const availability = profile.availability ?? {};
        setMonFriHours(String((availability as any).monFri ?? "09:00 - 19:00"));
        setSatHours(String((availability as any).sat ?? "09:00 - 19:00"));
        setSunHours(String((availability as any).sun ?? "No disponible"));

        setChatPrice(String(prices.chat ?? 0));
        setCallPrice(String(prices.call ?? 0));
        setVideoPrice(String(prices.video ?? 0));

        const trimmed = specialtiesCatalog.slice(0, 48).map((item) => ({ id: item.id, name: item.name }));
        setCatalog(trimmed);
        setSelectedSpecialties(Array.from(new Set(mySpecialtyIds)));
      } catch {
        setError("No se pudo cargar el perfil profesional.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSpecialtyNames = useMemo(
    () =>
      selectedSpecialties
        .map((id) => catalog.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [catalog, selectedSpecialties],
  );

  const displayName = useMemo(() => {
    const full = `${firstName} ${lastName}`.trim();
    if (!full) return "Professional";
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
          availability: {
            monFri: monFriHours.trim(),
            sat: satHours.trim(),
            sun: sunHours.trim(),
          },
        },
        avatarFile,
      );

      await upsertProfessionalPrices({
        chat: Number(chatPrice || 0),
        call: Number(callPrice || 0),
        video: Number(videoPrice || 0),
      });

      await updateMyProfessionalSpecialties(selectedSpecialties);

      Alert.alert("Perfil actualizado", "Tus cambios se guardaron correctamente.");
      setEditingBio(false);
      setEditingSpecialties(false);
      setEditingAvailability(false);
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
          <Pressable onPress={() => Alert.alert("Próximamente", "Vista pública en la siguiente iteración.")}> 
            <Text style={styles.publicLink}>Vista pública</Text>
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
            <Text style={styles.roleSubtitle}>{visibleSpecialties[0] ?? "Psicología clínica"}</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>Verificada</Text>
            </View>
          </View>
        </View>

        {loading ? <Text style={styles.infoText}>Cargando perfil...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Bio profesional</Text>
            <Pressable onPress={() => setEditingBio((prev) => !prev)}>
              <Text style={styles.editLink}>{editingBio ? "Listo" : "Editar"}</Text>
            </Pressable>
          </View>

          {editingBio ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Describe tu enfoque terapéutico"
                placeholderTextColor="#7A8EA8"
                style={styles.textArea}
              />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
            </View>
          ) : (
            <Text style={styles.cardBodyText} numberOfLines={4}>
              {bio || "Agrega una descripción profesional para que los clientes conozcan tu enfoque terapéutico."}
            </Text>
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
            <Text style={styles.cardTitle}>Tarifas</Text>
          </View>

          <View style={styles.priceRow}>
            {([
              { label: "Chat", value: chatPrice, icon: "chatbubble-ellipses-outline", suffix: "crd/msg" },
              { label: "Llamada", value: callPrice, icon: "call-outline", suffix: "crd/min" },
              { label: "Video", value: videoPrice, icon: "videocam-outline", suffix: "crd/min" },
            ] as const).map((item) => (
              <Pressable
                key={item.label}
                style={styles.priceCard}
                onPress={() => Alert.alert("Campo bloqueado", "Este campo no es editable.")}
              >
                <Ionicons name={item.icon} size={22} color={appTheme.colors.primary} />
                <Text style={styles.priceAmount}>{Number(item.value || 0).toFixed(0)}</Text>
                <Text style={styles.priceLabel}>{item.label}</Text>
                <Text style={styles.priceSuffix}>{item.suffix}</Text>
              </Pressable>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Disponibilidad</Text>
            <Pressable onPress={() => setEditingAvailability((prev) => !prev)}>
              <Text style={styles.editLink}>{editingAvailability ? "Listo" : "Editar"}</Text>
            </Pressable>
          </View>

          {editingAvailability ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={monFriHours}
                onChangeText={setMonFriHours}
                placeholder="Lun-Vie"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={satHours}
                onChangeText={setSatHours}
                placeholder="Sáb"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={sunHours}
                onChangeText={setSunHours}
                placeholder="Dom"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />

              <View style={styles.onlineRow}>
                <Text style={styles.onlineLabel}>Estado en línea</Text>
                <Switch
                  value={isOnline}
                  onValueChange={setIsOnline}
                  trackColor={{ false: "#CFD8E5", true: "#A7D6BB" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          ) : (
            <View style={styles.scheduleRows}>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLeft}>Lun–Vie</Text>
                <Text style={styles.scheduleRight}>{monFriHours}</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLeft}>Sáb</Text>
                <Text style={styles.scheduleRight}>{satHours}</Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLeft}>Dom</Text>
                <Text style={[styles.scheduleRight, { color: "#B7C4D4" }]}>{sunHours}</Text>
              </View>
            </View>
          )}
        </AppCard>

        <AppButton title="Guardar cambios" onPress={handleSave} loading={saving} />

        <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
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
  priceRow: {
    flexDirection: "row",
    gap: 8,
  },
  priceCard: {
    flex: 1,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 3,
  },
  priceAmount: {
    color: "#000000",
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "800",
  },
  priceLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  priceSuffix: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 10,
    fontWeight: "600",
  },
  rateRows: {
    gap: 8,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateLeft: {
    color: "#394F67",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  rateRight: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#ECF1F7",
  },
  scheduleRows: {
    gap: 10,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleLeft: {
    color: "#394F67",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  scheduleRight: {
    color: "#69AF8A",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
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

