import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { apiGetMyWallet } from "../../../api/userClient";
import { apiGetMyProfileUser } from "../../../api/userProfile";
import { appTheme } from "../../../theme/appTheme";

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim()?.[0] ?? "U";
  const last = lastName?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function normalizeRole(role?: string | null) {
  if (!role) return "Usuario";
  if (role === "USER") return "Cliente";
  if (role === "PROFESSIONAL") return "Profesional";
  if (role === "ADMIN") return "Administrador";
  return role;
}

export default function UserProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [profileData, walletData] = await Promise.allSettled([
          apiGetMyProfileUser(),
          apiGetMyWallet(),
        ]);

        if (profileData.status === "fulfilled") {
          setProfile(profileData.value);
        }

        if (walletData.status === "fulfilled") {
          const available = Number(walletData.value.balance ?? 0);
          setBalance(available);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayName = useMemo(() => {
    const firstName = profile?.firstName ?? user?.firstName ?? "";
    const lastName = profile?.lastName ?? user?.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName.length > 0 ? fullName : "Usuario";
  }, [profile?.firstName, profile?.lastName, user?.firstName, user?.lastName]);

  const email = profile?.email ?? user?.email ?? "Sin correo registrado";
  const phone = profile?.phoneNumber ?? user?.phoneNumber ?? "Sin teléfono registrado";
  const roleLabel = normalizeRole(profile?.role ?? user?.role);
  const avatarUrl = profile?.userProfile?.avatarUrl ?? profile?.UserProfile?.avatarUrl;
  const initials = getInitials(
    profile?.firstName ?? user?.firstName,
    profile?.lastName ?? user?.lastName,
  );

  async function handleLogout() {
    await logout();
    router.replace("/(public)/auth");
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Mi perfil</Text>
          <Text style={styles.subtitle}>
            Gestiona tu cuenta, créditos y accesos principales.
          </Text>
        </View>

        <LinearGradient
          colors={["#4D86BD", "#6AA7DB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.heroEmail} numberOfLines={1}>
              {email}
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Cuenta activa</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <Pressable
          style={styles.balanceCard}
          onPress={() => router.push("/(user)/credits" as any)}
        >
          <View style={styles.balanceLeft}>
            <View style={styles.balanceIconWrap}>
              <Ionicons name="card-outline" size={18} color={appTheme.colors.primary} />
            </View>

            <View>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceValue}>{Math.floor(balance)} créditos</Text>
            </View>
          </View>

          <View style={styles.balanceAction}>
            <Text style={styles.balanceActionText}>Recargar</Text>
            <Ionicons name="chevron-forward" size={16} color={appTheme.colors.primary} />
          </View>
        </Pressable>

        <AppCard>
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/(user)/credits" as any)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#E7F2FF" }]}>
              <Ionicons name="wallet-outline" size={18} color={appTheme.colors.primary} />
            </View>

            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Créditos</Text>
              <Text style={styles.menuSubtitle}>Gestiona saldo y recargas</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/(user)/referrals" as any)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#EAF8EF" }]}>
              <Ionicons name="people-outline" size={18} color={appTheme.colors.success} />
            </View>

            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Referidos</Text>
              <Text style={styles.menuSubtitle}>Comparte y gana beneficios</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/(user)/settings" as any)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#F0F4F8" }]}>
              <Ionicons name="settings-outline" size={18} color="#60758E" />
            </View>

            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Configuración</Text>
              <Text style={styles.menuSubtitle}>Preferencias y privacidad</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push("/terms" as any)}>
            <View style={[styles.menuIconWrap, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="document-text-outline" size={18} color="#4F46E5" />
            </View>

            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Términos y condiciones</Text>
              <Text style={styles.menuSubtitle}>Consulta las condiciones de uso</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Datos de cuenta</Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Correo</Text>
            <Text style={styles.dataValue} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Teléfono</Text>
            <Text style={styles.dataValue}>{phone}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Estado del perfil</Text>
            <Text style={styles.dataValue}>
              {loading ? "Sincronizando..." : profile?.isProfileComplete ? "Completo" : "Pendiente"}
            </Text>
          </View>
        </AppCard>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 14,
    backgroundColor: appTheme.colors.background,
  },

  headerBlock: {
    gap: 2,
  },

  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 32,
  },

  subtitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },

  profileHero: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
  },

  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
    backgroundColor: "#2D5F90",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitials: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 24,
  },

  heroContent: {
    flex: 1,
    gap: 2,
  },

  heroName: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 22,
  },

  heroEmail: {
    color: "#D7E8F7",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },

  heroMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  roleText: {
    color: "#EAF4FF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#8FD1A8",
  },

  statusText: {
    color: "#113C22",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },

  balanceCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  balanceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FE",
    borderWidth: 1,
    borderColor: "#D6E4F5",
  },

  balanceLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },

  balanceValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 22,
    fontWeight: "700",
  },

  balanceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 10,
  },

  balanceActionText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },

  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
  },

  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTextWrap: {
    flex: 1,
  },

  menuTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },

  menuSubtitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    marginTop: 2,
  },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },

  dataLabel: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    flex: 1,
  },

  dataValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
    flex: 1.4,
    textAlign: "right",
  },

  logoutBtn: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F5CACA",
    backgroundColor: "#FFF4F4",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  logoutText: {
    color: "#DC2626",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },
});

