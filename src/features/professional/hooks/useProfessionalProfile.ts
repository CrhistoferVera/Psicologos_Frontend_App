import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import {
  getMyProfessionalProfile,
  getMyProfessionalSpecialtyIds,
  getProfessionalSpecialtiesCatalog,
  updateMyProfessionalProfile,
  updateMyProfessionalSpecialties,
  uploadEducationPhoto,
} from "../api/professionalApi";
import type { EducationEntry } from "../types";
import { formatProfessionalName } from "../constants/titles";

type MediaFile = { uri: string; name: string; type: string };

function assetToFile(asset: ImagePicker.ImagePickerAsset, fallback: string): MediaFile {
  return {
    uri: asset.uri,
    name: asset.uri.split("/").pop() ?? fallback,
    type: asset.mimeType ?? "image/jpeg",
  };
}

export function useProfessionalProfile() {
  const router = useRouter();
  const { hydrate, logout, user } = useAuth();

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
  const [avatarFile, setAvatarFile] = useState<MediaFile | undefined>(undefined);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<MediaFile | undefined>(undefined);

  const [languages, setLanguages] = useState<string[]>([]);
  const [showLangModal, setShowLangModal] = useState(false);

  const [editingBio, setEditingBio] = useState(false);
  const [editingSpecialties, setEditingSpecialties] = useState(false);
  const [showPublicView, setShowPublicView] = useState(false);

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
      setCoverUrl(profile.coverUrl ?? null);
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

  const visibleSpecialties =
    selectedSpecialtyNames.length > 0 ? selectedSpecialtyNames : catalog.slice(0, 4).map((item) => item.name);

  // Preserva el orden de selección del psicólogo, no el orden del catálogo
  const readonlySpecialties =
    selectedSpecialties.length > 0
      ? (selectedSpecialties.map((id) => catalog.find((item) => item.id === id)).filter(Boolean) as {
          id: string;
          name: string;
        }[])
      : catalog.slice(0, 4);

  function toggleSpecialty(id: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function pickImage(fallback: string, options?: ImagePicker.ImagePickerOptions) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      ...options,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return assetToFile(result.assets[0], fallback);
  }

  async function pickAvatar() {
    try {
      const file = await pickImage("avatar.jpg");
      if (!file) return;
      setAvatarFile(file);
      setAvatarUrl(file.uri);
    } catch {
      setError("No se pudo seleccionar la imagen.");
    }
  }

  async function pickCover() {
    try {
      const file = await pickImage("cover.jpg", { allowsEditing: true, aspect: [9, 16] });
      if (!file) return;
      setCoverFile(file);
      setCoverUrl(file.uri);
    } catch {
      setError("No se pudo seleccionar la imagen de portada.");
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
      const file = await pickImage("photo.jpg");
      if (!file) return;
      setEduPhotoUri(file.uri);
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

  function deleteEduEntry(id: string) {
    Alert.alert("Eliminar formación", "¿Eliminar esta entrada de formación académica?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            const updated = education.filter((e) => e.id !== id);
            setEducation(updated);
            try {
              await updateMyProfessionalProfile({ education: updated });
            } catch (err: any) {
              const raw = err?.response?.data?.message ?? err?.message;
              Alert.alert("Error al eliminar", Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo eliminar la formación.");
            }
          })();
        },
      },
    ]);
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  async function removeLanguage(lang: string) {
    const updated = languages.filter((l) => l !== lang);
    setLanguages(updated);
    try {
      await updateMyProfessionalProfile({ languages: updated });
    } catch {}
  }

  async function persistLanguages() {
    setShowLangModal(false);
    try {
      await updateMyProfessionalProfile({ languages });
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      Alert.alert("Error", Array.isArray(raw) ? raw.join(", ") : raw || "No se pudieron guardar los idiomas.");
    }
  }

  async function toggleEditSpecialties() {
    if (!editingSpecialties) {
      setEditingSpecialties(true);
      return;
    }
    setEditingSpecialties(false);
    try {
      await updateMyProfessionalSpecialties(selectedSpecialties);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      Alert.alert("Error al guardar", Array.isArray(raw) ? raw.join(", ") : raw || "No se pudieron guardar las especialidades.");
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
          title,
          bio: bio.trim(),
          isOnline,
          education,
          languages,
        },
        avatarFile,
        coverFile,
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
      setCoverUrl(updatedProfile.coverUrl ?? null);
      setCoverFile(undefined);
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

  return {
    router,
    user,
    loading,
    saving,
    error,

    firstName,
    setFirstName,
    lastName,
    setLastName,
    username,
    setUsername,
    title,
    setTitle,
    bio,
    setBio,
    isOnline,
    setIsOnline,

    catalog,
    selectedSpecialties,
    selectedSpecialtyNames,
    visibleSpecialties,
    readonlySpecialties,
    toggleSpecialty,

    avatarUrl,
    coverUrl,
    pickAvatar,
    pickCover,

    languages,
    showLangModal,
    setShowLangModal,
    toggleLanguage,
    removeLanguage,
    persistLanguages,

    displayName,

    editingBio,
    setEditingBio,
    editingSpecialties,
    toggleEditSpecialties,
    showPublicView,
    setShowPublicView,

    education,
    showEduModal,
    setShowEduModal,
    editingEntry,
    eduDegree,
    setEduDegree,
    eduInstitution,
    setEduInstitution,
    eduYear,
    setEduYear,
    eduDescription,
    setEduDescription,
    eduPhotoUri,
    uploadingEduPhoto,
    openAddEduModal,
    openEditEduModal,
    pickEduPhoto,
    saveEduEntry,
    deleteEduEntry,

    handleSave,
    handleLogout,
  };
}
