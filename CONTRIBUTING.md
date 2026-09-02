# Contributing to LucClock

Thanks for wanting to contribute! LucClock is a small, friendly project and every bit of
help — code, docs, bug reports, design feedback — is appreciated.

## Code of conduct

Be respectful and constructive. We're all here to build a nice little clock.
Harassment or unkind behavior of any kind is not welcome.

## Ways to contribute

- **Report bugs** — open an issue with steps to reproduce, what you expected, and what happened.
- **Suggest features** — open an issue describing the idea and why it helps.
- **Fix something** — pick an open issue or something you noticed and open a pull request.
- **Improve docs** — README, this file, inline comments where missing.
- **Design** — icon/brand feedback, or polish suggestions with specifics.

## Good first issues

Look for issues labelled `good first issue`. They're small, well-scoped, and a great way to
get familiar with the code.

## Development setup

There is no build step — LucClock is plain JavaScript.

1. Clone the repo.
2. Load it unpacked in Brave/Chrome (`brave://extensions` → Developer mode → Load unpacked).
3. Edit, then hit **Reload** on the extension card and refresh your page to test.

To sanity-check JS files:

```sh
node --check content/content.js
node --check background/service-worker.js
node --check lib/storage.js
```

## Project structure

- `content/content.js` — the whole widget UI (markup + styles + logic), injected into a shadow DOM.
- `background/service-worker.js` — owns `chrome.alarms`; fires notifications and the chime.
- `background/offscreen.html` + `chime.wav` — MV3 audio playback (service workers can't play audio).
- `lib/storage.js` — shared storage helpers (settings, countdown, widget position).

## Guidelines

- Keep it **plain JS, no dependencies, no build step** — that's a core property of this project.
- Preserve the shadow-DOM isolation (no page style leaks, no globals beyond `window.__fctInjected`).
- Match the existing style: `fct-` prefixed classes, small helper functions, no framework.
- Keep the widget **calm** — the default 24-hour time, quiet colors, restrained motion.
- Ensure new controls are **keyboard-accessible** with `:focus-visible` styles, and honor
  `prefers-reduced-motion`.
- Add or update a test in your PR if you change behaviour — see `# Testing`.

## Testing

Automated smoke tests run against a jsdom harness that stubs the `chrome.*` APIs. To run them:

```sh
npm install         # installs jsdom (dev-only, not a runtime dependency)
node test/run.js
```

The suite covers mounting, panel open/flip behaviour, tabs, keyboard (Esc/arrows), the
countdown bubble, and worker notification/chime paths.

## Pull request process

1. Fork the repo and create a branch: `git checkout -b fix/description`.
2. Make your change; keep commits small and descriptive.
3. Run `node test/run.js` and make sure nothing regressed.
4. Open a pull request describing what you changed and why.
5. A maintainer will review and follow up.

Small, focused PRs are much easier to review than large ones — when in doubt, split it up.

## Questions?

Open an issue with the `question` label, or start a discussion. No question is too small.

MIT © Aizzul Luqman (Lucas)
