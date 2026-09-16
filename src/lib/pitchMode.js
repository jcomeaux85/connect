// Pitch / demo decoration. Off by default so a live floor cannot
// screenshot fake KPIs. Flip with VITE_PITCH_MODE=true for the deck.
export const PITCH_MODE =
  import.meta.env.VITE_PITCH_MODE === "true" ||
  import.meta.env.VITE_PITCH_STATS === "true";
