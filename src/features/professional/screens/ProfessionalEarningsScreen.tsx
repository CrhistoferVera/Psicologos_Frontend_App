import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Clipboard, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionalEarningsData } from "../api/professionalApi";
import { getMyReferrals } from "../../referrals/api/referralsApi";

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMovementTime(iso?: string) {
  if (!iso) return "Hoy 11:30";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Hoy 11:30";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const hour = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return sameDay ? `Hoy ${hour}` : `${date.getDate()}/${date.getMonth() + 1} ${hour}`;
}

function prettifyService(service: string) {
  const value = String(service || "").toLowerCase();
  if (value.includes("video")) return "Videollamada";
  if (value.includes("call") || value.includes("llamada")) return "Llamada";
  if (value.includes("message") || value.includes("chat")) return "Chat";
  return "Sesión";
}

export default function ProfessionalEarningsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, referralData] = await Promise.all([
          getProfessionalEarningsData(),
          getMyReferrals().catch(() => null),
        ]);
        setEarnings(data);
        if (referralData?.code) setReferralCode(referralData.code);
      } catch {
        setError("No se pudo cargar la información de ganancias.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleCopyCode() {
    if (!referralCode) return;
    Clipboard.setString(referralCode);
    Alert.alert("Copiado", `Tu código ${referralCode} fue copiado al portapapeles.`);
  }

  const gross = useMemo(() => {
    if (!Array.isArray(earnings?.transactions)) return 0;
    return earnings.transactions.reduce((acc: number, tx: any) => acc + Number(tx.amount ?? 0), 0);
  }, [earnings]);

  const net = Number(earnings?.total ?? earnings?.balance ?? 0);
  const commission = Math.max(gross - net, 0);
  const referrals = Number((earnings as any)?.referrals ?? 0);

  const thisWeek = Number(earnings?.thisWeek ?? 0);
  const thisMonth = net;
  const historical = gross;

  const txList = Array.isArray(earnings?.transactions) ? earnings.transactions.slice(0, 8) : [];

  function handleWithdraw() {
    Alert.alert("Próximamente", "El flujo guiado de solicitud de retiro se habilitará en la siguiente iteración.");
  }

  function handleReport() {
    Alert.alert("Próximamente", "La exportación de reportes estará disponible pronto.");
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Ganancias</Text>
        </View>

        {loading ? <Text style={styles.info}>Cargando información...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Ganancia neta (55%)</Text>
          <Text style={styles.heroValue}>{formatMoney(thisMonth)}</Text>

          <View style={styles.heroBreakdown}>
            <View style={styles.heroCol}>
              <Text style={styles.heroColValue}>{formatMoney(gross)}</Text>
              <Text style={styles.heroColLabel}>Bruto total</Text>
            </View>

            <View style={styles.heroCol}>
              <Text style={styles.heroColValue}>{formatMoney(commission)}</Text>
              <Text style={styles.heroColLabel}>Comisión (45%)</Text>
            </View>

            <View style={styles.heroCol}>
              <Text style={styles.heroColValue}>+{formatMoney(referrals)}</Text>
              <Text style={styles.heroColLabel}>Referidos</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.withdrawBtn} onPress={handleWithdraw}>
            <Text style={styles.withdrawText}>💰 Solicitar retiro</Text>
          </Pressable>

          <Pressable style={styles.reportBtn} onPress={handleReport}>
            <Text style={styles.reportText}>📊 Ver reporte</Text>
          </Pressable>
        </View>

        <View style={styles.kpisRow}>
          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatMoney(thisWeek)}</Text>
            <Text style={styles.kpiLabel}>Esta semana</Text>
          </AppCard>

          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatMoney(thisMonth)}</Text>
            <Text style={styles.kpiLabel}>Este mes</Text>
          </AppCard>

          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatMoney(historical)}</Text>
            <Text style={styles.kpiLabel}>Total histórico</Text>
          </AppCard>
        </View>

        {referralCode ? (
          <AppCard style={styles.referralCard}>
            <Text style={styles.referralTitle}>Tu código de referido</Text>
            <Text style={styles.referralSubtitle}>Comparte tu código. Ganas el 2.5% de las ganancias reales de cada profesional que registres.</Text>
            <Pressable style={styles.codeRow} onPress={handleCopyCode}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <Ionicons name="copy-outline" size={18} color={appTheme.colors.primary} />
            </Pressable>
          </AppCard>
        ) : null}

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>

        {txList.length === 0 && !loading ? (
          <AppCard style={{ marginHorizontal: 14 }}>
            <Text style={styles.info}>Sin movimientos de ganancia.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={txList}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            contentContainerStyle={styles.movementsList}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => {
              const amount = Number(item.amount ?? 0);
              const grossApprox = amount > 0 ? amount / 0.55 : 0;

              return (
                <AppCard style={styles.moveCard}>
                  <View style={styles.moveTop}>
                    <Text style={styles.moveClient}>{item.clientName || "Cliente"}</Text>
                    <Text style={styles.moveAmount}>+{formatMoney(amount)}</Text>
                  </View>

                  <View style={styles.moveMid}>
                    <Text style={styles.moveService}>{prettifyService(item.service)}</Text>
                    <Text style={styles.moveGross}>de {formatMoney(grossApprox)} bruto</Text>
                  </View>

                  <Text style={styles.moveTime}>{formatMovementTime(item.createdAt)}</Text>
                </AppCard>
              );
            }}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: appTheme.colors.background,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 32,
    fontWeight: "700",
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  heroCard: {
    marginHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#3E7F61",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  heroLabel: {
    color: "#DDF3E7",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  heroValue: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "700",
  },
  heroBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },
  heroCol: {
    flex: 1,
  },
  heroColValue: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  heroColLabel: {
    marginTop: 2,
    color: "#D7EFE3",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
  },
  withdrawBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: "#6AB88A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  withdrawText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  reportBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D3DEE9",
    backgroundColor: "#F6F9FD",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  reportText: {
    color: "#5C7391",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  kpisRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
  },
  kpiCard: {
    flex: 1,
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  kpiValue: {
    color: "#69AF8A",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  kpiLabel: {
    marginTop: 4,
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 16,
  },
  sectionTitle: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 14,
    marginTop: 4,
  },
  movementsList: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  moveCard: {
    borderRadius: 16,
    gap: 4,
  },
  moveTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moveClient: {
    color: "#1F3651",
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  moveAmount: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  moveMid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  moveService: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  moveGross: {
    color: "#8AA0BA",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  moveTime: {
    color: "#8AA0BA",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  referralCard: {
    marginHorizontal: 14,
    gap: 6,
  },
  referralTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  referralSubtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: appTheme.colors.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  codeText: {
    flex: 1,
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
