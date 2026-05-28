import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
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
  uploadEducationPhoto,
} from "../api/professionalApi";
import type { EducationEntry } from "../types";
import { LanguageSelectorModal } from "../components/LanguageSelectorModal";
import { getLangInfo } from "../constants/languages";
import { PROFESSIONAL_TITLES, formatProfessionalName } from "../constants/titles";

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const { hydrate, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [catalog, setCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; type: string } | undefined>(undefined);

  const [languages, setLanguages] = useState<string[]>([]);
  const [showLangModal, setShowLangModal] = useState(false);

  const [editingBio, setEditingBio] = useState(false);
  const [editingSpecialties, setEditingSpecialties] = useState(false);

  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EducationEntry | null>(null);
  const [eduDegree, setEduDegree] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduYear, setEduYear] = useState("");
  const [eduDescription, setEduDescription] = useState("");
  const [eduPhotoUri, setEduPhotoUri] = useState<string | null>(null);
  const [eduPhotoUrl, setEduPhotoUrl] = useState<string | null>(null);
  const [uploadingEduPhoto, setUploadingEduPhoto] = useState(false);

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
      setTitle(profile.title ?? null);
      setBio(profile.bio || "");
      setIsOnline(Boolean(profile.isOnline));
      setAvatarUrl(profile.avatarUrl ?? null);
      setEducation(Array.isArray(profile.education) ? profile.education : []);
      setLanguages(Array.isArray(profile.languages) ? profile.languages : []);

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
    return formatProfessionalName(full, title);
  }, [firstName, lastName, title]);

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

  function openAddEduModal() {
    setEditingEntry(null);
    setEduDegree("");
    setEduInstitution("");
    setEduYear("");
    setEduDescription("");
    setEduPhotoUri(null);
    setEduPhotoUrl(null);
    setShowEduModal(true);
  }

  function openEditEduModal(entry: EducationEntry) {
    setEditingEntry(entry);
    setEduDegree(entry.degree);
    setEduInstitution(entry.institution);
    setEduYear(String(entry.year));
    setEduDescription(entry.description ?? "");
    setEduPhotoUri(entry.photoUrl ?? null);
    setEduPhotoUrl(entry.photoUrl ?? null);
    setShowEduModal(true);
  }

  async function pickEduPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.uri.split("/").pop() ?? "photo.jpg",
        type: asset.mimeType ?? "image/jpeg",
      };
      setEduPhotoUri(asset.uri);
      setEduPhotoUrl(null);
      setUploadingEduPhoto(true);
      try {
        const { url } = await uploadEducationPhoto(file);
        setEduPhotoUrl(url);
      } catch {
        Alert.alert("Error", "No se pudo subir la foto. Intenta de nuevo.");
        setEduPhotoUri(null);
      } finally {
        setUploadingEduPhoto(false);
      }
    } catch {
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  }

  async function saveEduEntry() {
    if (uploadingEduPhoto) {
      Alert.alert("Espera", "La foto se está subiendo, por favor espera.");
      return;
    }
    const year = Number.parseInt(eduYear, 10);
    if (!eduDegree.trim() || !eduInstitution.trim() || !year || year < 1900 || year > 2100) {
      Alert.alert("Datos incompletos", "Completa el grado, institución y un año válido (1900-2100).");
      return;
    }
    const entry: EducationEntry = {
      id: editingEntry?.id ?? String(Date.now()),
      degree: eduDegree.trim(),
      institution: eduInstitution.trim(),
      year,
      description: eduDescription.trim() || undefined,
      photoUrl: eduPhotoUrl ?? undefined,
    };
    const updated = editingEntry
      ? education.map((e) => (e.id === editingEntry.id ? entry : e))
      : [...education, entry];
    setEducation(updated);
    setShowEduModal(false);
    try {
      await updateMyProfessionalProfile({ education: updated });
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      Alert.alert("Error al guardar", Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo guardar la formación.");
    }
  }

  async function confirmDeleteEduEntry(id: string) {
    const updated = education.filter((e) => e.id !== id);
    setEducation(updated);
    try {
      await updateMyProfessionalProfile({ education: updated });
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      Alert.alert("Error al eliminar", Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo eliminar la formación.");
    }
  }

  function deleteEduEntry(id: string) {
    Alert.alert("Eliminar formación", "¿Eliminar esta entrada de formación académica?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void confirmDeleteEduEntry(id) },
    ]);
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
          title,
          bio: bio.trim(),
          isOnline,
          education,
          languages,
        },
        avatarFile,
      );

      const updatedSpecialtyIds = await updateMyProfessionalSpecialties(selectedSpecialties);

      setFirstName(updatedProfile.firstName || "");
      setLastName(updatedProfile.lastName || "");
      setUsername(updatedProfile.username || "");
      setTitle(updatedProfile.title ?? null);
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
            <View style={styles.langCardTitleRow}>
              <View style={styles.langCardIcon}>
                <Ionicons name="language" size={15} color={appTheme.colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Idiomas que hablo</Text>
            </View>
            <Pressable style={styles.langAddPill} onPress={() => setShowLangModal(true)}>
              <Ionicons name="add" size={14} color={appTheme.colors.primary} />
              <Text style={styles.langAddPillText}>Agregar</Text>
            </Pressable>
          </View>

          {languages.length === 0 ? (
            <Pressable style={styles.langEmptyBtn} onPress={() => setShowLangModal(true)}>
              <Ionicons name="language-outline" size={20} color="#A0B4C8" />
              <Text style={styles.langEmptyText}>Toca para agregar los idiomas{"\n"}en los que atiendes</Text>
            </Pressable>
          ) : (
            <View style={styles.langChipWrap}>
              {languages.map((lang) => {
                const info = getLangInfo(lang);
                return (
                  <View
                    key={lang}
                    style={[
                      styles.langChip,
                      info && { backgroundColor: info.color, borderColor: info.border },
                    ]}
                  >
                    {info && <Text style={styles.langFlag}>{info.flag}</Text>}
                    <Text style={[styles.langChipText, info && { color: info.accent }]}>
                      {lang}
                    </Text>
                    <Pressable
                      hitSlop={6}
                      onPress={async () => {
                        const updated = languages.filter((l) => l !== lang);
                        setLanguages(updated);
                        try {
                          await updateMyProfessionalProfile({ languages: updated });
                        } catch {}
                      }}
                    >
                      <Ionicons name="close-circle" size={15} color={info?.accent ?? "#4F7BAE"} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </AppCard>

        <LanguageSelectorModal
          visible={showLangModal}
          selected={languages}
          onToggle={(lang) => setLanguages((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang])}
          onClose={async () => {
            setShowLangModal(false);
            try {
              await updateMyProfessionalProfile({ languages });
            } catch (err: any) {
              const raw = err?.response?.data?.message ?? err?.message;
              Alert.alert("Error", Array.isArray(raw) ? raw.join(", ") : raw || "No se pudieron guardar los idiomas.");
            }
          }}
        />

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Datos del perfil</Text>
            <Pressable onPress={() => setEditingBio((prev) => !prev)}>
              <Text style={styles.editLink}>{editingBio ? "Listo" : "Editar"}</Text>
            </Pressable>
          </View>

          {editingBio ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.fieldLabel}>Título profesional</Text>
              <View style={styles.titleChipsWrap}>
                <AppChip
                  label="Sin título"
                  active={!title}
                  onPress={() => setTitle(null)}
                />
                {PROFESSIONAL_TITLES.map((option) => (
                  <AppChip
                    key={option}
                    label={option}
                    active={title === option}
                    onPress={() => setTitle(option)}
                  />
                ))}
              </View>
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

        <AppCard style={styles.sectionCard}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Formación académica</Text>
            <Pressable onPress={openAddEduModal}>
              <Text style={styles.editLink}>+ Agregar</Text>
            </Pressable>
          </View>

          {education.length === 0 ? (
            <Text style={styles.cardBodyText}>
              Agrega tu formación académica para que los clientes conozcan tus credenciales.
            </Text>
          ) : (
            <View style={styles.eduList}>
              {education.map((entry) => (
                <View key={entry.id} style={styles.eduItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eduDegree}>{entry.degree}</Text>
                    <Text style={styles.eduMeta}>{entry.institution} · {entry.year}</Text>
                    {entry.description ? (
                      <Text style={styles.eduDesc}>{entry.description}</Text>
                    ) : null}
                    {entry.photoUrl ? (
                      <Image source={{ uri: entry.photoUrl }} style={styles.eduItemPhoto} />
                    ) : null}
                  </View>
                  <View style={styles.eduActions}>
                    <Pressable style={styles.eduActionBtn} onPress={() => openEditEduModal(entry)}>
                      <Ionicons name="create-outline" size={15} color="#4F7BAE" />
                    </Pressable>
                    <Pressable style={[styles.eduActionBtn, styles.eduActionBtnDanger]} onPress={() => deleteEduEntry(entry.id)}>
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AppCard>

        {/* Modal agregar / editar formación */}
        <Modal visible={showEduModal} transparent animationType="fade" onRequestClose={() => setShowEduModal(false)}>
          <View style={styles.eduModalOverlay}>
            <View style={styles.eduModalCard}>
              <Text style={styles.eduModalTitle}>
                {editingEntry ? "Editar formación" : "Agregar formación"}
              </Text>

              <TextInput
                value={eduDegree}
                onChangeText={setEduDegree}
                placeholder="Grado o título (ej. Licenciatura en Psicología)"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={eduInstitution}
                onChangeText={setEduInstitution}
                placeholder="Institución (ej. Universidad Mayor de San Andrés)"
                placeholderTextColor="#7A8EA8"
                style={styles.inlineInput}
              />
              <TextInput
                value={eduYear}
                onChangeText={setEduYear}
                placeholder="Año (ej. 2018)"
                placeholderTextColor="#7A8EA8"
                keyboardType="numeric"
                maxLength={4}
                style={styles.inlineInput}
              />
              <TextInput
                value={eduDescription}
                onChangeText={setEduDescription}
                placeholder="Descripción breve (opcional)"
                placeholderTextColor="#7A8EA8"
                multiline
                style={styles.textArea}
              />

              <Pressable style={styles.eduPhotoPickerBtn} onPress={pickEduPhoto} disabled={uploadingEduPhoto}>
                {eduPhotoUri ? (
                  <Image source={{ uri: eduPhotoUri }} style={styles.eduPhotoPreview} />
                ) : (
                  <View style={styles.eduPhotoPickerPlaceholder}>
                    <Ionicons name="image-outline" size={22} color="#4F7BAE" />
                    <Text style={styles.eduPhotoPickerText}>Agregar foto (título, diploma...)</Text>
                  </View>
                )}
                {uploadingEduPhoto ? (
                  <View style={styles.eduPhotoUploading}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.eduModalBtns}>
                <Pressable style={styles.eduCancelBtn} onPress={() => setShowEduModal(false)}>
                  <Text style={styles.eduCancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.eduSaveBtn} onPress={() => void saveEduEntry()}>
                  <Text style={styles.eduSaveBtnText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
  fieldLabel: {
    color: "#394F67",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  titleChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
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
  eduList: {
    gap: 10,
  },
  eduItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3FA",
  },
  eduDegree: {
    color: "#2A405B",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  eduMeta: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  eduDesc: {
    color: "#8EA5BE",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  eduActions: {
    flexDirection: "row",
    gap: 6,
  },
  eduActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EDF4FB",
    alignItems: "center",
    justifyContent: "center",
  },
  eduActionBtnDanger: {
    backgroundColor: "#FEF2F2",
  },
  eduModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  eduModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  eduModalTitle: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  eduModalBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  eduCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5DFEB",
    alignItems: "center",
    justifyContent: "center",
  },
  eduCancelBtnText: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  eduSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  eduSaveBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  eduPhotoPickerBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5DFEB",
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 80,
  },
  eduPhotoPickerPlaceholder: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  eduPhotoPickerText: {
    color: "#4F7BAE",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  eduPhotoPreview: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  eduPhotoUploading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  langCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${appTheme.colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  langAddPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: appTheme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langAddPillText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  langEmptyBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#D5DFEB",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 18,
  },
  langEmptyText: {
    color: "#A0B4C8",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  langChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDF4FB",
    borderWidth: 1.5,
    borderColor: "#BDD5EE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langFlag: {
    fontSize: 15,
    lineHeight: 18,
  },
  langChipText: {
    color: "#2A405B",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  eduItemPhoto: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    marginTop: 6,
    resizeMode: "cover",
  },
});
