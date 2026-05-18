import { MessageCircle, User, House, Gift, CircleDollarSign } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";

type Item = {
  key: string;
  label: string;
  icon: any;
  route: string;
  match: string; // pathname sin grupo para comparar con usePathname()
};

const items: Item[] = [
  { key: "home",     label: "Inicio",   icon: House,         route: "/(user)/home",     match: "/home" },
  { key: "chats",    label: "Chats",    icon: MessageCircle, route: "/(user)/chats",    match: "/chats" },
  { key: "packages", label: "Paquetes", icon: CircleDollarSign, route: "/(user)/packages", match: "/packages" },
  { key: "profile",  label: "Perfil",   icon: User,          route: "/(user)/profile",  match: "/profile" },
];

const PRIMARY  = appTheme.colors.primary; // #5B9BD5
const INACTIVE = "#6B7280";
const PILL_BG  = "rgba(91,155,213,0.28)";

function isActive(pathname: string, match: string) {
  if (match === "/home") return pathname === "/home" || pathname === "/";
  return pathname === match || pathname.startsWith(match + "/");
}

export default function UserBottomNav() {
  const pathname   = usePathname();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const navigating = useRef(false);

  function navigate(route: string) {
    if (navigating.current) return;
    navigating.current = true;
    router.push(route as any);
    setTimeout(() => { navigating.current = false; }, 600);
  }

  return (
    <View
      className="flex-row items-end justify-around relative border-t border-zinc-800"
      style={{ backgroundColor: "#18181b", paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }}
    >
      {items.map((item) => {
        const Icon   = item.icon;
        const active = isActive(pathname, item.match);
        const color  = active ? PRIMARY : INACTIVE;

        return (
          <Pressable
            key={item.key}
            className="flex-1 items-center pt-2 pb-1.5"
            onPress={() => !active && navigate(item.route)}
          >
            {/* píldora de fondo cuando activo */}
            <View
              style={{
                position: "absolute",
                top: 6,
                width: 52,
                height: 30,
                borderRadius: 99,
                backgroundColor: active ? PILL_BG : "transparent",
              }}
            />

            <Icon size={active ? 27 : 30} color={color} />

            <Text
              className="text-[10px] font-semibold mt-0.5"
              style={{ color }}
            >
              {item.label}
            </Text>

            {/* punto indicador */}
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 99,
                marginTop: 2,
                backgroundColor: active ? PRIMARY : "transparent",
              }}
            />
          </Pressable>
        );
      })}

      {/* FAB de referidos */}
      <Pressable
        className="absolute right-3 -top-3.5 w-8 h-8 rounded-full items-center justify-center"
        style={{
          backgroundColor: appTheme.colors.success,
          borderWidth: 2,
          borderColor: "#18181b",
          elevation: 4,
        }}
        onPress={() => navigate("/(user)/referrals")}
      >
        <Gift size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
