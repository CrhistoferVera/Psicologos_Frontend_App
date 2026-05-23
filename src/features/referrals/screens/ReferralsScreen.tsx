import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMyReferrals, type MyReferralsData } from "../api/referralsApi";
import ReferralStatsRow from "../components/ReferralStatsRow";

function BenefitItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIconWrap}>
        <Text style={styles.benefitIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function ReferralsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<MyReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = data?.role ?? user?.role ?? null;
  const isProfessional = role === "PROFESSIONAL" || role === "ANFITRIONA";
  const rewardPercent = data?.rules.referralRewardPercent ?? 5;

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setData(await getMyReferrals());
    } catch {
      setError("No se pudo cargar la información de referidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    Alert.alert("Copiado", "Tu código de referido fue copiado.");
  }

  async function handleShare() {
    if (!data?.code) return;
    await Share.share({ message: `Usa mi código de referido ${data.code} para registrarte en SanaMente.` });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.pageHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.title}>Programa de referidos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <ReferralStatsRow data={data} />

        {/* Código */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Tu código de referido</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{loading ? "•••••" : data?.code || "-"}</Text>
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.codeBtn} onPress={handleCopy} disabled={loading || !data?.code}>
              <Text style={styles.codeBtnText}>📋  Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.codeBtn, styles.codeBtnPrimary]} onPress={handleShare} disabled={loading || !data?.code}>
              <Text style={[styles.codeBtnText, { color: "#FFFFFF" }]}>↗  Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cómo funciona */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cómo funciona</Text>
          {isProfessional ? (
            <>
              <BenefitItem icon="🤝" title={`Psicólogos · ${rewardPercent}% recurrente`} desc="Cada vez que un cliente pague una sesión al psicólogo que invitaste, recibes el porcentaje automáticamente." />
              <View style={styles.divider} />
              <BenefitItem icon="👤" title={`Clientes · ${rewardPercent}% una vez`} desc="Cuando el cliente referido realice su primera compra, recibes tu recompensa." />
            </>
          ) : (
            <BenefitItem icon="🎁" title={`${rewardPercent}% en la primera compra`} desc="Cuando tu amigo realice su primera compra en SanaMente, recibes tu recompensa de inmediato." />
          )}
        </View>

        {/* Navegación a otras pantallas */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navCard} onPress={() => router.push("./referral-rewards" as any)}>
            <LinearGradient colors={["#064E3B", "#065F46"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.navIconWrap}>
              <Ionicons name="gift" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.navCardTitle}>Recompensas</Text>
            <Text style={styles.navCardSub}>Ver historial</Text>
            <Ionicons name="arrow-forward" size={14} color={appTheme.colors.textMuted} style={styles.navArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push("./my-referrals" as any)}>
            <LinearGradient colors={["#1E3A8A", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.navIconWrap}>
              <Ionicons name="people" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.navCardTitle}>Mis referidos</Text>
            <Text style={styles.navCardSub}>Ver personas</Text>
            <Ionicons name="arrow-forward" size={14} color={appTheme.colors.textMuted} style={styles.navArrow} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 22,
  },
  container: {
    padding: 14,
    paddingTop: 6,
    gap: 14,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: appTheme.radius.md,
    padding: 12,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  codeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  codeLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  codeBox: {
    backgroundColor: "#F0F7FF",
    borderRadius: appTheme.radius.md,
    borderWidth: 2,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  codeText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 28,
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  codeBtn: {
    flex: 1,
    borderRadius: appTheme.radius.md,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  codeBtnPrimary: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  codeBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 16,
  },
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 10,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitIcon: {
    fontSize: 20,
  },
  benefitTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 3,
  },
  benefitDesc: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  navBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
  },
  navCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 16,
    alignItems: "flex-start",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  navIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  navCardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 14,
  },
  navCardSub: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  navArrow: {
    marginTop: 4,
  },
  navBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navBtnIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 14,
  },
});
