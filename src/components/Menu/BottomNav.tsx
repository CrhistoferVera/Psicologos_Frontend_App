import { View, Pressable, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  Home,
  MessageCircle,
  User,
  Gem,
  CircleDollarSign,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Role = "anfitriona" | "cliente";

const tabsByRole = {
  cliente: [
    { name: "index", title: "Inicio", icon: Home },
    { name: "chats", title: "Chats", icon: MessageCircle },
    { name: "credito", title: "Créditos", icon: Gem },
    { name: "perfil", title: "Perfil", icon: User },
  ],
  anfitriona: [
    { name: "index", title: "Inicio", icon: Home },
    { name: "ganancias", title: "Ganancias", icon: CircleDollarSign },
    { name: "chats", title: "Chat", icon: MessageCircle },
    { name: "perfil", title: "Perfil", icon: User },
  ],
};

const activeColor: Record<Role, string> = {
  anfitriona: "#F6C16A",
  cliente: "#F6C16A",
};

export default function BottomNav({ role }: { role: Role }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = tabsByRole[role];
  const color = activeColor[role];

  const isActive = (tabName: string) => {
    if (tabName === "index") {
      const otherTabNames = tabs
        .filter((t) => t.name !== "index")
        .map((t) => t.name);
      const onOtherTab = otherTabNames.some((name) =>
        pathname.endsWith(`/${name}`),
      );
      return (
        !onOtherTab &&
        (pathname === `/(${role})` ||
          pathname === `/(${role})/index` ||
          pathname === "/" ||
          pathname.endsWith(`/${role}`))
      );
    }
    return pathname.endsWith(`/${tabName}`);
  };

  const handlePress = (tabName: string) => {
    if (isActive(tabName)) return;
    if (tabName === "index") {
      router.push(`/(${role})` as any);
    } else {
      router.push(`/(${role})/${tabName}` as any);
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#0a0a0a",
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.name);

        return (
          <Pressable
            key={tab.name}
            onPress={() => handlePress(tab.name)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
          >
            {/* Indicador superior dorado */}
            <View
              style={{
                position: "absolute",
                top: 0,
                width: active ? 28 : 0,
                height: 2,
                borderRadius: 2,
                backgroundColor: color,
                opacity: active ? 1 : 0,
              }}
            />

            {/* Icono con glow dorado si activo */}
            <View
              style={
                active
                  ? {
                      shadowColor: color,
                      shadowOpacity: 0.85,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  : undefined
              }
            >
              <Icon
                size={26}
                color={active ? color : "rgba(255,255,255,0.45)"}
              />
            </View>

            <Text
              style={{
                fontSize: 11,
                marginTop: 4,
                fontWeight: active ? "700" : "400",
                color: active ? color : "rgba(255,255,255,0.45)",
                ...(active
                  ? {
                      textShadowColor: color,
                      textShadowRadius: 8,
                      textShadowOffset: { width: 0, height: 0 },
                    }
                  : {}),
              }}
            >
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
