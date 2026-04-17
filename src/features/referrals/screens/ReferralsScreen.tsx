import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getReferralSummary } from "../api/referralsApi";

export default function ReferralsScreen() {
  const [code, setCode] = useState("");
  const [invites, setInvites] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getReferralSummary();
        setCode(data.code);
        setInvites(data.invitedCount);
        setBonus(data.bonusCredits);
      } catch {
        setError("No se pudo cargar la información de referidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copiado", "Tu código de referido fue copiado.");
  }

  async function handleShare() {
    await Share.share({
      message: `Únete a PsyConnect con mi código ${code} y empieza tu proceso con profesionales verificados.`,
    });
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Referidos</Text>
        <Text style={styles.subtitle}>Invita a tus contactos y recibe créditos promocionales.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.cardLabel}>Tu código</Text>
          <Text style={styles.code}>{loading ? "Cargando..." : code}</Text>
          <View style={styles.actions}>
            <AppButton title="Copiar" variant="secondary" onPress={handleCopy} style={{ flex: 1 }} disabled={loading || !code} />
            <AppButton title="Compartir" onPress={handleShare} style={{ flex: 1 }} disabled={loading || !code} />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.row}>
            <Text style={styles.metricLabel}>Invitados</Text>
            <Text style={styles.metricValue}>{invites}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.metricLabel}>Bonos acumulados</Text>
            <Text style={[styles.metricValue, { color: appTheme.colors.success }]}>{bonus} créditos</Text>
          </View>
          <Text style={styles.todoHint}>El historial detallado de referidos se visualiza en el panel admin.</Text>
        </AppCard>
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
    fontSize: 28,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  cardLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  code: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 26,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  metricValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  todoHint: {
    color: appTheme.colors.textMuted,
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
