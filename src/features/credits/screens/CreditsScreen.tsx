import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { apiGetAllPackages, apiFlowCreatePayment } from "../../../api/package";
import { apiCreatePaymentIntent, apiCreateEphemeralKey } from "../../../api/stripe";
import { apiGetMyWallet } from "../../../api/userClient";
import { apiGetExpenseHistory } from "../../../api/userProfile";
import { appTheme } from "../../../theme/appTheme";
import { BS_PER_USD, STRIPE_CREDITS_BONUS } from "../../../config";


// Define la estructura de un paquete: id, nombre, créditos y precio
type PackageItem = {
  id: string;
  name: string;
  credits: number;
  price: number;
};

type ExpenseItem = {
  id: string;
  detalle: string;
  monto: string | number;
  fecha: string;
  tipo?: string;
};

type PaymentMethod = "card" | "paypal" | "stripe";
type TabKey = "wallet" | "recharge";

function asNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isYesterday(date: Date, now: Date) {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return isSameDay(date, y);
}

function formatMoveDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const hour = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  if (isSameDay(date, now)) return `Hoy ${hour}`;
  if (isYesterday(date, now)) return `Ayer ${hour}`;

  return `${date.getDate()}/${date.getMonth() + 1} ${hour}`;
}

function signedAmount(item: ExpenseItem) {
  const amount = asNumber(item.monto);
  const creditTypes = new Set(["DEPOSIT", "PROMOTIONAL_GRANT"]);
  const isCredit = item.tipo ? creditTypes.has(item.tipo) : amount > 0;
  return isCredit ? Math.abs(amount) : -Math.abs(amount);
}

export default function CreditsScreen() {
  const router = useRouter();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [activeTab, setActiveTab] = useState<TabKey>("wallet");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  const [balance, setBalance] = useState(0);
  const [promoBalance, setPromoBalance] = useState(0);

  // Lista de paquetes que vienen del backend con su id, nombre, cantidad de créditos y precio
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [history, setHistory] = useState<ExpenseItem[]>([]);

  // Solo guarda el ID del paquete seleccionado, no el objeto completo
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [wallet, packageRes, expensesRes] = await Promise.all([
          apiGetMyWallet(),
          apiGetAllPackages(),
          apiGetExpenseHistory(),
        ]);

        setBalance(Number(wallet?.balance ?? 0));
        setPromoBalance(
          Number(
            wallet?.promotionalBalance ??
              (wallet as any)?.promoBalance ??
              (wallet as any)?.giftBalance ??
              0,
          ),
        );

        const normalized = Array.isArray((packageRes as any)?.data)
          ? (packageRes as any).data
          : Array.isArray(packageRes)
            ? packageRes
            : [];

            //// Busca en el array el paquete cuyo id coincide con selectedPackageId
// Esto da acceso a .id, .credits y .price en cualquier parte del componente
        const mappedPackages = normalized
          .map((item: any) => ({
            id: String(item.id),
            name: String(item.name ?? `Paquete ${item.credits}`),
            credits: Number(item.credits ?? 0),
            price: Number(item.price ?? 0),
          }))
          .sort((a: PackageItem, b: PackageItem) => a.credits - b.credits);

        setPackages(mappedPackages);

        if (mappedPackages.length > 0) {
          const preferred300 = mappedPackages.find((pkg: PackageItem) => pkg.credits === 300);
          setSelectedPackageId(preferred300?.id ?? mappedPackages[0].id);
        }

        const expenseData = Array.isArray((expensesRes as any)?.data) ? (expensesRes as any).data : [];
        setHistory(expenseData.slice(0, 10));
      } catch {
        setError("No se pudo cargar la información de créditos.");
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalBalance = useMemo(() => balance, [balance]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const usedToday = useMemo(() => {
    const now = new Date();
    return history
      .filter((item) => {
        const date = new Date(item.fecha);
        if (Number.isNaN(date.getTime())) return false;
        return isSameDay(date, now);
      })
      .reduce((acc, item) => acc + Math.abs(Math.min(signedAmount(item), 0)), 0);
  }, [history]);

  const usedThisMonth = useMemo(() => {
    const now = new Date();
    return history
      .filter((item) => {
        const date = new Date(item.fecha);
        if (Number.isNaN(date.getTime())) return false;
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((acc, item) => acc + Math.abs(Math.min(signedAmount(item), 0)), 0);
  }, [history]);

  async function handleFlowBuy(packageId: string) {
    try {
      const response = await apiFlowCreatePayment(packageId);
      if (response?.paymentUrl) {
        await Linking.openURL(response.paymentUrl);
      }
    } catch (err: any) {
      Alert.alert("No se pudo iniciar la recarga", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleBuy(packageId: string) {
    try {
      // Manda el packageId al backend; el backend busca el precio real y crea el PaymentIntent
      // Stripe nunca recibe el precio desde el frontend (seguridad)
      const [{ clientSecret, customerId }, ephemeralKey] = await Promise.all([
        apiCreatePaymentIntent(packageId, true), // backend devuelve clientSecret con el monto real
        apiCreateEphemeralKey(),                 // clave temporal para identificar al customer en Stripe
      ]);

      // Inicializa el Payment Sheet con los datos del backend
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret, // contiene el monto que definió el backend
        customerId,
        customerEphemeralKeySecret: ephemeralKey.secret,
        merchantDisplayName: "PsyConnect",
        setupIntentClientSecret: undefined,
      });
      if (initError) {
        Alert.alert("Error", initError.message);
        return;
      }

      // Abre el modal nativo de Stripe para que el usuario ingrese su tarjeta
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") {
          Alert.alert("Pago fallido", presentError.message);
        }
        return;
      }

      // Pago exitoso: refresca el saldo y vuelve al tab wallet
      Alert.alert("¡Pago exitoso!", "Tus créditos serán acreditados en breve.");
      const wallet = await apiGetMyWallet();
      setBalance(Number(wallet?.balance ?? 0));
      setActiveTab("wallet");
    } catch (err: any) {
      Alert.alert("No se pudo iniciar la recarga", err?.message ?? "Intenta nuevamente.");
    }
  }

  function packageBadge(index: number, pkg: PackageItem) {
    if (pkg.credits === 300 || index === 1) return "Popular";
    if (pkg.credits >= 600 || index === 2) return "Mejor valor";
    return null;
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={21} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Créditos</Text>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === "wallet" && styles.tabBtnActive]}
            onPress={() => setActiveTab("wallet")}
          >
            <Ionicons
              name="card-outline"
              size={15}
              color={activeTab === "wallet" ? "#FFFFFF" : appTheme.colors.primary}
            />
            <Text style={[styles.tabText, activeTab === "wallet" && styles.tabTextActive]}>
              Mi wallet
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === "recharge" && styles.tabBtnActive]}
            onPress={() => setActiveTab("recharge")}
          >
            <Ionicons
              name="cart-outline"
              size={15}
              color={activeTab === "recharge" ? "#FFFFFF" : appTheme.colors.primary}
            />
            <Text style={[styles.tabText, activeTab === "recharge" && styles.tabTextActive]}>
              Recargar
            </Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {activeTab === "wallet" ? (
          <>
            <View style={styles.sectionPad}>
              <LinearGradient
                colors={["#3F6E9F", "#5B9BD5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.walletHero}
              >
                <Text style={styles.walletLabel}>Saldo disponible</Text>
                <Text style={styles.walletBalance}>{Math.floor(totalBalance)}</Text>
                <Text style={styles.walletHint}>
                  créditos · ≈ ${(totalBalance * 0.042).toFixed(2)} USD
                </Text>

                <Pressable style={styles.walletRechargeBtn} onPress={() => setActiveTab("recharge")}>
                  <Text style={styles.walletRechargeText}>+ Recargar créditos</Text>
                </Pressable>
              </LinearGradient>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(usedToday)} crd</Text>
                <Text style={styles.statLabel}>Usados hoy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(usedThisMonth)} crd</Text>
                <Text style={styles.statLabel}>Este mes</Text>
              </View>
            </View>

            <View style={styles.sectionPad}>
              <Text style={styles.sectionTitle}>Historial de movimientos</Text>
            </View>

            {history.length === 0 ? (
              <View style={styles.sectionPad}>
                <AppCard>
                  <Text style={styles.emptyText}>
                    {loading ? "Cargando historial..." : "Sin movimientos recientes."}
                  </Text>
                </AppCard>
              </View>
            ) : (
              <View style={styles.movementsList}>
                {history.slice(0, 6).map((item) => {
                  const signed = signedAmount(item);
                  const isCredit = signed >= 0;

                  return (
                    <View key={item.id} style={styles.moveCard}>
                      <View
                        style={[
                          styles.moveIconWrap,
                          isCredit ? styles.moveIconCredit : styles.moveIconDebit,
                        ]}
                      >
                        <Ionicons
                          name={isCredit ? "arrow-down" : "arrow-up"}
                          size={16}
                          color="#1E293B"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.moveTitle} numberOfLines={2}>
                          {item.detalle}
                        </Text>
                        <Text style={styles.moveDate}>{formatMoveDate(item.fecha)}</Text>
                      </View>

                      <Text
                        style={[
                          styles.moveAmount,
                          isCredit ? styles.creditAmount : styles.debitAmount,
                        ]}
                      >
                        {isCredit ? "+" : "-"}
                        {Math.abs(signed)} crd
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionPad}>
              <Text style={styles.sectionTitle}>Selecciona un paquete</Text>
            </View>

            <View style={styles.packagesGrid}>
              {packages.map((pkg, idx) => {
                const selected = pkg.id === selectedPackageId;
                const badge = packageBadge(idx, pkg);

                return (
                  <Pressable
                    key={pkg.id}
                    style={[styles.packageCard, selected && styles.packageCardSelected]}
                    onPress={() => setSelectedPackageId(pkg.id)}
                  >
                    {badge ? (
                      <View style={styles.badgePill}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.pkgCredits}>{pkg.credits}</Text>
                    <Text style={styles.pkgCreditsLabel}>créditos</Text>
                    <Text style={styles.pkgPrice}>{pkg.price.toFixed(2)} Bs</Text>
                    <Text style={styles.pkgPriceUsd}>≈ ${(pkg.price / BS_PER_USD).toFixed(2)} USD</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionPad}>
              <AppCard>
                <Text style={styles.paymentTitle}>Método de pago</Text>

                <Pressable style={styles.paymentRow} onPress={() => setPaymentMethod("card")}>
                  <View style={[styles.radio, paymentMethod === "card" && styles.radioActive]} />
                  <Ionicons name="card-outline" size={16} color={appTheme.colors.primary} />
                  <Text style={styles.paymentText}>Tarjeta **** 4242</Text>
                </Pressable>

                <Pressable style={styles.paymentRow} onPress={() => setPaymentMethod("paypal")}>
                  <View style={[styles.radio, paymentMethod === "paypal" && styles.radioActive]} />
                  <Ionicons name="logo-paypal" size={16} color={appTheme.colors.primary} />
                  <Text style={styles.paymentText}>PayPal</Text>
                </Pressable>

                <Pressable style={styles.paymentRow} onPress={() => setPaymentMethod("stripe")}>
                  <View style={[styles.radio, paymentMethod === "stripe" && styles.radioActive]} />
                  <Ionicons name="card" size={16} color={appTheme.colors.primary} />
                  <Text style={styles.paymentText}>Stripe</Text>
                </Pressable>
              </AppCard>
            </View>

            <View style={styles.sectionPad}>
              <Pressable
                style={[styles.buyBtn, (!selectedPackage || loading) && { opacity: 0.6 }]}
                disabled={!selectedPackage || loading}
                onPress={() => {
                  if (!selectedPackage) return;
                  if (paymentMethod === "card" || paymentMethod === "paypal") {
                    void handleFlowBuy(selectedPackage.id);
                  } else {
                    void handleBuy(selectedPackage.id);
                  }
                }}
              >
                <Text style={styles.buyBtnText}>
                  {selectedPackage
                    ? paymentMethod === "stripe"
                      ? `Comprar ${Math.floor(selectedPackage.credits * (1 + STRIPE_CREDITS_BONUS))} créditos · ${selectedPackage.price.toFixed(2)} Bs (≈ $${(selectedPackage.price / BS_PER_USD).toFixed(2)} USD)`
                      : `Comprar ${selectedPackage.credits} créditos · ${selectedPackage.price.toFixed(2)} Bs (≈ $${(selectedPackage.price / BS_PER_USD).toFixed(2)} USD)`
                    : "Selecciona un paquete"}
                </Text>
              </Pressable>

              <Text style={styles.secureText}>Pago seguro · SSL encriptado</Text>
            </View>
          </>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: appTheme.colors.background,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },

  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },

  title: {
    color: appTheme.colors.text,
    fontSize: 34,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },

  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  tabBtnActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },

  tabText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },

  sectionPad: {
    paddingHorizontal: 16,
  },

  walletHero: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  walletLabel: {
    color: "#E2ECFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    fontWeight: "600",
  },

  walletBalance: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "700",
    marginTop: 2,
  },

  walletHint: {
    color: "#DCEAFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    marginTop: 2,
  },

  walletRechargeBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  walletRechargeText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },

  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 14,
  },

  statValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 21,
    fontWeight: "700",
  },

  statLabel: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    marginTop: 2,
  },

  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },

  movementsList: {
    gap: 10,
    paddingHorizontal: 16,
  },

  moveCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  moveIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  moveIconCredit: {
    backgroundColor: "#EAF7F0",
  },

  moveIconDebit: {
    backgroundColor: "#F8EFEF",
  },

  moveTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "600",
  },

  moveDate: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    marginTop: 2,
  },

  moveAmount: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },

  creditAmount: {
    color: "#5BAA82",
  },

  debitAmount: {
    color: "#EF4444",
  },

  emptyText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
  },

  packagesGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  packageCard: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "relative",
  },

  packageCardSelected: {
    borderColor: appTheme.colors.primary,
    borderWidth: 2,
    backgroundColor: "#EEF6FF",
  },

  badgePill: {
    position: "absolute",
    top: -10,
    right: 10,
    borderRadius: 999,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  badgeText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },

  pkgCredits: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 39,
    lineHeight: 42,
    fontWeight: "700",
  },

  pkgCreditsLabel: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
  },

  pkgPrice: {
    marginTop: 4,
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 34,
    fontWeight: "700",
  },

  pkgPriceUsd: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },

  paymentTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: appTheme.colors.primary,
    backgroundColor: "transparent",
  },

  radioActive: {
    backgroundColor: appTheme.colors.primary,
  },

  paymentText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 17,
    fontWeight: "500",
  },

  buyBtn: {
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
  },

  buyBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },

  secureText: {
    marginTop: 10,
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
  },
});

