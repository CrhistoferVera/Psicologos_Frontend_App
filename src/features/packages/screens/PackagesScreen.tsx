import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGetAllPackages } from "../../../api/package";
import { useAuth } from "../../../context/AuthContext";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { appTheme } from "../../../theme/appTheme";
import type { PackageData } from "../../../types/package";
import { formatBob, formatUsd } from "../../../utils/money";
import { PackageCard } from "../components/PackageCard";
import { PackagesEmptyState } from "../components/PackagesEmptyState";
import { PackagesHeader } from "../components/PackagesHeader";
import { WalletBalanceBanner } from "../components/WalletBalanceBanner";

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isBolivian } = useUserRegion();
  const canDetermineRegion = Boolean((user?.phoneDialCode ?? "").trim());

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadPackages();
    }, []),
  );

  async function loadPackages() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetAllPackages();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los paquetes.");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(pkg: PackageData) {
    if (!canDetermineRegion) return "Completa tu país y teléfono para continuar.";
    return isBolivian ? formatBob(pkg.price) : formatUsd(pkg.priceUsd ?? 0);
  }

  function handleBuy(item: PackageData) {
    if (!canDetermineRegion) return;
    router.push({
      pathname: "/(user)/packages/checkout",
      params: {
        packageId: item.id,
        packageName: item.name,
        priceBob: item.price,
        priceUsd: item.priceUsd ?? 0,
      },
    } as any);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PackagesHeader />
      <WalletBalanceBanner />
      {!canDetermineRegion ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>Completa tu país y teléfono para continuar.</Text>
        </View>
      ) : null}

      {loading ? (
        <PackagesEmptyState state="loading" />
      ) : error ? (
        <PackagesEmptyState state="error" message={error} onRetry={loadPackages} />
      ) : packages.length === 0 ? (
        <PackagesEmptyState state="empty" />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id ?? item.name}
          renderItem={({ item, index }) => (
            <PackageCard
              item={item}
              index={index}
              formattedPrice={formatPrice(item)}
              onPress={() => handleBuy(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={15} color={appTheme.colors.textMuted} />
              <Text style={styles.noteText}>
                El saldo del paquete se acredita autom�ticamente a tu wallet tras confirmar el pago.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  list: {
    padding: 16,
  },
  separator: {
    height: 14,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  noteText: {
    flex: 1,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  warningBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  warningText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
});

