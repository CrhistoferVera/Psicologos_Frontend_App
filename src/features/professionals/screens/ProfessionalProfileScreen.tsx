import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import { getMyChats } from '../../../api/messages';
import {
  getProfessionalSessionOfferings,
  type ProfessionalSessionOffering,
} from '../../../api/bookings';
import { getCommunicationAccess, type CommunicationAccess } from '../../../api/communication';
import { appTheme } from '../../../theme/appTheme';
import { useAuth } from '../../../context/AuthContext';
import { useUserRegion } from '../../../hooks/useUserRegion';
import { formatBob, formatUsd } from '../../../utils/money';
import { getProfessionalById } from '../api/professionalsApi';
import type { Professional } from '../types';
import { useCallManager } from '../../../context/CallContext';
import { useSessionRemaining } from '../../../hooks/useSessionRemaining';
import { formatRemainingMinText } from '../../../utils/sessionTime';

type TabKey = 'info' | 'reviews';

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isBolivian } = useUserRegion();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const professionalId = Array.isArray(params.id) ? params.id[0] : params.id ?? '';

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<ProfessionalSessionOffering[]>([]);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [openingBooking, setOpeningBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [openingChat, setOpeningChat] = useState(false);
  const [requestingCall, setRequestingCall] = useState<'CALL' | 'VIDEO_CALL' | null>(null);
  const [communicationAccess, setCommunicationAccess] = useState<CommunicationAccess | null>(null);
  const [communicationLoading, setCommunicationLoading] = useState(true);
  const { startOutgoingCall } = useCallManager();
  const canDetermineRegion = useMemo(
    () => Boolean((user?.phoneDialCode ?? '').trim()),
    [user?.phoneDialCode],
  );
  const preferredCurrency = canDetermineRegion ? (isBolivian ? 'BOB' : 'USD') : null;

  useEffect(() => {
    if (!professionalId) return;

    void (async () => {
      try {
        setError(null);
        setOfferingsLoading(true);
        const [profile, sessions] = await Promise.all([
          getProfessionalById(professionalId),
          getProfessionalSessionOfferings(professionalId),
        ]);
        setProfessional(profile);
        setOfferings(sessions);
        setOfferingsError(null);

        try {
          setCommunicationLoading(true);
          const access = await getCommunicationAccess(professionalId);
          setCommunicationAccess(access);
        } catch {
          setCommunicationAccess({
            allowed: false,
            bookingId: null,
            sessionStartsAt: null,
            sessionEndsAt: null,
            reason: 'UNKNOWN',
            message: 'No se pudo validar el acceso de comunicacion.',
          });
        } finally {
          setCommunicationLoading(false);
        }
      } catch {
        setError('No se pudo cargar el perfil profesional.');
        setOfferingsError('No se pudieron cargar las sesiones disponibles.');
        setCommunicationLoading(false);
      } finally {
        setOfferingsLoading(false);
      }
    })();
  }, [professionalId]);

  useEffect(() => {
    if (!professionalId) {
      setCommunicationLoading(false);
      return;
    }

    let cancelled = false;

    const loadAccess = async (showLoader: boolean) => {
      if (showLoader) setCommunicationLoading(true);
      try {
        const access = await getCommunicationAccess(professionalId);
        if (!cancelled) setCommunicationAccess(access);
      } catch {
        if (!cancelled) {
          setCommunicationAccess({
            allowed: false,
            bookingId: null,
            sessionStartsAt: null,
            sessionEndsAt: null,
            reason: 'UNKNOWN',
            message: 'No se pudo validar el acceso de comunicacion.',
          });
        }
      } finally {
        if (!cancelled && showLoader) setCommunicationLoading(false);
      }
    };

    void loadAccess(false);
    const timer = setInterval(() => {
      void loadAccess(false);
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [professionalId]);

  const subtitle = useMemo(() => {
    if (!professional) return '';
    if (professional.specialties.length === 0) return 'Psicología clínica';
    return professional.specialties.slice(0, 2).join(' · ');
  }, [professional]);
  const availabilityLabel = professional?.isOnline ? 'Disponible' : 'No disponible';

  const { remainingMs: sessionRemainingMs, isExpired: sessionExpired } = useSessionRemaining(
    communicationAccess?.sessionEndsAt,
    60_000,
  );
  const canCommunicateByAccess = communicationAccess?.allowed === true;
  const canCommunicate = canCommunicateByAccess && !sessionExpired;

  const communicationLabel = communicationLoading
    ? 'Validando acceso a comunicacion...'
    : canCommunicate
      ? `Sesion activa · termina en ${formatRemainingMinText(sessionRemainingMs)}`
      : sessionExpired && canCommunicateByAccess
        ? 'La sesion termino.'
        : communicationAccess?.message ?? 'Reserva una sesion para habilitar mensajes y llamadas.';

  if (!professional && !error) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.loading}>Cargando perfil...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!professional && error) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={[styles.loading, { color: appTheme.colors.danger }]}>{error}</Text>
        </View>
      </AppScreen>
    );
  }

  if (!professional) return null;

  const ratingText = professional.rating ? professional.rating.toFixed(1) : '4.9';
  const reviewCount = 142;

  async function handleStartChat() {
    if (openingChat) return;
    if (!professional) return;
    const targetProfessional = professional;

    try {
      const access = await getCommunicationAccess(targetProfessional.id);
      setCommunicationAccess(access);
      if (!access.allowed) {
        Alert.alert('Chat no disponible', access.message ?? 'Reserva una sesion para habilitar mensajes y llamadas.');
        return;
      }
    } catch {
      Alert.alert('Chat no disponible', 'Reserva una sesion para habilitar mensajes y llamadas.');
      return;
    }

    try {
      setOpeningChat(true);
      const chats = await getMyChats();
      const existing = chats.find((chat) => chat.otherUserId === targetProfessional.id);
      const existingConversationId = existing?.conversationId ?? '';

      router.push({
        pathname: '/(user)/chats/[id]',
        params: {
          id: existingConversationId || targetProfessional.id,
          conversationId: existingConversationId,
          professionalId: targetProfessional.id,
          professionalName: targetProfessional.name,
          professionalAvatar: targetProfessional.avatar,
        },
      } as any);
    } catch {
      router.push({
        pathname: '/(user)/chats/[id]',
        params: {
          id: targetProfessional.id,
          conversationId: '',
          professionalId: targetProfessional.id,
          professionalName: targetProfessional.name,
          professionalAvatar: targetProfessional.avatar,
        },
      } as any);
    } finally {
      setOpeningChat(false);
    }
  }

  async function handleStartCall(callType: 'CALL' | 'VIDEO_CALL') {
    if (requestingCall) return;
    if (!professional) return;

    try {
      const access = await getCommunicationAccess(professional.id);
      setCommunicationAccess(access);
      if (!access.allowed) {
        Alert.alert('Llamada no disponible', access.message ?? 'Las llamadas estan disponibles solo durante una sesion activa.');
        return;
      }

      setRequestingCall(callType);
      await startOutgoingCall({
        receiverId: professional.id,
        receiverName: professional.name,
        receiverAvatar: professional.avatar || null,
        callType,
      });
    } finally {
      setRequestingCall(null);
    }
  }

  function handleOpenBooking() {
    if (!professional || openingBooking || !canDetermineRegion) return;
    setOpeningBooking(true);
    router.push({
      pathname: '/(user)/bookings/new',
      params: {
        professionalId: professional.id,
        professionalName: professional.name,
      },
    } as any);
    setOpeningBooking(false);
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <LinearGradient
          colors={['#315885', '#3D6A9A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.topBar}>
            <Pressable style={styles.topIconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.topActions}>
              <Pressable style={styles.topIconBtn}>
                <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable style={styles.topIconBtn}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroProfileRow}>
            <View style={styles.avatarFrame}>
              <Image
                source={
                  professional.avatar
                    ? { uri: professional.avatar }
                    : require('../../../../assets/no_image.jpg')
                }
                style={styles.avatar}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{professional.name}</Text>
              {professional.username ? <Text style={styles.username}>@{professional.username}</Text> : null}
              <Text style={styles.subtitle}>{subtitle}</Text>
              <View style={[styles.statusBadge, professional.isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <Text style={[styles.statusBadgeText, professional.isOnline ? styles.statusBadgeTextOnline : styles.statusBadgeTextOffline]}>
                  {availabilityLabel}
                </Text>
              </View>

              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingValue}>{ratingText}</Text>
                <Text style={styles.reviews}>({reviewCount} reseñas)</Text>
              </View>
            </View>

          </View>
        </LinearGradient>

        <View style={styles.priceCardsRow}>
          <Pressable
            style={[
              styles.priceCard,
              styles.chatCard,
              (openingChat || !canCommunicate) && styles.priceCardDisabled,
            ]}
            onPress={handleStartChat}
            disabled={openingChat || !canCommunicate}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.priceTitle, { color: '#FFFFFF' }]}>Chat</Text>
          </Pressable>

          <Pressable
            style={[
              styles.priceCard,
              styles.callCard,
              requestingCall === 'CALL' && styles.priceCardDisabled,
              !canCommunicate && styles.priceCardDisabled,
            ]}
            onPress={() => handleStartCall('CALL')}
            disabled={requestingCall !== null || !canCommunicate}
          >
            <Ionicons name="call-outline" size={20} color="#26A269" />
            <Text style={[styles.priceTitle, { color: '#2F855A' }]}>Llamada</Text>
          </Pressable>

          <Pressable
            style={[
              styles.priceCard,
              styles.videoCard,
              requestingCall === 'VIDEO_CALL' && styles.priceCardDisabled,
              !canCommunicate && styles.priceCardDisabled,
            ]}
            onPress={() => handleStartCall('VIDEO_CALL')}
            disabled={requestingCall !== null || !canCommunicate}
          >
            <Ionicons name="videocam-outline" size={20} color="#7E6CCF" />
            <Text style={[styles.priceTitle, { color: '#6C5BB6' }]}>Video</Text>
          </Pressable>
        </View>

        <Text style={[styles.communicationHint, canCommunicate && styles.communicationHintAllowed]}>
          {communicationLabel}
        </Text>

        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'info' && styles.tabBtnActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Información</Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'reviews' && styles.tabBtnActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reseñas ({reviewCount})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'info' ? (
          <>
            <AppCard>
              <View style={styles.sessionsTitleRow}>
                <Text style={styles.blockTitle}>Sesiones disponibles</Text>
                {offerings.length > 0 && (
                  <Pressable
                    style={[styles.reserveBtn, (!canDetermineRegion || openingBooking) && styles.reserveBtnDisabled]}
                    onPress={handleOpenBooking}
                    disabled={!canDetermineRegion || openingBooking}
                  >
                    <Text style={styles.reserveBtnText}>Reservar</Text>
                  </Pressable>
                )}
              </View>

              {offeringsLoading ? (
                <Text style={styles.bio}>Cargando sesiones...</Text>
              ) : offerings.length === 0 ? (
                <Text style={styles.bio}>Este profesional aun no publicó sesiones reservables.</Text>
              ) : (
                <View style={styles.offeringsWrap}>
                  {offerings.map((offering) => (
                    <View key={offering.id} style={styles.offeringCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.offeringTitle}>{offering.title}</Text>
                        {!!offering.description && (
                          <Text style={styles.offeringDescription}>{offering.description}</Text>
                        )}
                        <Text style={styles.offeringMeta}>{offering.durationMinutes} min</Text>
                      </View>

                      <View style={styles.offeringRight}>
                        {canDetermineRegion && (
                          <Text style={styles.offeringPriceBob}>
                            {preferredCurrency === 'USD'
                              ? formatUsd(offering.priceUsd, true)
                              : formatBob(offering.priceBob)}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {!!offeringsError && <Text style={styles.errorText}>{offeringsError}</Text>}
              {!canDetermineRegion && (
                <Text style={styles.errorText}>
                  Completa tu país y teléfono para continuar.
                </Text>
              )}
            </AppCard>

            <AppCard>
              <Text style={styles.blockTitle}>Sobre mi</Text>
              <Text style={styles.bio}>
                {professional.bio ||
                  'Profesional de salud mental con enfoque clínico y orientado a resultados.'}
              </Text>
            </AppCard>

            <AppCard>
              <Text style={styles.blockTitle}>Especialidades</Text>
              <View style={styles.specialtiesWrap}>
                {(professional.specialties.length > 0 ? professional.specialties : ['Psicología clínica']).map((item) => (
                  <View key={item} style={styles.specialtyPill}>
                    <Text style={styles.specialtyPillText}>{item}</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          </>
        ) : (
          <AppCard>
            <Text style={styles.blockTitle}>Reseñas</Text>
            <Text style={styles.bio}>Aun no hay reseñas publicadas para este profesional.</Text>
          </AppCard>
        )}

        <Pressable
          style={[styles.chatBtn, (openingChat || !canCommunicate) && styles.chatBtnDisabled]}
          onPress={handleStartChat}
          disabled={openingChat || !canCommunicate}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
          <Text style={styles.chatBtnText}>
            {openingChat ? 'Abriendo...' : canCommunicate ? 'Iniciar chat' : 'Reserva para chatear'}
          </Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: '#475569',
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  page: {
    padding: 12,
    paddingBottom: 22,
    gap: 12,
    backgroundColor: appTheme.colors.background,
  },
  hero: {
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroProfileRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarFrame: {
    width: 86,
    height: 86,
    borderRadius: 22,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#DDE5EF',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 30,
    fontFamily: appTheme.fonts.heading,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    color: '#D4E3F5',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
  },
  username: {
    marginTop: 2,
    color: '#D4E3F5',
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgeOnline: {
    backgroundColor: 'rgba(34,197,94,0.20)',
    borderColor: 'rgba(134,239,172,0.45)',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(15,23,42,0.30)',
    borderColor: 'rgba(203,213,225,0.30)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
  },
  statusBadgeTextOnline: {
    color: '#DCFCE7',
  },
  statusBadgeTextOffline: {
    color: '#E2E8F0',
  },
  ratingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  star: {
    color: '#F7C948',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
  },
  reviews: {
    color: '#D5E2F2',
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },
  priceCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  priceCardDisabled: {
    opacity: 0.6,
  },
  chatCard: {
    backgroundColor: '#5B9BD5',
    borderColor: '#5B9BD5',
  },
  callCard: {
    backgroundColor: '#E9F7EF',
    borderColor: '#BFE2CF',
  },
  videoCard: {
    backgroundColor: '#F1EFFC',
    borderColor: '#D6D2F1',
  },
  priceTitle: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  communicationHint: {
    marginTop: -4,
    color: '#92400E',
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  communicationHintAllowed: {
    color: '#166534',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 11,
  },
  tabBtnActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  tabText: {
    color: '#475569',
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  blockTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: '700',
  },
  sessionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bio: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    lineHeight: 24,
    fontSize: 16,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EDF4FB',
    borderWidth: 1,
    borderColor: '#D6E6F7',
  },
  specialtyPillText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  offeringsWrap: {
    gap: 10,
  },
  offeringCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  offeringTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: '700',
  },
  offeringDescription: {
    marginTop: 2,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  offeringMeta: {
    marginTop: 4,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  offeringRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  offeringPriceBob: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: '700',
  },
  offeringPriceUsd: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  reserveBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reserveBtnDisabled: {
    opacity: 0.6,
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  chatBtn: {
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
  },
  chatBtnDisabled: {
    opacity: 0.6,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: '700',
  },
});
