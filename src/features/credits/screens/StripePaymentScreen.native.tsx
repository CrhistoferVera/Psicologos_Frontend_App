import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import AppScreen from "../../../components/ui/AppScreen";
import AppCard from "../../../components/ui/AppCard";
import { apiCreatePaymentIntent, apiCreateEphemeralKey, apiGetSavedPaymentMethods } from "../../../api/stripe";
import { appTheme } from "../../../theme/appTheme";

type SavedCard = { id: string; brand: string; last4: string; expMonth: number; expYear: number };

export default function StripePaymentScreen() {
  const router = useRouter();
  const { packageId, credits, price } = useLocalSearchParams<{ packageId: string; credits: string; price: string }>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardsModal, setShowCardsModal] = useState(false);

  useEffect(() => {
    void loadSavedCards();
  }, []);

  async function loadSavedCards() {
    try {
      setLoadingCards(true);
      const cards = await apiGetSavedPaymentMethods();
      const list = Array.isArray(cards) ? cards : [];
      setSavedCards(list);
      if (list.length > 0) {
        setSelectedCardId(list[0].id);
        setShowCardsModal(true);
      }
    } catch {
      setSavedCards([]);
    } finally {
      setLoadingCards(false);
    }
  }

  async function openPaymentSheet() {
    if (!packageId) return;
    try {
      setPaying(true);
      const [{ clientSecret, customerId }, ephemeralKey] = await Promise.all([
        apiCreatePaymentIntent(packageId, true),
        apiCreateEphemeralKey(),
      ]);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        customerId,
        customerEphemeralKeySecret: ephemeralKey.secret,
        merchantDisplayName: "Sanamente",
        billingDetailsCollectionConfiguration: {
          address: "full",
        },
        defaultBillingDetails: {},
      });

      if (initError) { Alert.alert("Error", initError.message); return; }

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") Alert.alert("Pago fallido", presentError.message);
        return;
      }

      Alert.alert("¡Pago exitoso!", "Tus créditos serán acreditados en breve.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Intenta nuevamente.");
    } finally {
      setPaying(false);
    }
  }

  async function payWithSavedCard() {
    if (!packageId || !selectedCardId) return;
    try {
      setPaying(true);
      const [{ clientSecret, customerId }, ephemeralKey] = await Promise.all([
        apiCreatePaymentIntent(packageId, true),
        apiCreateEphemeralKey(),
      ]);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        customerId,
        customerEphemeralKeySecret: ephemeralKey.secret,
        merchantDisplayName: "Sanamente",
      });

      if (initError) { Alert.alert("Error", initError.message); return; }

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") Alert.alert("Pago fallido", presentError.message);
        return;
      }

      Alert.alert("¡Pago exitoso!", "Tus créditos serán acreditados en breve.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Intenta nuevamente.");
    } finally {
      setPaying(false);
      setShowCardsModal(false);
    }
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Pagar con Stripe</Text>
        </View>

        {/* Resumen del paquete */}
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Créditos</Text>
            <Text style={styles.summaryValue}>{credits} cr</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValueBold}>Bs {Number(price).toFixed(2)}</Text>
          </View>
        </AppCard>

        {/* Estado de tarjetas */}
        {loadingCards ? (
          <AppCard style={styles.card}>
            <Text style={styles.hintText}>Cargando tarjetas guardadas...</Text>
          </AppCard>
        ) : savedCards.length === 0 ? (
          <AppCard style={styles.card}>
            <View style={styles.emptyCards}>
              <Ionicons name="card-outline" size={36} color={appTheme.colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin tarjetas guardadas</Text>
              <Text style={styles.hintText}>Agrega una tarjeta para continuar</Text>
              <Pressable style={styles.addCardBtn} onPress={openPaymentSheet} disabled={paying}>
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.addCardBtnText}>{paying ? "Cargando..." : "Agregar tarjeta"}</Text>
              </Pressable>
            </View>
          </AppCard>
        ) : (
          <AppCard style={styles.card}>
            <Text style={styles.cardTitle}>Tarjetas guardadas</Text>
            {savedCards.map((card) => (
              <Pressable
                key={card.id}
                style={[styles.cardRow, selectedCardId === card.id && styles.cardRowSelected]}
                onPress={() => setSelectedCardId(card.id)}
              >
                <View style={[styles.radio, selectedCardId === card.id && styles.radioActive]} />
                <Ionicons name="card" size={18} color={appTheme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardBrand}>{card.brand.toUpperCase()} **** {card.last4}</Text>
                  <Text style={styles.cardExp}>Vence {card.expMonth}/{card.expYear}</Text>
                </View>
              </Pressable>
            ))}

            <Pressable style={styles.addCardOutlineBtn} onPress={openPaymentSheet} disabled={paying}>
              <Ionicons name="add-circle-outline" size={16} color={appTheme.colors.primary} />
              <Text style={styles.addCardOutlineText}>Agregar nueva tarjeta</Text>
            </Pressable>

            <Pressable
              style={[styles.payBtn, (!selectedCardId || paying) && { opacity: 0.6 }]}
              disabled={!selectedCardId || paying}
              onPress={payWithSavedCard}
            >
              <Text style={styles.payBtnText}>{paying ? "Procesando..." : `Pagar Bs ${Number(price).toFixed(2)}`}</Text>
            </Pressable>
          </AppCard>
        )}

        <Text style={styles.secureText}>Pago seguro · SSL encriptado · Powered by Stripe</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: appTheme.colors.background, paddingTop: 6, paddingBottom: 24, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#DEE6F1" },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: appTheme.colors.border },
  headerTitle: { color: appTheme.colors.text, fontFamily: appTheme.fonts.heading, fontSize: 20, fontWeight: "700" },
  card: { marginHorizontal: 16, borderRadius: 16, gap: 10 },
  cardTitle: { color: appTheme.colors.text, fontFamily: appTheme.fonts.heading, fontSize: 16, fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  summaryLabel: { color: appTheme.colors.textMuted, fontFamily: appTheme.fonts.body, fontSize: 14 },
  summaryValue: { color: appTheme.colors.text, fontFamily: appTheme.fonts.body, fontSize: 14 },
  summaryValueBold: { color: appTheme.colors.primary, fontFamily: appTheme.fonts.heading, fontSize: 18, fontWeight: "700" },
  emptyCards: { alignItems: "center", gap: 8, paddingVertical: 10 },
  emptyTitle: { color: appTheme.colors.text, fontFamily: appTheme.fonts.heading, fontSize: 16, fontWeight: "700" },
  hintText: { color: appTheme.colors.textMuted, fontFamily: appTheme.fonts.body, fontSize: 13, textAlign: "center" },
  addCardBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: appTheme.colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginTop: 4 },
  addCardBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.body, fontSize: 15, fontWeight: "700" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: appTheme.colors.border, backgroundColor: "#F8FBFF" },
  cardRowSelected: { borderColor: appTheme.colors.primary, backgroundColor: "#EEF6FF" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: appTheme.colors.primary, backgroundColor: "transparent" },
  radioActive: { backgroundColor: appTheme.colors.primary },
  cardBrand: { color: appTheme.colors.text, fontFamily: appTheme.fonts.body, fontSize: 14, fontWeight: "600" },
  cardExp: { color: appTheme.colors.textMuted, fontFamily: appTheme.fonts.body, fontSize: 12 },
  addCardOutlineBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: appTheme.colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  addCardOutlineText: { color: appTheme.colors.primary, fontFamily: appTheme.fonts.body, fontSize: 14, fontWeight: "600" },
  payBtn: { backgroundColor: appTheme.colors.primary, borderRadius: 14, minHeight: 52, alignItems: "center", justifyContent: "center" },
  payBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 17, fontWeight: "700" },
  secureText: { textAlign: "center", color: appTheme.colors.textMuted, fontFamily: appTheme.fonts.body, fontSize: 12, paddingHorizontal: 16 },
});
