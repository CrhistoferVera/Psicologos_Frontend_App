import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";

export default function ProfessionalReviewStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string | string[]; specialties?: string | string[] }>();
  const name = Array.isArray(params.name) ? params.name[0] : params.name ?? "Profesional";
  const specialties = Array.isArray(params.specialties) ? params.specialties[0] : params.specialties ?? "";

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Registro enviado</Text>
        <Text style={styles.subtitle}>Tu perfil profesional quedo en revision. Ya puedes usar el panel y completar ajustes.</Text>

        <AppCard>
          <Text style={styles.cardTitle}>Estado actual</Text>
          <Text style={styles.status}>Pendiente de aprobacion</Text>
          <Text style={styles.meta}>Profesional: {name}</Text>
          <Text style={styles.meta}>Especialidades: {specialties || "Se asignaran durante revision"}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Siguientes pasos</Text>
          <Text style={styles.meta}>1. Configura tu perfil y disponibilidad.</Text>
          <Text style={styles.meta}>2. Ajusta tus tarifas de chat, llamada y video.</Text>
          <Text style={styles.meta}>3. Cuando el equipo apruebe tu cuenta, apareceras en el listado publico.</Text>
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
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 14,
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
});
