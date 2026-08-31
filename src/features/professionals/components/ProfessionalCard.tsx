import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { formatMoneyByCurrency } from "../../../utils/money";
import { formatProfessionalName } from "../../professional/constants/titles";
import type { Professional } from "../types";

type Props = {
  professional: Professional;
  onPress: () => void;
};

export default function ProfessionalCard({ professional, onPress }: Props) {
  const { currency } = useUserRegion();

  const lowestPrice =
    currency === "USD" ? professional.lowestSessionPriceUsd : professional.lowestSessionPriceBob;

  const specialtiesLabel =
    professional.specialties.length > 0
      ? professional.specialties.join(" · ")
      : "Atención profesional general";

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#E2E8F0" }}
      className="active:opacity-80 rounded-2xl border border-slate-300 bg-white p-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="flex-row gap-3">
        <View>
          <Image
            source={
              professional.avatar
                ? { uri: professional.avatar }
                : require("../../../../assets/no_image.jpg")
            }
            className="h-16 w-16 rounded-full bg-slate-200"
          />
          {professional.isOnline ? (
            <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#6BAF8A]" />
          ) : null}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1">
            <Text className="flex-1 font-heading text-[17px] font-bold text-[#020617]" numberOfLines={1}>
              {formatProfessionalName(professional.name, professional.title)}
            </Text>
            {professional.isVerified ? (
              <Ionicons name="shield-checkmark" size={15} color={appTheme.colors.primary} />
            ) : null}
          </View>

          <Text className="font-body text-xs text-slate-600" numberOfLines={1}>
            {specialtiesLabel}
          </Text>

          <View className="mt-0.5 flex-row items-center gap-3">
            {professional.rating ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text className="font-body text-xs font-semibold text-[#020617]">
                  {professional.rating.toFixed(1)}
                </Text>
                {professional.reviewCount ? (
                  <Text className="font-body text-xs text-slate-500">({professional.reviewCount})</Text>
                ) : null}
              </View>
            ) : (
              <Text className="font-body text-xs text-slate-400">Sin reseñas aún</Text>
            )}

            {professional.isOnline ? (
              <Text className="font-body text-xs font-semibold text-[#6BAF8A]">Disponible ahora</Text>
            ) : null}
          </View>
        </View>
      </View>

      {professional.bio ? (
        <Text className="mt-3 font-body text-xs leading-[18px] text-slate-600" numberOfLines={2}>
          {professional.bio}
        </Text>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
        {lowestPrice ? (
          <View className="flex-row items-baseline gap-1">
            <Text className="font-body text-[11px] text-slate-500">Desde</Text>
            <Text className="font-heading text-[15px] font-bold text-[#020617]">
              {formatMoneyByCurrency(lowestPrice, currency)}
            </Text>
          </View>
        ) : (
          <Text className="font-body text-xs text-slate-400">Consultar precio</Text>
        )}

        <View className="flex-row items-center gap-1">
          <Text className="font-body text-xs font-bold text-[#5B9BD5]">Ver perfil</Text>
          <Ionicons name="chevron-forward" size={14} color={appTheme.colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}
