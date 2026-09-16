// telephony — vendor-blind call layer for the Hub.
// Internal event/state vocabulary the UI consumes: 'ringing' | 'answered' | 'declined' | 'voicemail' | 'ended'.
// Drivers translate vendor reality into that vocabulary. Switch with env:
//
//   VITE_TELEPHONY_DRIVER = 'base44' (default) | 'twilio'
//   VITE_TELEPHONY_WS     = wss endpoint on your server (twilio mode) that relays
//                           Twilio Voice webhook events as JSON: { type, call }
//
// Audio exists only when driver is twilio AND a WS URL is set.
// Until then the floor is a queue: ring / answer / disposition still write
// Call rows. Mute and speaker are inert. That is intentional, not a bug.
//
// Twilio wiring when ready (no client code changes needed beyond env):
//   Twilio number Voice URL -> POST https://yourserver/telephony/voice (returns TwiML)
//   Server pushes { type: 'ringing', call: { id, customer_phone, ... } } over the WS.
//   answer/decline/voicemail send { action, callId } back over the same socket.

import { base44 } from "@/api/base44Client";

const DRIVER = import.meta.env.VITE_TELEPHONY_DRIVER || "base44";
const WS_URL = import.meta.env.VITE_TELEPHONY_WS || "";

export const TELEPHONY_DRIVER = DRIVER;
export const telephonyHasAudio = DRIVER === "twilio" && Boolean(WS_URL);

const base44Driver = {
  getRingingCalls: () => base44.entities.IncomingCall.filter({ status: "ringing" }, "-created_date"),
  answer: (callId) => base44.entities.IncomingCall.update(callId, { status: "answered", answered_at: new Date().toISOString() }),
  decline: (callId) => base44.entities.IncomingCall.update(callId, { status: "declined" }),
  voicemail: (callId) => base44.entities.IncomingCall.update(callId, { status: "voicemail" }),
  subscribe: () => () => {}
};

function twilioDriver() {
  let ws = null;
  let ringing = [];
  const listeners = new Set();

  function ensureSocket() {
    if (ws || !WS_URL) return;
    ws = new WebSocket(WS_URL);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "ringing") ringing = [msg.call, ...ringing.filter(c => c.id !== msg.call.id)];
        if (["answered", "declined", "voicemail", "ended"].includes(msg.type)) {
          ringing = ringing.filter(c => c.id !== msg.call?.id);
        }
        listeners.forEach(fn => fn(msg));
      } catch { /* ignore malformed frames */ }
    };
    ws.onclose = () => { ws = null; setTimeout(ensureSocket, 3000); };
  }

  function send(action, callId) {
    ensureSocket();
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, callId }));
  }

  return {
    getRingingCalls: async () => { ensureSocket(); return ringing; },
    answer: async (callId) => send("answer", callId),
    decline: async (callId) => send("decline", callId),
    voicemail: async (callId) => send("voicemail", callId),
    subscribe: (fn) => { ensureSocket(); listeners.add(fn); return () => listeners.delete(fn); }
  };
}

export const telephony = DRIVER === "twilio" ? twilioDriver() : base44Driver;
