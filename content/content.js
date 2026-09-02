(() => {
  if (window.__fctInjected) return;
  window.__fctInjected = true;

  const POMODORO_WORK_MS = 25 * 60 * 1000;
  const POMODORO_BREAK_MS = 5 * 60 * 1000;

  const STYLES = `/* ---------- theme tokens ---------- */
:host {
  all: initial;
  position: fixed;
  width: max-content;
  height: max-content;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
:host([data-theme="light"]) {
  --fct-bg: rgba(255,255,255,0.92);
  --fct-surface: #f4f4f5;
  --fct-text: #18181b;
  --fct-muted: #71717a;
  --fct-border: rgba(0,0,0,0.1);
  --fct-shadow: 0 8px 30px rgba(0,0,0,0.12);
}
:host([data-theme="dark"]) {
  --fct-bg: rgba(24,24,27,0.94);
  --fct-surface: #27272a;
  --fct-text: #fafafa;
  --fct-muted: #a1a1aa;
  --fct-border: rgba(255,255,255,0.12);
  --fct-shadow: 0 8px 30px rgba(0,0,0,0.5);
}
.fct-widget { display:flex; flex-direction:column; align-items:center; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; line-height:1; -webkit-font-smoothing:antialiased; font-size:14px; color:var(--fct-text); }
.fct-bubble { appearance:none; border:1px solid var(--fct-border); background:var(--fct-bg); color:var(--fct-text); border-radius:999px; padding:8px 16px; cursor:grab; display:flex; flex-direction:column; align-items:center; gap:2px; box-shadow:var(--fct-shadow); font-family:inherit; min-width:96px; transition:background-color 150ms ease-out,border-color 150ms ease-out,box-shadow 150ms ease-out; }
.fct-bubble:hover { border-color:var(--fct-accent); box-shadow:var(--fct-shadow),0 0 0 1px var(--fct-accent); }
.fct-bubble:active { cursor:grabbing; }
.fct-bubble-clock { font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; letter-spacing:.02em; }
.fct-bubble-date { font-size:10px; color:var(--fct-muted); text-transform:uppercase; letter-spacing:.06em; }
.fct-bubble[data-countdown="running"] .fct-bubble-clock { color:var(--fct-accent); }
.fct-bubble[data-countdown="running"] .fct-bubble-date { color:var(--fct-accent); font-weight:600; letter-spacing:.05em; }
.fct-panel { position:fixed; width:380px; max-width:calc(100vw - 24px); background:var(--fct-bg); border:1px solid var(--fct-border); border-radius:12px; box-shadow:var(--fct-shadow); color:var(--fct-text); font-size:14px; overflow:hidden; opacity:0; transform:scale(.96); transform-origin:top center; transition:opacity 160ms ease-out, transform 160ms ease-out; }
.fct-panel.fct-open { opacity:1; transform:scale(1); }
.fct-panel.fct-panel-up { transform-origin:bottom center; }
.fct-panel-head { display:flex; align-items:center; padding:8px 8px 0 8px; gap:6px; }
.fct-tabs { display:flex; flex:1; min-width:0; gap:3px; background:var(--fct-surface); border-radius:8px; padding:3px; }
.fct-tab { appearance:none; border:none; background:transparent; color:var(--fct-muted); padding:6px 2px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:12px; font-weight:500; flex:1 1 0; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:background-color 150ms ease-out, color 150ms ease-out; }
.fct-tab:hover { color:var(--fct-text); }
.fct-tab[aria-selected="true"] { background:var(--fct-bg); color:var(--fct-text); }
.fct-collapse { appearance:none; border:none; background:transparent; color:var(--fct-muted); width:26px; height:26px; border-radius:6px; cursor:pointer; font-size:18px; line-height:1; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:background-color 150ms ease-out, color 150ms ease-out, transform 150ms ease-out; }
.fct-collapse:hover { background:var(--fct-surface); color:var(--fct-text); }
.fct-collapse:active { transform:scale(.94); }
.fct-view { padding:14px; }
.fct-view:not([hidden]) { animation:fctViewIn 150ms ease-out; }
@keyframes fctViewIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
.fct-clock-time { font-size:40px; font-weight:300; text-align:center; font-variant-numeric:tabular-nums; letter-spacing:.01em; }
.fct-clock-date { text-align:center; margin-top:6px; color:var(--fct-muted); font-size:13px; }
.fct-countdown-timer { font-size:44px; font-weight:300; text-align:center; font-variant-numeric:tabular-nums; letter-spacing:.01em; }
.fct-countdown-label { text-align:center; color:var(--fct-accent); font-size:13px; font-weight:500; min-height:16px; margin-top:2px; }
.fct-row { display:flex; gap:8px; margin-top:14px; }
.fct-pomodoro-row { justify-content:stretch; }
.fct-pomodoro-row .fct-btn { flex:1 1 0; min-width:0; justify-content:center; }
.fct-timer-inputs { align-items:center; }
.fct-input { flex:1; min-width:0; border:1px solid var(--fct-border); border-radius:8px; padding:8px 10px; font-family:inherit; font-size:14px; background:var(--fct-surface); color:var(--fct-text); appearance:textfield; }
.fct-input::-webkit-inner-spin-button, .fct-input::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
.fct-btn { appearance:none; border:none; border-radius:8px; padding:8px 14px; font-family:inherit; font-size:13px; font-weight:600; background:var(--fct-accent); color:#fff; cursor:pointer; display:flex; align-items:center; transition:filter 150ms ease-out, transform 150ms ease-out, background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out; }
.fct-btn:hover { filter:brightness(1.08); }
.fct-btn:active { transform:scale(.96); }
.fct-btn-cancel { background:transparent; color:var(--fct-muted); border:1px solid var(--fct-border); }
.fct-btn-cancel:hover { color:var(--fct-text); }
.fct-field { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 0; }
.fct-field + .fct-field { border-top:1px solid var(--fct-border); }
.fct-toggle { cursor:pointer; }
.fct-select { appearance:none; border:1px solid var(--fct-border); background:var(--fct-surface); color:var(--fct-text); border-radius:8px; padding:6px 8px; font-family:inherit; font-size:13px; transition:border-color 150ms ease-out, background-color 150ms ease-out; }
.fct-select:hover { border-color:var(--fct-accent); }
.fct-color { width:34px; height:26px; padding:0; border:1px solid var(--fct-border); border-radius:6px; background:var(--fct-surface); cursor:pointer; }
.fct-color::-webkit-color-swatch-wrapper { padding:2px; }
.fct-color::-webkit-color-swatch { border:none; border-radius:4px; }
.fct-check { width:16px; height:16px; accent-color:var(--fct-accent); cursor:pointer; }
.fct-tab:focus-visible, .fct-collapse:focus-visible, .fct-btn:focus-visible, .fct-select:focus-visible, .fct-check:focus-visible, .fct-input:focus-visible { outline:2px solid var(--fct-accent); outline-offset:2px; }
@media (prefers-reduced-motion: reduce) {
  .fct-panel, .fct-view, .fct-tab, .fct-btn, .fct-collapse, .fct-bubble { transition-duration:.01ms !important; animation-duration:.01ms !important; }
}
`;

  const MARKUP = `<div class="fct-widget">
  <button class="fct-bubble" type="button" title="Clock &amp; timers" aria-expanded="false" aria-controls="fct-panel">
    <span class="fct-bubble-clock">--:--</span>
    <span class="fct-bubble-date">&nbsp;</span>
  </button>
  <div class="fct-panel" id="fct-panel" hidden>
    <div class="fct-panel-head">
      <div class="fct-tabs" role="tablist" aria-label="Clock controls">
        <button class="fct-tab" data-tab="clock" role="tab" aria-selected="true" type="button">Clock</button>
        <button class="fct-tab" data-tab="timer" role="tab" aria-selected="false" type="button">Timer</button>
        <button class="fct-tab" data-tab="pomodoro" role="tab" aria-selected="false" type="button">Pomodoro</button>
        <button class="fct-tab" data-tab="settings" role="tab" aria-selected="false" type="button">Settings</button>
      </div>
      <button class="fct-collapse" type="button" title="Collapse" aria-label="Collapse widget">&ndash;</button>
    </div>
    <section class="fct-view" data-view="clock" role="tabpanel">
      <div class="fct-clock-time">--:--</div>
      <div class="fct-clock-date">&nbsp;</div>
    </section>
    <section class="fct-view" data-view="timer" role="tabpanel" hidden>
      <div class="fct-countdown-timer">00:00</div>
      <div class="fct-countdown-label"></div>
      <div class="fct-row fct-timer-inputs">
        <input class="fct-input fct-min-input" type="number" min="0" max="720" step="1" inputmode="numeric" placeholder="Min" aria-label="Timer minutes">
        <button class="fct-btn fct-btn-start" type="button">Start</button>
        <button class="fct-btn fct-btn-cancel" type="button" hidden>Cancel</button>
      </div>
    </section>
    <section class="fct-view" data-view="pomodoro" role="tabpanel" hidden>
      <div class="fct-countdown-timer">25:00</div>
      <div class="fct-countdown-label"></div>
      <div class="fct-row fct-pomodoro-row">
        <button class="fct-btn fct-pomo-work" type="button">Work 25</button>
        <button class="fct-btn fct-pomo-break" type="button">Break 5</button>
        <button class="fct-btn fct-btn-cancel fct-pomo-cancel" type="button" hidden>Cancel</button>
      </div>
    </section>
    <section class="fct-view" data-view="settings" role="tabpanel" hidden>
      <div class="fct-field"><span>Theme</span>
        <select class="fct-select fct-theme" aria-label="Theme">
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="fct-field"><span>Accent</span>
        <input class="fct-color fct-accent" type="color" aria-label="Accent color" value="#3b82f6">
      </div>
      <label class="fct-field fct-toggle"><span>Show date</span>
        <input class="fct-check fct-show-date" type="checkbox" checked>
      </label>
      <label class="fct-field fct-toggle"><span>Show seconds</span>
        <input class="fct-check fct-show-seconds" type="checkbox">
      </label>
      <label class="fct-field fct-toggle"><span>Sound on finish</span>
        <input class="fct-check fct-sound" type="checkbox">
      </label>
    </section>
  </div>
</div>`;

  let settings = { ...DEFAULT_SETTINGS };
  let countdown = { ...DEFAULT_COUNTDOWN };
  let widgetState = { x: null, y: null, expanded: false, activeTab: "clock" };

  let host;
  let root;
  let els = {};
  let tickTimer = null;
  let uiTimer = null;

  function pad(n, len = 2) {
    return String(n).padStart(len, "0");
  }

  function formatTime(d, withSeconds) {
    const h = pad(d.getHours());
    const m = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return withSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  }

  function formatDateLine(d) {
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    const month = d.toLocaleDateString(undefined, { month: "short" });
    return `${weekday}, ${month} ${d.getDate()}`;
  }

  function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  }

  function formatRemaining(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function fmtPomLabel(mode) {
    if (mode === "pomodoro-work") return "Work in progress";
    if (mode === "pomodoro-break") return "Break in progress";
    return "";
  }

  function resolveTheme() {
    if (settings.theme === "light" || settings.theme === "dark") return settings.theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme() {
    if (host) host.setAttribute("data-theme", resolveTheme());
  }

  function applyAccent() {
    if (host) host.style.setProperty("--fct-accent", settings.accent);
  }

  function refreshSettings() {
    if (els.showDateToggle) els.showDateToggle.checked = settings.showDate;
    if (els.showSecondsToggle) els.showSecondsToggle.checked = settings.showSeconds;
    if (els.themeSelect) els.themeSelect.value = settings.theme;
    if (els.accentPicker) els.accentPicker.value = settings.accent;
    if (els.soundToggle) els.soundToggle.checked = settings.sound;
  }

  function updateClock() {
    if (!els.bubbleClock) return;
    const now = new Date();
    const withSeconds = settings.showSeconds;
    const timeStr = formatTime(now, withSeconds);
    els.bubbleClock.textContent = timeStr;
    if (els.clockTime) els.clockTime.textContent = timeStr;

    const dateStr = formatDateLine(now);
    const weekStr = `W${getWeekNumber(now)}`;
    const full = `${dateStr} · ${weekStr}`;
    const running = countdown.running && countdown.mode;
    if (els.bubbleDate) {
      if (!running) {
        els.bubbleDate.textContent = settings.showDate ? dateStr : "";
        els.bubbleDate.hidden = !settings.showDate;
      }
    }
    if (els.clockDate) els.clockDate.textContent = full;
    if (host) host.title = `${formatTime(now, true)} — ${full}`;
  }

  function refreshCountdownView() {
    const running = countdown.running && countdown.mode;
    if (els.bubble) {
      els.bubble.dataset.countdown = running ? "running" : "";
      els.bubble.title = running ? fmtPomLabel(countdown.mode) : "Clock & timers";
    }

    const isTimerActive = running && countdown.mode === "timer";
    const isPomoActive = running && countdown.mode && countdown.mode !== "timer";
    if (els.startBtn) els.startBtn.hidden = !!isTimerActive || !!running;
    if (els.cancelBtn) els.cancelBtn.hidden = !running;
    if (els.pomoCancel) els.pomoCancel.hidden = !running;

    if (running) {
      const remain = countdown.remainingMs;
      const label = countdown.label || fmtPomLabel(countdown.mode);
      // Reuse the second line of the pill to show remaining time — no extra
      // row, so the bubble never grows taller while a countdown runs.
      if (els.bubbleDate) {
        const shortLabel = countdown.mode === "timer" ? "" : (countdown.mode === "pomodoro-work" ? "FOCUS " : "BREAK ");
        els.bubbleDate.textContent = shortLabel + formatRemaining(remain);
        els.bubbleDate.hidden = false;
      }
      if (isTimerActive && els.timerDisplay) {
        els.timerDisplay.textContent = formatRemaining(remain);
        els.timerLabel.textContent = label;
      }
      if (isPomoActive && els.pomoDisplay) {
        els.pomoDisplay.textContent = formatRemaining(remain);
        els.pomoLabel.textContent = label;
      }
    } else {
      if (els.timerDisplay) {
        els.timerDisplay.textContent = "00:00";
        els.timerLabel.textContent = "";
      }
      if (els.pomoDisplay) {
        els.pomoDisplay.textContent = "25:00";
        els.pomoLabel.textContent = "";
      }
      if (els.minInput) els.minInput.value = "";
      // Restore the real date on the pill when nothing is running.
      if (els.bubbleDate) {
        const now = new Date();
        els.bubbleDate.textContent = settings.showDate ? formatDateLine(now) : "";
        els.bubbleDate.hidden = !settings.showDate;
      }
    }
    renderActiveTab();
  }

  function switchToTab(name) {
    widgetState.activeTab = name;
    els.tabs.forEach((t) => {
      const selected = t.dataset.tab === name;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    renderActiveTab();
    if (widgetState.expanded) positionPanel();
  }

  function renderActiveTab() {
    const name = widgetState.activeTab;
    els.views.forEach((v) => {
      v.hidden = v.dataset.view !== name;
    });
  }

  const BUBBLE_MARGIN = 4;

  function getBubbleSize() {
    const rect = host.getBoundingClientRect();
    return {
      w: rect.width || 128,
      h: rect.height || 44,
    };
  }

  // Clamp the bubble to true viewport edges with a tiny margin.
  function clampWidgetPosition(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { w, h } = getBubbleSize();
    const minX = BUBBLE_MARGIN;
    const maxX = Math.max(minX, vw - w - BUBBLE_MARGIN);
    const minY = BUBBLE_MARGIN;
    const maxY = Math.max(minY, vh - h - BUBBLE_MARGIN);
    x = Math.min(Math.max(x, minX), maxX);
    y = Math.min(Math.max(y, minY), maxY);
    return { x, y };
  }

  // Position the open panel so it never clips off-screen: shift horizontally
  // to keep it inside the viewport and flip upward when there's no room below.
  function positionPanel() {
    const panel = els.panel;
    if (!panel || panel.hidden || !widgetState.expanded) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panel.offsetWidth || 380;
    const ph = panel.offsetHeight || 220;
    const gap = 8;

    // The panel is position:fixed, so style in viewport coordinates directly.
    panel.style.left = "";
    panel.style.top = "";
    panel.style.bottom = "";
    panel.classList.remove("fct-panel-up");

    const hostRect = host.getBoundingClientRect();
    const hostW = hostRect.width || 128;
    const hostH = hostRect.height || 44;
    const hostX = hostRect.left;
    const hostY = hostRect.top;
    const hostBottom = hostY + hostH;

    const bubbleCenterX = hostX + hostW / 2;

    // Horizontal: center under the bubble, clamped to the viewport.
    let vpLeft = bubbleCenterX - pw / 2;
    vpLeft = Math.max(gap, Math.min(vpLeft, vw - pw - gap));
    panel.style.left = `${vpLeft}px`;

    // Vertical: below the bubble by default; flip above when not enough room.
    const spaceBelow = vh - hostBottom;
    if (spaceBelow >= ph + gap) {
      panel.style.top = `${hostBottom + gap}px`;
    } else {
      panel.classList.add("fct-panel-up");
      panel.style.bottom = `${vh - hostY + gap}px`;
    }
  }

  function saveWidgetStateSafe() {
    saveWidgetState(widgetState).catch(() => {});
  }

  function initDrag() {
    const bubble = els.bubble;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    function onDown(e) {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      originX = widgetState.x;
      originY = widgetState.y;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (!moved) return;
      const c = clampWidgetPosition(originX + dx, originY + dy);
      host.style.left = `${c.x}px`;
      host.style.top = `${c.y}px`;
      if (widgetState.expanded) positionPanel();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        const rect = host.getBoundingClientRect();
        const c = clampWidgetPosition(rect.left, rect.top);
        widgetState.x = c.x;
        widgetState.y = c.y;
        host.style.left = `${c.x}px`;
        host.style.top = `${c.y}px`;
        saveWidgetStateSafe();
        if (widgetState.expanded) positionPanel();
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    bubble.addEventListener("mousedown", onDown);
    bubble.addEventListener("click", () => {
      if (!moved) togglePanel();
    });
  }

  async function startCountdown(mode, totalMs, label) {
    const endsAt = Date.now() + totalMs;
    const next = {
      mode,
      label: label || "",
      totalMs,
      remainingMs: totalMs,
      endsAt,
      running: true,
    };
    countdown = next;
    await saveCountdown(next);
    try {
      await chrome.runtime.sendMessage({ type: "countdown:start", payload: { totalMs, endsAt } });
    } catch (e) {
      /* worker not ready; content loop still tracks locally */
    }
    switchToTab(mode === "timer" ? "timer" : "pomodoro");
    startUiLoop();
    refreshCountdownView();
  }

  async function cancelCountdown() {
    try {
      await chrome.runtime.sendMessage({ type: "countdown:cancel" });
    } catch (e) {
      /* ignore */
    }
    countdown = { ...DEFAULT_COUNTDOWN };
    await resetCountdown();
    stopUiLoop();
    refreshCountdownView();
  }

  function tick() {
    if (els.bubbleClock) els.bubbleClock.textContent = formatTime(new Date(), settings.showSeconds);
    updateClock();
  }

  function uiLoop() {
    if (countdown.running && countdown.endsAt) {
      countdown.remainingMs = Math.max(0, countdown.endsAt - Date.now());
      if (countdown.remainingMs <= 0) {
        countdown.running = false;
        stopUiLoop();
        refreshCountdownView();
      } else {
        refreshCountdownView();
      }
    }
  }

  function startTickLoop() {
    if (tickTimer) return;
    tick();
    tickTimer = setInterval(tick, 1000);
  }

  function stopTickLoop() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function startUiLoop() {
    if (uiTimer) return;
    uiLoop();
    uiTimer = setInterval(uiLoop, 250);
  }

  function stopUiLoop() {
    if (uiTimer) {
      clearInterval(uiTimer);
      uiTimer = null;
    }
  }

  function onStorageChanged(changes, area) {
    if (area !== "local") return;
    if (changes[COUNTDOWN_STORAGE_KEY]) {
      const newVal = changes[COUNTDOWN_STORAGE_KEY].newValue;
      if (!newVal) {
        countdown = { ...DEFAULT_COUNTDOWN };
        stopUiLoop();
        refreshCountdownView();
      } else {
        countdown = { ...DEFAULT_COUNTDOWN, ...newVal };
        if (countdown.running && countdown.endsAt) {
          countdown.remainingMs = Math.max(0, countdown.endsAt - Date.now());
          startUiLoop();
          refreshCountdownView();
        }
      }
    }
  }

  const PANEL_ANIM_MS = 160;
  let panelCloseTimer = null;

  function setPanel(expanded) {
    widgetState.expanded = expanded;
    const panel = els.panel;
    if (!panel) return;
    if (panelCloseTimer) {
      clearTimeout(panelCloseTimer);
      panelCloseTimer = null;
    }
    if (expanded) {
      panel.hidden = false;
      panel.classList.add("fct-open");
      // position before the first paint so there's no visible jump
      positionPanel();
      // force reflow so the opening transition runs from the closed state
      void panel.offsetHeight;
    } else {
      panel.classList.remove("fct-open");
      panelCloseTimer = setTimeout(() => {
        panel.hidden = true;
        panelCloseTimer = null;
      }, PANEL_ANIM_MS);
    }
    if (els.bubble) {
      els.bubble.setAttribute("aria-expanded", String(widgetState.expanded));
    }
    saveWidgetStateSafe();
  }

  function togglePanel() {
    setPanel(!widgetState.expanded);
  }

  function hookEvents() {
    els.collapseBtn.addEventListener("click", togglePanel);
    els.tabs.forEach((t) => {
      t.addEventListener("click", () => switchToTab(t.dataset.tab));
    });
    els.startBtn.addEventListener("click", async () => {
      const mins = parseInt(els.minInput.value, 10);
      if (!mins || mins <= 0) {
        els.minInput.focus();
        return;
      }
      await startCountdown("timer", mins * 60 * 1000, `${mins} min timer`);
    });
    els.minInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") els.startBtn.click();
    });
    els.cancelBtn.addEventListener("click", cancelCountdown);
    els.pomoCancel.addEventListener("click", cancelCountdown);
    els.pomoWork.addEventListener("click", () =>
      startCountdown("pomodoro-work", POMODORO_WORK_MS, "Focus 25 min"),
    );
    els.pomoBreak.addEventListener("click", () =>
      startCountdown("pomodoro-break", POMODORO_BREAK_MS, "Break 5 min"),
    );
    els.themeSelect.addEventListener("change", async () => {
      settings.theme = els.themeSelect.value;
      await saveSettings(settings);
      applyTheme();
    });
    els.accentPicker.addEventListener("input", async () => {
      settings.accent = els.accentPicker.value;
      applyAccent();
      await saveSettings(settings);
    });
    els.showDateToggle.addEventListener("change", async () => {
      settings.showDate = els.showDateToggle.checked;
      await saveSettings(settings);
      updateClock();
    });
    els.showSecondsToggle.addEventListener("change", async () => {
      settings.showSeconds = els.showSecondsToggle.checked;
      await saveSettings(settings);
      updateClock();
    });
    els.soundToggle.addEventListener("change", async () => {
      settings.sound = els.soundToggle.checked;
      await saveSettings(settings);
    });
    initDrag();

    // Esc closes the panel; arrow keys move across tabs (roving tabindex).
    root.addEventListener("keydown", (e) => {
      if (!widgetState.expanded) return;
      if (e.key === "Escape") {
        const typing = root.activeElement && root.activeElement.tagName === "INPUT";
        if (typing) return;
        e.preventDefault();
        setPanel(false);
        els.bubble.focus();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
        const target = root.activeElement && root.activeElement.closest(".fct-tab");
        if (!target) return;
        e.preventDefault();
        const idx = els.tabs.indexOf(target);
        if (idx === -1) return;
        let next = idx;
        if (e.key === "ArrowRight") next = (idx + 1) % els.tabs.length;
        else if (e.key === "ArrowLeft") next = (idx - 1 + els.tabs.length) % els.tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = els.tabs.length - 1;
        switchToTab(els.tabs[next].dataset.tab);
        els.tabs[next].focus();
      }
    });
  }

  function collectEls() {
    const q = (s) => root.querySelector(s);
    els.bubble = q(".fct-bubble");
    els.bubbleClock = q(".fct-bubble-clock");
    els.bubbleDate = q(".fct-bubble-date");
    els.panel = q(".fct-panel");
    els.collapseBtn = q(".fct-collapse");
    els.tabs = Array.from(root.querySelectorAll(".fct-tab"));
    els.views = Array.from(root.querySelectorAll(".fct-view"));
    els.clockTime = q('[data-view="clock"] .fct-clock-time');
    els.clockDate = q('[data-view="clock"] .fct-clock-date');
    els.timerDisplay = q('[data-view="timer"] .fct-countdown-timer');
    els.timerLabel = q('[data-view="timer"] .fct-countdown-label');
    els.minInput = q(".fct-min-input");
    els.startBtn = q(".fct-btn-start");
    els.cancelBtn = q(".fct-btn-cancel");
    els.pomoDisplay = q('[data-view="pomodoro"] .fct-countdown-timer');
    els.pomoLabel = q('[data-view="pomodoro"] .fct-countdown-label');
    els.pomoWork = q(".fct-pomo-work");
    els.pomoBreak = q(".fct-pomo-break");
    els.pomoCancel = q(".fct-pomo-cancel");
    els.themeSelect = q(".fct-theme");
    els.accentPicker = q(".fct-accent");
    els.showDateToggle = q(".fct-show-date");
    els.showSecondsToggle = q(".fct-show-seconds");
    els.soundToggle = q(".fct-sound");
  }

  function injectDom() {
    host = document.createElement("div");
    host.id = "fct-root";
    host.setAttribute("data-theme", "auto");
    root = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    root.appendChild(style);

    const wrap = document.createElement("div");
    wrap.innerHTML = MARKUP;
    root.appendChild(wrap.firstElementChild);

    (document.body || document.documentElement).appendChild(host);
  }

  async function mount() {
    try {
      injectDom();
      [settings, countdown, widgetState] = await Promise.all([
        loadSettings(),
        loadCountdown(),
        loadWidgetState(),
      ]);

      collectEls();
      hookEvents();

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (widgetState.x == null || widgetState.y == null) {
        const { w, h } = getBubbleSize();
        widgetState.x = vw - w - 16;
        widgetState.y = vh - h - 16;
      }
      const c = clampWidgetPosition(widgetState.x, widgetState.y);
      widgetState.x = c.x;
      widgetState.y = c.y;
      host.style.left = `${widgetState.x}px`;
      host.style.top = `${widgetState.y}px`;

      applyAccent();
      applyTheme();

      // restore expanded state without replaying the entrance animation
      if (els.panel) {
        els.panel.hidden = !widgetState.expanded;
        if (widgetState.expanded) {
          els.panel.classList.add("fct-open");
          positionPanel();
        }
      }
      refreshSettings();
      refreshCountdownView();
      if (countdown.running && countdown.endsAt) startUiLoop();
      startTickLoop();

      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
      chrome.storage.onChanged.addListener(onStorageChanged);

      // Keep the bubble on-screen and the open panel in view when the viewport changes.
      window.addEventListener("resize", () => {
        const c = clampWidgetPosition(widgetState.x, widgetState.y);
        widgetState.x = c.x;
        widgetState.y = c.y;
        host.style.left = `${widgetState.x}px`;
        host.style.top = `${widgetState.y}px`;
        saveWidgetStateSafe();
        positionPanel();
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[Floating Clock] failed to mount:", err);
      if (host && host.parentNode) host.parentNode.removeChild(host);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
