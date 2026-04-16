import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { apiGetMyWallet } from "../../../api/userClient";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import type { Professional } from "../../professionals/types";

type QuickSpecialty = {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [wallet, list] = await Promise.all([apiGetMyWallet(), getProfessionals()]);
        setBalance(wallet?.balance ?? 0);
        setProfessionals(list.slice(0, 5));
      } catch {
        try {
          const list = await getProfessionals();
          setProfessionals(list.slice(0, 5));
          setError("No se pudo cargar el saldo en este momento.");
        } catch {
          setError("No se pudieron cargar los profesionales.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const quickSpecialties = useMemo<QuickSpecialty[]>(
    () => [
      { name: "Ansiedad", icon: "leaf-outline" },
      { name: "Depresion", icon: "heart-outline" },
      { name: "Pareja", icon: "people-outline" },
      { name: "Autoestima", icon: "sparkles-outline" },
    ],
    [],
  );

  return (
    <AppScreen scroll contentPadding={16}>
      <View style={styles.wrap}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Buenos dias,</Text>
            <Text style={styles.heading}>{user?.firstName ?? "Usuario"}</Text>
          </View>
          <Pressable style={styles.notifyBtn}>
            <Ionicons name="notifications" size={16} color="#F2AE22" />
          </Pressable>
          <View style={styles.avatarWrap}>
            <Image source={require("../../../../assets/no_image.jpg")} style={styles.headerAvatar} />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#6F88A4" />
          <TextInput
            placeholder="Buscar psicologos, especialidades..."
            placeholderTextColor="#7A8FA9"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            onSubmitEditing={() =>
              router.push({ pathname: "/(user)/professionals", params: { search: search.trim() } } as any)
            }
          />
        </View>

        <LinearGradient
          colors={["#6FA8DC", "#8E7CC3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.creditsCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.creditsLabel}>Tus creditos</Text>
            <View style={styles.creditsRow}>
              <Ionicons name="card-outline" size={24} color="#FFFFFF" />
              <Text style={styles.creditsValue}>{Math.floor(balance)} creditos</Text>
            </View>
          </View>
          <Pressable style={styles.rechargeBtn} onPress={() => router.push("/(user)/credits")}> 
            <Text style={styles.rechargeText}>Recargar</Text>
          </Pressable>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Especialidades</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtiesRow}>
          {quickSpecialties.map((item) => (
            <Pressable
              key={item.name}
              style={styles.specialtyCard}
              onPress={() =>
                router.push({ pathname: "/(user)/professionals", params: { specialty: item.name } } as any)
              }
            >
              <Ionicons name={item.icon} size={22} color={appTheme.colors.primary} />
              <Text style={styles.specialtyName}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sliderHint} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Disponibles ahora</Text>
          <Text style={styles.link} onPress={() => router.push("/(user)/professionals")}>
            Ver todos
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={professionals}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(user)/professionals/[id]", params: { id: item.id } } as any)
              }
            >
              <AppCard style={styles.proCard}>
                <Image
                  source={item.avatar ? { uri: item.avatar } : require("../../../../assets/no_image.jpg")}
                  style={styles.proAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.proName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.proSpecialty} numberOfLines={2}>
                    {item.specialties.length ? item.specialties[0] : "Psicologia clinica"}
                  </Text>
                  <View style={styles.proMetaRow}>
                    <Text style={styles.rating}>â˜… {item.rating ? item.rating.toFixed(1) : "4.9"}</Text>
                    <Text style={styles.price}>{item.prices.chat ?? 15} crd/min</Text>
                  </View>
                </View>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() =>
                    router.push({ pathname: "/(user)/professionals/[id]", params: { id: item.id } } as any)
                  }
                >
                  <Text style={styles.viewBtnText}>Ver</Text>
                </Pressable>
              </AppCard>
            </Pressable>
          )}
        />

        {!loading && professionals.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>No hay profesionales disponibles por el momento.</Text>
          </AppCard>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greeting: {
    color: appTheme.colors.textMuted,
    fontSize: 15,
    fontFamily: appTheme.fonts.body,
    fontWeight: "500",
  },
  heading: {
    color: appTheme.colors.text,
    fontSize: 33,
    lineHeight: 36,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  notifyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F7",
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: appTheme.colors.primary,
    padding: 2,
  },
  headerAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CFD8E3",
    backgroundColor: "#EAF0F6",
    paddingHorizontal: 16,
    minHeight: 58,
  },
  search: {
    flex: 1,
    minHeight: 48,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 19,
  },
  creditsCard: {
    borderRadius: 18,
    minHeight: 118,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditsLabel: {
    color: "#DCEAFF",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },
  creditsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  creditsValue: {
    color: "#FFFFFF",
    fontSize: 33,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  rechargeBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  rechargeText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },
  specialtiesRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },
  specialtyCard: {
    width: 98,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  specialtyName: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontFamily: appTheme.fonts.body,
    fontWeight: "500",
  },
  sliderHint: {
    height: 6,
    width: 120,
    borderRadius: 99,
    backgroundColor: "#B8C1CC",
    alignSelf: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    color: "#5A7594",
    fontSize: 18,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  link: {
    color: appTheme.colors.primary,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  proAvatar: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  proName: {
    color: "#1E293B",
    fontSize: 15,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    lineHeight: 20,
  },
  proSpecialty: {
    color: "#64748B",
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
  },
  proMetaRow: {
    marginTop: 2,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  rating: {
    color: "#F59E0B",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
  price: {
    color: appTheme.colors.primary,
    fontSize: 14,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  viewBtn: {
    borderRadius: 14,
    backgroundColor: "#E4EEF8",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewBtnText: {
    color: appTheme.colors.primary,
    fontSize: 16,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
});
