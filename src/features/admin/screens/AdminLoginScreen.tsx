import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { loginWithEmail } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

export default function AdminLoginScreen() {
  const router = useRouter();
  const { user, isHydrated, setSession, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isHydrated) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (user?.role === "ADMIN") {
    return <Redirect href="/admin" />;
  }

  async function handleLogin() {
    try {
      setLoading(true);
      const response = await loginWithEmail(email.trim(), password);
      if (response.user.role !== "ADMIN") {
        Alert.alert("Acceso restringido", "Esta interfaz web está habilitada solo para administradores.");
        return;
      }
      await setSession(response.access_token, response.user);
      router.replace("/admin");
    } catch (error: any) {
      Alert.alert("No se pudo iniciar sesión", error?.message ?? "Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const hasBlockedUser = Boolean(user && user.role !== "ADMIN");
  const disabled = !email.trim() || !password || loading;

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Panel Admin</Text>
        <Text style={styles.subtitle}>Inicia sesión con una cuenta administradora.</Text>

        {hasBlockedUser ? (
          <>
            <View style={styles.blockedBox}>
              <Text style={styles.blockedTitle}>Cuenta no autorizada</Text>
              <Text style={styles.blockedText}>Esta sesión pertenece a un usuario sin rol administrador.</Text>
            </View>
            <Pressable style={styles.primaryBtn} onPress={() => void logout()}>
              <Text style={styles.primaryBtnText}>Cerrar sesión actual</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="admin@ejemplo.com"
              placeholderTextColor={appTheme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={appTheme.colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable style={[styles.primaryBtn, disabled && { opacity: 0.6 }]} disabled={disabled} onPress={() => void handleLogin()}>
              <Text style={styles.primaryBtnText}>{loading ? "Ingresando..." : "Ingresar al panel"}</Text>
            </Pressable>
          </>
        )}

        {Platform.OS === "web" ? <Text style={styles.footer}>Web habilitada únicamente para administración.</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#EEF4FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  centered: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    padding: 20,
    gap: 12,
  },
  title: {
    color: "#1F3656",
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#5D7390",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  primaryBtn: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  blockedBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: 12,
    gap: 4,
  },
  blockedTitle: {
    color: "#B91C1C",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  blockedText: {
    color: "#7F1D1D",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  footer: {
    marginTop: 4,
    color: "#64748B",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
});
