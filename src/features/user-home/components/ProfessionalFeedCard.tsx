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
import type { ProfessionalSessionOffering } from "../../../api/bookings";
import type { CommunicationAccess } from "../../../api/communication";
import type { Professional } from "../../professionals/types";

type Props = {
  professional: Professional;
  cardHeight: number;
  onProfilePress: () => void;
  onChatPress: () => void;
  onReservePress: (offeringId: string) => void;
  offerings: ProfessionalSessionOffering[] | null;
  offeringsLoading?: boolean;
  reserveLoadingOfferingId?: string | null;
  preferredCurrency: "BOB" | "USD" | null;
  canReserve: boolean;
  chatLoading?: boolean;
  communicationAccess?: CommunicationAccess | null;
  communicationAccessLoading?: boolean;
};

const NO_IMAGE = require("../../../../assets/no_image.jpg");

export default function ProfessionalFeedCard({
  professional,
  cardHeight,
  onProfilePress,
  onChatPress,
  onReservePress,
  offerings,
  offeringsLoading = false,
  reserveLoadingOfferingId = null,
  preferredCurrency,
  canReserve,
  chatLoading = false,
  communicationAccess = null,
  communicationAccessLoading = false,
}: Props) {
  const bgSource =
    professional.coverImage
      ? { uri: professional.coverImage }
      : professional.avatar
      ? { uri: professional.avatar }
      : NO_IMAGE;

  const username = professional.username ? `@${professional.username}` : null;
  const bio = professional.bio?.trim() || null;
  const highlightedOffering = offerings?.[0] ?? null;
  const hasMoreOfferings = (offerings?.length ?? 0) > 1;
  const canCommunicate = communicationAccess?.allowed === true;

  const communicationHint = communicationAccessLoading
    ? "Validando acceso a comunicación..."
    : canCommunicate
    ? `Sesión activa hasta ${formatSessionTime(communicationAccess?.sessionEndsAt)}`
    : "Reserva una sesión para habilitar mensajes y llamadas.";

  function formatOfferingPrice(offering: ProfessionalSessionOffering) {
    if (preferredCurrency === "USD") {
      return `$ ${Number(offering.priceUsd).toFixed(2)} USD`;
    }
    return `Bs ${Number(offering.priceBob).toFixed(2)}`;
  }

  function formatSessionTime(iso: string | null | undefined) {
    if (!iso) return "--:--";
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "--:--";
    return parsed.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    <Pressable
      style={[styles.card, { height: cardHeight }]}
      onPress={onProfilePress}
      android_ripple={null}
    >
      <Image source={bgSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.overlay} />

      <LinearGradient
        colors={["transparent", "rgba(5,10,20,0.50)", "rgba(5,10,20,0.94)"]}
        locations={[0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {professional.isOnline && (
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>En línea</Text>
        </View>
      )}

      <View style={styles.infoPanel}>
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

        {bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {bio}
          </Text>
        ) : null}

        <View style={styles.offeringsBlock}>
          <Text style={styles.offeringsTitle}>Sesiones disponibles</Text>

          {offeringsLoading ? (
            <Text style={styles.noOfferingsText}>Cargando sesiones...</Text>
          ) : !offerings || offerings.length === 0 ? (
            <Text style={styles.noOfferingsText}>
              Este psicólogo aún no tiene sesiones disponibles.
            </Text>
          ) : (
            <View style={styles.offeringsList}>
              {highlightedOffering ? (
                <View key={highlightedOffering.id} style={styles.offeringRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offeringName} numberOfLines={1}>
                      {highlightedOffering.title}
                    </Text>
                    <Text style={styles.offeringMeta}>
                      {highlightedOffering.durationMinutes} min | {formatOfferingPrice(highlightedOffering)}
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.reserveBtn,
                      (!canReserve || reserveLoadingOfferingId === highlightedOffering.id) && styles.reserveBtnDisabled,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onReservePress(highlightedOffering.id);
                    }}
                    disabled={!canReserve || reserveLoadingOfferingId !== null}
                  >
                    <Text style={styles.reserveBtnText}>
                      {reserveLoadingOfferingId === highlightedOffering.id ? "Abriendo..." : "Reservar"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {hasMoreOfferings ? (
                <Pressable
                  style={styles.viewMoreBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onProfilePress();
                  }}
                >
                  <Text style={styles.viewMoreText}>Ver más sesiones</Text>
                  <Ionicons name="chevron-forward" size={14} color="#BFDBFE" />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, styles.chatBtn, (!canCommunicate || chatLoading) && styles.chatBtnDisabled]}
            onPress={(e) => {
              e.stopPropagation?.();
              onChatPress();
            }}
            disabled={chatLoading || !canCommunicate}
          >
            {chatLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Chatear</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={[styles.communicationHint, canCommunicate && styles.communicationHintAllowed]}>
          {communicationHint}
        </Text>

        {!canReserve && (
          <Text style={styles.regionWarning}>
            No se pudo determinar tu región de pago. Actualiza tu perfil para reservar.
          </Text>
        )}

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
  offeringsBlock: {
    gap: 6,
  },
  offeringsTitle: {
    color: "#DBEAFE",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  offeringsList: {
    gap: 7,
  },
  offeringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.22)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: "rgba(10,20,38,0.58)",
  },
  offeringName: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  offeringMeta: {
    marginTop: 1,
    color: "rgba(226,232,240,0.78)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  reserveBtn: {
    backgroundColor: "#5B9BD5",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  reserveBtnDisabled: {
    opacity: 0.58,
  },
  reserveBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  noOfferingsText: {
    color: "rgba(226,232,240,0.76)",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  viewMoreBtn: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  viewMoreText: {
    color: "#BFDBFE",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: "rgba(91,155,213,0.72)",
    flex: 1,
  },
  chatBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  regionWarning: {
    color: "#FECACA",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textAlign: "center",
  },
  communicationHint: {
    color: "#FDE68A",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textAlign: "center",
  },
  communicationHintAllowed: {
    color: "#BBF7D0",
  },
  tapHint: {
    color: "rgba(255,255,255,0.28)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
