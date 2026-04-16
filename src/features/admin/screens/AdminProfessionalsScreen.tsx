import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

function fullName(row: AdminProfessionalRecord) {
  return [row.firstName, row.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

export default function AdminProfessionalsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState<AdminProfessionalRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<AdminSpecialty[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<AdminProfessionalRecord | null>(null);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [savingSpecialties, setSavingSpecialties] = useState(false);

  async function load(initial = false) {
    try {
      setLoading(true);
      setError(null);
      const [professionals, specialtyList] = await Promise.all([
        getAdminProfessionals(search || undefined, initial ? undefined : nextCursor ?? undefined, 20),
        getAdminSpecialties(true),
      ]);

      if (initial) setRows(professionals.data);
      else setRows((prev) => [...prev, ...professionals.data]);
      setNextCursor(professionals.nextCursor);
      setSpecialties(specialtyList);
    } catch {
      setError("No se pudo cargar la gestion de professionals.");
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
      Alert.alert(fullName(row), "No se pudieron cargar estadisticas detalladas.");
    }
  }

  async function handleSelectProfessional(row: AdminProfessionalRecord) {
    setSelectedProfessional(row);
    try {
      const assigned = await getProfessionalSpecialtiesAdmin(row.id);
      const ids = assigned
        .map((item: any) => item?.specialty?.id)
        .filter(Boolean);
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
      Alert.alert("Especialidades guardadas", "Asignacion actualizada correctamente.");
    } catch (err: any) {
      Alert.alert("No se pudo guardar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingSpecialties(false);
    }
  }

  const reviewCount = useMemo(() => rows.filter((row) => !row.isActive).length, [rows]);

  return (
    <View style={styles.page}>
      <View style={styles.topRow}>
        <AppCard style={{ flex: 1 }}>
          <Text style={styles.metricLabel}>Professionals en revision</Text>
          <Text style={styles.metricValue}>{reviewCount}</Text>
        </AppCard>
        <AppCard style={{ flex: 1 }}>
          <Text style={styles.metricLabel}>Activos</Text>
          <Text style={[styles.metricValue, { color: appTheme.colors.success }]}>{rows.filter((row) => row.isActive).length}</Text>
        </AppCard>
      </View>

      <AppCard>
        <View style={styles.filtersRow}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => setSearch(searchInput.trim())}
            placeholder="Buscar professional por nombre, email o telefono"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.search}
          />
          <Pressable style={styles.searchBtn} onPress={() => setSearch(searchInput.trim())}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </View>
      </AppCard>

      {loading ? <Text style={styles.info}>Cargando professionals...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && rows.length === 0 ? (
        <AdminEmptyState title="Sin professionals" description="No hay resultados para la busqueda actual." />
      ) : (
        <AdminDataTable
          rows={rows}
          columns={[
            {
              key: "name",
              title: "Professional",
              width: 200,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row)}</Text>,
            },
            {
              key: "username",
              title: "Username",
              width: 140,
              render: (row) => <Text style={styles.cellMuted}>{row.professionalProfile?.username ?? "-"}</Text>,
            },
            {
              key: "specialties",
              title: "Especialidades",
              width: 190,
              render: () => <Text style={styles.cellMuted}>Gestionar en panel lateral</Text>,
            },
            {
              key: "review",
              title: "Revision",
              width: 130,
              render: (row) => (
                <AdminStatusBadge
                  label={row.isActive ? "Aprobado" : "En revision"}
                  tone={row.isActive ? "positive" : "warning"}
                />
              ),
            },
            {
              key: "docs",
              title: "Documento",
              width: 120,
              render: (row) => (
                <AdminStatusBadge
                  label={row.professionalProfile?.idDocUrl ? "Cargado" : "Pendiente"}
                  tone={row.professionalProfile?.idDocUrl ? "positive" : "neutral"}
                />
              ),
            },
            {
              key: "earnings",
              title: "Balance",
              width: 110,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.wallet?.balance ?? 0).toFixed(2)} cr</Text>,
            },
            {
              key: "actions",
              title: "Acciones",
              width: 270,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.actionOutline} onPress={() => void handleOpenDetails(row)}>
                    <Text style={styles.actionOutlineText}>Ver</Text>
                  </Pressable>
                  <Pressable style={styles.actionOutline} onPress={() => void handleSelectProfessional(row)}>
                    <Text style={styles.actionOutlineText}>Especialidades</Text>
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
          <Text style={styles.moreBtnText}>Cargar mas professionals</Text>
        </Pressable>
      ) : null}

      <AppCard>
        <Text style={styles.panelTitle}>Asignar especialidades</Text>
        <Text style={styles.panelHint}>Selecciona un professional en la tabla y asigna sus especialidades.</Text>
        <Text style={styles.panelCurrent}>Seleccionado: {selectedProfessional ? fullName(selectedProfessional) : "Ninguno"}</Text>
        <View style={styles.tagsWrap}>
          {specialties.map((tag) => (
            <AppChip
              key={tag.id}
              label={tag.name}
              active={selectedSpecialtyIds.includes(tag.id)}
              onPress={() => toggleSpecialty(tag.id)}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    gap: 12,
  },
  topRow: {
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
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  search: {
    minWidth: 280,
    flexGrow: 1,
    backgroundColor: appTheme.colors.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  searchBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
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
  actionOutline: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionOutlineText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  approveBtn: {
    borderRadius: 8,
    backgroundColor: "rgba(107, 175, 138, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  approveText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  rejectBtn: {
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rejectText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  moreBtn: {
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  panelTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  panelHint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  panelCurrent: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  saveSpecsBtn: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveSpecsText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
