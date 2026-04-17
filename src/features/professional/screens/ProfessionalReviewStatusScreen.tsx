import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getMyProfessionalReviewStatus } from "../api/professionalApi";

export default function ProfessionalReviewStatusScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [notes, setNotes] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const review = await getMyProfessionalReviewStatus();
        setStatus(review.status);
        setNotes(review.notes ?? null);
      } catch {
        setError("No se pudo cargar el estado de revisión.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusLabel = useMemo(() => {
    if (status === "APPROVED") return "Aprobado";
    if (status === "REJECTED") return "Rechazado";
    return "Pendiente de aprobación";
  }, [status]);

  const statusColor = useMemo(() => {
    if (status === "APPROVED") return appTheme.colors.success;
    if (status === "REJECTED") return appTheme.colors.danger;
    return "#B45309";
  }, [status]);

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Estado del registro profesional</Text>
        <Text style={styles.subtitle}>Consulta el estado de revisión de tu perfil profesional.</Text>

        {loading ? <Text style={styles.meta}>Cargando estado...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.cardTitle}>Estado actual</Text>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
          {notes ? <Text style={styles.meta}>Observación: {notes}</Text> : null}
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Siguientes pasos</Text>
          <Text style={styles.meta}>1. Completa tu perfil, especialidades y disponibilidad.</Text>
          <Text style={styles.meta}>2. Ajusta tus tarifas de chat, llamada y video.</Text>
          <Text style={styles.meta}>3. Cuando el equipo apruebe tu cuenta, aparecerás en el listado público.</Text>
        </AppCard>

        <AppButton title="Ir al dashboard profesional" onPress={() => router.replace("/(professional)/dashboard")} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
    justifyContent: "center",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  status: {
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 14,
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
