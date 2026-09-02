const DEFAULT_SETTINGS = {
  theme: "auto", // "auto" | "light" | "dark"
  accent: "#3b82f6",
  showDate: true,
  showSeconds: false,
  sound: false,
};

const DEFAULT_COUNTDOWN = {
  mode: null, // null | "timer" | "pomodoro-work" | "pomodoro-break"
  label: "",
  totalMs: 0,
  remainingMs: 0,
  endsAt: null,
  running: false,
};

const COUNTDOWN_STORAGE_KEY = "countdown";

async function loadSettings() {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
  return settings;
}

async function loadCountdown() {
  const stored = await chrome.storage.local.get(COUNTDOWN_STORAGE_KEY);
  const cd = { ...DEFAULT_COUNTDOWN, ...(stored[COUNTDOWN_STORAGE_KEY] || {}) };
  if (cd.running && cd.endsAt) {
    cd.remainingMs = Math.max(0, cd.endsAt - Date.now());
    if (cd.remainingMs === 0) {
      cd.running = false;
    }
  }
  return cd;
}

async function saveCountdown(cd) {
  await chrome.storage.local.set({ [COUNTDOWN_STORAGE_KEY]: cd });
  return cd;
}

async function resetCountdown() {
  await chrome.storage.local.remove(COUNTDOWN_STORAGE_KEY);
  return { ...DEFAULT_COUNTDOWN };
}

const STORAGE_KEY_PREFIX = "widget:";
const WIDGET_POS_VERSION = 2;

async function loadWidgetState() {
  const stored = await chrome.storage.local.get();
  const state = {
    x: null,
    y: null,
    expanded: false,
    activeTab: "clock",
    posVersion: WIDGET_POS_VERSION,
  };
  for (const [key, value] of Object.entries(stored)) {
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      const field = key.slice(STORAGE_KEY_PREFIX.length);
      if (field in state) state[field] = value;
    }
  }
  // If the stored position predates this layout version, drop it so the
  // widget falls back to its default bottom-right placement.
  if (state.posVersion !== WIDGET_POS_VERSION) {
    state.x = null;
    state.y = null;
    state.posVersion = WIDGET_POS_VERSION;
  }
  return state;
}

async function saveWidgetState(state) {
  const entries = {};
  for (const [field, value] of Object.entries(state)) {
    entries[STORAGE_KEY_PREFIX + field] = value;
  }
  await chrome.storage.local.set(entries);
}
