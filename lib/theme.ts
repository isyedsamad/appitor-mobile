export const lightTheme = {
  bg: "#f9fafb",
  bgCard: "#ffffff",

  text: "#0f172a",
  textMuted: "#505e71",

  border: "#e5e7eb",

  primary: "#e45011",
  primaryHover: "#c2410c",
  primarySoft: "#fff1e8",

  accent: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",

  warningSoft: "#fff7ed",
  accentSoft: "#ecfdf5",
  dangerSoft: "#fef2f2",
};

export const darkTheme = {
  bg: "#0b0f14",
  bgCard: "#111827",

  text: "#e5e7eb",
  textMuted: "#9ca3af",

  border: "#1f2933",

  primary: "#e45011",
  primaryHover: "#f97316",
  primarySoft: "#2a140a",

  accent: "#22c55e",
  warning: "#fbbf24",
  danger: "#ef4444",

  warningSoft: "rgba(251,191,36,0.15)",
  accentSoft: "rgba(34,197,94,0.15)",
  dangerSoft: "rgba(239,68,68,0.15)",
};

export type AppTheme = typeof lightTheme;
