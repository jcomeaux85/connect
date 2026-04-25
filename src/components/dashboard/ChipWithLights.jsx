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

      {/* Indicator lights — stacked vertically, right side */}
      <div
        className="absolute flex flex-col gap-2 items-center"
        style={{ right: '-14px', top: '50%', transform: 'translateY(-50%)' }}
      >
        {/* White light */}
        <div
          onClick={toggle}
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            cursor: 'pointer',
            background: lightsOn && whiteBlink
              ? 'rgba(240,240,255,1)'
              : 'rgba(80,80,100,0.4)',
            boxShadow: lightsOn && whiteBlink
              ? '0 0 6px 2px rgba(200,210,255,0.9), 0 0 12px 4px rgba(180,190,255,0.4)'
              : 'none',
            transition: 'background 0.06s, box-shadow 0.06s',
          }}
        />
        {/* Green light */}
        <div
          onClick={toggle}
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            cursor: 'pointer',
            background: lightsOn
              ? 'rgba(60,220,100,1)'
              : 'rgba(40,80,50,0.4)',
            boxShadow: lightsOn
              ? '0 0 6px 2px rgba(60,220,100,0.9), 0 0 14px 5px rgba(30,180,70,0.4)'
              : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        />
      </div>
    </div>
  );
}