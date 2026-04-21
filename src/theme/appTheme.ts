export const appTheme = {
  colors: {
    primary: "#5B9BD5",
    background: "#F7FAFC",
    surface: "#FFFFFF",
    text: "#020617",
    textMuted: "#475569",
    border: "#CBD5E1",
    success: "#6BAF8A",
    danger: "#DC2626",
  },
  radius: {
    md: 12,
    lg: 16,
    xl: 24,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  fonts: {
    heading: "PlusJakartaSans-Bold",
    body: "Inter-Regular",
  },
} as const;

export type AppTheme = typeof appTheme;

