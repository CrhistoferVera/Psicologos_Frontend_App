import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import {
  createAdminPackage,
  deleteAdminPackage,
  getAdminPackages,
  updateAdminPackage,
  type AdminPackage,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import { useAdminResponsive } from "../hooks/useAdminResponsive";

export default function AdminPackagesScreen() {
  const { isMobile, contentPadding } = useAdminResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminPackage[]>([]);

  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [price, setPrice] = useState("");

  const [editing, setEditing] = useState<AdminPackage | null>(null);
  const [editName, setEditName] = useState("");
  const [editCredits, setEditCredits] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminPackages();
      setRows(data);
    } catch {
      setError("No se pudo cargar los paquetes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    const parsedCredits = Number(credits);
    const parsedPrice = Number(price);

    if (!name.trim()) {
      Alert.alert("Nombre requerido", "Ingresa un nombre de paquete.");
      return;
    }

    if (!Number.isInteger(parsedCredits) || parsedCredits <= 0) {
      Alert.alert("Créditos inválidos", "Los créditos deben ser un entero mayor a 0.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Precio inválido", "El precio en Bs debe ser mayor a 0.");
      return;
    }

    try {
      await createAdminPackage({ name: name.trim(), credits: parsedCredits, price: parsedPrice, isActive: true });
      setName("");
      setCredits("");
      setPrice("");
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo crear", err?.message ?? "Intenta nuevamente.");
    }
  }

  function openEdit(row: AdminPackage) {
    setEditing(row);
    setEditName(row.name);
    setEditCredits(String(row.credits));
    setEditPrice(String(row.price));
  }

  async function handleSaveEdit() {
    if (!editing) return;

    const parsedCredits = Number(editCredits);
    const parsedPrice = Number(editPrice);

    if (!editName.trim()) {
      Alert.alert("Nombre requerido", "Ingresa un nombre de paquete.");
      return;
    }

    if (!Number.isInteger(parsedCredits) || parsedCredits <= 0) {
      Alert.alert("Créditos inválidos", "Los créditos deben ser un entero mayor a 0.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Precio inválido", "El precio en Bs debe ser mayor a 0.");
      return;
    }

    try {
      await updateAdminPackage(editing.id, {
        name: editName.trim(),
        credits: parsedCredits,
        price: parsedPrice,
      });
      setEditing(null);
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo guardar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdminPackage(id);
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo eliminar", err?.message ?? "Intenta nuevamente.");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      <Text style={styles.title}>Paquetes de recarga</Text>
      {loading ? <Text style={styles.info}>Cargando paquetes...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppCard>
        <Text style={styles.cardTitle}>Crear paquete</Text>
        <View style={[styles.formGrid, { flexDirection: isMobile ? "column" : "row" }]}>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Nombre" placeholderTextColor={appTheme.colors.textMuted} />
          <TextInput value={credits} onChangeText={setCredits} style={styles.input} keyboardType="number-pad" placeholder="Créditos" placeholderTextColor={appTheme.colors.textMuted} />
          <TextInput value={price} onChangeText={setPrice} style={styles.input} keyboardType="decimal-pad" placeholder="Precio Bs" placeholderTextColor={appTheme.colors.textMuted} />
          <Pressable style={styles.primaryBtn} onPress={() => void handleCreate()}>
            <Text style={styles.primaryBtnText}>Agregar</Text>
          </Pressable>
        </View>
      </AppCard>

      {rows.length === 0 && !loading ? (
        <AdminEmptyState title="Sin paquetes" description="No hay paquetes activos configurados." />
      ) : (
        <AdminDataTable
          rows={rows}
          columns={[
            {
              key: "name",
              title: "Nombre",
              width: 220,
              render: (row) => <Text style={styles.cellPrimary}>{row.name}</Text>,
            },
            {
              key: "credits",
              title: "Créditos",
              width: 130,
              render: (row) => <Text style={styles.cellMuted}>{row.credits}</Text>,
            },
            {
              key: "price",
              title: "Precio",
              width: 140,
              render: (row) => <Text style={styles.cellMuted}>Bs {row.price.toFixed(2)}</Text>,
            },
            {
              key: "actions",
              title: "Acciones",
              width: 220,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.secondaryBtn} onPress={() => openEdit(row)}>
                    <Text style={styles.secondaryBtnText}>Editar</Text>
                  </Pressable>
                  <Pressable style={styles.deleteBtn} onPress={() => void handleDelete(row.id)}>
                    <Text style={styles.deleteBtnText}>Eliminar</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      )}

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.cardTitle}>Editar paquete</Text>
            <TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholder="Nombre" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editCredits} onChangeText={setEditCredits} style={styles.input} keyboardType="number-pad" placeholder="Créditos" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editPrice} onChangeText={setEditPrice} style={styles.input} keyboardType="decimal-pad" placeholder="Precio Bs" placeholderTextColor={appTheme.colors.textMuted} />
            <View style={styles.actionsCell}>
              <Pressable style={styles.secondaryBtn} onPress={() => setEditing(null)}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => void handleSaveEdit()}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingVertical: 24, gap: 12 },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  formGrid: { gap: 8, alignItems: "center" },
  input: {
    minHeight: 44,
    flexGrow: 1,
    width: "100%",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    backgroundColor: appTheme.colors.background,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 12,
  },
  secondaryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
    fontSize: 12,
  },
  deleteBtn: {
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteBtnText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 12,
  },
  cellPrimary: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
    fontSize: 13,
  },
  cellMuted: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  actionsCell: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
});
