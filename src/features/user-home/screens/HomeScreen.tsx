import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { apiGetMyWallet } from "../../../api/userClient";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import ProfessionalCard from "../../professionals/components/ProfessionalCard";
import type { Professional } from "../../professionals/types";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [wallet, list] = await Promise.all([apiGetMyWallet(), getProfessionals()]);
        setBalance(wallet?.balance ?? 0);
        setProfessionals(list.slice(0, 5));
      } catch {
        try {
          const list = await getProfessionals();
          setProfessionals(list.slice(0, 5));
          setError("No se pudo cargar el saldo en este momento.");
        } catch {
          setError("No se pudieron cargar los profesionales.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const quickSpecialties = useMemo(() => ["Ansiedad", "Depresión", "Pareja", "Autoestima"], []);

  return (
    <AppScreen scroll contentPadding={16}>
      <View style={styles.wrap}>
        <Text style={styles.greeting}>Hola {user?.firstName ?? "Usuario"}</Text>
        <Text style={styles.heading}>Encuentra apoyo profesional hoy</Text>

        <TextInput
          placeholder="Buscar profesionales o especialidades"
          placeholderTextColor={appTheme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          onSubmitEditing={() =>
            router.push({ pathname: "/(user)/professionals", params: { search: search.trim() } } as any)
          }
        />

        <AppCard>
          <Text style={styles.cardTitle}>Saldo disponible</Text>
          <Text style={styles.balanceValue}>{balance.toFixed(2)} créditos</Text>
          <Text style={styles.cardHint}>Usa tu saldo para iniciar chats con profesionales.</Text>
        </AppCard>

        <View style={styles.chips}>
          {quickSpecialties.map((item) => (
            <AppChip
              key={item}
              label={item}
              onPress={() => router.push({ pathname: "/(user)/professionals", params: { specialty: item } } as any)}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profesionales destacados</Text>
          <Text style={styles.link} onPress={() => router.push("/(user)/professionals")}>
            Ver todos
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={professionals}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ProfessionalCard
              professional={item}
              onPress={() => router.push({ pathname: "/(user)/professionals/[id]", params: { id: item.id } } as any)}
            />
          )}
        />
        {!loading && professionals.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>No hay profesionales disponibles por el momento.</Text>
          </AppCard>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  greeting: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  heading: {
    color: appTheme.colors.text,
    fontSize: 27,
    lineHeight: 34,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  search: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderColor: appTheme.colors.border,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  cardTitle: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
  },
  balanceValue: {
    color: appTheme.colors.primary,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  cardHint: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontSize: 17,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  link: {
    color: appTheme.colors.primary,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
});

