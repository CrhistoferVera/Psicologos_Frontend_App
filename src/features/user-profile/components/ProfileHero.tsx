import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

type Props = {
  displayName: string;
  email: string;
  roleLabel: string;
  avatarUrl?: string | null;
  initials: string;
};

// expo-linear-gradient no soporta className, así que la sombra va por style.
const heroShadow = {
  borderRadius: 22,
  shadowColor: "#2D5F90",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 5,
} as const;

export default function ProfileHero({ displayName, email, roleLabel, avatarUrl, initials }: Props) {
  const [avatarError, setAvatarError] = useState(false);
  const showImage = Boolean(avatarUrl) && !avatarError;

  return (
    <LinearGradient
      colors={["#4D86BD", "#6AA7DB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={heroShadow}
    >
      <View className="flex-row items-center gap-3 px-4 py-4">
        <View className="w-[72px] h-[72px] rounded-[20px] p-[3px] bg-white/40">
          {showImage ? (
            <Image
              source={{ uri: avatarUrl! }}
              className="w-full h-full rounded-[17px]"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View className="w-full h-full rounded-[17px] bg-[#2D5F90] items-center justify-center">
              <Text className="text-white font-heading font-bold text-2xl">{initials}</Text>
            </View>
          )}
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-white font-heading font-bold text-[22px]" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-[#D7E8F7] font-body text-sm" numberOfLines={1}>
            {email}
          </Text>

          <View className="flex-row items-center gap-2 flex-wrap mt-2">
            <View className="rounded-full border border-white/40 bg-white/[0.14] px-2.5 py-[5px]">
              <Text className="text-[#EAF4FF] font-body text-xs font-bold">{roleLabel}</Text>
            </View>
            <View className="rounded-full bg-[#8FD1A8] px-2.5 py-[5px]">
              <Text className="text-[#113C22] font-body text-xs font-bold">Cuenta activa</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
