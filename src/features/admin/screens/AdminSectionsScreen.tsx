import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import {
  createAdminSpecialty,
  deactivateAdminSpecialty,
  getAdminSpecialties,
  getAdminStats,
  updateAdminSpecialty,
} from "../api/adminApi";
import AdminEmptyState from "../components/AdminEmptyState";
import { useAdminResponsive } from "../hooks/useAdminResponsive";
import type { AdminSpecialty } from "../types";

function subsectionListFromDescription(name: string, description?: string | null) {
  if (!description) return [name];
  const parsed = description
    .split(/[,.;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 7);
  return parsed.length > 0 ? parsed : [name];
}

export default function AdminSectionsScreen() {
  const { isMobile, contentPadding } = useAdminResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AdminSpecialty[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [data, statsData] = await Promise.all([getAdminSpecialties(true, search || undefined), getAdminStats()]);
      setRows(data);
      setStats(statsData);
    } catch {
      setError("No se pudo cargar secciones/especialidades.");
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
      Alert.alert("Nombre requerido", "Ingresa un nombre para la sección.");
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

  const activeCount = useMemo(() => rows.filter((row) => row.isActive).length, [rows]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      <View style={[styles.actionsRow, { flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subtitle}>Gestiona la taxonomía de especialidades de la plataforma</Text>
        </View>
      </View>

      <View style={[styles.metricsRow, { flexWrap: "wrap" }]}>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{activeCount}</Text>
          <Text style={styles.metricLabel}>Secciones activas</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{rows.length}</Text>
          <Text style={styles.metricLabel}>Subsecciones totales</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{Number(stats?.professionals?.total ?? 0)}</Text>
          <Text style={styles.metricLabel}>Profesionales asignados</Text>
        </AppCard>
      </View>

      <AppCard>
        <View style={styles.createHeader}>
          <Text style={styles.formTitle}>Crear sección</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar secciones..."
            placeholderTextColor={appTheme.colors.textMuted}
            style={[styles.searchInput, { minWidth: isMobile ? 0 : 260, width: isMobile ? "100%" : undefined }]}
          />
        </View>

        <View style={styles.formGrid}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Nombre (ej: Psicología)"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />
          <TextInput
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Subsecciones separadas por coma (ej: Ansiedad, Depresión)"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />
          <Pressable style={styles.primaryBtn} onPress={() => void handleCreate()}>
            <Text style={styles.primaryBtnText}>Agregar</Text>
          </Pressable>
        </View>
      </AppCard>

      {loading ? <Text style={styles.info}>Cargando secciones...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && rows.length === 0 ? (
        <AdminEmptyState title="Sin secciones" description="No hay especialidades registradas aún." />
      ) : (
        rows.map((row) => (
          <AppCard key={row.id}>
            <View style={styles.sectionTop}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>??</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { fontSize: isMobile ? 22 : 30, lineHeight: isMobile ? 28 : 34 }]}>{row.name}</Text>
                <Text style={styles.sectionMeta}>{row.isActive ? "Activa" : "Inactiva"} · {subsectionListFromDescription(row.name, row.description).length} subsecciones</Text>
              </View>
              <View style={styles.sectionActions}>
                <Pressable style={styles.editBtn} onPress={() => openEdit(row)}>
                  <Text style={styles.editText}>Editar</Text>
                </Pressable>
                {row.isActive ? (
                  <Pressable style={styles.deleteBtn} onPress={() => void handleDeactivate(row.id)}>
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.editBtn}
                    onPress={async () => {
                      await updateAdminSpecialty(row.id, { isActive: true });
                      await load();
                    }}
                  >
                    <Text style={styles.editText}>Activar</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.chipsWrap}>
              {subsectionListFromDescription(row.name, row.description).map((subsection, index) => (
                <View key={`${row.id}-${index}`} style={styles.subChip}>
                  <Text style={styles.subChipText}>{subsection}</Text>
                </View>
              ))}
            </View>
          </AppCard>
        ))
      )}

      {editingId ? (
        <AppCard>
          <Text style={styles.formTitle}>Editar sección</Text>
          <TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholder="Nombre" placeholderTextColor={appTheme.colors.textMuted} />
          <TextInput value={editDescription} onChangeText={setEditDescription} style={styles.input} placeholder="Descripción" placeholderTextColor={appTheme.colors.textMuted} />
          <View style={styles.editActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setEditingId(null)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => void handleSaveEdit()}>
              <Text style={styles.primaryBtnText}>Guardar</Text>
            </Pressable>
          </View>
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingBottom: 28,
    gap: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subtitle: {
    color: "#607895",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
  },
  newBtn: {
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  newBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 110,
  },
  metricValue: {
    color: "#1E3656",
    fontFamily: appTheme.fonts.heading,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 40,
  },
  metricLabel: {
    color: "#5F7898",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  formTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  formGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  searchInput: {
    minWidth: 260,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  input: {
    minWidth: 240,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  primaryBtn: {
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
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
  sectionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FD",
  },
  sectionIconText: {
    fontSize: 22,
  },
  sectionTitle: {
    color: "#1F3656",
    fontFamily: appTheme.fonts.heading,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 34,
  },
  sectionMeta: {
    color: "#607895",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    borderRadius: 8,
    backgroundColor: "#E9F1FC",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteBtn: {
    borderRadius: 8,
    backgroundColor: "#FDEBEC",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DCE8F4",
    backgroundColor: "#F5FAFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  subChipText: {
    color: "#476284",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  fakeSubsectionRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fakeSubsectionText: {
    color: "#8AA0BA",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  addSubBtn: {
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addSubBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  cancelBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
});
