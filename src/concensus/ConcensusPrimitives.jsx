// Concensus — small neumorphic building blocks. Inline-styled so the module
// carries its own look without touching global CSS.
import React from "react";
import { concensusTheme as t, raised, raisedSoft, inset, pressable } from "./concensusTheme";

export function NeuCard({ children, className = "", soft = false, radius = 20, style = {} }) {
  return (
    <div className={className} style={{ ...(soft ? raisedSoft(radius) : raised(radius)), ...style }}>
      {children}
    </div>
  );
}

export function NeuButton({ children, onClick, active = false, disabled = false, className = "", style = {}, radius = 14 }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 text-sm font-semibold ${className}`}
      style={{
        ...pressable(active, radius),
        color: t.text,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function NeuPrimaryButton({ children, onClick, disabled = false, className = "", style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-3 text-sm font-bold ${className}`}
      style={{
        borderRadius: 16,
        border: "none",
        color: t.onAccent,
        background: `linear-gradient(135deg, ${t.violet}, ${t.violetDeep})`,
        boxShadow: disabled
          ? "none"
          : `4px 4px 12px ${t.shadowDark}, -3px -3px 10px ${t.shadowLight}`,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function NeuInput({ value, onChange, placeholder, className = "", style = {} }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 text-sm outline-none ${className}`}
      style={{ ...inset(14), color: t.text, border: "none", ...style }}
    />
  );
}

export function NeuTextarea({ value, onChange, placeholder, rows = 4, className = "", style = {} }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-3 text-sm outline-none resize-none ${className}`}
      style={{ ...inset(14), color: t.text, border: "none", ...style }}
    />
  );
}

export { t as concensusTheme, raised, raisedSoft, inset, pressable };