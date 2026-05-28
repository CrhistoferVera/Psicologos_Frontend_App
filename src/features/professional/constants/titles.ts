export const PROFESSIONAL_TITLES = ["Dr.", "Dra.", "Lic.", "Lic.ª", "Mg.", "MsC.", "PhD"] as const;
export type ProfessionalTitle = (typeof PROFESSIONAL_TITLES)[number];

export function formatProfessionalName(name: string, title?: string | null): string {
  const trimmedName = (name ?? "").trim();
  if (!trimmedName) return "";
  const trimmedTitle = (title ?? "").trim();
  return trimmedTitle ? `${trimmedTitle} ${trimmedName}` : trimmedName;
}
