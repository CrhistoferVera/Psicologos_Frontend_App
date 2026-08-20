import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import MenuRow from "./MenuRow";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  route: string;
};

const items: MenuItem[] = [
  {
    icon: "people-outline",
    iconColor: appTheme.colors.success,
    iconBg: "#EAF8EF",
    title: "Referidos",
    subtitle: "Comparte y gana beneficios",
    route: "/(user)/referrals",
  },
  {
    icon: "calendar-clear-outline",
    iconColor: appTheme.colors.primary,
    iconBg: "#EEF4FF",
    title: "Mis reservas",
    subtitle: "Revisa pagos y estado de sesiones",
    route: "/(user)/bookings",
  },
  {
    icon: "settings-outline",
    iconColor: "#60758E",
    iconBg: "#F0F4F8",
    title: "Configuración",
    subtitle: "Preferencias y privacidad",
    route: "/(user)/settings",
  },
  {
    icon: "document-text-outline",
    iconColor: "#4F46E5",
    iconBg: "#EEF2FF",
    title: "Términos y condiciones",
    subtitle: "Consulta las condiciones de uso",
    route: "/terms",
  },
];

export default function QuickAccessCard() {
  const router = useRouter();

  return (
    <AppCard>
      <Text className="text-[#020617] font-heading text-lg font-bold mb-0.5">Accesos rápidos</Text>

      {items.map((item) => (
        <MenuRow
          key={item.route}
          icon={item.icon}
          iconColor={item.iconColor}
          iconBg={item.iconBg}
          title={item.title}
          subtitle={item.subtitle}
          onPress={() => router.push(item.route as any)}
        />
      ))}
    </AppCard>
  );
}
