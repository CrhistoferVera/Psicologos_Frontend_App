export type LangItem = {
  name: string;
  flag: string;
  color: string;
  border: string;
  accent: string;
};

export const LANGUAGE_GROUPS: { region: string; icon: string; languages: LangItem[] }[] = [
  {
    region: "Más hablados",
    icon: "⭐",
    languages: [
      { name: "Español",        flag: "🇪🇸", color: "#FFF7ED", border: "#FDBA74", accent: "#F97316" },
      { name: "Inglés",         flag: "🇬🇧", color: "#EFF6FF", border: "#93C5FD", accent: "#3B82F6" },
      { name: "Portugués",      flag: "🇵🇹", color: "#F0FDF4", border: "#86EFAC", accent: "#22C55E" },
      { name: "Francés",        flag: "🇫🇷", color: "#EFF6FF", border: "#93C5FD", accent: "#2563EB" },
      { name: "Árabe",          flag: "🇸🇦", color: "#F0FDF4", border: "#86EFAC", accent: "#15803D" },
      { name: "Chino Mandarín", flag: "🇨🇳", color: "#FFF1F2", border: "#FCA5A5", accent: "#B91C1C" },
      { name: "Hindi",          flag: "🇮🇳", color: "#FFF7ED", border: "#FDBA74", accent: "#C2410C" },
      { name: "Ruso",           flag: "🇷🇺", color: "#F0F9FF", border: "#7DD3FC", accent: "#0369A1" },
    ],
  },
  {
    region: "América",
    icon: "🌎",
    languages: [
      { name: "Guaraní",     flag: "🇵🇾", color: "#FFF1F2", border: "#FCA5A5", accent: "#EF4444" },
      { name: "Quechua",     flag: "🇵🇪", color: "#FDF4FF", border: "#E879F9", accent: "#A855F7" },
      { name: "Aymara",      flag: "🇧🇴", color: "#ECFDF5", border: "#6EE7B7", accent: "#10B981" },
      { name: "Náhuatl",     flag: "🇲🇽", color: "#FFF7ED", border: "#FCD34D", accent: "#D97706" },
      { name: "Haití Creol", flag: "🇭🇹", color: "#FDF2F8", border: "#F0ABFC", accent: "#C026D3" },
    ],
  },
  {
    region: "Europa",
    icon: "🌍",
    languages: [
      { name: "Alemán",     flag: "🇩🇪", color: "#FEFCE8", border: "#FDE047", accent: "#CA8A04" },
      { name: "Italiano",   flag: "🇮🇹", color: "#F0FDF4", border: "#86EFAC", accent: "#16A34A" },
      { name: "Holandés",   flag: "🇳🇱", color: "#FFF7ED", border: "#FDBA74", accent: "#EA580C" },
      { name: "Sueco",      flag: "🇸🇪", color: "#EFF6FF", border: "#BAE6FD", accent: "#0284C7" },
      { name: "Polaco",     flag: "🇵🇱", color: "#FFF1F2", border: "#FCA5A5", accent: "#DC2626" },
      { name: "Griego",     flag: "🇬🇷", color: "#EFF6FF", border: "#93C5FD", accent: "#1E40AF" },
      { name: "Rumano",     flag: "🇷🇴", color: "#FFF1F2", border: "#FCA5A5", accent: "#B91C1C" },
      { name: "Húngaro",    flag: "🇭🇺", color: "#FFF7ED", border: "#FDBA74", accent: "#C2410C" },
      { name: "Checo",      flag: "🇨🇿", color: "#FDF4FF", border: "#D8B4FE", accent: "#7C3AED" },
      { name: "Noruego",    flag: "🇳🇴", color: "#FFF1F2", border: "#FCA5A5", accent: "#9F1239" },
      { name: "Danés",      flag: "🇩🇰", color: "#FFF1F2", border: "#FECDD3", accent: "#BE123C" },
      { name: "Finlandés",  flag: "🇫🇮", color: "#EFF6FF", border: "#BAE6FD", accent: "#075985" },
      { name: "Catalán",    flag: "🏴",  color: "#FFF7ED", border: "#FCD34D", accent: "#B45309" },
      { name: "Ucraniano",  flag: "🇺🇦", color: "#FEFCE8", border: "#FDE047", accent: "#1D4ED8" },
    ],
  },
  {
    region: "Asia & Oriente",
    icon: "🌏",
    languages: [
      { name: "Japonés",    flag: "🇯🇵", color: "#FFF1F2", border: "#FECDD3", accent: "#E11D48" },
      { name: "Coreano",    flag: "🇰🇷", color: "#EFF6FF", border: "#93C5FD", accent: "#1D4ED8" },
      { name: "Turco",      flag: "🇹🇷", color: "#FFF1F2", border: "#FCA5A5", accent: "#DC2626" },
      { name: "Persa",      flag: "🇮🇷", color: "#F0FDF4", border: "#6EE7B7", accent: "#047857" },
      { name: "Indonesio",  flag: "🇮🇩", color: "#FFF1F2", border: "#FCA5A5", accent: "#9F1239" },
      { name: "Tailandés",  flag: "🇹🇭", color: "#EFF6FF", border: "#93C5FD", accent: "#1E3A8A" },
      { name: "Vietnamita", flag: "🇻🇳", color: "#FFF1F2", border: "#FCA5A5", accent: "#991B1B" },
      { name: "Tagalo",     flag: "🇵🇭", color: "#EFF6FF", border: "#93C5FD", accent: "#1D4ED8" },
      { name: "Hebreo",     flag: "🇮🇱", color: "#EFF6FF", border: "#BAE6FD", accent: "#1E40AF" },
      { name: "Bengali",    flag: "🇧🇩", color: "#F0FDF4", border: "#86EFAC", accent: "#166534" },
      { name: "Urdu",       flag: "🇵🇰", color: "#F0FDF4", border: "#6EE7B7", accent: "#065F46" },
      { name: "Malayo",     flag: "🇲🇾", color: "#FFF1F2", border: "#FCA5A5", accent: "#9F1239" },
      { name: "Swahili",    flag: "🇰🇪", color: "#F0FDF4", border: "#86EFAC", accent: "#14532D" },
    ],
  },
];

export const ALL_LANGUAGES: LangItem[] = LANGUAGE_GROUPS.flatMap((g) => g.languages);

export function getLangInfo(name: string): LangItem | undefined {
  return ALL_LANGUAGES.find((l) => l.name === name);
}
