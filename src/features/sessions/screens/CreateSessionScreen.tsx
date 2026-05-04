import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { apiCreateSession, apiUpdateSession, apiGetSessionById } from "../../../api/sessions";

const BOB_TO_USD = 7;

export default function CreateSessionScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = Boolean(edit);

  const [title, setTitle] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  useEffect(() => {
    if (!edit) return;
    void (async () => {
      try {
        const session = await apiGetSessionById(edit);
        setTitle(session.title);
        setDurationInput(String(session.durationMinutes));
        setPriceInput(String(session.priceInBs));
      } catch {
        Alert.alert("Error", "No se pudo cargar la sesion.");
        router.back();
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [edit]);

  const priceUsd = priceInput ? (Number(priceInput) / BOB_TO_USD).toFixed(2) : "0.00";

  async function handleSubmit() {
    const duration = Number(durationInput);
    const price = Number(priceInput);

    if (!title.trim()) { Alert.alert("Error", "Ingresa un titulo."); return; }
    if (!Number.isFinite(duration) || duration < 15) { Alert.alert("Error", "La duracion minima es 15 minutos."); return; }
    if (!Number.isFinite(price) || price < 1) { Alert.alert("Error", "El precio minimo es Bs 1."); return; }

    try {
      setLoading(true);
      if (isEdit && edit) {
        await apiUpdateSession(edit, { title: title.trim(), durationMinutes: duration, priceInBs: price });
      } else {
        await apiCreateSession({ title: title.trim(), durationMinutes: duration, priceInBs: price });
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "No se pudo guardar la sesion.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingEdit) {
    return <AppScreen><Text style={styles.muted}>Cargando...</Text></AppScreen>;
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>{isEdit ? "Editar sesion" : "Nueva sesion"}</Text>
        </View>

        <AppCard style={styles.form}>
          <Text style={styles.label}>Titulo de la sesion</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Terapia de ansiedad"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
            maxLength={200}
          />

          <Text style={styles.label}>Duracion (minutos)</Text>
          <TextInput
            value={durationInput}
            onChangeText={setDurationInput}
            keyboardType="numeric"
            placeholder="Ej: 60"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Precio en Bolivianos (Bs)</Text>
          <TextInput
            value={priceInput}
            onChangeText={setPriceInput}
            keyboardType="numeric"
            placeholder="Ej: 150"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />

          <View style={styles.usdPreview}>
            <Ionicons name="information-circle-outline" size={14} color={appTheme.colors.textMuted} />
            <Text style={styles.usdPreviewText}>
              Precio en USD (calculado): ${priceUsd}
            </Text>
          </View>

          <Pressable
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            disabled={loading}
            onPress={() => void handleSubmit()}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear sesion"}
            </Text>
          </Pressable>
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 24, gap: 16 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#DEE6F1",
  },
  backBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  form: { marginHorizontal: 14, gap: 10 },
  label: { fontSize: 13, fontWeight: "600", fontFamily: appTheme.fonts.body, color: appTheme.colors.text },
  input: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF", color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body, paddingHorizontal: 12, paddingVertical: 10,
  },
  usdPreview: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F0F9FF", borderRadius: 8, padding: 10,
  },
  usdPreviewText: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted },
  submitBtn: {
    minHeight: 46, borderRadius: 12, backgroundColor: appTheme.colors.primary,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  submitBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 15, fontWeight: "700" },
  disabledBtn: { opacity: 0.65 },
  muted: { fontSize: 13, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, textAlign: "center", padding: 20 },
});
