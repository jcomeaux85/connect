// ─────────────────────────────────────────────────────────────
// Shared demo data for the call center dashboard. Used by both
// AgentCallTimeline and CallQueuePanel so they stay in sync with
// the same agents, queue colors, call schedule, and queue pool.
// Data repeats daily (the simulated clock loops 8am→6pm).
// ─────────────────────────────────────────────────────────────

export const AGENTS = ['Ryan', 'Vanessa', 'Chris', 'Jarrad'];

// Each agent maps to one of the four Qflo queue colors (orange, sky,
// aloe, purple). Break/lunch windows are staggered so no two agents
// are off the floor at the same time — two 15-min breaks + one
// 1-hour lunch each, spread across the 8am-6pm shift.
export const AGENT_CONFIG = {
  Ryan:    { color: '#ef4444', label: 'Red', breaks: [
    { start: '09:30', end: '09:45', type: 'break' },
    { start: '11:00', end: '12:00', type: 'lunch' },
    { start: '15:15', end: '15:30', type: 'break' },
  ]},
  Vanessa: { color: '#eab308', label: 'Yellow', breaks: [
    { start: '09:45', end: '10:00', type: 'break' },
    { start: '12:00', end: '13:00', type: 'lunch' },
    { start: '15:30', end: '15:45', type: 'break' },
  ]},
  Chris:   { color: '#3b82f6', label: 'Blue', breaks: [
    { start: '10:00', end: '10:15', type: 'break' },
    { start: '13:00', end: '14:00', type: 'lunch' },
    { start: '15:45', end: '16:00', type: 'break' },
  ]},
  Jarrad:  { color: '#22c55e', label: 'Green', breaks: [
    { start: '10:15', end: '10:30', type: 'break' },
    { start: '14:00', end: '15:00', type: 'lunch' },
    { start: '16:00', end: '16:15', type: 'break' },
  ]},
};

// Helper: "HH:MM" → minutes since midnight
function _timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Helper: minutes since midnight → "HH:MM"
function _minsToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Generate randomized 15-min break times for an agent, seeded by cycle.
// Lunches stay fixed from AGENT_CONFIG. Two breaks are chosen: one in
// the morning (before lunch) and one in the afternoon (after lunch),
// aligned to 5-min increments so they look natural.
export function generateAgentBreaks(agent, cycle) {
  const cfg = AGENT_CONFIG[agent];
  if (!cfg) return [];
  const lunch = cfg.breaks.find(b => b.type === 'lunch');
  if (!lunch) return cfg.breaks;
  const lunchStart = _timeToMins(lunch.start);
  const lunchEnd = _timeToMins(lunch.end);

  const agentIdx = AGENTS.indexOf(agent);
  const seed = agentIdx * 1000 + cycle * 17;
  const rand = (n) => {
    const x = Math.sin((seed + n) * 99991.137) * 43758.5453;
    return x - Math.floor(x);
  };

  // Morning break: 15 min between 8:15 and (lunchStart - 30)
  const mornStart = 8 * 60 + 15;
  const mornEnd = lunchStart - 30;
  const mornBreak = Math.floor((mornStart + rand(1) * Math.max(mornEnd - mornStart - 15, 0)) / 5) * 5;

  // Afternoon break: 15 min between (lunchEnd + 15) and 17:45
  const aftStart = lunchEnd + 15;
  const aftEnd = 17 * 60 + 45;
  const aftBreak = Math.floor((aftStart + rand(2) * Math.max(aftEnd - aftStart - 15, 0)) / 5) * 5;

  return [
    { start: _minsToTime(mornBreak), end: _minsToTime(mornBreak + 15), type: 'break' },
    { start: lunch.start, end: lunch.end, type: 'lunch' },
    { start: _minsToTime(aftBreak), end: _minsToTime(aftBreak + 15), type: 'break' },
  ];
}

// Each demo call: time, direction, duration (seconds), employer.
const DEMO_CALLS = {
  Ryan: [
    { time: '08:06', direction: 'inbound',  duration: 28,   employer: 'PSP'        },
    { time: '08:14', direction: 'outbound', duration: 1980, employer: 'Lazer'      },
    { time: '08:34', direction: 'inbound',  duration: 22,   employer: 'PSP'        },
    { time: '09:02', direction: 'inbound',  duration: 310,  employer: 'PAM'        },
    { time: '09:40', direction: 'outbound', duration: 240,  employer: 'Lazer'      },
    { time: '10:18', direction: 'inbound',  duration: 1860, employer: 'PAM'        },
    { time: '11:05', direction: 'outbound', duration: 200,  employer: 'Tekni-Plex' },
    { time: '11:38', direction: 'inbound',  duration: 265,  employer: 'Lazer'      },
    { time: '13:10', direction: 'outbound', duration: 280,  employer: 'PAM'        },
    { time: '14:02', direction: 'inbound',  duration: 2100, employer: 'Lazer'      },
    { time: '15:00', direction: 'outbound', duration: 230,  employer: 'Orbital'    },
    { time: '15:48', direction: 'inbound',  duration: 255,  employer: 'PAM'        },
    { time: '16:36', direction: 'outbound', duration: 210,  employer: 'Lazer'      },
    { time: '17:20', direction: 'inbound',  duration: 240,  employer: 'PAM'        },
  ],
  Vanessa: [
    { time: '08:10', direction: 'inbound',  duration: 25,   employer: 'PSP'        },
    { time: '08:22', direction: 'outbound', duration: 2100, employer: 'PAM'        },
    { time: '09:05', direction: 'inbound',  duration: 30,   employer: 'PSP'        },
    { time: '09:32', direction: 'outbound', duration: 245,  employer: 'Lazer'      },
    { time: '10:08', direction: 'inbound',  duration: 280,  employer: 'PAM'        },
    { time: '10:46', direction: 'outbound', duration: 1740, employer: 'Lazer'      },
    { time: '11:30', direction: 'inbound',  duration: 215,  employer: 'Orbital'    },
    { time: '13:04', direction: 'outbound', duration: 300,  employer: 'PAM'        },
    { time: '13:46', direction: 'inbound',  duration: 1980, employer: 'Lazer'      },
    { time: '14:42', direction: 'outbound', duration: 185,  employer: 'Tekni-Plex' },
    { time: '15:30', direction: 'inbound',  duration: 270,  employer: 'PAM'        },
    { time: '16:24', direction: 'outbound', duration: 220,  employer: 'Lazer'      },
    { time: '17:18', direction: 'inbound',  duration: 195,  employer: "Buddy's"    },
  ],
  Chris: [
    { time: '08:04', direction: 'inbound',  duration: 24,   employer: 'PSP'        },
    { time: '08:12', direction: 'outbound', duration: 26,   employer: 'PSP'        },
    { time: '08:30', direction: 'inbound',  duration: 1860, employer: 'Lazer'      },
    { time: '09:14', direction: 'outbound', duration: 195,  employer: 'PAM'        },
    { time: '09:50', direction: 'inbound',  duration: 260,  employer: 'Lazer'      },
    { time: '10:30', direction: 'outbound', duration: 2160, employer: 'PAM'        },
    { time: '11:24', direction: 'inbound',  duration: 235,  employer: 'Orbital'    },
    { time: '13:16', direction: 'outbound', duration: 290,  employer: 'Lazer'      },
    { time: '14:00', direction: 'inbound',  duration: 1920, employer: 'PAM'        },
    { time: '14:54', direction: 'outbound', duration: 180,  employer: 'Tekni-Plex' },
    { time: '15:40', direction: 'inbound',  duration: 245,  employer: 'Lazer'      },
    { time: '16:30', direction: 'outbound', duration: 210,  employer: 'PAM'        },
    { time: '17:14', direction: 'inbound',  duration: 160,  employer: 'Rock-it'    },
  ],
  Jarrad: [
    { time: '08:08', direction: 'inbound',  duration: 27,   employer: 'PSP'        },
    { time: '08:20', direction: 'outbound', duration: 2040, employer: 'Lazer'      },
    { time: '09:04', direction: 'inbound',  duration: 21,   employer: 'PSP'        },
    { time: '09:30', direction: 'outbound', duration: 215,  employer: 'PAM'        },
    { time: '10:06', direction: 'inbound',  duration: 270,  employer: 'Lazer'      },
    { time: '10:44', direction: 'outbound', duration: 1620, employer: 'PAM'        },
    { time: '11:28', direction: 'inbound',  duration: 230,  employer: 'Tekni-Plex' },
    { time: '13:08', direction: 'outbound', duration: 245,  employer: 'Lazer'      },
    { time: '13:52', direction: 'inbound',  duration: 2280, employer: 'PAM'        },
    { time: '14:50', direction: 'outbound', duration: 200,  employer: 'Orbital'    },
    { time: '15:38', direction: 'inbound',  duration: 265,  employer: 'Lazer'      },
    { time: '16:28', direction: 'outbound', duration: 185,  employer: 'SwimUSA'    },
    { time: '17:22', direction: 'inbound',  duration: 220,  employer: 'PAM'        },
  ],
};
export { DEMO_CALLS };

// Demo queue — the initial waiting list shown in CallQueuePanel.
export const DEMO_QUEUE = [
  { customer_name: 'Maria Gonzalez',    call_reason: 'Claim Assistance',     priority: 'urgent' },
  { customer_name: 'James Thornton',    call_reason: 'Benefits Inquiry',    priority: 'high'   },
  { customer_name: 'Aisha Patel',        call_reason: 'Provider Search',     priority: 'medium' },
  { customer_name: 'Robert Kim',         call_reason: 'General Inquiry',     priority: 'low'    },
  { customer_name: 'Sandra Lee',          call_reason: 'Enrollment Help',     priority: 'medium' },
  { customer_name: 'David Chen',          call_reason: 'Billing Issue',       priority: 'high'   },
  { customer_name: 'Michelle Brown',      call_reason: 'Document Request',    priority: 'low'    },
  { customer_name: 'Carlos Rodriguez',    call_reason: 'Authorization Request', priority: 'medium' },
];

// Pool of replacement callers — as the queue drains (top item routed),
// new callers are added from this pool so the queue stays alive.
export const QUEUE_POOL = [
  { customer_name: 'Tyler Brooks',       call_reason: 'Claim Assistance',     priority: 'high'   },
  { customer_name: 'Nina Castellano',     call_reason: 'Benefits Inquiry',    priority: 'medium' },
  { customer_name: 'Marcus Webb',         call_reason: 'Provider Search',     priority: 'low'    },
  { customer_name: 'Priya Shah',           call_reason: 'Enrollment Help',     priority: 'medium' },
  { customer_name: 'Derek Lockwood',       call_reason: 'Billing Issue',       priority: 'high'   },
  { customer_name: 'Yuki Tanaka',          call_reason: 'Document Request',    priority: 'low'    },
  { customer_name: 'Aaliyah Brooks',       call_reason: 'Authorization Request', priority: 'medium' },
  { customer_name: 'Victor Ramos',         call_reason: 'General Inquiry',     priority: 'low'    },
  { customer_name: 'Sienna Vargas',        call_reason: 'Claim Assistance',     priority: 'urgent' },
  { customer_name: 'Owen Mathers',         call_reason: 'Benefits Inquiry',    priority: 'medium' },
  { customer_name: 'Lila Park',            call_reason: 'Provider Search',     priority: 'medium' },
  { customer_name: 'Gabe Holloway',         call_reason: 'Enrollment Help',     priority: 'high'   },
];