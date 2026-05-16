import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import AppInput from "../../../components/ui/AppInput";
import BankCard from "./BankCard";
import DeleteBankAccountModal from "./DeleteBankAccountModal";
import type { Bank, BankAccount } from "../../../api/wallet";

interface Props {
  banks: Bank[];
  bankAccounts: BankAccount[];
  newBankId: number | null;
  onBankIdChange: (id: number | null) => void;
  isCreating: boolean;
  isDeletingId: string | null;
  onAddAccount: (number: string, holderName: string) => void;
  onDeleteAccount: (id: string) => void;
  onBack: () => void;
}

export default function BankAccountsTab({
  banks,
  bankAccounts,
  newBankId,
  onBankIdChange,
  isCreating,
  isDeletingId,
  onAddAccount,
  onDeleteAccount,
}: Props) {
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);

  const canSubmit = !!newBankId && accountNumber.trim().length > 0;

  function toggleSelect(id: string) {
    setSelectedToDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleConfirmDelete() {
    selectedToDelete.forEach((id) => onDeleteAccount(id));
    setDeleteMode(false);
    setSelectedToDelete([]);
  }

  function handleAdd() {
    onAddAccount(accountNumber, holderName);
    setAccountNumber("");
    setHolderName("");
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
    >
      {/* Banner informativo */}
      <LinearGradient colors={["#1565C0", "#1976D2", "#2196F3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.infoBanner}>
        <View style={styles.infoBannerCircle1} />
        <View style={styles.infoBannerCircle2} />
        <View style={styles.infoBannerIcon}>
          <Ionicons name="information-circle" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoBannerTitle}>Solo retiros en Bolivianos (BOB)</Text>
          <Text style={styles.infoBannerText}>Para retiros en USD usa tu wallet de Binance en la sección de retiro.</Text>
        </View>
      </LinearGradient>

      {/* Formulario */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="add-circle" size={18} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Agregar cuenta bancaria</Text>
        </View>

        {/* Selector banco */}
        <View style={styles.bankLabelRow}>
          <View style={styles.bankLabelIcon}>
            <Ionicons name="business-outline" size={13} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.bankLabel}>Banco</Text>
        </View>
        <View>
          <Pressable
            style={[styles.comboBox, bankDropdownOpen && styles.comboBoxOpen]}
            onPress={() => { setBankDropdownOpen(!bankDropdownOpen); setBankSearch(""); }}
          >
            <View style={styles.comboBoxLeft}>
              <View style={styles.comboBoxIcon}>
                <Ionicons name="business-outline" size={16} color={appTheme.colors.primary} />
              </View>
              <Text style={newBankId ? styles.comboBoxValue : styles.comboBoxPlaceholder}>
                {newBankId ? banks.find((b) => b.id === newBankId)?.name ?? "Selecciona un banco" : "Selecciona un banco"}
              </Text>
            </View>
            <Ionicons name={bankDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={appTheme.colors.primary} />
          </Pressable>

          {bankDropdownOpen && (
            <View style={styles.comboDropdown}>
              <View style={styles.comboSearchWrap}>
                <Ionicons name="search-outline" size={15} color={appTheme.colors.textMuted} />
                <TextInput
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  placeholder="Buscar banco..."
                  placeholderTextColor={appTheme.colors.textMuted}
                  style={styles.comboSearchInput}
                />
                {bankSearch.length > 0 && (
                  <Pressable onPress={() => setBankSearch("")}>
                    <Ionicons name="close-circle" size={16} color={appTheme.colors.textMuted} />
                  </Pressable>
                )}
              </View>
              <ScrollView style={styles.comboList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {banks
                  .filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                  .map((bank) => (
                    <Pressable
                      key={bank.id}
                      style={[styles.comboItem, newBankId === bank.id && styles.comboItemSelected]}
                      onPress={() => { onBankIdChange(bank.id); setBankDropdownOpen(false); setBankSearch(""); }}
                    >
                      <View style={styles.comboItemLeft}>
                        <View style={[styles.comboItemDot, newBankId === bank.id && styles.comboItemDotSelected]} />
                        <Text style={[styles.comboItemText, newBankId === bank.id && styles.comboItemTextSelected]}>
                          {bank.name}
                        </Text>
                      </View>
                      {newBankId === bank.id && <Ionicons name="checkmark-circle" size={18} color={appTheme.colors.primary} />}
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>

        <AppInput
          label="Número de cuenta"
          labelIcon="keypad-outline"
          placeholder="Ej: 1234567890"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          showCheck
          hint="Ingresa el número de tu cuenta bancaria"
        />

        <AppInput
          label="Titular"
          labelIcon="person-outline"
          placeholder="Nombre completo del titular"
          value={holderName}
          onChangeText={setHolderName}
          autoCapitalize="words"
          showCheck
        />

        <Pressable
          style={[styles.addBtn, (!canSubmit || isCreating) && styles.addBtnDisabled]}
          disabled={!canSubmit || isCreating}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{isCreating ? "Guardando..." : "Agregar cuenta"}</Text>
        </Pressable>
      </View>

      {/* Lista de cuentas */}
      <View style={[styles.card, { marginTop: 14 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="card" size={18} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Mis cuentas BOB</Text>
          {bankAccounts.length > 0 && (
            deleteMode ? (
              <Pressable style={styles.cancelBtn} onPress={() => { setDeleteMode(false); setSelectedToDelete([]); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.deleteIconBtn} onPress={() => setDeleteMode(true)}>
                <Ionicons name="trash-outline" size={13} color={appTheme.colors.danger} />
                <Text style={styles.deleteIconBtnText}>Eliminar</Text>
              </Pressable>
            )
          )}
        </View>
        {bankAccounts.length === 0 ? (
          <Text style={styles.emptyText}>No tienes cuentas bancarias registradas.</Text>
        ) : (
          <View style={styles.accountsList}>
            {bankAccounts.map((account) => (
              <BankCard
                key={account.id}
                account={account}
                selectionMode={deleteMode}
                isChecked={selectedToDelete.includes(account.id)}
                onPress={deleteMode ? () => toggleSelect(account.id) : undefined}
              />
            ))}
            {deleteMode && (
              <Pressable
                style={[styles.confirmDeleteBtn, selectedToDelete.length === 0 && styles.confirmDeleteBtnDisabled]}
                disabled={selectedToDelete.length === 0 || isDeletingId !== null}
                onPress={handleConfirmDelete}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <Text style={styles.confirmDeleteBtnText}>
                  {isDeletingId ? "Eliminando..." : `Confirmar eliminar (${selectedToDelete.length})`}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: appTheme.colors.background },
  container: { paddingBottom: 24 },
  infoBanner: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 14,
  },
  infoBannerCircle1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -30,
    right: -20,
  },
  infoBannerCircle2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 40,
  },
  infoBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  infoBannerTitle: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  infoBannerText: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  deleteIconBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteIconBtnText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  cancelBtn: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  confirmDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: appTheme.colors.danger,
    shadowColor: appTheme.colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 4,
  },
  confirmDeleteBtnDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
  confirmDeleteBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  bankLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  bankLabelIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bankLabel: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  comboBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  comboBoxOpen: {
    borderColor: appTheme.colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  comboBoxLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  comboBoxIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  comboBoxValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  comboBoxPlaceholder: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    flex: 1,
  },
  comboDropdown: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: appTheme.colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: appTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comboSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    backgroundColor: "#F8FAFC",
  },
  comboSearchInput: {
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    paddingVertical: 0,
  },
  comboList: { maxHeight: 220 },
  comboItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  comboItemSelected: { backgroundColor: "#EEF4FF" },
  comboItemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  comboItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appTheme.colors.border,
  },
  comboItemDotSelected: { backgroundColor: appTheme.colors.primary },
  comboItemText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  comboItemTextSelected: { color: appTheme.colors.primary, fontWeight: "700" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    shadowColor: appTheme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 4,
  },
  addBtnDisabled: { opacity: 0.55, shadowOpacity: 0, elevation: 0 },
  addBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  accountsList: { gap: 12 },
});
