import React, { useState, useEffect, useRef } from 'react';

// The DOC chip the user just provided
const CHIP_SRC = "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/744a6aa64_kling_20260422_Inpaint_make_the_D_3365_2.png";

// A single status light that blinks at random intervals
function BlinkLight({ color, on }) {
  const [lit, setLit] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    if (!on) {
      setLit(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    const tick = () => {
      setLit((p) => !p);
      const next = 120 + Math.random() * 780;
      timer.current = setTimeout(tick, next);
    };
    timer.current = setTimeout(tick, 200 + Math.random() * 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [on]);

  return (
    <div
      style={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: lit ? color : 'rgba(255,255,255,0.10)',
        boxShadow: lit ? `0 0 4px 1px ${color}aa` : 'none',
        transition: 'background 0.08s, box-shadow 0.08s',
      }}
    />
  );
}

export default function DOCChipHeader() {
  const [lightsOn, setLightsOn] = useState(true);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        padding: '4px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* DOC Chip */}
      <div
        onClick={() => setLightsOn((p) => !p)}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          cursor: 'pointer',
        }}
      >
        <img
          src={CHIP_SRC}
          alt="DOC chip"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Three lights running down the top of the right edge */}
      <div
        style={{
          position: 'absolute',
          top: '22px',
          right: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        {/* red — static, stays on (off only when chip clicked) */}
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: lightsOn ? '#ef4444' : 'rgba(255,255,255,0.10)',
            boxShadow: lightsOn ? '0 0 4px 1px rgba(239,68,68,0.8)' : 'none',
            transition: 'background 0.12s, box-shadow 0.12s',
          }}
        />
        {/* green — blinks at random pace */}
        <BlinkLight color="#22c55e" on={lightsOn} />
        {/* yellow — blinks at random pace */}
        <BlinkLight color="#eab308" on={lightsOn} />
      </div>
    </div>
  );
}