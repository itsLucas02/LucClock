/**
 * Build a distributable LucClock package (a zip you load unpacked in a browser).
 *
 * The extension is plain JS with no build step, so "packaging" is just staging
 * the runtime files + a short install README into a clean folder and zipping it.
 *
 * Usage:
 *   node scripts/build-release.js          # builds dist/lucclock-<version>.zip
 *
 * Output goes to dist/ (gitignored) ready to attach to a GitHub Release.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const VERSION = manifest.version;
const NAME = "lucclock-" + VERSION;

// Runtime files required to load the extension unpacked.
const FILES = [
  "manifest.json",
  "content/content.js",
  "lib/storage.js",
  "background/service-worker.js",
  "background/offscreen.html",
  "background/chime.wav",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

const INSTALL_README = `# LucClock ${VERSION}

Thank you for downloading LucClock! This is the extension package. Load it straight
into Brave, Chrome, Edge, Opera or Arc with these steps.

## Install in Brave (or Chrome)

1. Unzip this file into a folder you won't delete (e.g. \`~/Downloads/LucClock\` or
   \`Documents/LucClock\`).
2. Open \`brave://extensions\` (in Chrome: \`chrome://extensions\`).
3. Turn ON **Developer mode** (top-right corner).
4. Click **Load unpacked**.
5. Select the \`${NAME}\` folder you just unzipped.
6. Done! The clock bubble appears at the bottom-right of every page.

## Notes

- Keep the folder on disk — the browser reads from it. Don't move or delete it
  after loading, or the extension stops working.
- To update later: unzip the new version over the folder (or load the new folder),
  then click the **Reload** icon on the extension card.
- The widget is one shared clock across all your tabs: start a timer or pomodoro on
  any page and every tab shows it. Drag it to any edge; it follows everywhere.
- No data leaves your browser. No network requests. All local.

Need help or want to contribute? https://github.com/itsLucas02/LucClock

MIT License (c) Aizzul Luqman (Lucas)
`;

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  return r.stdout.trim();
}

function main() {
  const dist = path.join(ROOT, "dist");
  fs.mkdirSync(dist, { recursive: true });

  // Stage into a temp folder so the zip root has exactly the package folder.
  const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lucclock-"));
  const pkgDir = path.join(stageRoot, NAME);
  fs.mkdirSync(pkgDir, { recursive: true });

  for (const rel of FILES) {
    const src = path.join(ROOT, rel);
    const dst = path.join(pkgDir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(pkgDir, "INSTALL.md"), INSTALL_README);

  // Zip via PowerShell Compress-Archive (available on Windows; on macOS/Linux
  // fall back to the `zip` CLI if present).
  const zipOut = path.join(dist, NAME + ".zip");
  if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);
  const platform = process.platform;
  if (platform === "win32") {
    run("powershell", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${pkgDir}' -DestinationPath '${zipOut}' -Force`,
    ], ROOT);
  } else {
    run("zip", ["-r", zipOut, NAME], stageRoot);
  }

  // Show contents so it's easy to verify.
  console.log("Built " + zipOut);
  if (platform === "win32") {
    run("powershell", ["-NoProfile", "-Command", `tar -tf '${zipOut}'`], ROOT);
  } else {
    run("unzip", ["-l", zipOut], ROOT);
  }
  fs.rmSync(stageRoot, { recursive: true, force: true });
  console.log("Done.");
}

main();
