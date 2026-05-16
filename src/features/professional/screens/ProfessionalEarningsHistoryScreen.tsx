import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import {
  getProfessionalEarningsData,
  getProfessionalWithdrawalRequests,
} from "../api/professionalApi";
import type { EarningTransaction, WithdrawalRequest } from "../../../api/wallet";
import EarningTransactionCard from "../components/EarningTransactionCard";
import WithdrawalHistoryCard from "../components/WithdrawalHistoryCard";
import WithdrawalDetailModal from "../components/WithdrawalDetailModal";
import HistoryTabBar from "../components/HistoryTabBar";

type TabKey = "earnings" | "withdrawals";

export default function ProfessionalEarningsHistoryScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("earnings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [earningsData, withdrawalsData] = await Promise.all([
        getProfessionalEarningsData(),
        getProfessionalWithdrawalRequests(),
      ]);
      setTransactions(Array.isArray(earningsData?.transactions) ? earningsData.transactions : []);
      setWithdrawals(withdrawalsData);
    } catch {
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: "earnings", label: "Ganancias", count: transactions.length },
    { key: "withdrawals", label: "Retiros", count: withdrawals.length },
  ];

  return (
    <AppScreen scroll={false} contentPadding={0}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.title}>Historial</Text>
      </View>

      <View style={styles.tabsWrap}>
        <HistoryTabBar
          tabs={tabs}
          activeKey={activeTab}
          onPress={(k) => setActiveTab(k as TabKey)}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Cargando historial...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={36} color={appTheme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "earnings" ? (
            transactions.length === 0 ? (
              <EmptyState
                icon="cash-outline"
                message="Aún no tienes ganancias registradas."
              />
            ) : (
              transactions.map((tx) => (
                <EarningTransactionCard key={tx.id} transaction={tx} />
              ))
            )
          ) : (
            withdrawals.length === 0 ? (
              <EmptyState
                icon="wallet-outline"
                message="Aún no tienes solicitudes de retiro."
              />
            ) : (
              <>
                <View style={styles.hint}>
                  <Ionicons name="information-circle-outline" size={14} color={appTheme.colors.primary} />
                  <Text style={styles.hintText}>Toca una tarjeta para ver sus detalles</Text>
                </View>
                {withdrawals.map((w) => (
                  <WithdrawalHistoryCard key={w.id} withdrawal={w} onPress={setSelectedWithdrawal} />
                ))}
              </>
            )
          )}
        </ScrollView>
      )}
      <WithdrawalDetailModal
        withdrawal={selectedWithdrawal}
        onClose={() => setSelectedWithdrawal(null)}
      />
    </AppScreen>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={44} color={appTheme.colors.border} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  title: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
  tabsWrap: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    gap: 10,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  stateText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  retryText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
