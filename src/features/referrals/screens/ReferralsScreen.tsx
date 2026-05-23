import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMyReferrals, type MyReferralsData, type ReferralHistoryItem } from "../api/referralsApi";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  QUALIFIED: "Valido",
};

const CASE_LABEL: Record<string, string> = {
  PRO_TO_PRO: "Pro → Pro",
  PRO_TO_USER: "Pro → Cliente",
  USER_TO_USER: "Cliente → Cliente",
};

const TYPE_LABEL: Record<string, string> = {
  SESSION: "Sesion",
  PACKAGE: "Paquete",
};

function ReferralRow({ item }: { item: ReferralHistoryItem }) {
  const fullName = item.referred.fullName || item.referred.email || "Usuario";
  const status = STATUS_LABEL[item.status] ?? item.status;
  const caseLabel = item.case ? CASE_LABEL[item.case] : null;

  return (
    <View style={styles.referralRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.referralName}>{fullName}</Text>
        <Text style={styles.referralMeta}>
          {item.referred.role} · {new Date(item.referred.createdAt).toLocaleDateString()}
        </Text>
        {caseLabel ? <Text style={styles.referralMeta}>Caso: {caseLabel}</Text> : null}
        {item.rewardPaidAt ? (
          <Text style={[styles.referralMeta, { color: appTheme.colors.success }]}>
            Recompensa pagada el {new Date(item.rewardPaidAt).toLocaleDateString()}
          </Text>
        ) : null}
        {item.rewards.length > 0 ? (
          <Text style={[styles.referralMeta, { color: appTheme.colors.success }]}>
            +{item.totalRewardsEarned.toFixed(2)} ganado
          </Text>
        ) : null}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    </View>
  );
}

export default function ReferralsScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<MyReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = data?.role ?? user?.role ?? null;
  const isProfessional = role === "PROFESSIONAL" || role === "ANFITRIONA";
  const rewardPercent = data?.rules.referralRewardPercent ?? 5;

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setData(await getMyReferrals());
    } catch {
      setError("No se pudo cargar la informacion de referidos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    Alert.alert("Copiado", "Tu codigo de referido fue copiado.");
  }

  async function handleShare() {
    if (!data?.code) return;
    await Share.share({
      message: `Usa mi codigo de referido ${data.code} para registrarte en SanaMente.`,
    });
  }

  const history = data?.history ?? [];
  const allRewards = history.flatMap((h) => h.rewards);

  const headerText = isProfessional
    ? `Comparte tu codigo y gana el ${rewardPercent}% de cada sesion que generen los profesionales que invites. Para clientes, ganas el ${rewardPercent}% en su primera compra.`
    : `Comparte tu codigo y gana el ${rewardPercent}% en la primera compra de cada persona que invites.`;

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Programa de referidos</Text>
        <Text style={styles.subtitle}>{headerText}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Código de referido */}
        <AppCard>
          <Text style={styles.label}>Tu codigo de referido</Text>
          <Text style={styles.code}>{loading ? "Cargando..." : data?.code || "-"}</Text>
          <View style={styles.actions}>
            <AppButton title="Copiar" variant="secondary" onPress={handleCopy} style={{ flex: 1 }} disabled={loading || !data?.code} />
            <AppButton title="Compartir" onPress={handleShare} style={{ flex: 1 }} disabled={loading || !data?.code} />
          </View>
        </AppCard>

        {/* Resumen */}
        <AppCard>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.progressValue}>
            {data?.invitedCount ?? 0} personas invitadas
          </Text>
          <Text style={styles.progressValue}>
            +{(data?.totalRewardsEarned ?? 0).toFixed(2)} ganado en total
          </Text>
        </AppCard>

        {/* Historial de recompensas (si tiene) */}
        {allRewards.length > 0 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Recompensas recibidas</Text>
            {allRewards.slice(0, 20).map((reward) => (
              <View key={reward.id} style={styles.rewardRow}>
                <Text style={styles.meta}>
                  {new Date(reward.createdAt).toLocaleDateString()} · {TYPE_LABEL[reward.type] ?? reward.type}
                  {reward.case ? ` · ${CASE_LABEL[reward.case] ?? reward.case}` : ""}
                </Text>
                <Text style={styles.rewardAmount}>
                  +{reward.rewardAmount.toFixed(2)} {reward.currency}
                </Text>
              </View>
            ))}
          </AppCard>
        ) : null}

        {/* Lista de referidos */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Referidos</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.refresh}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.meta}>Cargando...</Text>
        ) : history.length === 0 ? (
          <AppCard>
            <Text style={styles.meta}>Todavia no tienes referidos.</Text>
          </AppCard>
        ) : (
          history.map((item) => <ReferralRow key={item.id} item={item} />)
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 24,
  },
  subtitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  code: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 26,
    marginVertical: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  progressValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 18,
  },
  meta: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  rewardRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
  rewardAmount: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refresh: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 13,
  },
  referralRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 12,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  referralName: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 14,
  },
  referralMeta: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  badge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#312E81",
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 11,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
