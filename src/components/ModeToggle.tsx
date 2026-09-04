import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import type { ActiveMode } from "../services/auth";

// Botón estilo inDrive: alterna entre modo Usuario y modo Psicólogo.
// - Si la cuenta tiene capacidad profesional -> muestra el switch de dos modos.
// - Si es un usuario puro -> muestra un CTA para convertirse en profesional.
export default function ModeToggle() {
  const router = useRouter();
  const { activeMode, capabilities, professionalReviewStatus, switchMode } = useAuth();
  const [busy, setBusy] = useState(false);

  // Un usuario puro (aún sin perfil profesional): CTA de onboarding.
  if (!capabilities.isProfessional) {
    return (
      <Pressable
        onPress={() => router.push("/(public)/professional-upgrade")}
        className="flex-row items-center gap-3 rounded-2xl bg-[#0F172A] px-4 py-4"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Ionicons name="medkit-outline" size={20} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-base font-bold text-white">
            Conviértete en psicólogo
          </Text>
          <Text className="font-body text-xs text-white/70">
            Ofrece sesiones y gana con tu cuenta actual.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </Pressable>
    );
  }

  const isPending = professionalReviewStatus !== "APPROVED";

  async function handleSwitch(next: ActiveMode) {
    if (busy || next === activeMode) return;
    setBusy(true);
    try {
      await switchMode(next);
      router.replace(next === "PROFESSIONAL" ? "/(professional)/dashboard" : "/(user)/home");
    } catch (e: any) {
      Alert.alert(
        "No se pudo cambiar de modo",
        e?.message ?? "Inténtalo de nuevo en un momento.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-2 rounded-2xl bg-white p-3 shadow-sm">
      <View className="flex-row items-center justify-between px-1">
        <Text className="font-heading text-sm font-bold text-[#0F172A]">Modo activo</Text>
        {busy ? <ActivityIndicator size="small" color="#0F172A" /> : null}
      </View>

      <View className="flex-row gap-2">
        <ModeButton
          label="Usuario"
          icon="person-outline"
          active={activeMode === "USER"}
          onPress={() => handleSwitch("USER")}
        />
        <ModeButton
          label="Psicólogo"
          icon="medkit-outline"
          active={activeMode === "PROFESSIONAL"}
          onPress={() => handleSwitch("PROFESSIONAL")}
        />
      </View>

      {isPending ? (
        <Text className="px-1 font-body text-xs text-[#B45309]">
          Tu perfil profesional está en revisión.
        </Text>
      ) : null}
    </View>
  );
}

function ModeButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 ${
        active ? "bg-[#0F172A]" : "bg-[#F1F5F9]"
      }`}
    >
      <Ionicons name={icon} size={18} color={active ? "#FFFFFF" : "#475569"} />
      <Text
        className={`font-heading text-sm font-bold ${active ? "text-white" : "text-[#475569]"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
