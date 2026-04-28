import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { getAdminClientById, getAdminClients, updateAdminClientStatus } from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminResponsive } from "../hooks/useAdminResponsive";
import type { AdminUserRecord } from "../types";

type StatusFilter = "all" | "active" | "blocked" | "inactive";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function fullName(row: AdminUserRecord) {
  return [row.firstName, row.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activo" },
  { key: "blocked", label: "Bloqueado" },
  { key: "inactive", label: "Inactivo" },
];

export default function AdminUsersScreen() {
  const { isMobile, contentPadding } = useAdminResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  async function load(initial = false) {
    try {
      setLoading(true);
      setError(null);
      const result = await getAdminClients(search || undefined, initial ? undefined : nextCursor ?? undefined, 20);
      if (initial) {
        setRows(result.data);
      } else {
        setRows((prev) => [...prev, ...result.data]);
      }
      setNextCursor(result.nextCursor);
    } catch {
      setError("No se pudo cargar el listado de usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    if (status === "active") return rows.filter((row) => row.isActive);
    return rows.filter((row) => !row.isActive);
  }, [rows, status]);

  const metrics = useMemo(() => {
    const active = rows.filter((row) => row.isActive).length;
    const blocked = rows.filter((row) => !row.isActive).length;
    const inactive = blocked;
    const today = rows.filter((row) => {
      const date = new Date(row.createdAt);
      const now = new Date();
      return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { active, blocked, inactive, today };
  }, [rows]);

  async function handleToggle(row: AdminUserRecord) {
    try {
      await updateAdminClientStatus(row.id, !row.isActive);
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, isActive: !item.isActive } : item)));
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleOpenDetail(id: string) {
    try {
      setLoadingUserDetail(true);
      const detail = await getAdminClientById(id);
      setSelectedUser(detail);
    } catch (err: any) {
      Alert.alert("No se pudo cargar", err?.message ?? "No se pudo obtener el detalle del usuario.");
    } finally {
      setLoadingUserDetail(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      <View style={[styles.actionsRow, { flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Total: {rows.length.toLocaleString()} usuarios registrados</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput.trim())}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={appTheme.colors.textMuted}
          style={[styles.search, { minWidth: isMobile ? 0 : 320, width: isMobile ? "100%" : undefined }]}
        />
        {statusTabs.map((tab) => {
          const active = status === tab.key;
          return (
            <Pressable key={tab.key} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setStatus(tab.key)}>
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.metricsRow, { flexWrap: "wrap" }]}>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: appTheme.colors.success }]}>{metrics.active.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Total activos</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: appTheme.colors.danger }]}>{metrics.blocked.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Bloqueados</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.inactive.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Inactivos</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: appTheme.colors.primary }]}>{metrics.today.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Nuevos hoy</Text>
        </AppCard>
      </View>

      {loading ? <Text style={styles.info}>Cargando usuarios...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && filtered.length === 0 ? (
        <AdminEmptyState title="Sin resultados" description="No encontramos usuarios para este filtro." />
      ) : (
        <AdminDataTable
          rows={filtered}
          columns={[
            {
              key: "name",
              title: "Usuario",
              width: 220,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row)}</Text>,
            },
            {
              key: "contact",
              title: "Email",
              width: 230,
              render: (row) => <Text style={styles.cellMuted}>{row.email ?? row.phoneNumber}</Text>,
            },
            {
              key: "status",
              title: "Estado",
              width: 130,
              render: (row) => <AdminStatusBadge label={row.isActive ? "activo" : "bloqueado"} tone={row.isActive ? "positive" : "danger"} />,
            },
            {
              key: "credits",
              title: "Créditos",
              width: 120,
              render: (row) => <Text style={[styles.cellPrimary, styles.blue]}>{Number(row.wallet?.balance ?? 0).toFixed(0)} crd</Text>,
            },
            {
              key: "joined",
              title: "Registro",
              width: 130,
              render: (row) => <Text style={styles.cellMuted}>{formatDate(row.createdAt)}</Text>,
            },
            {
              key: "actions",
              title: "Acciones",
              width: 190,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.viewBtn} onPress={() => void handleOpenDetail(row.id)}>
                    <Text style={styles.viewText}>Ver</Text>
                  </Pressable>
                  <Pressable style={[styles.blockBtn, row.isActive ? styles.blockBtnRed : styles.blockBtnGreen]} onPress={() => void handleToggle(row)}>
                    <Text style={[styles.blockText, row.isActive ? styles.blockTextRed : styles.blockTextGreen]}>{row.isActive ? "Bloquear" : "Desbloquear"}</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      )}

      {nextCursor ? (
        <Pressable style={styles.moreBtn} onPress={() => void load(false)}>
          <Text style={styles.moreBtnText}>Cargar más</Text>
        </Pressable>
      ) : null}

      <Modal visible={selectedUser !== null} transparent animationType="fade" onRequestClose={() => setSelectedUser(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedUser(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Detalle de usuario</Text>
            {loadingUserDetail || !selectedUser ? (
              <Text style={styles.cellMuted}>Cargando...</Text>
            ) : (
              <View style={{ gap: 8 }}>
                <Text style={styles.cellPrimary}>{fullName(selectedUser)}</Text>
                <Text style={styles.cellMuted}>Email: {selectedUser.email ?? "-"}</Text>
                <Text style={styles.cellMuted}>Teléfono: {selectedUser.phoneNumber}</Text>
                <Text style={styles.cellMuted}>Referral code: {selectedUser.referralCode ?? "-"}</Text>
                <Text style={styles.cellMuted}>Username: {selectedUser.userProfile?.userName ?? "-"}</Text>
                <Text style={styles.cellMuted}>Bio: {selectedUser.userProfile?.bio ?? "-"}</Text>
                <Text style={styles.cellMuted}>Saldo: {Number(selectedUser.wallet?.balance ?? 0).toFixed(2)} créditos</Text>
                <Text style={styles.cellMuted}>Registro: {formatDate(selectedUser.createdAt)}</Text>
              </View>
            )}
            <Pressable style={styles.moreBtn} onPress={() => setSelectedUser(null)}>
              <Text style={styles.moreBtnText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  title: {
    color: "#607895",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  search: {
    minWidth: 320,
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
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
  },
  metricLabel: {
    color: "#5F7898",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
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
  blue: {
    color: appTheme.colors.primary,
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
  blockBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  blockBtnRed: {
    backgroundColor: "#FDEBEC",
  },
  blockBtnGreen: {
    backgroundColor: "#E7F6EE",
  },
  blockText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  blockTextRed: {
    color: appTheme.colors.danger,
  },
  blockTextGreen: {
    color: appTheme.colors.success,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
});
