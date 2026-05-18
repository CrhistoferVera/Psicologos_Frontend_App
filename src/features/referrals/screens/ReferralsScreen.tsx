import { useEffect, useMemo, useState } from "react";
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
  ACTIVE: "Activo",
  QUALIFIED: "Valido",
  REWARDED: "Recompensado",
};

function ReferralRow({ item }: { item: ReferralHistoryItem }) {
  const fullName = item.referred.fullName || item.referred.email || "Usuario";
  const status = STATUS_LABEL[item.status] ?? item.status;

  return (
    <View style={styles.referralRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.referralName}>{fullName}</Text>
        <Text style={styles.referralMeta}>
          {item.referred.role} · {new Date(item.referred.createdAt).toLocaleDateString()}
        </Text>
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

  const rules = data?.rules ?? {
    validPurchasesRequired: 1,
    threshold: 10,
    clientDiscountPercent: 5,
    clientDiscountSessions: 10,
    professionalRewardPercent: 5,
  };
  const progress = data?.progress ?? {
    valid: 0,
    threshold: rules.threshold,
    pending: 0,
    cyclesUnlocked: 0,
  };

  const headerText = useMemo(() => {
    if (isProfessional) {
      return `Cuando ${rules.threshold} personas invitadas cumplan las compras validas requeridas, recibes ${rules.professionalRewardPercent}% permanente de las sesiones que generen esas personas.`;
    }
    return `Cuando ${rules.threshold} personas invitadas cumplan las compras validas requeridas, recibes ${rules.clientDiscountPercent}% de descuento en ${rules.clientDiscountSessions} sesiones.`;
  }, [isProfessional, rules]);

  const remainingDiscountSessions = data?.clientBenefit?.remainingDiscountSessions ?? 0;
  const beneficiaries = data?.professionalBenefit?.beneficiaries ?? [];
  const rewardsHistory = data?.professionalBenefit?.rewardsHistory ?? [];
  const history = data?.history ?? [];

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Programa de referidos</Text>
        <Text style={styles.subtitle}>{headerText}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.label}>Tu codigo de referido</Text>
          <Text style={styles.code}>{loading ? "Cargando..." : data?.code || "-"}</Text>
          <View style={styles.actions}>
            <AppButton title="Copiar" variant="secondary" onPress={handleCopy} style={{ flex: 1 }} disabled={loading || !data?.code} />
            <AppButton title="Compartir" onPress={handleShare} style={{ flex: 1 }} disabled={loading || !data?.code} />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Progreso</Text>
          <Text style={styles.progressValue}>
            {progress.valid} / {progress.threshold} referidos validos
          </Text>
          <Text style={styles.meta}>
            Compras validas requeridas por referido: {rules.validPurchasesRequired}
          </Text>
          <Text style={styles.meta}>Cuenta recargas de saldo y sesiones pagadas.</Text>
          <Text style={styles.meta}>Referidos pendientes: {progress.pending}</Text>
        </AppCard>

        {!isProfessional ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Beneficio activo</Text>
            <Text style={styles.progressValue}>
              Te quedan {remainingDiscountSessions} sesiones con {rules.clientDiscountPercent}% de descuento.
            </Text>
            <Text style={styles.meta}>El descuento se consume solo en sesiones pagadas.</Text>
          </AppCard>
        ) : (
          <AppCard>
            <Text style={styles.sectionTitle}>Beneficiarios permanentes</Text>
            <Text style={styles.progressValue}>{beneficiaries.length} activos</Text>
            {beneficiaries.slice(0, 10).map((item) => (
              <Text key={item.id} style={styles.meta}>
                • {item.referredUser.fullName || item.referredUser.email || item.referredUserId}
              </Text>
            ))}
            {beneficiaries.length === 0 ? <Text style={styles.meta}>Sin beneficiarios todavia.</Text> : null}
          </AppCard>
        )}

        {isProfessional ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Historial de recompensas</Text>
            {rewardsHistory.length === 0 ? (
              <Text style={styles.meta}>Sin recompensas registradas aun.</Text>
            ) : (
              rewardsHistory.slice(0, 10).map((reward) => (
                <View key={reward.id} style={styles.rewardRow}>
                  <Text style={styles.meta}>
                    {new Date(reward.createdAt).toLocaleDateString()} · {reward.referred.fullName || reward.referred.email || "Referido"}
                  </Text>
                  <Text style={styles.rewardAmount}>
                    +{reward.rewardAmount.toFixed(2)} {reward.currency}
                  </Text>
                </View>
              ))
            )}
          </AppCard>
        ) : null}

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
