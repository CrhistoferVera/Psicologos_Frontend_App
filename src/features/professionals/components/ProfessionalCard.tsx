import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import type { Professional } from "../types";

type Props = {
  professional: Professional;
  onPress: () => void;
};

export default function ProfessionalCard({ professional, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <AppCard>
        <View style={styles.row}>
          <Image
            source={
              professional.avatar
                ? { uri: professional.avatar }
                : require("../../../../assets/no_image.jpg")
            }
            style={styles.avatar}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{professional.name}</Text>
            <Text style={styles.specialtyText} numberOfLines={1}>
              {professional.specialties.length > 0
                ? professional.specialties.join(" · ")
                : "Atención profesional general"}
            </Text>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.badge,
                  professional.isOnline ? styles.onlineBadge : styles.offlineBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    professional.isOnline ? styles.onlineText : styles.offlineText,
                  ]}
                >
                  {professional.isOnline ? "Disponible" : "No disponible"}
                </Text>
              </View>

              {professional.rating ? (
                <Text style={styles.rating}>★ {professional.rating.toFixed(1)}</Text>
              ) : null}
            </View>
          </View>

        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E2E8F0",
  },

  info: {
    flex: 1,
    gap: 6,
  },

  name: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },

  specialtyText: {
    color: "#475569",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },

  onlineBadge: {
    backgroundColor: "rgba(107, 175, 138, 0.16)",
    borderColor: "rgba(107, 175, 138, 0.28)",
  },

  offlineBadge: {
    backgroundColor: "#F1F5F9",
    borderColor: appTheme.colors.border,
  },

  badgeText: {
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },

  onlineText: {
    color: appTheme.colors.success,
  },

  offlineText: {
    color: appTheme.colors.textMuted,
  },

  rating: {
    color: appTheme.colors.text,
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },

});

