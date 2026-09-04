import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import { useProfessionalProfile } from "../hooks/useProfessionalProfile";
import { LanguageSelectorModal } from "../components/LanguageSelectorModal";
import ProfileTopBar from "../components/profile/ProfileTopBar";
import CoverPicker from "../components/profile/CoverPicker";
import IdentityCard from "../components/profile/IdentityCard";
import LanguagesCard from "../components/profile/LanguagesCard";
import ProfileDataCard from "../components/profile/ProfileDataCard";
import SpecialtiesCard from "../components/profile/SpecialtiesCard";
import AvailabilityCard from "../components/profile/AvailabilityCard";
import EducationCard from "../components/profile/EducationCard";
import EducationFormModal from "../components/profile/EducationFormModal";
import EnvironmentsCard from "../components/profile/EnvironmentsCard";
import PublicViewModal from "../components/profile/PublicViewModal";

export default function ProfessionalProfileScreen() {
  const p = useProfessionalProfile();

  return (
    <AppScreen scroll contentPadding={0}>
      <View className="pt-1.5 pb-4 gap-2.5 bg-[#F7FAFC]">
        <ProfileTopBar onBack={() => p.router.back()} onPublicView={() => p.setShowPublicView(true)} />

        <CoverPicker coverUrl={p.coverUrl} onPick={p.pickCover} />

        <IdentityCard
          avatarUrl={p.avatarUrl}
          displayName={p.displayName}
          roleSubtitle={p.visibleSpecialties[0] ?? "Psicología clínica"}
          isVerified={p.user?.isActive}
          onPickAvatar={p.pickAvatar}
        />

        {p.loading ? (
          <Text className="text-[#475569] font-body text-xs text-center px-3.5">Cargando perfil...</Text>
        ) : null}
        {p.error ? (
          <Text className="text-[#DC2626] font-body text-xs text-center px-3.5">{p.error}</Text>
        ) : null}

        <LanguagesCard
          languages={p.languages}
          onAdd={() => p.setShowLangModal(true)}
          onRemove={(lang) => void p.removeLanguage(lang)}
        />

        <LanguageSelectorModal
          visible={p.showLangModal}
          selected={p.languages}
          onToggle={p.toggleLanguage}
          onClose={() => void p.persistLanguages()}
        />

        <ProfileDataCard
          editing={p.editingBio}
          onToggleEdit={() => p.setEditingBio((prev) => !prev)}
          firstName={p.firstName}
          onFirstName={p.setFirstName}
          lastName={p.lastName}
          onLastName={p.setLastName}
          username={p.username}
          onUsername={p.setUsername}
          bio={p.bio}
          onBio={p.setBio}
          title={p.title}
          onTitle={p.setTitle}
        />

        <SpecialtiesCard
          editing={p.editingSpecialties}
          onToggleEdit={() => void p.toggleEditSpecialties()}
          catalog={p.catalog}
          readonlySpecialties={p.readonlySpecialties}
          selectedSpecialties={p.selectedSpecialties}
          onToggleSpecialty={p.toggleSpecialty}
        />

        <AvailabilityCard
          isOnline={p.isOnline}
          onToggleOnline={p.setIsOnline}
          onSessions={() => p.router.push("/(professional)/sessions" as any)}
          onAvailability={() => p.router.push("/(professional)/availability" as any)}
        />

        <EducationCard
          education={p.education}
          onAdd={p.openAddEduModal}
          onEdit={p.openEditEduModal}
          onDelete={p.deleteEduEntry}
        />

        <EducationFormModal
          visible={p.showEduModal}
          isEditing={Boolean(p.editingEntry)}
          degree={p.eduDegree}
          onDegree={p.setEduDegree}
          institution={p.eduInstitution}
          onInstitution={p.setEduInstitution}
          year={p.eduYear}
          onYear={p.setEduYear}
          description={p.eduDescription}
          onDescription={p.setEduDescription}
          photoUri={p.eduPhotoUri}
          uploading={p.uploadingEduPhoto}
          onPickPhoto={() => void p.pickEduPhoto()}
          onCancel={() => p.setShowEduModal(false)}
          onSave={() => void p.saveEduEntry()}
        />

        <EnvironmentsCard />

        <PublicViewModal
          visible={p.showPublicView}
          onClose={() => p.setShowPublicView(false)}
          id={p.user?.id ?? ""}
          displayName={p.displayName}
          username={p.username || undefined}
          avatarUrl={p.avatarUrl}
          coverUrl={p.coverUrl}
          bio={p.bio}
          specialties={p.selectedSpecialtyNames}
          isOnline={p.isOnline}
          languages={p.languages}
          isVerified={p.user?.isActive}
        />

        <View className="mx-3.5">
          <AppButton title="Guardar cambios" onPress={p.handleSave} loading={p.saving} />
        </View>

        <Pressable
          className="mx-3.5 min-h-[48px] rounded-[14px] border border-[#F5CACA] bg-[#FFF4F4] flex-row items-center justify-center gap-2 active:bg-[#FDE8E8]"
          accessibilityRole="button"
          onPress={() => void p.handleLogout()}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text className="text-[#DC2626] font-body text-[15px] font-bold">Cerrar sesión</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}
