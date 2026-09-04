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
const LAST_WRITER_KEY = STORAGE_KEY_PREFIX + "instanceId:last";

// Each content-script instance (one per tab) gets a fresh, unique in-memory id.
// It is NOT stored in shared chrome.storage — if it were, every tab would read
// the same id and the origin guard would collapse. Every UI write is stamped
// with this id so peers can adopt the change while ignoring their own echo
// (the storage change listener also fires in the tab that wrote).
async function loadInstanceId() {
  return (crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

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
    if (key.startsWith(STORAGE_KEY_PREFIX) && key !== LAST_WRITER_KEY) {
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

async function saveWidgetState(state, originId) {
  const entries = {};
  for (const [field, value] of Object.entries(state)) {
    entries[STORAGE_KEY_PREFIX + field] = value;
  }
  // Stamp which instance caused this so listeners can reconcile.
  if (originId) entries[LAST_WRITER_KEY] = originId;
  await chrome.storage.local.set(entries);
}

// Returns the id of the last instance that wrote widget state (for peers to
// tell "did I cause this?" from the shared change record).
async function loadLastWriter() {
  const stored = await chrome.storage.local.get(LAST_WRITER_KEY);
  return stored[LAST_WRITER_KEY] || null;
}
