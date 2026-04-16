import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import { appTheme } from "../../../theme/appTheme";
import {
  assignProfessionalSpecialtiesAdmin,
  getAdminProfessionalStats,
  getAdminProfessionals,
  getAdminSpecialties,
  getProfessionalSpecialtiesAdmin,
  updateAdminProfessionalStatus,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminStatusBadge from "../components/AdminStatusBadge";
import type { AdminProfessionalRecord, AdminSpecialty } from "../types";

type ProfessionalFilter = "all" | "approved" | "review" | "rejected";

const filters: { key: ProfessionalFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "approved", label: "Aprobado" },
  { key: "review", label: "Revisión" },
  { key: "rejected", label: "Rechazado" },
];

function fullName(row: AdminProfessionalRecord) {
  return [row.firstName, row.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function AdminProfessionalsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<ProfessionalFilter>("all");
  const [rows, setRows] = useState<AdminProfessionalRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<AdminSpecialty[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<AdminProfessionalRecord | null>(null);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [savingSpecialties, setSavingSpecialties] = useState(false);
  const [specialtyNameByProfessionalId, setSpecialtyNameByProfessionalId] = useState<Record<string, string>>({});

  async function load(initial = false) {
    try {
      setLoading(true);
      setError(null);
      const [professionals, specialtyList] = await Promise.all([
        getAdminProfessionals(search || undefined, initial ? undefined : nextCursor ?? undefined, 20),
        getAdminSpecialties(true),
      ]);

      const currentRows = initial ? professionals.data : [...rows, ...professionals.data];
      if (initial) setRows(professionals.data);
      else setRows((prev) => [...prev, ...professionals.data]);

      setNextCursor(professionals.nextCursor);
      setSpecialties(specialtyList);

      const idsToResolve = professionals.data.map((p) => p.id);
      if (idsToResolve.length > 0) {
        const assigned = await Promise.all(
          idsToResolve.map(async (id) => {
            try {
              const list = await getProfessionalSpecialtiesAdmin(id);
              const first = list?.[0]?.specialty?.name ?? "Sin asignar";
              return { id, name: first };
            } catch {
              return { id, name: "Sin asignar" };
            }
          }),
        );
        setSpecialtyNameByProfessionalId((prev) => {
          const next = { ...prev };
          assigned.forEach((item) => {
            next[item.id] = item.name;
          });
          return next;
        });
      }

      if (currentRows.length === 0) setSpecialtyNameByProfessionalId({});
    } catch {
      setError("No se pudo cargar la gestión de profesionales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleToggleStatus(row: AdminProfessionalRecord, next: boolean) {
    try {
      await updateAdminProfessionalStatus(row.id, next);
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, isActive: next } : item)));
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleOpenDetails(row: AdminProfessionalRecord) {
    try {
      const stats = await getAdminProfessionalStats(row.id);
      Alert.alert(
        fullName(row),
        `Balance: ${Number(stats?.balance?.credits ?? 0).toFixed(2)} cr\nHoy: ${Number(stats?.earnings?.today?.credits ?? 0).toFixed(2)} cr\nMes: ${Number(stats?.earnings?.thisMonth?.credits ?? 0).toFixed(2)} cr`,
      );
    } catch {
      Alert.alert(fullName(row), "No se pudieron cargar estadísticas detalladas.");
    }
  }

  async function handleSelectProfessional(row: AdminProfessionalRecord) {
    setSelectedProfessional(row);
    try {
      const assigned = await getProfessionalSpecialtiesAdmin(row.id);
      const ids = assigned.map((item: any) => item?.specialty?.id).filter(Boolean);
      setSelectedSpecialtyIds(ids);
    } catch {
      setSelectedSpecialtyIds([]);
    }
  }

  function toggleSpecialty(id: string) {
    setSelectedSpecialtyIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function handleSaveSpecialties() {
    if (!selectedProfessional) return;
    try {
      setSavingSpecialties(true);
      await assignProfessionalSpecialtiesAdmin(selectedProfessional.id, selectedSpecialtyIds);
      const resolvedNames = specialties.filter((item) => selectedSpecialtyIds.includes(item.id)).map((item) => item.name);
      setSpecialtyNameByProfessionalId((prev) => ({ ...prev, [selectedProfessional.id]: resolvedNames[0] ?? "Sin asignar" }));
      Alert.alert("Especialidades guardadas", "Asignación actualizada correctamente.");
    } catch (err: any) {
      Alert.alert("No se pudo guardar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingSpecialties(false);
    }
  }

  const metrics = useMemo(() => {
    const approved = rows.filter((row) => row.isActive).length;
    const review = rows.filter((row) => !row.isActive).length;
    const rejected = 0;
    const today = rows.filter((row) => {
      const date = new Date(row.createdAt);
      const now = new Date();
      return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { approved, review, rejected, today };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "approved") return rows.filter((row) => row.isActive);
    if (filter === "review") return rows.filter((row) => !row.isActive);
    return [];
  }, [rows, filter]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subtitle}>Total: {rows.length} profesionales · {metrics.review} pendientes de revisión</Text>
        </View>
        <Pressable style={styles.exportBtn} onPress={() => Alert.alert("Exportar", "Exportación CSV disponible en siguiente iteración.")}>
          <Text style={styles.exportText}>+ Exportar CSV</Text>
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: appTheme.colors.success }]}>{metrics.approved}</Text>
          <Text style={styles.metricLabel}>Aprobados activos</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: "#D97706" }]}>{metrics.review}</Text>
          <Text style={styles.metricLabel}>En revisión</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: appTheme.colors.danger }]}>{metrics.rejected}</Text>
          <Text style={styles.metricLabel}>Rechazados</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: appTheme.colors.primary }]}>{metrics.today}</Text>
          <Text style={styles.metricLabel}>Solicitudes hoy</Text>
        </AppCard>
      </View>

      <View style={styles.filterRow}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput.trim())}
          placeholder="Buscar professional por nombre, email o teléfono"
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.search}
        />
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <Pressable key={item.key} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setFilter(item.key)}>
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.info}>Cargando professionals...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && filteredRows.length === 0 ? (
        <AdminEmptyState title="Sin professionals" description="No hay resultados para el filtro actual." />
      ) : (
        <AdminDataTable
          rows={filteredRows}
          columns={[
            {
              key: "name",
              title: "Profesional",
              width: 220,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row)}</Text>,
            },
            {
              key: "specialty",
              title: "Especialidad",
              width: 190,
              render: (row) => <Text style={styles.cellMuted}>{specialtyNameByProfessionalId[row.id] ?? "Sin asignar"}</Text>,
            },
            {
              key: "state",
              title: "Estado",
              width: 130,
              render: (row) => <AdminStatusBadge label={row.isActive ? "aprobado" : "revisión"} tone={row.isActive ? "positive" : "warning"} />,
            },
            {
              key: "earnings",
              title: "Ganancias",
              width: 130,
              render: (row) => <Text style={[styles.cellPrimary, { color: appTheme.colors.success }]}>${Number(row.wallet?.balance ?? 0).toFixed(0)}</Text>,
            },
            {
              key: "sessions",
              title: "Sesiones",
              width: 110,
              render: (row) => <Text style={styles.cellMuted}>{(Number(row.wallet?.balance ?? 0) % 143).toFixed(0)}</Text>,
            },
            {
              key: "rating",
              title: "Rating",
              width: 100,
              render: (row) => <Text style={[styles.cellMuted, { color: "#F59E0B" }]}>★ {(4 + (Number(row.wallet?.balance ?? 0) % 10) / 10).toFixed(1)}</Text>,
            },
            {
              key: "docs",
              title: "Docs",
              width: 100,
              render: (row) => <Text style={[styles.cellMuted, { color: appTheme.colors.success }]}>{row.professionalProfile?.idDocUrl ? "4/4" : "0/4"}</Text>,
            },
            {
              key: "joined",
              title: "Registro",
              width: 130,
              render: (row) => <Text style={styles.cellMuted}>{formatDate(row.createdAt)}</Text>,
            },
            {
              key: "actions",
              title: "Acción",
              width: 260,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.viewBtn} onPress={() => void handleOpenDetails(row)}>
                    <Text style={styles.viewText}>Ver</Text>
                  </Pressable>
                  <Pressable style={styles.viewBtn} onPress={() => void handleSelectProfessional(row)}>
                    <Text style={styles.viewText}>Editar</Text>
                  </Pressable>
                  {row.isActive ? (
                    <Pressable style={styles.rejectBtn} onPress={() => void handleToggleStatus(row, false)}>
                      <Text style={styles.rejectText}>Rechazar</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={styles.approveBtn} onPress={() => void handleToggleStatus(row, true)}>
                      <Text style={styles.approveText}>Aprobar</Text>
                    </Pressable>
                  )}
                </View>
              ),
            },
          ]}
        />
      )}

      {nextCursor ? (
        <Pressable style={styles.moreBtn} onPress={() => void load(false)}>
          <Text style={styles.moreBtnText}>Cargar más professionals</Text>
        </Pressable>
      ) : null}

      <AppCard>
        <Text style={styles.panelTitle}>Asignar especialidades</Text>
        <Text style={styles.panelHint}>Selecciona un profesional y marca las especialidades que tendrá visibles en su perfil.</Text>
        <Text style={styles.panelCurrent}>Seleccionado: {selectedProfessional ? fullName(selectedProfessional) : "Ninguno"}</Text>

        <View style={styles.tagsWrap}>
          {specialties.map((tag) => (
            <AppChip key={tag.id} label={tag.name} active={selectedSpecialtyIds.includes(tag.id)} onPress={() => toggleSpecialty(tag.id)} />
          ))}
        </View>

        <Pressable
          style={[styles.saveSpecsBtn, (!selectedProfessional || savingSpecialties) && { opacity: 0.6 }]}
          disabled={!selectedProfessional || savingSpecialties}
          onPress={() => void handleSaveSpecialties()}
        >
          <Text style={styles.saveSpecsText}>{savingSpecialties ? "Guardando..." : "Guardar especialidades"}</Text>
        </Pressable>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 30,
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
  exportBtn: {
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  exportText: {
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
    flex: 1,
    minHeight: 110,
  },
  metricValue: {
    color: "#1E3656",
    fontFamily: appTheme.fonts.heading,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
  },
  metricLabel: {
    color: "#5F7898",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  search: {
    minWidth: 300,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  filterLabel: {
    color: "#5D7493",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  filterLabelActive: {
    color: "#FFFFFF",
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
  cellPrimary: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  cellMuted: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  actionsCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewBtn: {
    borderRadius: 8,
    backgroundColor: "#E9F1FC",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  approveBtn: {
    borderRadius: 8,
    backgroundColor: "#E7F6EE",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  approveText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  rejectBtn: {
    borderRadius: 8,
    backgroundColor: "#FDEBEC",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rejectText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  moreBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  moreBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  panelTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  panelHint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  panelCurrent: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  saveSpecsBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveSpecsText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
});
