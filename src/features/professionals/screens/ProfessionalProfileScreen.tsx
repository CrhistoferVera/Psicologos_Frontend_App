import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { apiGetMyWallet } from "../../../api/userClient";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionalById } from "../api/professionalsApi";
import type { Professional } from "../types";

type TabKey = "info" | "reviews";

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const professionalId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  useEffect(() => {
    if (!professionalId) return;
    void (async () => {
      try {
        setError(null);
        const profile = await getProfessionalById(professionalId);
        setProfessional(profile);
      } catch {
        setError("No se pudo cargar el perfil profesional.");
      }

      try {
        const wallet = await apiGetMyWallet();
        setBalance(wallet?.balance ?? 0);
      } catch {
        // wallet is optional for this view
      }
    })();
  }, [professionalId]);

  const subtitle = useMemo(() => {
    if (!professional) return "";
    if (professional.specialties.length === 0) return "Psicologia Clinica";
    return professional.specialties.slice(0, 2).join(" · ");
  }, [professional]);

  if (!professional && !error) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.loading}>Cargando perfil...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!professional && error) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={[styles.loading, { color: appTheme.colors.danger }]}>{error}</Text>
        </View>
      </AppScreen>
    );
  }

  if (!professional) return null;

  const ratingText = professional.rating ? professional.rating.toFixed(1) : "4.9";
  const reviewCount = 142;

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <LinearGradient colors={["#315885", "#3D6A9A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.topBar}>
            <Pressable style={styles.topIconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.topActions}>
              <Pressable style={styles.topIconBtn}>
                <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.topIconBtn}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroProfileRow}>
            <View style={styles.avatarFrame}>
              <Image
                source={professional.avatar ? { uri: professional.avatar } : require("../../../../assets/no_image.jpg")}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{professional.name}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingValue}>{ratingText}</Text>
                <Text style={styles.reviews}>({reviewCount} resenas)</Text>
              </View>
            </View>

            <View style={[styles.statusBadge, professional.isOnline ? styles.statusOnline : styles.statusOffline]}>
              <Text style={[styles.statusText, professional.isOnline ? styles.statusOnlineText : styles.statusOfflineText]}>
                {professional.isOnline ? "En linea" : "Offline"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <AppCard style={styles.creditsCard}>
          <View style={styles.creditInfo}>
            <Ionicons name="card-outline" size={18} color={appTheme.colors.primary} />
            <Text style={styles.creditLabel}>Tus creditos:</Text>
            <Text style={styles.creditValue}>{Math.floor(balance)}</Text>
          </View>
          <Pressable style={styles.creditBtn} onPress={() => router.push("/(user)/credits")}>
            <Text style={styles.creditBtnText}>Recargar</Text>
          </Pressable>
        </AppCard>

        <View style={styles.priceCardsRow}>
          <View style={[styles.priceCard, styles.chatCard]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.priceTitle, { color: "#FFFFFF" }]}>Chat</Text>
            <Text style={[styles.priceAmount, { color: "#FFFFFF" }]}>{professional.prices.chat ?? 15} crd/min</Text>
          </View>

          <View style={[styles.priceCard, styles.callCard]}>
            <Ionicons name="call-outline" size={20} color="#26A269" />
            <Text style={[styles.priceTitle, { color: "#2F855A" }]}>Llamada</Text>
            <Text style={[styles.priceAmount, { color: "#2F855A" }]}>{professional.prices.call ?? 20} crd</Text>
          </View>

          <View style={[styles.priceCard, styles.videoCard]}>
            <Ionicons name="videocam-outline" size={20} color="#7E6CCF" />
            <Text style={[styles.priceTitle, { color: "#6C5BB6" }]}>Video</Text>
            <Text style={[styles.priceAmount, { color: "#6C5BB6" }]}>{professional.prices.video ?? 25} crd</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === "info" && styles.tabBtnActive]}
            onPress={() => setActiveTab("info")}
          >
            <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>Informacion</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === "reviews" && styles.tabBtnActive]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text style={[styles.tabText, activeTab === "reviews" && styles.tabTextActive]}>Resenas ({reviewCount})</Text>
          </Pressable>
        </View>

        {activeTab === "info" ? (
          <>
            <AppCard>
              <Text style={styles.blockTitle}>Sobre mi</Text>
              <Text style={styles.bio}>{professional.bio || "Profesional de salud mental con enfoque clinico y orientado a resultados."}</Text>
            </AppCard>

            <AppCard>
              <Text style={styles.blockTitle}>Especialidades</Text>
              <View style={styles.specialtiesWrap}>
                {(professional.specialties.length > 0 ? professional.specialties : ["Psicologia Clinica"]).map((item) => (
                  <View key={item} style={styles.specialtyPill}>
                    <Text style={styles.specialtyPillText}>{item}</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          </>
        ) : (
          <AppCard>
            <Text style={styles.blockTitle}>Resenas</Text>
            <Text style={styles.bio}>Aun no hay resenas publicadas para este profesional.</Text>
          </AppCard>
        )}

        <Pressable
          style={styles.chatBtn}
          onPress={() =>
            router.push({
              pathname: "/(user)/chats/[id]",
              params: {
                id: professional.id,
                professionalId: professional.id,
                professionalName: professional.name,
                professionalAvatar: professional.avatar,
              },
            } as any)
          }
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
          <Text style={styles.chatBtnText}>Iniciar chat</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  page: {
    padding: 12,
    paddingBottom: 22,
    gap: 12,
    backgroundColor: appTheme.colors.background,
  },
  hero: {
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
  },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroProfileRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarFrame: {
    width: 86,
    height: 86,
    borderRadius: 22,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#DDE5EF",
  },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: appTheme.colors.success,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 30,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    color: "#D4E3F5",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  ratingRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  star: {
    color: "#F7C948",
    fontSize: 14,
    fontWeight: "700",
  },
  ratingValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
  reviews: {
    color: "#D5E2F2",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
  statusOnline: {
    backgroundColor: "#77C48F",
  },
  statusOffline: {
    backgroundColor: "#CBD5E1",
  },
  statusOnlineText: {
    color: "#F8FFF9",
  },
  statusOfflineText: {
    color: "#334155",
  },
  creditsCard: {
    marginTop: -8,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  creditInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  creditLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  creditValue: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
  creditBtn: {
    borderRadius: 12,
    backgroundColor: "#E6F0FA",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  creditBtnText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    fontWeight: "700",
  },
  priceCardsRow: {
    flexDirection: "row",
    gap: 8,
  },
  priceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  chatCard: {
    backgroundColor: "#5B9BD5",
    borderColor: "#5B9BD5",
  },
  callCard: {
    backgroundColor: "#E9F7EF",
    borderColor: "#BFE2CF",
  },
  videoCard: {
    backgroundColor: "#F1EFFC",
    borderColor: "#D6D2F1",
  },
  priceTitle: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  priceAmount: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 11,
  },
  tabBtnActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  tabText: {
    color: "#64748B",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  blockTitle: {
    color: "#64748B",
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  bio: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    lineHeight: 24,
    fontSize: 16,
  },
  specialtiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specialtyPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EDF4FB",
    borderWidth: 1,
    borderColor: "#D6E6F7",
  },
  specialtyPillText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  chatBtn: {
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 13,
  },
  chatBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },
});
