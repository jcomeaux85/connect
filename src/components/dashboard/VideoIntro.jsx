import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_URL = 'https://res.cloudinary.com/dfeelbckg/video/upload/q_auto/f_auto/v1776843080/ebmheader_uxcv5g.mp4';
const SESSION_KEY = 'ben_connect_intro_played';

export default function VideoIntro() {
  const [show, setShow] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);
    if (!alreadyPlayed) {
      setShow(true);
    }
  }, []);

  const handleEnded = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShow(false);
  };

  const handleSkip = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            src={VIDEO_URL}
            autoPlay
            muted
            playsInline
            onEnded={handleEnded}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <button
            onClick={handleSkip}
            style={{
              position: 'absolute',
              bottom: '32px',
              right: '32px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}