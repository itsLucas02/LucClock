<div align="center">

# LucClock

**A calm, minimal clock for your browser — with a timer and pomodoro, floating on every tab.**

Built by **Lucas (Aizzul Luqman)** · Open to contributions

</div>

---

## What it is

LucClock is a lightweight browser extension (Manifest V3) that puts a quiet, draggable
**24-hour clock** in the corner of your screen — on every tab, every site. It stays out of
your way until you need it, then expands into a clean panel with:

- **Clock** — live 24-hour time, date + ISO week line, optional seconds
- **Timer** — count down minutes; get a desktop notification when time's up
- **Pomodoro** — Work 25 / Break 5 focus sessions
- **Settings** — Auto/Light/Dark theme, accent color, date & seconds toggles, sound

While a countdown runs, the pill swaps its date line for the live remaining time
(`FOCUS 24:12`) so the bubble never bloats. Drag it to **any** screen edge — the panel
smartly repositions and flips upward near the bottom so it always stays on-screen.

> Works in **Brave** and other Chromium browsers (Chrome, Edge, Opera, Arc).

## Why LucClock?

Clocks are everywhere, but few exist as a *polished, always-available floating extension* —
most are browser-UI mods or clunky popups. LucClock is a deliberate, calm little tool:

- **Truly floating** — pinned to the corner of every page you visit
- **24-hour by default** — clean, unambiguous, readable at a glance
- **Timer + pomodoro that survive tab switches** — alarms run in the background worker
- **Isolated & safe** — injected in a shadow DOM so it never touches page styles or scripts
- **Accessible & keyboard-friendly** — Esc, arrow keys, focus outlines, reduced-motion aware

## Install (unpacked)

Because it's plain JavaScript with **no build step**, you can load it straight from source:

1. Clone this repo (or download & extract it).
2. Open `brave://extensions` (or `chrome://extensions`).
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and select the repo folder.
5. The LucClock bubble appears bottom-right on every page.

> When loaded unpacked, keep the folder in place and hit **Reload** on the extension card
> after pulling changes.

## Using it

| Do this | Result |
|---|---|
| Click the bubble | Open/close the panel |
| Drag the bubble | Move it to any edge; position is remembered |
| **Timer** tab → minutes → Start | Desktop notification on finish |
| **Pomodoro** tab → Work 25 / Break 5 | Focus session with notification |
| **Settings** | Theme, accent, date/seconds, sound on finish |
| Press `Esc` with panel open | Collapse it |
| `←` / `→` / Home / End on a tab | Move between Clock/Timer/Pomodoro/Settings |

## Project layout

```
LucClock/
├── manifest.json            # MV3: content script, background worker, permissions
├── icons/                   # 16/48/128 px extension icons
├── brand/                   # Brand assets (SVG mark)
├── lib/
│   └── storage.js           # Settings / countdown / position persistence
├── content/
│   └── content.js           # Self-contained widget: UI, drag, panel flip, clock, keyboard
└── background/
    ├── service-worker.js    # chrome.alarms + notifications + chime trigger
    ├── offscreen.html       # MV3 audio playback surface
    └── chime.wav            # Soft completion chime
```

## Contributing

Contributions are welcome — bug reports, ideas, docs, and pull requests. See
[CONTRIBUTING.md](CONTRIBUTING.md) to get started. Please read our
[Code of Conduct](CONTRIBUTING.md#code-of-conduct) and note all work is MIT licensed.

## License

[MIT](LICENSE) © Aizzul Luqman (Lucas)
