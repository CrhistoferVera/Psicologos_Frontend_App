import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { apiGetAllPackages, apiFlowCreatePayment } from "../../../api/package";
import { apiGetMyWallet } from "../../../api/userClient";
import { apiGetExpenseHistory } from "../../../api/userProfile";
import { appTheme } from "../../../theme/appTheme";

type PackageItem = {
  id: string;
  name: string;
  credits: number;
  price: number;
};

export default function CreditsScreen() {
  const [balance, setBalance] = useState(0);
  const [promoBalance, setPromoBalance] = useState(0);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [history, setHistory] = useState<{ id: string; detalle: string; monto: string | number; fecha: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [wallet, list, expenses] = await Promise.all([
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

        const normalized = Array.isArray(list?.data) ? list.data : Array.isArray(list) ? list : [];
        setPackages(
          normalized.map((item: any) => ({
            id: String(item.id),
            name: String(item.name ?? `Paquete ${item.credits}`),
            credits: Number(item.credits ?? 0),
            price: Number(item.price ?? 0),
          })),
        );
        setHistory(Array.isArray(expenses?.data) ? expenses.data.slice(0, 8) : []);
      } catch {
        setError("No se pudo cargar la información de créditos.");
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalBalance = useMemo(() => balance + promoBalance, [balance, promoBalance]);

  async function handleBuy(packageId: string) {
    try {
      const response = await apiFlowCreatePayment(packageId);
      if (response?.paymentUrl) {
        await Linking.openURL(response.paymentUrl);
      }
    } catch (error: any) {
      Alert.alert("No se pudo iniciar la recarga", error?.message ?? "Intenta nuevamente.");
    }
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Créditos y Wallet</Text>
        <Text style={styles.subtitle}>Gestiona tu saldo y recargas de forma simple.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AppCard>
          <Text style={styles.cardTitle}>Saldo total</Text>
          <Text style={styles.totalBalance}>{totalBalance.toFixed(2)} créditos</Text>
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Saldo real</Text>
            <Text style={styles.splitValue}>{balance.toFixed(2)} cr</Text>
          </View>
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Saldo promocional</Text>
            <Text style={[styles.splitValue, { color: appTheme.colors.success }]}>{promoBalance.toFixed(2)} cr</Text>
          </View>
        </AppCard>

        <Text style={styles.section}>Paquetes de recarga</Text>
        {loading ? (
          <AppCard>
            <Text style={styles.emptyText}>Cargando paquetes...</Text>
          </AppCard>
        ) : packages.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>No hay paquetes publicados por el momento.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={packages}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <AppCard>
                <Text style={styles.pkgName}>{item.name}</Text>
                <Text style={styles.pkgMeta}>
                  {item.credits} créditos · Bs {item.price.toFixed(2)}
                </Text>
                <AppButton title="Recargar" onPress={() => handleBuy(item.id)} />
              </AppCard>
            )}
          />
        )}

        <Text style={styles.section}>Historial reciente</Text>
        {history.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>Sin movimientos recientes.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={history}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <AppCard>
                <Text style={styles.histDetail}>{item.detalle}</Text>
                <Text style={styles.histMeta}>
                  {item.monto} cr · {new Date(item.fecha).toLocaleDateString()}
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
  cardTitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  totalBalance: {
    color: appTheme.colors.primary,
    fontSize: 30,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  splitLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  splitValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  section: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 17,
    marginTop: 4,
  },
  pkgName: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
  },
  pkgMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  histDetail: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  histMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});

