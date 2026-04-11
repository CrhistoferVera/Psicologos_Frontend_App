import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { useCreditRate } from "@/src/hooks/useCreditRate";
import { LinearGradient } from "expo-linear-gradient";
import {
  apiGetMyEarnings,
  apiGetBanks,
  apiGetBankAccounts,
  apiAddBankAccount,
  apiDeleteBankAccount,
  apiCreateWithdrawalRequest,
  EarningTransaction,
  EarningsData,
  Bank,
  BankAccount,
} from "@/src/api/wallet";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MessageCircle,
  Image as ImageIcon,
  Phone,
  Video,
  TrendingUp,
  X,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle,
  ClipboardList,
} from "lucide-react-native";


function getServiceIcon(service: string) {
  const s = service.toLowerCase();
  if (s.includes("mensaje")) return <MessageCircle size={22} color="#fff" />;
  if (
    s.includes("foto") ||
    s.includes("imagen") ||
    s.includes("galería") ||
    s.includes("privada")
  )
    return <ImageIcon size={22} color="#fff" />;
  if (s.includes("llamada")) return <Phone size={22} color="#fff" />;
  if (s.includes("video")) return <Video size={22} color="#fff" />;
  return <TrendingUp size={22} color="#fff" />;
}

function AnimatedBorderCard({
  children,
  borderRadius = 18,
  style,
}: {
  children: React.ReactNode;
  borderRadius?: number;
  style?: object;
}) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[{ borderRadius, padding: 2, overflow: "hidden" }, style]}>
      <Animated.View
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          top: "50%",
          left: "50%",
          marginTop: -300,
          marginLeft: -300,
          transform: [{ rotate }],
        }}
      >
        <LinearGradient
          colors={["#F6C16A", "#FFE5A0", "#F6C16A", "#C9933A", "#8B5E1A", "#C9933A", "#FFE5A0", "#F6C16A", "#F6C16A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      {children}
    </View>
  );
}

function TransactionItem({ tx, toSoles }: { tx: EarningTransaction; toSoles: (n: number) => string }) {
  return (
    <AnimatedBorderCard style={{ marginBottom: 16 }}>
      <LinearGradient
        colors={["#1a0208", "#6B0A0A", "#C41818"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ borderRadius: 16 }}
      >
        <View className="flex-row items-center px-4 py-4">
          <View className="w-11 h-11 rounded-xl bg-[#9E1A34] items-center justify-center mr-4">
            {getServiceIcon(tx.service)}
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">
              {tx.service}
            </Text>
            {tx.clientName ? (
              <Text className="text-red-200 text-xs mt-0.5">{tx.clientName}</Text>
            ) : null}
          </View>
          <Text style={{ color: "#FFEE00", fontWeight: "800", fontSize: 15 }}>
            + S/ {toSoles(tx.amount)}
          </Text>
        </View>
      </LinearGradient>
    </AnimatedBorderCard>
  );
}

// ─── Add Bank Account Modal ──────────────────────────────────────────────────

function AddBankAccountModal({
  visible,
  onClose,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: (account: BankAccount) => void;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      apiGetBanks()
        .then(setBanks)
        .catch(() => {});
      setSelectedBank(null);
      setAccountNumber("");
      setHolderName("");
    }
  }, [visible]);

  const handleSave = async () => {
    if (!selectedBank) return Alert.alert("Error", "Selecciona un banco");
    if (!accountNumber.trim())
      return Alert.alert("Error", "Ingresa el número de cuenta");
    setLoading(true);
    try {
      const account = await apiAddBankAccount({
        bankId: selectedBank.id,
        accountNumber: accountNumber.trim(),
        accountHolderName: holderName.trim() || undefined,
      });
      onAdded(account);
      onClose();
    } catch {
      Alert.alert("Error", "No se pudo agregar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        <View className="bg-[#111] rounded-t-3xl px-6 pt-5 pb-8">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-lg font-bold">
              Agregar cuenta bancaria
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-400 text-xs mb-1">Banco</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between bg-[#1a1a1a] rounded-xl px-4 py-3 mb-4"
            onPress={() => setShowBankPicker(true)}
          >
            <Text style={{ color: selectedBank ? "#fff" : "#6b7280" }}>
              {selectedBank ? selectedBank.name : "Seleccionar banco"}
            </Text>
            <ChevronDown size={18} color="#9ca3af" />
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs mb-1">Número de cuenta</Text>
          <TextInput
            className="bg-[#1a1a1a] text-white rounded-xl px-4 py-3 mb-4"
            placeholder="Ej: 12345678901234"
            placeholderTextColor="#6b7280"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
          />

          <Text className="text-gray-400 text-xs mb-1">Titular (opcional)</Text>
          <TextInput
            className="bg-[#1a1a1a] text-white rounded-xl px-4 py-3 mb-6"
            placeholder="Nombre del titular"
            placeholderTextColor="#6b7280"
            value={holderName}
            onChangeText={setHolderName}
          />

          <TouchableOpacity
            className="bg-[#D11B1B] rounded-xl py-4 items-center"
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Guardar cuenta
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bank picker */}
        <Modal visible={showBankPicker} transparent animationType="fade">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
            onPress={() => setShowBankPicker(false)}
            activeOpacity={1}
          >
            <View className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
              <FlatList
                data={banks}
                keyExtractor={(b) => b.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#2a2a2a",
                    }}
                    onPress={() => {
                      setSelectedBank(item);
                      setShowBankPicker(false);
                    }}
                  >
                    <Text className="text-white flex-1">{item.name}</Text>
                    {selectedBank?.id === item.id && (
                      <CheckCircle size={18} color="#D11B1B" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">
                      No hay bancos disponibles
                    </Text>
                  </View>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Withdrawal Modal ────────────────────────────────────────────────────────

function WithdrawalModal({
  visible,
  balance,
  creditRate,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  balance: number;
  creditRate: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const [credits, setCredits] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const creditsNum = parseFloat(credits) || 0;
  const soles = (creditsNum * creditRate).toFixed(2);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const data = await apiGetBankAccounts();
      setAccounts(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las cuentas");
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setCredits("");
      setSelectedAccount(null);
      loadAccounts();
    }
  }, [visible]);

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar cuenta", "¿Seguro que deseas eliminar esta cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await apiDeleteBankAccount(id).catch(() => {});
          setAccounts((prev) => prev.filter((a) => a.id !== id));
          if (selectedAccount?.id === id) setSelectedAccount(null);
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!credits || creditsNum <= 0)
      return Alert.alert("Error", "Ingresa un monto válido");
    if (creditsNum > balance)
      return Alert.alert(
        "Saldo insuficiente",
        `Solo tienes Cred/ ${balance} disponibles`,
      );
    if (!selectedAccount)
      return Alert.alert("Error", "Selecciona una cuenta bancaria");

    setLoading(true);
    try {
      await apiCreateWithdrawalRequest({
        credits: creditsNum,
        bankAccountId: selectedAccount.id,
      });
      Alert.alert(
        "Solicitud enviada",
        `Tu solicitud de retiro de S/ ${soles} fue enviada. El equipo la procesará en 1-3 días hábiles.`,
        [
          {
            text: "OK",
            onPress: () => {
              onClose();
              onSuccess();
            },
          },
        ],
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? "No se pudo enviar la solicitud";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <View
            className="bg-[#111] rounded-t-3xl px-6 pt-5 pb-8"
            style={{ maxHeight: "85%" }}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-lg font-bold">
                Solicitar pago
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Balance */}
              <View className="bg-[#1a1a1a] rounded-xl px-4 py-3 mb-5 flex-row justify-between">
                <Text className="text-gray-400 text-sm">Saldo disponible</Text>
                <Text className="text-white font-bold text-sm">
                  Cred/ {balance}
                </Text>
              </View>

              {/* Credits input */}
              <Text className="text-gray-400 text-xs mb-1">
                Monto a retirar (créditos)
              </Text>
              <TextInput
                className="bg-[#1a1a1a] text-white rounded-xl px-4 py-3 text-lg font-bold mb-3"
                placeholder="0"
                placeholderTextColor="#6b7280"
                value={credits}
                onChangeText={(v) => setCredits(v.replace(/[^0-9.]/g, ""))}
                keyboardType="numeric"
              />

              {/* Soles conversion */}
              <View
                className="rounded-xl px-4 py-3 mb-6 flex-row items-center justify-between"
                style={{
                  backgroundColor: "rgba(209,27,27,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(209,27,27,0.3)",
                }}
              >
                <Text className="text-gray-300 text-sm">
                  Recibirás en soles
                </Text>
                <Text className="text-[#D11B1B] font-black text-xl">
                  S/ {soles}
                </Text>
              </View>

              {/* Bank accounts */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white font-semibold">
                  Cuenta de destino
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  onPress={() => setShowAddAccount(true)}
                >
                  <Plus size={14} color="#D11B1B" />
                  <Text className="text-[#D11B1B] text-xs font-semibold">
                    Agregar
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingAccounts ? (
                <ActivityIndicator
                  color="#D11B1B"
                  style={{ marginVertical: 16 }}
                />
              ) : accounts.length === 0 ? (
                <TouchableOpacity
                  className="bg-[#1a1a1a] rounded-xl py-5 items-center mb-6"
                  style={{
                    borderWidth: 1,
                    borderColor: "#333",
                    borderStyle: "dashed",
                  }}
                  onPress={() => setShowAddAccount(true)}
                >
                  <Plus size={20} color="#6b7280" />
                  <Text className="text-gray-500 text-sm mt-2">
                    Agrega una cuenta bancaria
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="mb-6">
                  {accounts.map((acc) => {
                    const selected = selectedAccount?.id === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        className="flex-row items-center rounded-xl px-4 py-3 mb-2"
                        style={{
                          backgroundColor: selected
                            ? "rgba(209,27,27,0.1)"
                            : "#1a1a1a",
                          borderWidth: 1,
                          borderColor: selected ? "#D11B1B" : "#2a2a2a",
                        }}
                        onPress={() => setSelectedAccount(acc)}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            marginRight: 12,
                            borderColor: selected ? "#D11B1B" : "#6b7280",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selected && (
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: "#D11B1B",
                              }}
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text className="text-white font-semibold text-sm">
                            {acc.bankName}
                          </Text>
                          <Text className="text-gray-400 text-xs">
                            {acc.accountNumber}
                          </Text>
                          {acc.accountHolderName ? (
                            <Text className="text-gray-500 text-xs">
                              {acc.accountHolderName}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(acc.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#6b7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text className="text-gray-500 text-xs text-center mb-5">
                1 crédito = S/ 0.90 · El pago se procesa en 1-3 días hábiles
              </Text>

              <TouchableOpacity
                className="rounded-xl py-4 items-center"
                style={{ backgroundColor: loading ? "#8b0000" : "#D11B1B" }}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Solicitar S/ {soles}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AddBankAccountModal
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAdded={(acc) => {
          setAccounts((prev) => [acc, ...prev]);
          setSelectedAccount(acc);
        }}
      />
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AnfitrianaGanancias() {
  const router = useRouter();
  const { toSoles, creditRate } = useCreditRate();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const result = await apiGetMyEarnings();
      setData(result);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las ganancias");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#25060E" }}>
      <ScreenHeader title="Mis ganancias" role="anfitriona" backgroundColor="#25060E" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D11B1B" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#D11B1B"
            />
          }
        >

          {/* Total Card */}
          <AnimatedBorderCard borderRadius={16} style={{ marginBottom: 24 }}>
          <View style={{ backgroundColor: "#D11B1B", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 20 }}>
            <Text className="text-red-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Total acumulado
            </Text>
            <Text
              style={{
                color: "#FFEE00",
                fontSize: 36,
                fontWeight: "900",
                marginBottom: 16,
              }}
            >
              S/ {toSoles(data?.total ?? 0)}
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text
                  style={{ color: "#FFEE00", fontSize: 20, fontWeight: "700" }}
                >
                  S/ {toSoles(data?.today ?? 0)}
                </Text>
                <Text className="text-red-200 text-xs mt-0.5">Hoy</Text>
              </View>
              <View className="w-px bg-red-400 mx-2" />
              <View className="items-center">
                <Text
                  style={{ color: "#FFEE00", fontSize: 20, fontWeight: "700" }}
                >
                  S/ {toSoles(data?.thisWeek ?? 0)}
                </Text>
                <Text className="text-red-200 text-xs mt-0.5">Esta semana</Text>
              </View>
              <View className="w-px bg-red-400 mx-2" />
              <View className="items-center">
                <Text
                  style={{ color: "#FFEE00", fontSize: 20, fontWeight: "700" }}
                >
                  S/ {toSoles(data?.total ?? 0)}
                </Text>
                <Text className="text-red-200 text-xs mt-0.5">Total</Text>
              </View>
            </View>
          </View>
          </AnimatedBorderCard>

          {/* Action buttons */}
          <View className="mb-3">
            <AnimatedBorderCard borderRadius={12} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: "#D11B1B", borderRadius: 10, paddingVertical: 16, alignItems: "center" }}
                onPress={() => setShowWithdrawal(true)}
              >
                <Text style={{ color: "#FFEE00", fontSize: 16, fontWeight: "800" }}>
                  Retirar dinero
                </Text>
              </TouchableOpacity>
            </AnimatedBorderCard>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-1.5 bg-[#1a1a1a] rounded-xl py-3 mb-6"
              onPress={() => router.push("/(anfitriona)/solicitudes-retiro")}
            >
              <ClipboardList size={16} color="#9ca3af" />
              <Text className="text-gray-400 text-sm font-semibold">
                Mis retiros
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction History Header */}
          <Text className="text-white font-bold text-base mb-4">
            Historial de transacciones
          </Text>

          {/* Transactions */}
          {data?.transactions.length === 0 ? (
            <View className="items-center py-12">
              <TrendingUp size={48} color="#333" />
              <Text className="text-gray-500 mt-4 text-center">
                Aún no tienes ganancias registradas.{"\n"}¡Empieza a enviar
                mensajes bloqueados!
              </Text>
            </View>
          ) : (
            data?.transactions.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} toSoles={toSoles} />
            ))
          )}
        </ScrollView>
      )}

      <WithdrawalModal
        visible={showWithdrawal}
        balance={data?.balance ?? 0}
        creditRate={creditRate}
        onClose={() => setShowWithdrawal(false)}
        onSuccess={() => load(true)}
      />
    </View>
  );
}
