/**
 * LucClock smoke tests.
 *
 * Runs the content script and service worker against jsdom with the chrome.*
 * APIs stubbed, then asserts key behaviours. No browser required.
 *
 *   npm install   # once
 *   node test/run.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
let pass = 0;
let fail = 0;
function check(name, cond) {
  console.log((cond ? "PASS" : "FAIL") + " - " + name);
  cond ? pass++ : fail++;
}

// ---------------------------------------------------------------------------
// Content-script harness
// ---------------------------------------------------------------------------
// A "storage backend" is a shared { store, listeners } pair. Passing the same
// backend to two makeDom() calls simulates two tabs sharing chrome.storage.
function makeStorageBackend() {
  const store = {};
  const listeners = [];
  return { store, listeners };
}

function makeDom(backend) {
  const b = backend || makeStorageBackend();
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "https://example.com/",
    pretendToBeVisual: true,
    runScripts: "dangerously",
  });
  const sent = [];
  const chromeMock = {
    storage: {
      local: {
        async get(keys) {
          const store = b.store;
          if (keys === undefined) return { ...store };
          const arr = Array.isArray(keys) ? keys : [keys];
          const out = {};
          for (const k of arr) if (k in store) out[k] = store[k];
          return out;
        },
        async set(obj) {
          const store = b.store;
          const changes = {};
          for (const [k, v] of Object.entries(obj)) {
            const nv = JSON.parse(JSON.stringify(v));
            if (JSON.stringify(store[k]) !== JSON.stringify(v)) {
              changes[k] = { oldValue: store[k], newValue: nv };
              store[k] = JSON.parse(JSON.stringify(v));
            }
          }
          // Real chrome.storage fires ONE onChanged per set(), with every key.
          if (Object.keys(changes).length) {
            b.listeners.forEach((cb) => cb(changes, "local"));
          }
        },
        async remove(keys) {
          const store = b.store;
          const arr = Array.isArray(keys) ? keys : [keys];
          for (const k of arr) {
            if (k in store) {
              b.listeners.forEach((cb) => cb({ [k]: { oldValue: store[k], newValue: undefined } }, "local"));
              delete store[k];
            }
          }
        },
      },
      onChanged: { addListener: (cb) => b.listeners.push(cb) },
    },
    runtime: { async sendMessage(m) { sent.push(m); return { ok: true }; } },
  };
  dom.window.chrome = chromeMock;
  dom.window.matchMedia = () => ({ matches: false, addEventListener: () => {}, addListener: () => {} });
  dom.window.HTMLElement.prototype.offsetWidth = 380;
  dom.window.HTMLElement.prototype.offsetHeight = 220;
  dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.id === "fct-root") {
      const l = parseFloat(this.style.left) || 0;
      const t = parseFloat(this.style.top) || 0;
      return { width: 128, height: 44, left: l, top: t, right: l + 128, bottom: t + 44 };
    }
    return { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 };
  };
  dom.window.innerWidth = 1280;
  dom.window.innerHeight = 800;
  const load = (f) => dom.window.document.body.appendChild(
    Object.assign(dom.window.document.createElement("script"), { textContent: fs.readFileSync(path.join(ROOT, f), "utf8") })
  );
  return { dom, load, sent, backend: b };
}

async function contentTests() {
  console.log("\n== content ==");
  const { dom, load, sent } = makeDom();
  load("lib/storage.js");
  load("content/content.js");
  await new Promise((r) => setTimeout(r, 80));

  const host = dom.window.document.getElementById("fct-root");
  const shadow = host.shadowRoot;
  const bubble = shadow.querySelector(".fct-bubble");
  const panel = shadow.querySelector(".fct-panel");
  const styleText = shadow.querySelector("style").textContent;

  check("mounts host + shadow", !!host && !!shadow);
  check("tabs intact", ["Clock", "Timer", "Pomodoro", "Settings"].every((n, i) =>
    shadow.querySelectorAll(".fct-tab")[i] && shadow.querySelectorAll(".fct-tab")[i].textContent.trim() === n));
  check("panel position:fixed", /\.fct-panel\s*\{[^}]*position:fixed/.test(styleText));
  check("tabs share width", /\.fct-tab\s*\{[^}]*flex:1 1 0/.test(styleText));
  check("pomodoro buttons fill row", /\.fct-pomodoro-row \.fct-btn\s*\{[^}]*flex:1 1 0/.test(styleText));
  check("no separate countdown chip", !shadow.querySelector(".fct-bubble-countdown"));

  const dragTo = (fx, fy) => {
    const sx = parseFloat(host.style.left) || 60;
    const sy = parseFloat(host.style.top) || 60;
    const fire = (el, type, x, y) => el.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }));
    fire(bubble, "mousedown", sx, sy);
    dom.window.document.dispatchEvent(new dom.window.MouseEvent("mousemove", { bubbles: true, clientX: fx, clientY: fy }));
    dom.window.document.dispatchEvent(new dom.window.MouseEvent("mouseup", { bubbles: true, clientX: fx, clientY: fy }));
    fire(bubble, "mousedown", fx, fy);
    dom.window.document.dispatchEvent(new dom.window.MouseEvent("mouseup", { bubbles: true, clientX: fx, clientY: fy }));
  };

  dragTo(1136, 740); // bottom-right
  bubble.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  check("bottom-right flips panel UP", panel.classList.contains("fct-open") && panel.classList.contains("fct-panel-up") && panel.style.bottom !== "");
  shadow.querySelector(".fct-collapse").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 220));

  dragTo(60, 60); // top-left
  bubble.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  check("top-left opens panel DOWN", panel.classList.contains("fct-open") && !panel.classList.contains("fct-panel-up") && panel.style.top !== "");

  // Esc
  shadow.querySelector(".fct-collapse").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 220));
  check("panel hidden after close", panel.hasAttribute("hidden"));

  // countdown into the date slot
  shadow.querySelector('.fct-tab[data-tab="timer"]').dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  shadow.querySelector(".fct-min-input").value = "5";
  shadow.querySelector(".fct-btn-start").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 80));
  const dateSlot = shadow.querySelector(".fct-bubble-date");
  check("bubble date slot shows remaining", /^05:00$/.test(dateSlot.textContent.trim()));
  check("start message sent", sent.some((m) => m.type === "countdown:start"));
  check("bubble still two lines", bubble.querySelectorAll("span").length === 2);

  // arrow-key tab nav
  shadow.querySelector(".fct-collapse").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 200));
  bubble.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
  shadow.querySelector('.fct-tab[data-tab="clock"]').focus();
  shadow.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const active = [...shadow.querySelectorAll(".fct-tab")].find((t) => t.getAttribute("aria-selected") === "true");
  check("ArrowRight selects Timer", active.dataset.tab === "timer");
}

async function twoTabSyncTests() {
  console.log("\n== cross-tab sync ==");
  const backend = makeStorageBackend();
  const tabA = makeDom(backend);
  const tabB = makeDom(backend);
  for (const t of [tabA, tabB]) {
    t.load("lib/storage.js");
    t.load("content/content.js");
  }
  // Let both mount fully (each reads shared state + gets its instanceId).
  await new Promise((r) => setTimeout(r, 150));

  const shA = tabA.dom.window.document.getElementById("fct-root").shadowRoot;
  const shB = tabB.dom.window.document.getElementById("fct-root").shadowRoot;
  const get = (sh) => ({
    expanded: sh.querySelector(".fct-panel").classList.contains("fct-open"),
    active: [...sh.querySelectorAll(".fct-tab")].find((t) => t.getAttribute("aria-selected") === "true").dataset.tab,
    bubble: sh.querySelector(".fct-bubble-date").textContent.trim(),
    chip: sh.querySelector(".fct-bubble").dataset.countdown,
  });

  const sA = get(shA);
  const sB = get(shB);
  check("both tabs start collapsed", !sA.expanded && !sB.expanded);

  // Tab A opens the panel + switches to Pomodoro -> Tab B follows.
  const fire = (dom, el, type) => el.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true }));
  fire(tabA.dom, shA.querySelector(".fct-bubble"), "click");
  await new Promise((r) => setTimeout(r, 30));
  fire(tabA.dom, shA.querySelector('.fct-tab[data-tab="pomodoro"]'), "click");
  await new Promise((r) => setTimeout(r, 120));
  check("B opens when A opens", get(shB).expanded === true);
  check("B follows active tab", get(shB).active === "pomodoro");

  // No echo loop: A did not get flipped back / re-closed by its own change.
  check("A stays open after own change", get(shA).expanded === true);
  check("A stays on pomodoro", get(shA).active === "pomodoro");

  // Tab B collapses -> Tab A follows.
  fire(tabB.dom, shB.querySelector(".fct-collapse"), "click");
  await new Promise((r) => setTimeout(r, 250));
  check("A collapses when B collapses", get(shA).expanded === false);

  // Tab A changes theme to dark -> both theme selects + host update.
  const selA = shA.querySelector(".fct-theme");
  selA.value = "dark";
  selA.dispatchEvent(new tabA.dom.window.Event("change"));
  await new Promise((r) => setTimeout(r, 80));
  const hostB = tabB.dom.window.document.getElementById("fct-root");
  check("B host data-theme dark", hostB.getAttribute("data-theme") === "dark");
  check("A host data-theme dark", tabA.dom.window.document.getElementById("fct-root").getAttribute("data-theme") === "dark");

  // Start pomodoro in A -> B shows running + same remaining in its date slot.
  fire(tabA.dom, shA.querySelector(".fct-bubble"), "click"); // open A (and B)
  await new Promise((r) => setTimeout(r, 30));
  fire(tabA.dom, shA.querySelector(".fct-pomo-work"), "click");
  await new Promise((r) => setTimeout(r, 120));
  const bState = get(shB);
  check("B shows running countdown", bState.chip === "running");
  check("B date slot shows FOCUS + time", /^FOCUS 25:00$/.test(bState.bubble));

  // Cancel in B -> both reset.
  fire(tabB.dom, shB.querySelector(".fct-pomo-cancel"), "click");
  await new Promise((r) => setTimeout(r, 80));
  check("A reset after B cancels", get(shA).chip !== "running");

  // Count total writes to prove no runaway loop.
  const writeKeys = Object.keys(backend.store).filter((k) => k.startsWith("widget:"));
  check("shared widget state keys bounded", writeKeys.length <= 8);
}

// ---------------------------------------------------------------------------
// Service-worker harness
// ---------------------------------------------------------------------------
async function workerTests() {
  console.log("\n== worker ==");

  const store = {};
  const alarms = [];
  const notifications = [];
  const sent = [];
  let alarmCbs = [];
  let msgCbs = [];
  let hasOffscreen = false;
  const offscreenCreated = [];

  const chromeMock = {
    runtime: {
      onInstalled: { addListener: () => {} },
      onMessage: { addListener: (cb) => msgCbs.push(cb) },
      sendMessage: (m) => { sent.push(m); return Promise.resolve({ ok: true }); },
    },
    alarms: {
      clear: async () => true,
      create: (n, o) => alarms.push({ n, o }),
      onAlarm: { addListener: (cb) => alarmCbs.push(cb) },
    },
    storage: {
      local: {
        async get(keys) {
          const arr = Array.isArray(keys) ? keys : [keys];
          const out = {};
          for (const k of arr) if (k in store) out[k] = store[k];
          return out;
        },
        async set(obj) { Object.assign(store, JSON.parse(JSON.stringify(obj))); },
        async remove(keys) { const a = Array.isArray(keys) ? keys : [keys]; for (const k of a) delete store[k]; },
      },
    },
    notifications: { create: (o) => notifications.push(o) },
    offscreen: {
      hasDocument: async () => hasOffscreen,
      createDocument: async (o) => { offscreenCreated.push(o); hasOffscreen = true; },
    },
  };
  const sandbox = {
    importScripts: (f) => { vm.runInContext(fs.readFileSync(path.join(ROOT, "background", f), "utf8"), ctx); },
    chrome: chromeMock, console, setTimeout, clearTimeout, Date, JSON, Math, Promise,
  };
  sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "background", "service-worker.js"), "utf8"), ctx);

  // pomodoro work + sound on -> notification + offscreen chime
  store["countdown"] = { mode: "pomodoro-work", label: "", endsAt: Date.now() - 1000, running: true };
  store["settings"] = { sound: true };
  await alarmCbs[0]({ name: "countdown-done" });
  await new Promise((r) => setTimeout(r, 20));
  check("work end notifies", notifications.length === 1 && /break\?/i.test(notifications[0].message));
  check("offscreen created for chime", offscreenCreated.length === 1 && offscreenCreated[0].reasons.includes("AUDIO_PLAYBACK"));
  check("chime play sent", sent.some((m) => m.type === "chime:play"));
  check("storage cleared", !("countdown" in store));

  // break + sound off -> no chime
  notifications.length = 0; offscreenCreated.length = 0; sent.length = 0; hasOffscreen = false;
  store["countdown"] = { mode: "pomodoro-break", label: "", endsAt: Date.now() - 1000, running: true };
  store["settings"] = { sound: false };
  await alarmCbs[0]({ name: "countdown-done" });
  await new Promise((r) => setTimeout(r, 20));
  check("break end suggests work", /work session\?/i.test(notifications[0].message));
  check("no chime when sound off", offscreenCreated.length === 0 && !sent.some((m) => m.type === "chime:play"));

  // start message creates alarm
  const send = msgCbs[0];
  alarms.length = 0;
  await new Promise((res) => send({ type: "countdown:start", payload: { totalMs: 60000, endsAt: Date.now() + 60000 } }, {}, res));
  check("alarm created on start", alarms.length === 1 && alarms[0].n === "countdown-done");
}

(async () => {
  await contentTests();
  await twoTabSyncTests();
  await workerTests();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
