// Concensus — 1-10 rating slider with labels that shift with the value.
import React from "react";
import { concensusTheme as t, inset } from "../concensusTheme";
import { ratingLabel, ratingColor } from "../concensusTheme";

export default function RatingSlider({ value, onChange }) {
  const color = ratingColor(value);
  return (
    <div>
      <style>{`
        .concensus-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 9999px;
          background: ${t.shadowDark}; outline: none; }
        .concensus-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          background: ${color}; box-shadow: 2px 2px 5px ${t.shadowDark}, -2px -2px 5px ${t.shadowLight};
          border: 3px solid #fff; }
        .concensus-range::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          background: ${color}; border: 3px solid #fff; box-shadow: 2px 2px 5px ${t.shadowDark}; }
      `}</style>
      <div className="flex items-end justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: t.softRedDeep }}>Struggling</span>
        <div className="text-center">
          <div className="text-3xl font-black leading-none" style={{ color }}>{value}</div>
          <div className="text-xs font-bold mt-1" style={{ color }}>{ratingLabel(value)}</div>
        </div>
        <span className="text-xs font-semibold" style={{ color: "#7bb37a" }}>Thriving</span>
      </div>

      <div className="px-1 py-3 rounded-2xl" style={inset(18)}>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="concensus-range w-full"
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