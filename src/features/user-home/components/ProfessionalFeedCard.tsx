import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { appTheme } from "../../../theme/appTheme";
import type { Professional } from "../../professionals/types";

type Props = {
  professional: Professional;
  cardHeight: number;
  onProfilePress: () => void;
  onChatPress: () => void;
  chatLoading?: boolean;
};

const NO_IMAGE = require("../../../../assets/no_image.jpg");

function PriceTag({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: number | null | undefined;
}) {
  if (!value) return null;
  return (
    <View style={styles.priceTag}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.85)" />
      <Text style={styles.priceTagText}>{value} crd</Text>
      <Text style={styles.priceTagLabel}>{label}</Text>
    </View>
  );
}

export default function ProfessionalFeedCard({
  professional,
  cardHeight,
  onProfilePress,
  onChatPress,
  chatLoading = false,
}: Props) {
  const bgSource =
    professional.coverImage
      ? { uri: professional.coverImage }
      : professional.avatar
      ? { uri: professional.avatar }
      : NO_IMAGE;

  const username = professional.username ? `@${professional.username}` : null;
  const bio = professional.bio?.trim() || null;

  return (
    // Tapping the card background navigates to full profile
    <Pressable
      style={[styles.card, { height: cardHeight }]}
      onPress={onProfilePress}
      android_ripple={null}
    >
      {/* Background image */}
      <Image
        source={bgSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Bottom gradient — covers ~55% of card from bottom */}
      <LinearGradient
        colors={["transparent", "rgba(5,10,20,0.50)", "rgba(5,10,20,0.94)"]}
        locations={[0.3, 0.60, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Online badge — top right of card */}
      {professional.isOnline && (
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>En línea</Text>
        </View>
      )}

      {/* Bottom info panel */}
      <View style={styles.infoPanel}>
        {/* Row: mini avatar + name/username */}
        <View style={styles.nameRow}>
          <Image
            source={professional.avatar ? { uri: professional.avatar } : NO_IMAGE}
            style={styles.miniAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {professional.name}
            </Text>
            {username ? (
              <Text style={styles.username} numberOfLines={1}>
                {username}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Specialties */}
        {professional.specialties.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesRow}
          >
            {professional.specialties.slice(0, 4).map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Bio */}
        {bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {bio}
          </Text>
        ) : null}

        {/* Prices */}
        <View style={styles.pricesRow}>
          <PriceTag
            icon="chatbubble-outline"
            label="chat"
            value={professional.prices.chat}
          />
          <PriceTag
            icon="call-outline"
            label="llamada"
            value={professional.prices.call}
          />
          <PriceTag
            icon="videocam-outline"
            label="video"
            value={professional.prices.video}
          />
        </View>

        {/* CTA — solo Chat */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, styles.chatBtn]}
            onPress={(e) => { e.stopPropagation?.(); onChatPress(); }}
            disabled={chatLoading}
          >
            {chatLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Chat</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Hint — tap card for full profile */}
        <Text style={styles.tapHint}>Toca para ver el perfil completo</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#0a0f1a",
    overflow: "hidden",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  // Online badge — anchored 16px from top (no floating header to avoid)
  onlineBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,25,10,0.60)",
    borderWidth: 1,
    borderColor: "rgba(107,175,138,0.55)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: appTheme.colors.success,
  },

  onlineText: {
    color: "#A7F3C8",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },

  // Info panel — anchored to bottom with proper breathing room
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 22,
    gap: 10,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  miniAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.65)",
    backgroundColor: "#1a2a3a",
  },

  name: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  username: {
    color: "rgba(255,255,255,0.60)",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    marginTop: 1,
  },

  specialtiesRow: {
    flexDirection: "row",
    gap: 6,
  },

  chip: {
    backgroundColor: "rgba(91,155,213,0.30)",
    borderWidth: 1,
    borderColor: "rgba(91,155,213,0.50)",
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },

  chipText: {
    color: "#D6EAFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },

  bio: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },

  pricesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  priceTagText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },

  priceTagLabel: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 99,
    minHeight: 42,
  },

  chatBtn: {
    backgroundColor: appTheme.colors.primary,
    flex: 1,
  },

  actionBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },

  tapHint: {
    color: "rgba(255,255,255,0.28)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
