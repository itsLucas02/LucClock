importScripts("../lib/storage.js");

const COUNTDOWN_ALARM = "countdown-done";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clear(COUNTDOWN_ALARM);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return;

  switch (message.type) {
    case "countdown:start": {
      const { totalMs, endsAt } = message.payload || {};
      if (!totalMs || !endsAt) {
        sendResponse({ ok: false, error: "Missing payload" });
        return;
      }
      chrome.alarms.clear(COUNTDOWN_ALARM).then(() => {
        chrome.alarms.create(COUNTDOWN_ALARM, { when: endsAt });
      });
      sendResponse({ ok: true });
      return;
    }

    case "countdown:cancel": {
      chrome.alarms.clear(COUNTDOWN_ALARM);
      sendResponse({ ok: true });
      return;
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== COUNTDOWN_ALARM) return;

  (async () => {
    const stored = await chrome.storage.local.get([COUNTDOWN_STORAGE_KEY, "settings"]);
    const cd = stored[COUNTDOWN_STORAGE_KEY] || {};
    const settings = stored.settings || {};

    if (cd.endsAt && cd.endsAt > Date.now() + 2000) {
      chrome.alarms.create(COUNTDOWN_ALARM, { when: cd.endsAt });
      return;
    }

    await chrome.storage.local.remove(COUNTDOWN_STORAGE_KEY);

    const isWork = cd.mode === "pomodoro-work";
    const isBreak = cd.mode === "pomodoro-break";
    const title = isWork
      ? "Pomodoro complete"
      : isBreak
        ? "Break over"
        : "Timer complete";
    const message = cd.label
      ? `"${cd.label}" is done.`
      : isWork
        ? "Great work! Start a 5-minute break?"
        : isBreak
          ? "Break's over — ready for another work session?"
          : "Time's up!";

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 2,
    });

    if (settings.sound) {
      playChime();
    }

    chrome.runtime.sendMessage({ type: "countdown:done", mode: cd.mode });
  })();
});

// Play the completion chime via an offscreen document (MV3 service workers
// can't touch the DOM or audio directly).
async function playChime() {
  const path = "offscreen.html";
  const hasDocument = await chrome.offscreen.hasDocument().catch(() => false);
  if (!hasDocument) {
    await chrome.offscreen.createDocument({
      url: path,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play a completion chime when a timer or pomodoro finishes.",
    }).catch(() => {});
  }
  await chrome.runtime.sendMessage({ type: "chime:play" }).catch(() => {});
}
