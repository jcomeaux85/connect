import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_URL = 'https://res.cloudinary.com/dfeelbckg/video/upload/q_auto/f_auto/v1776843080/ebmheader_uxcv5g.mp4';
// Key is per-login-session: we store the login timestamp in localStorage on first visit,
// and mark the video played for that session. Logging out clears the login key.
const LOGIN_TS_KEY = 'ben_connect_login_ts';
const PLAYED_TS_KEY = 'ben_connect_intro_played_ts';

function getOrCreateLoginTs() {
  let ts = localStorage.getItem(LOGIN_TS_KEY);
  if (!ts) {
    ts = Date.now().toString();
    localStorage.setItem(LOGIN_TS_KEY, ts);
  }
  return ts;
}

export default function VideoIntro() {
  const [show, setShow] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const loginTs = getOrCreateLoginTs();
    const playedTs = localStorage.getItem(PLAYED_TS_KEY);
    if (playedTs !== loginTs) {
      setShow(true);
    }
  }, []);

  const markPlayed = () => {
    const loginTs = getOrCreateLoginTs();
    localStorage.setItem(PLAYED_TS_KEY, loginTs);
    setShow(false);
  };

  const handleEnded = markPlayed;
  const handleSkip = markPlayed;

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