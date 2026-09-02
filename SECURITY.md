# Security Policy

## Reporting a vulnerability

LucClock is a small local extension: it stores settings in `chrome.storage.local`, injects a
widget into a shadow DOM on every page, and uses `chrome.alarms` + `chrome.notifications`.
It makes **no network requests** and collects **no data**.

If you still find a security issue, please report it privately rather than opening a public
issue:

- Open a **private vulnerability report** on GitHub
  (Repository → Security → *Report a vulnerability*), or
- Email the maintainer privately (see the repo's About / commit author).

Please include:
- A description of the issue and its impact
- Steps to reproduce
- Affected versions / commit
- Any suggested fix, if you have one

## Scope

In scope: the extension code in this repository.

Out of scope: the browsers it runs in, or third-party code linked from the README.

## Response

We aim to acknowledge reports within a few days and to ship a fix as soon as a reproduction
is confirmed. Please give us reasonable time before disclosing publicly.

## Safe by design

- No network calls — nothing leaves the browser.
- No data collection or analytics.
- Widget is confined to a shadow DOM (no page CSS/JS interference).
- All timers are local via `chrome.alarms`.
