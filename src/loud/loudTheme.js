// ALERA | loud — self-contained visual theme. Bold orange/red accent to match
// the "loud" name, distinct from eQuo's violet. Neumorphic, own product feel.

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

const t = loudTheme;

export const raised = (radius = 20) => ({
  background: t.surface,
  borderRadius: radius,
  boxShadow: `7px 7px 16px ${t.shadowDark}, -7px -7px 16px ${t.shadowLight}`,
});

export const raisedSoft = (radius = 16) => ({
  background: t.surface,
  borderRadius: radius,
  boxShadow: `4px 4px 10px ${t.shadowDark}, -4px -4px 10px ${t.shadowLight}`,
});

export const inset = (radius = 14) => ({
  background: t.bg,
  borderRadius: radius,
  boxShadow: `inset 3px 3px 7px ${t.shadowDark}, inset -3px -3px 7px ${t.shadowLight}`,
});

export const pressable = (active = false, radius = 14) => ({
  background: t.surface,
  borderRadius: radius,
  border: "none",
  boxShadow: active
    ? `inset 3px 3px 7px ${t.shadowDark}, inset -3px -3px 7px ${t.shadowLight}`
    : `4px 4px 10px ${t.shadowDark}, -4px -4px 10px ${t.shadowLight}`,
  transition: "box-shadow 0.18s ease, transform 0.18s ease",
});