import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import { appTheme } from "../../../theme/appTheme";
import {
  assignProfessionalSpecialtiesAdmin,
  editAdminProfessional,
  getAdminProfessionalById,
  getAdminProfessionalStats,
  getAdminProfessionals,
  getAdminSpecialties,
  getProfessionalSpecialtiesAdmin,
  updateAdminProfessionalProfile,
  updateAdminProfessionalStatus,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminResponsive } from "../hooks/useAdminResponsive";
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
  const { isMobile, contentPadding } = useAdminResponsive();
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
  const [detailProfessional, setDetailProfessional] = useState<AdminProfessionalRecord | null>(null);
  const [detailStats, setDetailStats] = useState<any>(null);
  const [editingProfessional, setEditingProfessional] = useState<AdminProfessionalRecord | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
    setDetailProfessional(row);
    setDetailStats(null);
    try {
      const stats = await getAdminProfessionalStats(row.id);
      setDetailStats(stats);
    } catch {
      // stats no disponibles, panel igual se muestra
    }
  }

  async function handleSelectProfessional(row: AdminProfessionalRecord) {
    setSelectedProfessional(row);
    setDetailProfessional(null);
    try {
      const assigned = await getProfessionalSpecialtiesAdmin(row.id);
      const ids = assigned.map((item: any) => item?.specialty?.id).filter(Boolean);
      setSelectedSpecialtyIds(ids);
    } catch {
      setSelectedSpecialtyIds([]);
    }
  }

  async function handleOpenEdit(row: AdminProfessionalRecord) {
    try {
      const detail = await getAdminProfessionalById(row.id);
      setEditingProfessional(detail);
      setEditPhone(detail.phoneNumber ?? "");
      setEditEmail(detail.email ?? "");
      setEditUsername(detail.professionalProfile?.username ?? "");
      setEditBio(detail.professionalProfile?.bio ?? "");
      setEditRate(String(Number(detail.professionalProfile?.rateCredits ?? 0)));
      setEditFirstName(detail.firstName ?? "");
      setEditLastName(detail.lastName ?? "");
    } catch (err: any) {
      Alert.alert("No se pudo cargar", err?.message ?? "No se pudo obtener detalle del profesional.");
    }
  }

  async function handleSaveEdit() {
    if (!editingProfessional) return;
    const rateCredits = Number(editRate);
    if (!Number.isFinite(rateCredits) || rateCredits < 0) {
      Alert.alert("Tarifa inválida", "La tarifa base debe ser un número mayor o igual a 0.");
      return;
    }

    try {
      setSavingEdit(true);
      await editAdminProfessional(editingProfessional.id, {
        phoneNumber: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        username: editUsername.trim() || undefined,
        bio: editBio.trim() || undefined,
        rateCredits,
      });
      await updateAdminProfessionalProfile(editingProfessional.id, {
        firstName: editFirstName.trim() || undefined,
        lastName: editLastName.trim() || undefined,
        username: editUsername.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      setEditingProfessional(null);
      await load(true);
      Alert.alert("Guardado", "Datos del profesional actualizados.");
    } catch (err: any) {
      Alert.alert("No se pudo guardar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingEdit(false);
    }
  }

  function toggleSpecialty(id: string) {
    setSelectedSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function handleSaveSpecialties() {
    if (!selectedProfessional) return;

    try {
      setSavingSpecialties(true);

      await assignProfessionalSpecialtiesAdmin(selectedProfessional.id, selectedSpecialtyIds);

      const resolvedNames = specialties
        .filter((item) => selectedSpecialtyIds.includes(item.id))
        .map((item) => item.name);

      setSpecialtyNameByProfessionalId((prev) => ({
        ...prev,
        [selectedProfessional.id]: resolvedNames[0] ?? "Sin asignar",
      }));

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
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
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
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      <View style={[styles.actionsRow, { flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subtitle}>
            Total: {rows.length} profesionales · {metrics.review} pendientes de revisión
          </Text>
        </View>
      </View>

      <View style={[styles.metricsRow, { flexWrap: "wrap" }]}>
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
          placeholder="Buscar profesional por nombre, email o teléfono"
          placeholderTextColor={appTheme.colors.textMuted}
          style={[styles.search, { minWidth: isMobile ? 0 : 300, width: isMobile ? "100%" : undefined }]}
        />

        {filters.map((item) => {
          const active = filter === item.key;

          return (
            <Pressable
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.info}>Cargando profesionales...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && filteredRows.length === 0 ? (
        <AdminEmptyState
          title="Sin profesionales"
          description="No hay resultados para el filtro actual."
        />
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
              render: (row) => (
                <Text style={styles.cellMuted}>
                  {specialtyNameByProfessionalId[row.id] ?? "Sin asignar"}
                </Text>
              ),
            },
            {
              key: "state",
              title: "Estado",
              width: 130,
              render: (row) => (
                <AdminStatusBadge
                  label={row.isActive ? "aprobado" : "revisión"}
                  tone={row.isActive ? "positive" : "warning"}
                />
              ),
            },
            {
              key: "earnings",
              title: "Ganancias",
              width: 130,
              render: (row) => (
                <Text style={[styles.cellPrimary, { color: appTheme.colors.success }]}>
                  {Number(row.wallet?.balance ?? 0).toFixed(2)} cr
                </Text>
              ),
            },
            {
              key: "docs",
              title: "Docs",
              width: 100,
              render: (row) => {
                const p = row.professionalProfile;
                const count = [
                  p?.idDocUrl,
                  p?.kycVideoUrl,
                  p?.matriculaUrl,
                  p?.tituloProfesionalUrl,
                ].filter(Boolean).length;

                const faceStatus = p?.kycFaceMatchStatus;
                const faceColor =
                  faceStatus === "PASSED"
                    ? appTheme.colors.success
                    : faceStatus === "FAILED"
                      ? appTheme.colors.danger
                      : appTheme.colors.textMuted;

                return (
                  <View>
                    <Text
                      style={[
                        styles.cellMuted,
                        { color: count >= 3 ? appTheme.colors.success : appTheme.colors.danger },
                      ]}
                    >
                      {count}/4 docs
                    </Text>
                    <Text style={[styles.cellMuted, { fontSize: 10, color: faceColor }]}>
                      {faceStatus ?? "PENDING"}
                    </Text>
                  </View>
                );
              },
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

                  <Pressable style={styles.viewBtn} onPress={() => void handleOpenEdit(row)}>
                    <Text style={styles.viewText}>Editar</Text>
                  </Pressable>

                  <Pressable style={styles.viewBtn} onPress={() => void handleSelectProfessional(row)}>
                    <Text style={styles.viewText}>Especialidades</Text>
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
          <Text style={styles.moreBtnText}>Cargar más profesionales</Text>
        </Pressable>
      ) : null}

      {/* Modal de detalles KYC */}
      <Modal
        visible={detailProfessional !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailProfessional(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDetailProfessional(null)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            {detailProfessional == null ? null : <>
            <View style={styles.detailHeader}>
              <Text style={styles.panelTitle}>{fullName(detailProfessional)}</Text>
              <Pressable style={styles.closeBtn} onPress={() => setDetailProfessional(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {detailStats ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailStat}>Balance: <Text style={styles.detailValue}>{Number(detailStats?.balance?.credits ?? 0).toFixed(2)} cr</Text></Text>
                <Text style={styles.detailStat}>Hoy: <Text style={styles.detailValue}>{Number(detailStats?.earnings?.today?.credits ?? 0).toFixed(2)} cr</Text></Text>
                <Text style={styles.detailStat}>Mes: <Text style={styles.detailValue}>{Number(detailStats?.earnings?.thisMonth?.credits ?? 0).toFixed(2)} cr</Text></Text>
              </View>
            ) : null}

            <Text style={styles.detailSection}>COTEJO FACIAL</Text>
            <Text style={styles.detailStat}>
              Score:{" "}
              <Text style={[styles.detailValue, {
                color: detailProfessional?.professionalProfile?.kycFaceMatchStatus === "PASSED"
                  ? appTheme.colors.success
                  : detailProfessional?.professionalProfile?.kycFaceMatchStatus === "FAILED"
                    ? appTheme.colors.danger
                    : appTheme.colors.textMuted,
              }]}>
                {detailProfessional?.professionalProfile?.kycFaceMatchScore != null
                  ? `${Number(detailProfessional.professionalProfile.kycFaceMatchScore).toFixed(1)}%`
                  : "N/A"}{" "}
                ({detailProfessional?.professionalProfile?.kycFaceMatchStatus ?? "PENDING"})
              </Text>
            </Text>

            <Text style={styles.detailSection}>DOCUMENTOS KYC</Text>
            {[
              { label: "Documento de identidad", url: detailProfessional?.professionalProfile?.idDocUrl },
              { label: "Video de rostro", url: detailProfessional?.professionalProfile?.kycVideoUrl },
              { label: "Matrícula profesional", url: detailProfessional?.professionalProfile?.matriculaUrl },
              { label: "Título profesional", url: detailProfessional?.professionalProfile?.tituloProfesionalUrl },
            ].map((doc) => (
              <View key={doc.label} style={styles.docRow}>
                <Text style={styles.detailStat}>{doc.label}:</Text>
                {doc.url ? (
                  <Pressable onPress={() => void Linking.openURL(doc.url!)}>
                    <Text style={styles.docLink}>Ver documento ↗</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.docMissing}>No cargado</Text>
                )}
              </View>
            ))}

            <View style={styles.modalActions}>
              {detailProfessional?.isActive ? (
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => {
                    void handleToggleStatus(detailProfessional!, false);
                    setDetailProfessional(null);
                  }}
                >
                  <Text style={styles.rejectText}>Rechazar</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.approveBtn}
                  onPress={() => {
                    void handleToggleStatus(detailProfessional!, true);
                    setDetailProfessional(null);
                  }}
                >
                  <Text style={styles.approveText}>Aprobar</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeBtn} onPress={() => setDetailProfessional(null)}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </Pressable>
            </View>
            </>}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Panel de editar especialidades */}
      <AppCard>
        <Text style={styles.panelTitle}>Asignar especialidades</Text>
        <Text style={styles.panelHint}>
          Selecciona un profesional y marca las especialidades que tendrá visibles en su perfil.
        </Text>
        <Text style={styles.panelCurrent}>
          Seleccionado: {selectedProfessional ? fullName(selectedProfessional) : "Ninguno"}
        </Text>

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
          <Text style={styles.saveSpecsText}>
            {savingSpecialties ? "Guardando..." : "Guardar especialidades"}
          </Text>
        </Pressable>
      </AppCard>

      <Modal
        visible={editingProfessional !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingProfessional(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingProfessional(null)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.panelTitle}>Editar profesional</Text>
            <TextInput value={editFirstName} onChangeText={setEditFirstName} style={styles.input} placeholder="Nombre" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editLastName} onChangeText={setEditLastName} style={styles.input} placeholder="Apellido" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editPhone} onChangeText={setEditPhone} style={styles.input} placeholder="Teléfono" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editEmail} onChangeText={setEditEmail} style={styles.input} placeholder="Email" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editUsername} onChangeText={setEditUsername} style={styles.input} placeholder="Username" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editRate} onChangeText={setEditRate} style={styles.input} keyboardType="decimal-pad" placeholder="Tarifa base (cr)" placeholderTextColor={appTheme.colors.textMuted} />
            <TextInput value={editBio} onChangeText={setEditBio} style={styles.input} multiline placeholder="Bio" placeholderTextColor={appTheme.colors.textMuted} />
            <View style={styles.modalActions}>
              <Pressable style={styles.closeBtn} onPress={() => setEditingProfessional(null)}>
                <Text style={styles.closeBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.approveBtn} onPress={() => void handleSaveEdit()} disabled={savingEdit}>
                <Text style={styles.approveText}>{savingEdit ? "Guardando..." : "Guardar"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },

  content: {
    paddingBottom: 28,
    paddingTop: 10,
    gap: 14,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  subtitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    lineHeight: 22,
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
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
  },

  metricLabel: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: "#F8FAFC",
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
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },

  filterLabelActive: {
    color: "#FFFFFF",
  },

  info: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "500",
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
    color: "#475569",
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
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#D6E4F5",
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
    backgroundColor: "#EAF7F0",
    borderWidth: 1,
    borderColor: "#CFE8D8",
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
    backgroundColor: "#FEECEC",
    borderWidth: 1,
    borderColor: "#F9D5D8",
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
    backgroundColor: "#F8FAFC",
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
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 560,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },

  closeBtn: {
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  closeBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },

  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  detailClose: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },

  detailRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 8,
  },

  detailSection: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  detailStat: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },

  detailValue: {
    fontWeight: "700",
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
  },

  docLink: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  docMissing: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
});

