import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomNav() {
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    const tabs = [
        { name: "Home", icon: "home", route: "/admin" },
        { name: "Clientes", icon: "users", route: "/admin/userClient" },
        { name: "Anfitrionas", icon: "user-friends", route: "/admin/anfitriona" },
    ];

    return (

        <View className="bg-[#A11213] flex-row justify-around items-center py-3 rounded-t-2xl border-t border-red-700/40" style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }}>

            {tabs.map((tab) => {
                const isActive = pathname === tab.route;

                return (
                    <Link key={tab.route} href={tab.route} asChild>
                        <TouchableOpacity className="items-center flex-1">

                            <FontAwesome5
                                name={tab.icon as any}
                                size={24}
                                color={isActive ? "#ffffff" : "#fca5a5"}
                            />

                            <Text
                                className={`text-[11px] mt-1 font-bold ${isActive ? "text-white" : "text-red-200"
                                    }`}
                            >
                                {tab.name}
                            </Text>

                        </TouchableOpacity>
                    </Link>
                );
            })}

        </View>

    );
}
