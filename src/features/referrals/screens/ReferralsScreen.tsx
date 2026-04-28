import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getMyReferrals, type MyReferralsData, type ReferralHistoryItem } from "../api/referralsApi";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  QUALIFIED: "Calificado",
  REWARDED: "Recompensado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#B45309",
  ACTIVE: "#2563EB",
  QUALIFIED: "#7C3AED",
  REWARDED: appTheme.colors.success,
};

function ReferralCard({ item }: { item: ReferralHistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLOR[item.status] ?? appTheme.colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.referralCard}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View style={styles.referralHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.referralName}>
            {item.referred.fullName || item.referred.email || "Profesional"}
          </Text>
          <Text style={styles.referralMeta}>
            {item.referred.role === "PROFESSIONAL" || item.referred.role === "ANFITRIONA"
              ? "Psicólogo/Profesional"
              : "Usuario"}{" "}
            · {new Date(item.referred.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABEL[item.status] ?? item.status}
          </Text>
        </View>
      </View>

      <View style={styles.referralRewardRow}>
        <Text style={styles.rewardLabel}>Recompensas acumuladas</Text>
        <Text style={[styles.rewardValue, { color: appTheme.colors.success }]}>
          {item.totalRewardCredits.toFixed(2)} créditos
        </Text>
      </View>

      {expanded && item.rewardEvents.length > 0 ? (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Historial de recompensas</Text>

          {item.rewardEvents.map((ev) => (
            <View key={ev.id} style={styles.eventRow}>
              <Text style={styles.eventDate}>
                {new Date(ev.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.eventPercent}>{ev.percentageApplied}%</Text>
              <Text style={styles.eventAmount}>+{ev.rewardAmount.toFixed(2)} cr</Text>
            </View>
          ))}
        </View>
      ) : expanded && item.rewardEvents.length === 0 ? (
        <Text style={styles.eventsEmpty}>
          Sin recompensas aún. Se generan cuando el profesional cobra servicios.
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function ReferralsScreen() {
  const [data, setData] = useState<MyReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

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
    await Share.share({
      message: `Únete como profesional en Sanamente con mi código ${data.code} y empieza a atender pacientes verificados.`,
    });
  }

  const code = data?.code ?? "";
  const total = data?.invitedCount ?? 0;
  const bonus = data?.bonusCredits ?? 0;
  const history = data?.history ?? [];
  const stats = data?.stats ?? { pending: 0, active: 0, qualified: 0, rewarded: 0 };

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Programa de referidos</Text>
        <Text style={styles.subtitle}>
          Invita profesionales con tu código y gana el {"\u00b7"} del porcentaje configurado
          sobre sus ganancias reales.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.cardLabel}>Tu código de referido</Text>
          <Text style={styles.code}>{loading ? "Cargando..." : code || "—"}</Text>

          <View style={styles.actions}>
            <AppButton
              title="Copiar"
              variant="secondary"
              onPress={handleCopy}
              style={{ flex: 1 }}
              disabled={loading || !code}
            />
            <AppButton
              title="Compartir"
              onPress={handleShare}
              style={{ flex: 1 }}
              disabled={loading || !code}
            />
          </View>

          <Text style={styles.hint}>
            Comparte este código con psicólogos que quieran unirse a la plataforma.
          </Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Resumen</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Profesionales referidos</Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: appTheme.colors.success }]}>
                {bonus.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Créditos ganados</Text>
            </View>

            <View style={styles.statCell}>
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>

            <View style={styles.statCell}>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>
        </AppCard>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Profesionales referidos</Text>

          <TouchableOpacity onPress={load}>
            <Text style={styles.refreshBtn}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : history.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyTitle}>Sin referidos aún</Text>
            <Text style={styles.emptyText}>
              Comparte tu código con profesionales. Cuando se registren y generen ganancias,
              recibirás un porcentaje aquí.
            </Text>
          </AppCard>
        ) : (
          history.map((item) => <ReferralCard key={item.id} item={item} />)
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
    fontSize: 26,
  },

  subtitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },

  cardLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },

  code: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 26,
    letterSpacing: 1,
    marginVertical: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  hint: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },

  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statCell: {
    minWidth: 100,
    flex: 1,
    alignItems: "center",
    gap: 2,
  },

  statValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 22,
  },

  statLabel: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textAlign: "center",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  refreshBtn: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },

  loadingText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },

  emptyTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },

  emptyText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  referralCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 14,
    gap: 8,
  },

  referralHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
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
    marginTop: 2,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },

  statusText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },

  referralRewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rewardLabel: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },

  rewardValue: {
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 14,
  },

  eventsContainer: {
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    paddingTop: 8,
    gap: 6,
    marginTop: 4,
  },

  eventsTitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },

  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  eventDate: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    flex: 1,
  },

  eventPercent: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginHorizontal: 8,
  },

  eventAmount: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 12,
  },

  eventsEmpty: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },

  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});

