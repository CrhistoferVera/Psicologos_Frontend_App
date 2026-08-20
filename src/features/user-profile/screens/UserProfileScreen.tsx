import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { useUserProfile } from "../hooks/useUserProfile";
import ProfileHero from "../components/ProfileHero";
import QuickAccessCard from "../components/QuickAccessCard";
import AccountDataCard from "../components/AccountDataCard";
import LogoutButton from "../components/LogoutButton";

export default function UserProfileScreen() {
  const router = useRouter();
  const {
    logout,
    loading,
    displayName,
    email,
    phone,
    roleLabel,
    avatarUrl,
    initials,
    isProfileComplete,
  } = useUserProfile();

  async function handleLogout() {
    await logout();
    router.replace("/(public)/auth");
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View className="pt-2 px-4 pb-[18px] gap-[14px] bg-[#F7FAFC]">
        <View className="gap-0.5">
          <Text className="text-[#020617] font-heading font-bold text-[32px]">Mi perfil</Text>
          <Text className="text-[#475569] font-body text-sm leading-5">
            Gestiona tu cuenta y accesos principales.
          </Text>
        </View>

        <ProfileHero
          displayName={displayName}
          email={email}
          roleLabel={roleLabel}
          avatarUrl={avatarUrl}
          initials={initials}
        />

        <QuickAccessCard />

        <AccountDataCard
          email={email}
          phone={phone}
          loading={loading}
          isProfileComplete={isProfileComplete}
        />

        <LogoutButton onPress={handleLogout} />
      </View>
    </AppScreen>
  );
}
