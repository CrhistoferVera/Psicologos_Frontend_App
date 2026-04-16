import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import {
  addProfessionalBankAccount,
  getProfessionalBankAccounts,
  getProfessionalBanks,
  getProfessionalEarningsData,
  getProfessionalWithdrawalRequests,
  removeProfessionalBankAccount,
  requestProfessionalWithdrawal,
} from "../api/professionalApi";

export default function ProfessionalEarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const [bankId, setBankId] = useState<number | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [creditsToWithdraw, setCreditsToWithdraw] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [earningsData, banksData, accountsData, withdrawalsData] = await Promise.all([
        getProfessionalEarningsData(),
        getProfessionalBanks(),
        getProfessionalBankAccounts(),
        getProfessionalWithdrawalRequests(),
      ]);
      setEarnings(earningsData);
      setBanks(Array.isArray(banksData) ? banksData : []);
      setBankAccounts(Array.isArray(accountsData) ? accountsData : []);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);

      if (Array.isArray(banksData) && banksData.length > 0 && bankId == null) {
        setBankId(Number(banksData[0].id));
      }
      if (Array.isArray(accountsData) && accountsData.length > 0) {
        setSelectedBankAccountId(String(accountsData[0].id));
      }
    } catch {
      setError("No se pudo cargar la informacion de ganancias.");
    } finally {
      setLoading(false);
    }
  }

  const gross = useMemo(() => {
    if (!Array.isArray(earnings?.transactions)) return 0;
    return earnings.transactions.reduce((acc: number, tx: any) => acc + Number(tx.amount ?? 0), 0);
  }, [earnings]);

  const net = Number(earnings?.total ?? 0);
  const commission = Math.max(gross - net, 0);

  async function handleAddBankAccount() {
    if (!bankId || !accountNumber.trim()) {
      Alert.alert("Datos incompletos", "Selecciona banco e ingresa numero de cuenta.");
      return;
    }

    try {
      setSubmitting(true);
      await addProfessionalBankAccount({
        bankId,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim() || undefined,
      });
      setAccountNumber("");
      setAccountHolderName("");
      await loadData();
      Alert.alert("Cuenta agregada", "Tu cuenta bancaria fue registrada.");
    } catch (err: any) {
      Alert.alert("No se pudo agregar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteBankAccount(id: string) {
    try {
      setSubmitting(true);
      await removeProfessionalBankAccount(id);
      await loadData();
    } catch (err: any) {
      Alert.alert("No se pudo eliminar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateWithdrawal() {
    const credits = Number(creditsToWithdraw || 0);
    if (!selectedBankAccountId || credits <= 0) {
      Alert.alert("Datos incompletos", "Selecciona cuenta y monto de retiro.");
      return;
    }

    try {
      setSubmitting(true);
      await requestProfessionalWithdrawal({
        credits,
        bankAccountId: selectedBankAccountId,
      });
      setCreditsToWithdraw("");
      await loadData();
      Alert.alert("Solicitud enviada", "Tu retiro quedo en estado pendiente.");
    } catch (err: any) {
      Alert.alert("No se pudo solicitar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Ganancias</Text>
        <Text style={styles.subtitle}>Resumen financiero profesional y retiros.</Text>

        {loading ? <Text style={styles.info}>Cargando informacion...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.cardLabel}>Saldo neto disponible</Text>
          <Text style={styles.netValue}>{net.toFixed(2)} creditos</Text>
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Bruto facturado</Text>
            <Text style={styles.breakValue}>{gross.toFixed(2)} cr</Text>
          </View>
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Neto acreditado</Text>
            <Text style={styles.breakValue}>{net.toFixed(2)} cr</Text>
          </View>
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Comision plataforma</Text>
            <Text style={styles.breakValue}>{commission.toFixed(2)} cr</Text>
          </View>
          <View style={styles.breakRow}>
            <Text style={styles.breakLabel}>Promocional no contable</Text>
            <Text style={styles.breakValue}>0.00 cr</Text>
          </View>
          <Text style={styles.note}>Desglose sujeto al ledger financiero final del backend.</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Solicitar retiro</Text>
          <TextInput
            value={creditsToWithdraw}
            onChangeText={setCreditsToWithdraw}
            placeholder="Monto en creditos"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={appTheme.colors.textMuted}
          />
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedBankAccountId}
              onValueChange={(value) => setSelectedBankAccountId(String(value))}
              style={{ height: 44 }}
            >
              <Picker.Item label="Selecciona una cuenta" value="" />
              {bankAccounts.map((account) => (
                <Picker.Item
                  key={String(account.id)}
                  label={`${account.bankName} • ${account.accountNumber}`}
                  value={String(account.id)}
                />
              ))}
            </Picker>
          </View>
          <AppButton title="Solicitar retiro" onPress={handleCreateWithdrawal} loading={submitting} />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Agregar cuenta bancaria</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={bankId ?? ""} onValueChange={(value) => setBankId(Number(value))} style={{ height: 44 }}>
              {banks.map((bank) => (
                <Picker.Item key={String(bank.id)} label={bank.name} value={bank.id} />
              ))}
            </Picker>
          </View>
          <TextInput
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Numero de cuenta"
            style={styles.input}
            placeholderTextColor={appTheme.colors.textMuted}
          />
          <TextInput
            value={accountHolderName}
            onChangeText={setAccountHolderName}
            placeholder="Nombre del titular (opcional)"
            style={styles.input}
            placeholderTextColor={appTheme.colors.textMuted}
          />
          <AppButton title="Guardar cuenta" variant="secondary" onPress={handleAddBankAccount} loading={submitting} />
        </AppCard>

        <Text style={styles.sectionTitle}>Cuentas registradas</Text>
        {bankAccounts.length === 0 ? (
          <AppCard>
            <Text style={styles.info}>No tienes cuentas bancarias registradas.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={bankAccounts}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <AppCard>
                <Text style={styles.bankName}>{item.bankName}</Text>
                <Text style={styles.bankMeta}>{item.accountNumber}</Text>
                <Pressable onPress={() => handleDeleteBankAccount(String(item.id))}>
                  <Text style={styles.deleteText}>Eliminar</Text>
                </Pressable>
              </AppCard>
            )}
          />
        )}

        <Text style={styles.sectionTitle}>Movimientos de ganancia</Text>
        {Array.isArray(earnings?.transactions) && earnings.transactions.length > 0 ? (
          <FlatList
            data={earnings.transactions.slice(0, 12)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <AppCard>
                <Text style={styles.txTitle}>{item.service}</Text>
                <Text style={styles.txMeta}>{item.clientName || "Cliente"}</Text>
                <Text style={styles.txAmount}>+{Number(item.amount).toFixed(2)} cr</Text>
              </AppCard>
            )}
          />
        ) : (
          <AppCard>
            <Text style={styles.info}>Sin movimientos de ganancia.</Text>
          </AppCard>
        )}

        <Text style={styles.sectionTitle}>Solicitudes de retiro</Text>
        {withdrawals.length === 0 ? (
          <AppCard>
            <Text style={styles.info}>Aun no tienes solicitudes de retiro.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={withdrawals}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <AppCard>
                <Text style={styles.txTitle}>{Number(item.credits).toFixed(2)} cr · S/ {Number(item.soles).toFixed(2)}</Text>
                <Text style={styles.txMeta}>{item.bankName} · {item.accountNumber}</Text>
                <Text style={[styles.status, item.status === "APPROVED" ? styles.ok : item.status === "REJECTED" ? styles.reject : styles.pending]}>
                  {item.status}
                </Text>
              </AppCard>
            )}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  cardLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  netValue: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontSize: 30,
    fontWeight: "700",
  },
  breakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  breakValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 14,
  },
  note: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    minHeight: 46,
    paddingHorizontal: 12,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    overflow: "hidden",
  },
  bankName: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
  bankMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  deleteText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  txTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
    fontSize: 14,
  },
  txMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  txAmount: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
  status: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  pending: {
    color: "#B45309",
  },
  ok: {
    color: appTheme.colors.success,
  },
  reject: {
    color: appTheme.colors.danger,
  },
});
