import React, { useState, useEffect, useRef } from 'react';

export default function ChipWithLights() {
  const [lightsOn, setLightsOn] = useState(true);
  const [whiteBlink, setWhiteBlink] = useState(true);
  const timerRef = useRef(null);

  // Random blink interval for white light
  useEffect(() => {
    if (!lightsOn) return;

    const scheduleNext = () => {
      const delay = 800 + Math.random() * 3200; // 0.8s – 4s
      timerRef.current = setTimeout(() => {
        setWhiteBlink(false);
        setTimeout(() => {
          setWhiteBlink(true);
          scheduleNext();
        }, 120 + Math.random() * 180); // off for 120–300ms
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, [lightsOn]);

  const toggle = () => setLightsOn(p => !p);

  return (
    <div className="relative flex items-center justify-center h-[120px] sm:h-[150px] lg:h-[180px]">
      {/* Chip image */}
      <img
        src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/10b930afa_Gemini_Generated_Image_1hvf8a1hvf8a1hvf.png"
        alt="BEN|CONNECT chip"
        onClick={toggle}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
          borderRadius: '1rem',
          filter: 'drop-shadow(4px 5px 1px rgba(0,0,0,0.35)) drop-shadow(6px 8px 16px rgba(0,0,0,0.5))',
          cursor: 'pointer',
        }}
      />

      {/* Indicator lights — top-right corner, horizontal row */}
      <div
        className="absolute flex flex-row gap-1.5 items-center"
        style={{ top: '8px', right: '10px' }}
      >
        {/* White light */}
        <div
          onClick={toggle}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            cursor: 'pointer',
            background: lightsOn && whiteBlink
              ? 'rgba(235,238,255,1)'
              : 'rgba(70,70,90,0.35)',
            border: '0.5px solid rgba(160,165,190,0.55)',
            boxShadow: lightsOn && whiteBlink
              ? '0 0 5px 2px rgba(200,210,255,0.85), 0 0 10px 3px rgba(180,190,255,0.35)'
              : 'none',
            transition: 'background 0.06s, box-shadow 0.06s',
          }}
        />
        {/* Green light */}
        <div
          onClick={toggle}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            cursor: 'pointer',
            background: lightsOn
              ? 'rgba(55,215,95,1)'
              : 'rgba(35,70,45,0.35)',
            border: '0.5px solid rgba(80,160,100,0.55)',
            boxShadow: lightsOn
              ? '0 0 5px 2px rgba(55,215,95,0.85), 0 0 12px 4px rgba(30,180,70,0.35)'
              : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        />
      </div>
    </div>
  );
}