import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { apiGetPenaltyTransactions, type PenaltyTransaction } from "../../../api/wallet";
import PenaltyTransactionCard from "../components/PenaltyTransactionCard";

export default function ProfessionalPenaltiesScreen() {
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void apiGetPenaltyTransactions()
        .then(setPenalties)
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Ionicons name="receipt-outline" size={22} color="#DC2626" />
          <Text style={styles.title}>Historial de penalidades</Text>
        </View>
        <Text style={styles.subtitle}>
          Registro completo de descuentos por inasistencia a sesiones.
        </Text>

        {loading ? (
          <ActivityIndicator color={appTheme.colors.primary} style={{ marginTop: 32 }} />
        ) : penalties.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#16A34A" />
            <Text style={styles.emptyText}>No tienes penalidades registradas.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {penalties.map((tx) => (
              <PenaltyTransactionCard key={tx.id} tx={tx} />
            ))}
          </View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingBottom: 32,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DC2626",
    fontFamily: appTheme.fonts.heading,
  },
  subtitle: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    lineHeight: 19,
  },
  list: {
    gap: 12,
    marginTop: 4,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    marginTop: 48,
  },
  emptyText: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
});
