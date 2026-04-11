import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionalById } from "../api/professionalsApi";
import type { Professional } from "../types";

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [professional, setProfessional] = useState<Professional | null>(null);

  useEffect(() => {
    void (async () => {
      const data = await getProfessionalById(params.id);
      setProfessional(data);
    })();
  }, [params.id]);

  if (!professional) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.loading}>Cargando perfil...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Image
          source={professional.avatar ? { uri: professional.avatar } : require("../../../../assets/no_image.jpg")}
          style={styles.hero}
        />
        <Text style={styles.name}>{professional.name}</Text>
        <View style={[styles.statusBadge, professional.isOnline ? styles.online : styles.offline]}>
          <Text style={[styles.statusText, professional.isOnline ? styles.onlineText : styles.offlineText]}>
            {professional.isOnline ? "Disponible ahora" : "No disponible"}
          </Text>
        </View>
        <Text style={styles.bio}>{professional.bio}</Text>

        <View style={styles.specialties}>
          {professional.specialties.length > 0 ? (
            professional.specialties.map((item) => <AppChip key={item} label={item} />)
          ) : (
            <AppChip label="Atención general" />
          )}
        </View>

        <AppCard>
          <Text style={styles.sectionTitle}>Tarifas de atención</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Chat</Text>
            <Text style={styles.priceValue}>{professional.prices.chat ?? "—"} cr</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Llamada</Text>
            <Text style={styles.priceValue}>{professional.prices.call ?? "—"} cr</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Videollamada</Text>
            <Text style={styles.priceValue}>{professional.prices.video ?? "—"} cr</Text>
          </View>
        </AppCard>

        <AppButton
          title="Iniciar chat"
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
        />

        <View style={styles.secondaryActions}>
          <AppButton title="Llamada (próximamente)" variant="secondary" onPress={() => {}} style={{ flex: 1 }} />
          <AppButton title="Video (próximamente)" variant="secondary" onPress={() => {}} style={{ flex: 1 }} />
        </View>
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
  container: {
    gap: 14,
  },
  hero: {
    width: "100%",
    height: 220,
    borderRadius: appTheme.radius.lg,
    backgroundColor: "#DCEAF7",
  },
  name: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  bio: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    lineHeight: 22,
    fontSize: 14,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  online: {
    backgroundColor: "rgba(107, 175, 138, 0.16)",
  },
  offline: {
    backgroundColor: "#EEF2F7",
  },
  onlineText: {
    color: appTheme.colors.success,
  },
  offlineText: {
    color: appTheme.colors.textMuted,
  },
  specialties: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  priceValue: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
  },
});

