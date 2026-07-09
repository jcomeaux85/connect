// Concensus — self-contained visual theme.
// Soft violet + warm cream/peach. Neumorphic. Intentionally NOT tied to the
// rest of the app's ThemeProvider so this module feels like its own product.

export const concensusTheme = {
  // Base surfaces
  bg: "#f3eefb",          // soft violet-tinted cream
  surface: "#f6f1fc",     // raised card base
  cream: "#fdf6ee",       // warm cream accent surface
  peach: "#ffe9dc",       // warm peach accent

  // Neumorphic shadow pair (tuned for the violet-cream base)
  shadowDark: "#d4c9e6",
  shadowLight: "#ffffff",

  // Accents
  violet: "#8b6fd4",
  violetDeep: "#6f52c0",
  violetSoft: "#b9a5ea",
  peachAccent: "#f0a878",

  // Alert palette — warm amber / soft red, never harsh system red
  amber: "#e6a15c",
  amberDeep: "#c9803a",
  softRed: "#e08a7d",
  softRedDeep: "#c96a5c",

  // Text
  text: "#4a3f63",
  textSoft: "#7c7192",
  textFaint: "#a99fbd",
  onAccent: "#ffffff",
};

const t = concensusTheme;

// ---- Neumorphic style helpers (inline styles, no global CSS needed) ----
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

// Rating scale labels — shift with the slider value for consistency between people.
export function ratingLabel(v) {
  if (v <= 2) return "Struggling";
  if (v <= 4) return "Running low";
  if (v <= 6) return "Getting by";
  if (v <= 8) return "Doing well";
  return "Thriving";
}

export function ratingColor(v) {
  if (v <= 3) return t.softRedDeep;
  if (v <= 5) return t.amberDeep;
  if (v <= 7) return t.violet;
  return "#7bb37a"; // soft green for the high end
}