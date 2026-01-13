export const lightTheme = {
  // Backgrounds
  bg: "#f9fafb",
  bgCard: "#ffffff",

  // Text
  text: "#0f172a",
  textMuted: "#505e71",

  // Borders
  border: "#e5e7eb",

  // Brand
  primary: "#e45011",
  primaryHover: "#c2410c",
  primarySoft: "#fff1e8",

  // Accent / Status
  accent: "#16a34a",      // success / Paid
  warning: "#f59e0b",     // Pending
  danger: "#dc2626",      // Overdue

  // Status variants (p=paid, a=absent/overdue, l=late, m=missed, h=halfday, o=other)
  statusPbg: "#dcfce7",
  statusPtext: "#166534",
  statusPborder: "#86efac",

  statusAbg: "#fee2e2",
  statusAtext: "#991b1b",
  statusAborder: "#fca5a5",

  statusLbg: "#fef3c7",
  statusLtext: "#92400e",
  statusLborder: "#fcd34d",

  statusMbg: "#dbeafe",
  statusMtext: "#1e40af",
  statusMborder: "#93c5fd",

  statusHbg: "#ccfbf1",
  statusHtext: "#065f46",
  statusHborder: "#5eead4",

  statusObg: "#ede9fe",
  statusOtext: "#5b21b6",
  statusOborder: "#c4b5fd",

  // Soft Variants (backgrounds / badges)
  warningSoft: "#fff7ed",
  accentSoft: "#ecfdf5",
  dangerSoft: "#fef2f2",
}

export const darkTheme = {
  // Backgrounds
  bg: "#0b0f14",
  bgCard: "#111827",

  // Text
  text: "#e5e7eb",
  textMuted: "#9ca3af",

  // Borders
  border: "#1f2933",

  // Brand
  primary: "#e45011",
  primaryHover: "#f97316",
  primarySoft: "#2a140a",

  // Accent / Status
  accent: "#22c55e",      // success / Paid
  warning: "#fbbf24",     // Pending
  danger: "#ef4444",      // Overdue

  // Status variants
  statusPbg: "#052e16",
  statusPtext: "#4ade80",
  statusPborder: "#166534",

  statusAbg: "#450a0a",
  statusAtext: "#f87171",
  statusAborder: "#7f1d1d",

  statusLbg: "#422006",
  statusLtext: "#facc15",
  statusLborder: "#854d0e",

  statusMbg: "#172554",
  statusMtext: "#60a5fa",
  statusMborder: "#1e3a8a",

  statusHbg: "#042f2e",
  statusHtext: "#2dd4bf",
  statusHborder: "#134e4a",

  statusObg: "#2e1065",
  statusOtext: "#c4b5fd",
  statusOborder: "#4c1d95",

  // Soft Variants (backgrounds / badges)
  warningSoft: "rgba(251,191,36,0.15)",
  accentSoft: "rgba(34,197,94,0.15)",
  dangerSoft: "rgba(239,68,68,0.15)",
}

export type AppTheme = typeof lightTheme;
