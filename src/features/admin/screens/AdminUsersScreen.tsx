import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { getAdminClients, updateAdminClientStatus } from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminStatusBadge from "../components/AdminStatusBadge";
import type { AdminUserRecord } from "../types";

type StatusFilter = "all" | "active" | "suspended";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function fullName(row: AdminUserRecord) {
  return [row.firstName, row.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

export default function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

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

  async function handleToggle(row: AdminUserRecord) {
    try {
      await updateAdminClientStatus(row.id, !row.isActive);
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, isActive: !item.isActive } : item)));
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    }
  }

  return (
    <View style={styles.page}>
      <AppCard>
        <View style={styles.filtersRow}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => setSearch(searchInput.trim())}
            placeholder="Buscar por nombre, email o telefono"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.search}
          />
          <Pressable style={[styles.filterChip, status === "all" && styles.filterChipActive]} onPress={() => setStatus("all")}>
            <Text style={[styles.filterLabel, status === "all" && styles.filterLabelActive]}>Todos</Text>
          </Pressable>
          <Pressable style={[styles.filterChip, status === "active" && styles.filterChipActive]} onPress={() => setStatus("active")}>
            <Text style={[styles.filterLabel, status === "active" && styles.filterLabelActive]}>Activos</Text>
          </Pressable>
          <Pressable style={[styles.filterChip, status === "suspended" && styles.filterChipActive]} onPress={() => setStatus("suspended")}>
            <Text style={[styles.filterLabel, status === "suspended" && styles.filterLabelActive]}>Suspendidos</Text>
          </Pressable>
          <Pressable style={styles.searchBtn} onPress={() => setSearch(searchInput.trim())}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </View>
      </AppCard>

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
              title: "Nombre",
              width: 220,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row)}</Text>,
            },
            {
              key: "contact",
              title: "Email / Telefono",
              width: 220,
              render: (row) => <Text style={styles.cellMuted}>{row.email ?? row.phoneNumber}</Text>,
            },
            {
              key: "status",
              title: "Estado",
              width: 140,
              render: (row) => <AdminStatusBadge label={row.isActive ? "Activo" : "Suspendido"} tone={row.isActive ? "positive" : "danger"} />,
            },
            {
              key: "credits",
              title: "Creditos",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.wallet?.balance ?? 0).toFixed(2)}</Text>,
            },
            {
              key: "joined",
              title: "Registro",
              width: 120,
              render: (row) => <Text style={styles.cellMuted}>{formatDate(row.createdAt)}</Text>,
            },
            {
              key: "referredBy",
              title: "Referido por",
              width: 140,
              render: () => <Text style={styles.cellMuted}>-</Text>,
            },
            {
              key: "actions",
              title: "Acciones",
              width: 180,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.actionOutline} onPress={() => Alert.alert("Usuario", fullName(row))}>
                    <Text style={styles.actionOutlineText}>Ver</Text>
                  </Pressable>
                  <Pressable style={styles.actionFill} onPress={() => void handleToggle(row)}>
                    <Text style={styles.actionFillText}>{row.isActive ? "Bloquear" : "Activar"}</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      )}

      {nextCursor ? (
        <Pressable style={styles.moreBtn} onPress={() => void load(false)}>
          <Text style={styles.moreBtnText}>Cargar mas</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    gap: 12,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  search: {
    minWidth: 260,
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
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  filterLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  filterLabelActive: {
    color: "#FFFFFF",
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
    gap: 8,
  },
  actionOutline: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionOutlineText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  actionFill: {
    backgroundColor: appTheme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionFillText: {
    color: "#FFFFFF",
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
});
