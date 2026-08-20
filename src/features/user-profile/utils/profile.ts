export function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim()?.[0] ?? "U";
  const last = lastName?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function normalizeRole(role?: string | null) {
  if (!role) return "Usuario";
  if (role === "USER") return "Cliente";
  if (role === "PROFESSIONAL") return "Profesional";
  if (role === "ADMIN") return "Administrador";
  return role;
}
