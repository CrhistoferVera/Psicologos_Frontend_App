import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { appTheme } from "../../../theme/appTheme";
import type { CommunicationAccess } from "../../../api/communication";
import type { Professional } from "../../professionals/types";
import { useUserRegion } from "../../../hooks/useUserRegion";
import SpecialtiesModal from "./SpecialtiesModal";

type ImmediateData = {
  priceBob: number;
  priceUsd: number;
  durationMinutes: number;
  expiresAt: string;
  description?: string | null;
};

type Props = {
  professional: Professional;
  cardHeight: number;
  onProfilePress: () => void;
  onChatPress: () => void;
  chatLoading?: boolean;
  communicationAccess?: CommunicationAccess | null;
  communicationAccessLoading?: boolean;
  mode?: 'normal' | 'immediate';
  immediateData?: ImmediateData;
  onImmediatePress?: () => void;
};

const NO_IMAGE = require("../../../../assets/no_image.jpg");

export default function ProfessionalFeedCard({
  professional,
  cardHeight,
  onProfilePress,
  onChatPress,
  chatLoading = false,
  communicationAccess = null,
  mode = 'normal',
  immediateData,
  onImmediatePress,
}: Props) {
  const bgSource =
    professional.coverImage
      ? { uri: professional.coverImage }
      : professional.avatar
      ? { uri: professional.avatar }
      : NO_IMAGE;

  const [showSpecialties, setShowSpecialties] = useState(false);

  const { isBolivian } = useUserRegion();
  const username = professional.username ? `@${professional.username}` : null;
  const bio = professional.bio?.trim() || null;
  const canCommunicate = communicationAccess?.allowed === true;
  const hiddenSpecialties = Math.max(0, professional.specialties.length - 2);

  const lowestSessionPrice =
    (isBolivian ? professional.lowestSessionPriceBob : professional.lowestSessionPriceUsd) ?? null;

  function formatPrice(value: number) {
    const amount = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return isBolivian ? `Bs. ${amount}` : `${amount} USD`;
  }

  return (
    // La tarjeta no navega: solo el avatar, el nombre y el boton de agendar
    // llevan al perfil, para no disparar la navegacion con cualquier toque.
    <View style={[styles.card, { height: cardHeight }]}>
      <Image source={bgSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.overlay} />

      <LinearGradient
        colors={["transparent", "rgba(5,10,20,0.50)", "rgba(5,10,20,0.94)"]}
        locations={[0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {mode === 'immediate' ? (
        <View style={styles.immediateBadge}>
          <Ionicons name="flash" size={11} color="#FCA5A5" />
          <Text style={styles.immediateBadgeText}>Atención Inmediata</Text>
        </View>
      ) : (
        <View style={styles.topRightStack}>
          <View style={[styles.onlineBadge, !professional.isOnline && styles.offlineBadge]}>
            {professional.isOnline ? <View style={styles.onlineDot} /> : null}
            <Text style={[styles.onlineText, !professional.isOnline && styles.offlineText]}>
              {professional.isOnline ? "Disponible" : "No disponible"}
            </Text>
          </View>

          {lowestSessionPrice !== null ? (
            <View style={styles.sessionPriceBadge}>
              <Ionicons name="pricetag-outline" size={11} color="#D6EAFF" />
              <Text style={styles.sessionPriceText}>
                Sesiones desde {formatPrice(lowestSessionPrice)}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.infoPanel}>
        <View style={styles.nameRow}>
          <Pressable onPress={onProfilePress} hitSlop={6}>
            <Image
              source={professional.avatar ? { uri: professional.avatar } : NO_IMAGE}
              style={styles.miniAvatar}
            />
          </Pressable>

          <Pressable style={{ flex: 1 }} onPress={onProfilePress} hitSlop={6}>
            <Text style={styles.name} numberOfLines={1}>
              {professional.name}
            </Text>
            {username ? (
              <Text style={styles.username} numberOfLines={1}>
                {username}
              </Text>
            ) : null}
          </Pressable>
        </View>

        {professional.specialties.length > 0 && (
          <View style={styles.specialtiesRow}>
            <Text style={styles.specialtiesText} numberOfLines={1}>
              {professional.specialties.slice(0, 2).join(" · ")}
            </Text>
            {hiddenSpecialties > 0 ? (
              <Pressable
                style={styles.specialtiesMoreBtn}
                hitSlop={6}
                onPress={() => setShowSpecialties(true)}
              >
                <Text style={styles.specialtiesMoreText}>+{hiddenSpecialties}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {professional.languages && professional.languages.length > 0 && (
          <View style={styles.langsRow}>
            <View style={styles.langsIconWrap}>
              <Ionicons name="chatbubbles-outline" size={11} color="rgba(255,255,255,0.70)" />
            </View>
            <Text style={styles.langsLabel}>Habla</Text>
            <View style={styles.langsDivider} />
            {professional.languages.slice(0, 3).map((lang) => (
              <View key={lang} style={styles.langTag}>
                <Text style={styles.langTagText}>{lang}</Text>
              </View>
            ))}
            {professional.languages.length > 3 && (
              <View style={[styles.langTag, styles.langTagMore]}>
                <Text style={styles.langTagText}>+{professional.languages.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {bio}
          </Text>
        ) : null}

        {mode === 'immediate' ? (
          <>
            {/* Precio y duración inline */}
            {immediateData ? (
              <View style={styles.immediateInfoRow}>
                <View style={styles.immediateInfoChip}>
                  <Ionicons name="cash-outline" size={12} color="#FCA5A5" />
                  <Text style={styles.immediateInfoText}>
                    {isBolivian ? `Bs. ${immediateData.priceBob}` : `${immediateData.priceUsd} USD`}
                  </Text>
                </View>
                <View style={styles.immediateInfoChip}>
                  <Ionicons name="time-outline" size={12} color="#FCA5A5" />
                  <Text style={styles.immediateInfoText}>{immediateData.durationMinutes} min</Text>
                </View>
              </View>
            ) : null}
            <Pressable
              style={styles.immediateBtn}
              onPress={() => onImmediatePress?.()}
            >
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Text style={styles.immediateBtnText}>Recibir atención ahora</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.scheduleBtn, !professional.isOnline && styles.scheduleBtnDisabled]}
              onPress={onProfilePress}
              disabled={!professional.isOnline}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={professional.isOnline ? "#FFFFFF" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.scheduleBtnText,
                  !professional.isOnline && styles.scheduleBtnTextDisabled,
                ]}
              >
                Agendar sesión
              </Text>
            </Pressable>

            {/* El chat solo se muestra cuando hay una sesión que lo habilita:
                un boton permanentemente apagado solo agregaba ruido. */}
            {canCommunicate ? (
              <Pressable
                style={styles.chatIconBtn}
                onPress={onChatPress}
                disabled={chatLoading}
              >
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="chatbubble-outline" size={19} color="#FFFFFF" />
                )}
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <SpecialtiesModal
        visible={showSpecialties}
        onClose={() => setShowSpecialties(false)}
        professionalName={professional.name}
        avatarUrl={professional.avatar}
        specialties={professional.specialties}
      />
    </View>
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
  topRightStack: {
    position: "absolute",
    top: 16,
    right: 16,
    alignItems: "flex-end",
    gap: 6,
  },
  sessionPriceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,20,40,0.60)",
    borderWidth: 1,
    borderColor: "rgba(91,155,213,0.55)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sessionPriceText: {
    color: "#D6EAFF",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
  onlineBadge: {
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
  offlineBadge: {
    borderColor: "rgba(203,213,225,0.45)",
    backgroundColor: "rgba(15,23,42,0.58)",
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
  offlineText: {
    color: "#CBD5E1",
  },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 28,
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
    alignItems: "center",
    gap: 8,
  },
  specialtiesText: {
    flexShrink: 1,
    color: "#BFDBFE",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  specialtiesMoreBtn: {
    backgroundColor: "rgba(91,155,213,0.28)",
    borderWidth: 1,
    borderColor: "rgba(91,155,213,0.50)",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  specialtiesMoreText: {
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
  },
  scheduleBtnDisabled: {
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  scheduleBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  scheduleBtnTextDisabled: {
    color: "#94A3B8",
  },
  chatIconBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  langsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  langFlag: {
    fontSize: 12,
    lineHeight: 16,
  },
  langText: {
    color: "rgba(255,255,255,0.90)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  langMore: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
    alignSelf: "center",
  },
  langsLabel: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  langsValue: {
    color: "rgba(255,255,255,0.90)",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  langsIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  langsDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginHorizontal: 2,
  },
  langTag: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  langTagMore: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  langTagText: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  immediateInfoRow: {
    flexDirection: "row",
    gap: 8,
  },
  immediateInfoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(220,38,38,0.25)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.40)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  immediateInfoText: {
    color: "#FCA5A5",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  immediateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 6,
  },
  immediateBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  immediateBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(127,10,10,0.60)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.60)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  immediateBadgeText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
});
