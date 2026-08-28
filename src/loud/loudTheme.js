// ALERA | loud — self-contained visual theme. Bold orange/red accent to match
// the "loud" name, distinct from eQuo's violet. Neumorphic, own product feel.
// Responds to the global dark-mode switch via useLoudTheme().

import { useTheme } from "@/components/ThemeProvider";

export const loudTheme = {
  bg: "#fff5f0",
  surface: "#fff8f3",
  cream: "#fdf2ee",

  shadowDark: "#f0d4c8",
  shadowLight: "#ffffff",

  // Accents — bold, loud
  orange: "#f97316",
  orangeDeep: "#ea580c",
  red: "#ef4444",
  redDeep: "#dc2626",

  // Text
  text: "#7c3a1a",
  textSoft: "#a87856",
  textFaint: "#c4a890",
  onAccent: "#ffffff",
};

// Dark variant — warm charcoal surfaces, same loud orange/red accent.
export const loudThemeDark = {
  bg: "#1f1b16",
  surface: "#28231d",
  cream: "#2a2520",

  shadowDark: "#15110d",
  shadowLight: "#322c25",

  orange: "#f97316",
  orangeDeep: "#ea580c",
  red: "#ef4444",
  redDeep: "#dc2626",

  text: "#f5e6d8",
  textSoft: "#c4a890",
  textFaint: "#8a7560",
  onAccent: "#ffffff",
};

const makeHelpers = (t) => ({
  raised: (radius = 20) => ({
    background: t.surface,
    borderRadius: radius,
    boxShadow: `7px 7px 16px ${t.shadowDark}, -7px -7px 16px ${t.shadowLight}`,
  }),
  raisedSoft: (radius = 16) => ({
    background: t.surface,
    borderRadius: radius,
    boxShadow: `4px 4px 10px ${t.shadowDark}, -4px -4px 10px ${t.shadowLight}`,
  }),
  inset: (radius = 14) => ({
    background: t.bg,
    borderRadius: radius,
    boxShadow: `inset 3px 3px 7px ${t.shadowDark}, inset -3px -3px 7px ${t.shadowLight}`,
  }),
  pressable: (active = false, radius = 14) => ({
    background: t.surface,
    borderRadius: radius,
    border: "none",
    boxShadow: active
      ? `inset 3px 3px 7px ${t.shadowDark}, inset -3px -3px 7px ${t.shadowLight}`
      : `4px 4px 10px ${t.shadowDark}, -4px 4px 10px ${t.shadowLight}`,
    transition: "box-shadow 0.18s ease, transform 0.18s ease",
  }),
});

// Static helpers bound to the light theme (kept for the public survey-fill page,
// which renders outside the ThemeProvider and has no dark-mode context).
const lightHelpers = makeHelpers(loudTheme);
export const raised = lightHelpers.raised;
export const raisedSoft = lightHelpers.raisedSoft;
export const inset = lightHelpers.inset;
export const pressable = lightHelpers.pressable;

// Hook for in-app (authenticated) Loud components — picks the palette and
// returns theme-aware helpers based on the global dark-mode switch.
export const useLoudTheme = () => {
  const { isDark } = useTheme();
  const theme = isDark ? loudThemeDark : loudTheme;
  return { theme, isDark, ...makeHelpers(theme) };
};