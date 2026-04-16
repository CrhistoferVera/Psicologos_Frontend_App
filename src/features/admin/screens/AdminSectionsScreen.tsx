import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { createAdminSpecialty, deactivateAdminSpecialty, getAdminSpecialties, updateAdminSpecialty } from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminStatusBadge from "../components/AdminStatusBadge";
import type { AdminSpecialty } from "../types";

export default function AdminSectionsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AdminSpecialty[]>([]);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSpecialties(true, search || undefined);
      setRows(data);
    } catch {
      setError("No se pudo cargar sections/especialidades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate() {
    if (!newName.trim()) {
      Alert.alert("Nombre requerido", "Ingresa un nombre para la especialidad.");
      return;
    }
    try {
      await createAdminSpecialty({ name: newName.trim(), description: newDescription.trim() || undefined });
      setNewName("");
      setNewDescription("");
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo crear", err?.message ?? "Intenta nuevamente.");
    }
  }

  function openEdit(row: AdminSpecialty) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditDescription(row.description ?? "");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    try {
      await updateAdminSpecialty(editingId, { name: editName.trim(), description: editDescription.trim() || undefined });
      setEditingId(null);
      setEditName("");
      setEditDescription("");
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo guardar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateAdminSpecialty(id);
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo desactivar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleActivate(id: string) {
    try {
      await updateAdminSpecialty(id, { isActive: true });
      await load();
    } catch (err: any) {
      Alert.alert("No se pudo activar", err?.message ?? "Intenta nuevamente.");
    }
  }

  const activeCount = useMemo(() => rows.filter((row) => row.isActive).length, [rows]);

  return (
    <View style={styles.page}>
      <View style={styles.metricsRow}>
        <AppCard style={{ flex: 1 }}>
          <Text style={styles.metricLabel}>Especialidades activas</Text>
          <Text style={styles.metricValue}>{activeCount}</Text>
        </AppCard>
        <AppCard style={{ flex: 1 }}>
          <Text style={styles.metricLabel}>Especialidades totales</Text>
          <Text style={styles.metricValue}>{rows.length}</Text>
        </AppCard>
      </View>

      <AppCard>
        <Text style={styles.panelTitle}>Crear section/especialidad</Text>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Nombre (ej: Ansiedad)"
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={newDescription}
          onChangeText={setNewDescription}
          placeholder="Descripcion opcional"
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.input}
        />
        <Pressable style={styles.primaryBtn} onPress={() => void handleCreate()}>
          <Text style={styles.primaryBtnText}>Crear especialidad</Text>
        </Pressable>
      </AppCard>

      <AppCard>
        <Text style={styles.panelTitle}>Buscar section</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o descripcion"
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.input}
        />
      </AppCard>

      {loading ? <Text style={styles.info}>Cargando sections...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && rows.length === 0 ? (
        <AdminEmptyState title="Sin sections" description="No hay especialidades registradas aun." />
      ) : (
        <AdminDataTable
          rows={rows}
          columns={[
            { key: "name", title: "Section / Especialidad", width: 220, render: (row) => <Text style={styles.cellPrimary}>{row.name}</Text> },
            { key: "slug", title: "Slug", width: 180, render: (row) => <Text style={styles.cellMuted}>{row.slug}</Text> },
            {
              key: "description",
              title: "Descripcion",
              width: 300,
              render: (row) => <Text style={styles.cellMuted}>{row.description ?? "-"}</Text>,
            },
            {
              key: "status",
              title: "Estado",
              width: 130,
              render: (row) => <AdminStatusBadge label={row.isActive ? "Activa" : "Inactiva"} tone={row.isActive ? "positive" : "neutral"} />,
            },
            {
              key: "actions",
              title: "Acciones",
              width: 220,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.outlineBtn} onPress={() => openEdit(row)}>
                    <Text style={styles.outlineBtnText}>Editar</Text>
                  </Pressable>
                  {row.isActive ? (
                    <Pressable style={styles.rejectBtn} onPress={() => void handleDeactivate(row.id)}>
                      <Text style={styles.rejectText}>Desactivar</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={styles.primaryBtnInline} onPress={() => void handleActivate(row.id)}>
                      <Text style={styles.primaryBtnInlineText}>Activar</Text>
                    </Pressable>
                  )}
                </View>
              ),
            },
          ]}
        />
      )}

      {editingId ? (
        <AppCard>
          <Text style={styles.panelTitle}>Editar section</Text>
          <TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholder="Nombre" placeholderTextColor={appTheme.colors.textMuted} />
          <TextInput value={editDescription} onChangeText={setEditDescription} style={styles.input} placeholder="Descripcion" placeholderTextColor={appTheme.colors.textMuted} />
          <View style={styles.editActions}>
            <Pressable style={styles.outlineBtn} onPress={() => setEditingId(null)}>
              <Text style={styles.outlineBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryBtnInline} onPress={() => void handleSaveEdit()}>
              <Text style={styles.primaryBtnInlineText}>Guardar</Text>
            </Pressable>
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={styles.panelTitle}>Subsections (estructura futura)</Text>
        <Text style={styles.info}>La jerarquia se prepara para categorias clinicas y subsecciones en fase siguiente.</Text>
        <Text style={styles.info}>TODO: agregar entidad backend de subsecciones y ordenamiento.</Text>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    gap: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  metricValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
  },
  panelTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    backgroundColor: appTheme.colors.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  primaryBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  cellPrimary: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  cellMuted: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  actionsCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  outlineBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  rejectBtn: {
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rejectText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  primaryBtnInline: {
    borderRadius: 8,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  primaryBtnInlineText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
});
