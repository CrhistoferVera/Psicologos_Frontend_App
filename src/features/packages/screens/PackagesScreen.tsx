import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGetAllPackages } from "../../../api/package";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { appTheme } from "../../../theme/appTheme";
import type { PackageData } from "../../../types/package";
import { PackageCard } from "../components/PackageCard";
import { PackagesEmptyState } from "../components/PackagesEmptyState";
import { PackagesHeader } from "../components/PackagesHeader";
import { WalletBalanceBanner } from "../components/WalletBalanceBanner";

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isBolivian } = useUserRegion();

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
    return isBolivian
      ? `Bs ${Number(pkg.price).toFixed(2)}`
      : `$${Number(pkg.priceUsd ?? 0).toFixed(2)}`;
  }

  function handleBuy(item: PackageData) {
    router.push({
      pathname: "/(user)/packages/checkout",
      params: {
        packageId: item.id,
        packageName: item.name,
        credits: item.credits,
        priceBob: item.price,
        priceUsd: item.priceUsd ?? 0,
      },
    } as any);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PackagesHeader />
      <WalletBalanceBanner />

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
                Los créditos se acreditan automáticamente a tu wallet tras confirmar el pago.
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
});
