import React from 'react';

// The DOC chip
const CHIP_SRC = "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/744a6aa64_kling_20260422_Inpaint_make_the_D_3365_2.png";

export default function DOCChipHeader() {
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
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
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

        {/* Single red light — top-right corner, always on */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 4px 1px rgba(239,68,68,0.8)',
          }}
        />
      </div>
    </div>
  );
}