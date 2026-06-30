import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import {
  getPayoutAccounts,
  createPayoutAccount,
  type ClientPayoutAccount,
  type RefundMethod,
} from "../../../api/payoutAccounts";
import { requestRefund, type RefundRequestResult } from "../../../api/bookings";

type Props = {
  visible: boolean;
  bookingId: string;
  scheduledStartAt: string;
  refundEarlyWindowHours?: number;
  refundEarlyPercent?: number;
  refundLatePercent?: number;
  onClose: () => void;
  onSuccess: (result: RefundRequestResult) => void;
};

type ModalStep = "accounts" | "add";

type AddForm = {
  method: RefundMethod;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  cryptoAddress: string;
  cryptoCurrency: string;
  cryptoNetwork: string;
};

const EARLY_HOURS = 24;
const EARLY_PERCENT = 50;
const LATE_PERCENT = 80;

function getRefundPercent(scheduledStartAt: string, earlyHours = EARLY_HOURS) {
  const hoursElapsed = (Date.now() - new Date(scheduledStartAt).getTime()) / 3600000;
  return hoursElapsed <= earlyHours ? EARLY_PERCENT : LATE_PERCENT;
}

function accountLabel(account: ClientPayoutAccount) {
  if (account.method === "BANK_TRANSFER") {
    return `${account.bankName ?? "Banco"} · ${account.bankAccountNumber ?? ""}`;
  }
  return `${account.cryptoCurrency ?? "Crypto"} · ${account.cryptoNetwork ?? ""}`;
}

function accountSubLabel(account: ClientPayoutAccount) {
  if (account.method === "BANK_TRANSFER") {
    return `Titular: ${account.bankAccountHolder ?? "—"}`;
  }
  return account.cryptoAddress ?? "—";
}

export function RefundRequestModal({
  visible,
  bookingId,
  scheduledStartAt,
  refundEarlyWindowHours = EARLY_HOURS,
  onClose,
  onSuccess,
}: Props) {
  const [view, setView] = useState<ModalStep>("accounts");
  const [accounts, setAccounts] = useState<ClientPayoutAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addForm, setAddForm] = useState<AddForm>({
    method: "BANK_TRANSFER",
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
    cryptoAddress: "",
    cryptoCurrency: "",
    cryptoNetwork: "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refundPercent = getRefundPercent(scheduledStartAt, refundEarlyWindowHours);

  useEffect(() => {
    if (!visible) return;
    setView("accounts");
    setSelectedId(null);
    setError(null);
    void loadAccounts();
  }, [visible]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    try {
      const data = await getPayoutAccounts();
      setAccounts(data);
      const def = data.find((a) => a.isDefault);
      if (def) setSelectedId(def.id);
    } catch {
      setError("No se pudieron cargar las cuentas de pago.");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function handleSaveAccount() {
    setAddError(null);

    if (addForm.method === "BANK_TRANSFER") {
      if (!addForm.bankName.trim() || !addForm.bankAccountNumber.trim() || !addForm.bankAccountHolder.trim()) {
        setAddError("Completa todos los campos del banco.");
        return;
      }
    } else {
      if (!addForm.cryptoAddress.trim() || !addForm.cryptoCurrency.trim() || !addForm.cryptoNetwork.trim()) {
        setAddError("Completa todos los campos de la billetera crypto.");
        return;
      }
    }

    setSavingAccount(true);
    try {
      const payload =
        addForm.method === "BANK_TRANSFER"
          ? {
              method: "BANK_TRANSFER" as const,
              bankName: addForm.bankName.trim(),
              bankAccountNumber: addForm.bankAccountNumber.trim(),
              bankAccountHolder: addForm.bankAccountHolder.trim(),
            }
          : {
              method: "CRYPTO" as const,
              cryptoAddress: addForm.cryptoAddress.trim(),
              cryptoCurrency: addForm.cryptoCurrency.trim(),
              cryptoNetwork: addForm.cryptoNetwork.trim(),
            };

      const created = await createPayoutAccount(payload);
      setAccounts((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setView("accounts");
    } catch (err: any) {
      setAddError(err?.response?.data?.message ?? "No se pudo guardar la cuenta.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleRequestRefund() {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestRefund(bookingId, selectedId);
      onSuccess(result);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  function field(
    label: string,
    value: string,
    key: keyof AddForm,
    placeholder: string,
  ) {
    return (
      <View style={styles.fieldWrap} key={key}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={(v) => setAddForm((p) => ({ ...p, [key]: v }))}
          placeholder={placeholder}
          placeholderTextColor={appTheme.colors.textMuted}
        />
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.sheetHeader}>
            {view === "add" ? (
              <Pressable onPress={() => setView("accounts")} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
              </Pressable>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <Text style={styles.sheetTitle}>
              {view === "add" ? "Nueva cuenta de pago" : "Solicitar reembolso"}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={appTheme.colors.textMuted} />
            </Pressable>
          </View>

          {/* ── VISTA: LISTA DE CUENTAS ── */}
          {view === "accounts" && (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.percentBadge}>
                <Ionicons name="wallet-outline" size={18} color="#1D4ED8" />
                <Text style={styles.percentText}>
                  Te corresponde un reembolso del{" "}
                  <Text style={styles.percentHighlight}>{refundPercent}%</Text>
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Elige dónde recibir el dinero</Text>

              {loadingAccounts ? (
                <ActivityIndicator style={{ marginVertical: 24 }} color={appTheme.colors.primary} />
              ) : accounts.length === 0 ? (
                <View style={styles.emptyAccounts}>
                  <Ionicons name="card-outline" size={32} color={appTheme.colors.textMuted} />
                  <Text style={styles.emptyText}>Aún no tienes cuentas de pago guardadas.</Text>
                </View>
              ) : (
                accounts.map((account) => (
                  <Pressable
                    key={account.id}
                    style={[styles.accountCard, selectedId === account.id && styles.accountCardSelected]}
                    onPress={() => setSelectedId(account.id)}
                  >
                    <View style={styles.accountCardLeft}>
                      <Ionicons
                        name={account.method === "BANK_TRANSFER" ? "business-outline" : "logo-bitcoin"}
                        size={20}
                        color={selectedId === account.id ? appTheme.colors.primary : appTheme.colors.textMuted}
                      />
                      <View>
                        <Text style={styles.accountLabel}>{accountLabel(account)}</Text>
                        <Text style={styles.accountSub} numberOfLines={1}>{accountSubLabel(account)}</Text>
                      </View>
                    </View>
                    {selectedId === account.id && (
                      <Ionicons name="checkmark-circle" size={20} color={appTheme.colors.primary} />
                    )}
                  </Pressable>
                ))
              )}

              <Pressable style={styles.addBtn} onPress={() => { setAddError(null); setView("add"); }}>
                <Ionicons name="add-circle-outline" size={16} color={appTheme.colors.primary} />
                <Text style={styles.addBtnText}>Agregar cuenta de pago</Text>
              </Pressable>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.confirmBtn, (!selectedId || submitting) && styles.confirmBtnDisabled]}
                disabled={!selectedId || submitting}
                onPress={handleRequestRefund}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Solicitar reembolso</Text>
                )}
              </Pressable>
            </ScrollView>
          )}

          {/* ── VISTA: AGREGAR CUENTA ── */}
          {view === "add" && (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.methodToggle}>
                <Pressable
                  style={[styles.methodBtn, addForm.method === "BANK_TRANSFER" && styles.methodBtnActive]}
                  onPress={() => setAddForm((p) => ({ ...p, method: "BANK_TRANSFER" }))}
                >
                  <Ionicons name="business-outline" size={14} color={addForm.method === "BANK_TRANSFER" ? "#fff" : appTheme.colors.textMuted} />
                  <Text style={[styles.methodBtnText, addForm.method === "BANK_TRANSFER" && styles.methodBtnTextActive]}>
                    Transferencia
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.methodBtn, addForm.method === "CRYPTO" && styles.methodBtnActive]}
                  onPress={() => setAddForm((p) => ({ ...p, method: "CRYPTO" }))}
                >
                  <Ionicons name="logo-bitcoin" size={14} color={addForm.method === "CRYPTO" ? "#fff" : appTheme.colors.textMuted} />
                  <Text style={[styles.methodBtnText, addForm.method === "CRYPTO" && styles.methodBtnTextActive]}>
                    Crypto
                  </Text>
                </Pressable>
              </View>

              {addForm.method === "BANK_TRANSFER" ? (
                <>
                  {field("Banco", addForm.bankName, "bankName", "Ej: Banco Unión")}
                  {field("Número de cuenta", addForm.bankAccountNumber, "bankAccountNumber", "Ej: 1234567890")}
                  {field("Titular de la cuenta", addForm.bankAccountHolder, "bankAccountHolder", "Nombre completo")}
                </>
              ) : (
                <>
                  {field("Criptomoneda", addForm.cryptoCurrency, "cryptoCurrency", "Ej: USDT")}
                  {field("Red / Network", addForm.cryptoNetwork, "cryptoNetwork", "Ej: TRC-20")}
                  {field("Dirección de billetera", addForm.cryptoAddress, "cryptoAddress", "0x...")}
                </>
              )}

              {addError ? <Text style={styles.errorText}>{addError}</Text> : null}

              <Pressable
                style={[styles.confirmBtn, savingAccount && styles.confirmBtnDisabled]}
                disabled={savingAccount}
                onPress={handleSaveAccount}
              >
                {savingAccount ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Guardar cuenta</Text>
                )}
              </Pressable>
            </ScrollView>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
    gap: 12,
  },
  percentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
  },
  percentText: {
    fontSize: 14,
    color: "#1E40AF",
    flex: 1,
  },
  percentHighlight: {
    fontWeight: "700",
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: appTheme.colors.textMuted,
    marginTop: 4,
  },
  emptyAccounts: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    borderRadius: 12,
    padding: 14,
  },
  accountCardSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: "#EFF6FF",
  },
  accountCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: appTheme.colors.text,
  },
  accountSub: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    maxWidth: 220,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 14,
    color: appTheme.colors.primary,
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: appTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 13,
    color: appTheme.colors.danger,
    textAlign: "center",
  },
  methodToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: "#F8FAFC",
  },
  methodBtnActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  methodBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: appTheme.colors.textMuted,
  },
  methodBtnTextActive: {
    color: "#fff",
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: appTheme.colors.textMuted,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: appTheme.colors.text,
    backgroundColor: "#F8FAFC",
  },
});
