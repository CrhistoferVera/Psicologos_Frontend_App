import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import { useUserSettings } from "../hooks/useUserSettings";
import SettingsHeader from "../components/SettingsHeader";
import AvatarPicker from "../components/AvatarPicker";
import SettingsField from "../components/SettingsField";

export default function UserSettingsScreen() {
  const {
    router,
    loading,
    saving,
    error,
    userName,
    setUserName,
    bio,
    setBio,
    email,
    avatarUrl,
    initials,
    pickAvatar,
    handleSave,
  } = useUserSettings();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2.5 p-4 pb-10 mt-5 bg-[#F7FAFC]">
          <SettingsHeader onBack={() => router.back()} />

          {loading ? <Text className="text-[#475569] font-body text-xs">Cargando...</Text> : null}
          {error ? <Text className="text-[#DC2626] font-body text-xs">{error}</Text> : null}

          <AvatarPicker avatarUrl={avatarUrl} initials={initials} onPress={() => void pickAvatar()} />

          <SettingsField
            label="Username"
            value={userName}
            onChangeText={setUserName}
            placeholder="Username"
            autoCapitalize="none"
          />
          <SettingsField
            label="Correo"
            value={email}
            editable={false}
            hint="Tu correo está vinculado a tu cuenta de Google y no se puede cambiar."
          />
          <SettingsField label="Bio" value={bio} onChangeText={setBio} placeholder="Bio" multiline />

          <AppButton
            title={saving ? "Guardando..." : "Guardar cambios"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
