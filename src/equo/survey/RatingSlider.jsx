// eQuo — 1-10 rating slider with ANCHORED labels at 1 and 10 (gap fix).
// The 1 anchor reads "1 — Struggling" and the 10 anchor reads "10 — Thriving"
// so the scale is never ambiguous.
import React from "react";
import { equoTheme as t, inset } from "../equoTheme";
import { ratingLabel, ratingColor } from "../equoTheme";

export default function RatingSlider({ value, onChange }) {
  const color = ratingColor(value);
  return (
    <div>
      <style>{`
        .equo-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 9999px;
          background: ${t.shadowDark}; outline: none; }
        .equo-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          background: ${color}; box-shadow: 2px 2px 5px ${t.shadowDark}, -2px -2px 5px ${t.shadowLight};
          border: 3px solid #fff; }
        .equo-range::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          background: ${color}; border: 3px solid #fff; box-shadow: 2px 2px 5px ${t.shadowDark}; }
      `}</style>
      <div className="flex items-end justify-between mb-3">
        <div className="text-left">
          <div className="text-xs font-black" style={{ color: t.softRedDeep }}>1 — Struggling</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black leading-none" style={{ color }}>{value}</div>
          <div className="text-xs font-bold mt-1" style={{ color }}>{ratingLabel(value)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black" style={{ color: "#7bb37a" }}>10 — Thriving</div>
        </div>
      </div>

      <div className="px-1 py-3 rounded-2xl" style={inset(18)}>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="equo-range w-full"
          style={{ accentColor: color }}
        />
        <div className="flex justify-between px-1 mt-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className="text-[10px] font-semibold"
              style={{ color: n === value ? color : t.textFaint }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}