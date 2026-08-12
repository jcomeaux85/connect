import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CHIP_SRC = "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/3c7e51212_kling_20260530_IMAGE_please_mak_700_0.png";

// A single status light that blinks at random intervals (like monitoring data packets)
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

// Red alert light — slightly bigger than the others, pulses when notifying
function AlertLight({ active }) {
  const [pulse, setPulse] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    if (!active) {
      setPulse(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    const tick = () => {
      setPulse((p) => !p);
      timer.current = setTimeout(tick, 650);
    };
    timer.current = setTimeout(tick, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [active]);

  return (
    <div
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: active && pulse ? '#ef4444' : 'rgba(239,68,68,0.14)',
        boxShadow: active && pulse ? '0 0 6px 2px rgba(239,68,68,0.75)' : 'none',
        transition: 'background 0.18s, box-shadow 0.18s',
      }}
    />
  );
}

export default function ChipHeader() {
  const [lightsOn, setLightsOn] = useState(true);

  // Unread notifications drive the red alert light
  const { data: unread = [] } = useQuery({
    queryKey: ['chip-unread-notifications'],
    queryFn: async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.email) return [];
        return base44.entities.Notification.filter({ user_email: me.email, is_read: false }, '-created_date', 20);
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const hasAlerts = unread.length > 0;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        padding: '15px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Chip */}
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
          alt="BEN|CONNECT chip"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {/* Red alert light — top-left corner, slightly bigger than the others */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '5px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <AlertLight active={hasAlerts && lightsOn} />
      </div>

      {/* Three lights running down the top of the right edge, just off the chip */}
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
        {/* white — static, stays on (off only when chip clicked) */}
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: lightsOn ? '#ffffff' : 'rgba(255,255,255,0.10)',
            boxShadow: lightsOn ? '0 0 4px 1px rgba(255,255,255,0.7)' : 'none',
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