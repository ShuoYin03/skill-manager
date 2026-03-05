"use strict";
const electron = require("electron");
const path = require("path");
const Store = require("electron-store");
const uuid = require("uuid");
const simpleGit = require("simple-git");
const child_process = require("child_process");
const fs = require("fs");
const supabaseJs = require("@supabase/supabase-js");
const http = require("http");
const crypto = require("crypto");
const fsp = require("fs/promises");
const os = require("os");
const IPC = {
  REPOS_GET_ALL: "repos:get-all",
  REPOS_ADD: "repos:add",
  REPOS_REMOVE: "repos:remove",
  REPOS_UPDATE: "repos:update",
  REPOS_REFRESH_BRANCHES: "repos:refresh-branches",
  EDITOR_OPEN: "editor:open",
  EDITOR_GET_AVAILABLE: "editor:get-available",
  SETTINGS_GET: "settings:get",
  SETTINGS_UPDATE: "settings:update",
  WINDOW_HIDE: "window:hide",
  LAUNCHER_SHOWN: "launcher:shown",
  LAUNCHER_HIDDEN: "launcher:hidden",
  NAVIGATE_SETTINGS: "navigate:settings",
  SHORTCUT_SUSPEND: "shortcut:suspend",
  SHORTCUT_RESUME: "shortcut:resume",
  AUTH_SIGN_IN: "auth:sign-in",
  AUTH_SIGN_OUT: "auth:sign-out",
  AUTH_GET_SESSION: "auth:get-session",
  AUTH_CALLBACK_RECEIVED: "auth:callback-received",
  LICENSE_GET_STATUS: "license:get-status",
  LICENSE_VERIFY: "license:verify",
  // Skills
  SKILLS_SCAN_REPO: "skills:scan-repo",
  SKILLS_SCAN_ALL: "skills:scan-all",
  SKILLS_CREATE: "skills:create",
  SKILLS_UPDATE: "skills:update",
  SKILLS_DELETE: "skills:delete",
  SKILLS_TOGGLE: "skills:toggle",
  SKILLS_GLOBALIZE: "skills:globalize",
  // Presets
  SKILLS_PRESETS_GET: "skills:presets:get",
  SKILLS_PRESETS_SAVE: "skills:presets:save",
  SKILLS_PRESETS_UPDATE: "skills:presets:update",
  SKILLS_PRESETS_DELETE: "skills:presets:delete",
  SKILLS_PRESETS_APPLY: "skills:presets:apply",
  // Marketplace
  SKILLS_MARKETPLACE_SEARCH: "skills:marketplace:search",
  SKILLS_MARKETPLACE_GET: "skills:marketplace:get",
  SKILLS_MARKETPLACE_INSTALL: "skills:marketplace:install",
  SKILLS_MARKETPLACE_FILTER_STATS: "skills:marketplace:filter-stats",
  GET_HOME_DIR: "get:home-dir",
  // Repo info
  REPO_LAST_COMMIT: "repo:last-commit",
  REPO_LANGUAGE_STATS: "repo:language-stats",
  // Instruction files (CLAUDE.md, .cursorrules, etc.)
  INSTRUCTIONS_SCAN: "instructions:scan",
  INSTRUCTIONS_READ: "instructions:read",
  INSTRUCTIONS_WRITE: "instructions:write",
  INSTRUCTIONS_GLOBALIZE: "instructions:globalize"
};
const store = new Store({
  defaults: {
    repos: [],
    settings: {
      globalHotkey: "CommandOrControl+Shift+O",
      defaultEditor: "vscode",
      theme: "system",
      launchAtLogin: false,
      skillsDir: "tool-specific",
      hideAfterOpen: true,
      alwaysOnTop: true,
      rememberWindowSize: true
    },
    trialStartedAt: null,
    authTokens: null,
    licenseCache: null,
    skillPresets: [],
    windowBounds: null
  }
});
function getRepos() {
  return store.get("repos");
}
function setRepos(repos) {
  store.set("repos", repos);
}
function addRepo(repo) {
  const repos = getRepos();
  repos.push(repo);
  setRepos(repos);
}
function removeRepo(id) {
  const repos = getRepos().filter((r) => r.id !== id);
  setRepos(repos);
}
function updateRepo(id, updates) {
  const repos = getRepos().map((r) => r.id === id ? { ...r, ...updates } : r);
  setRepos(repos);
}
function getSettings() {
  return store.get("settings");
}
function updateSettings(updates) {
  const current = getSettings();
  const updated = { ...current, ...updates };
  store.set("settings", updated);
  return updated;
}
function getTrialStartedAt() {
  return store.get("trialStartedAt");
}
function setTrialStartedAt(ts) {
  store.set("trialStartedAt", ts);
}
function getAuthTokens() {
  return store.get("authTokens");
}
function setAuthTokens(tokens) {
  store.set("authTokens", tokens);
}
function clearAuthTokens() {
  store.set("authTokens", null);
}
function getLicenseCache() {
  return store.get("licenseCache");
}
function setLicenseCache(cache) {
  store.set("licenseCache", cache);
}
function getSkillPresets() {
  return store.get("skillPresets");
}
function addSkillPreset(preset) {
  const presets = getSkillPresets();
  presets.push(preset);
  store.set("skillPresets", presets);
}
function removeSkillPreset(id) {
  const presets = getSkillPresets().filter((p) => p.id !== id);
  store.set("skillPresets", presets);
}
function updateSkillPreset(preset) {
  const presets = getSkillPresets().map((p) => p.id === preset.id ? preset : p);
  store.set("skillPresets", presets);
}
function getWindowBounds() {
  return store.get("windowBounds");
}
function setWindowBounds(bounds) {
  store.set("windowBounds", bounds);
}
let launcherWindow = null;
let suppressHide = false;
let boundsDebounceTimer = null;
function setSuppressHide(v) {
  suppressHide = v;
}
function createLauncherWindow() {
  const settings = getSettings();
  const savedBounds = settings.rememberWindowSize ? getWindowBounds() : null;
  const win = new electron.BrowserWindow({
    width: savedBounds?.width ?? 900,
    height: savedBounds?.height ?? 600,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: true,
    fullscreenable: false,
    alwaysOnTop: settings.alwaysOnTop ?? true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.platform === "darwin") {
    win.setVibrancy("under-window");
  }
  const saveBounds = () => {
    if (!getSettings().rememberWindowSize) return;
    if (boundsDebounceTimer) clearTimeout(boundsDebounceTimer);
    boundsDebounceTimer = setTimeout(() => {
      const bounds = win.getBounds();
      setWindowBounds(bounds);
    }, 500);
  };
  win.on("resize", saveBounds);
  win.on("move", saveBounds);
  win.on("blur", () => {
    if (suppressHide) return;
    setTimeout(() => {
      if (suppressHide) return;
      const focused = electron.BrowserWindow.getFocusedWindow();
      if (!focused) hideLauncher();
    }, 150);
  });
  win.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (!electron.app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  launcherWindow = win;
  return win;
}
function showLauncher() {
  if (!launcherWindow) return;
  const settings = getSettings();
  const savedBounds = settings.rememberWindowSize ? getWindowBounds() : null;
  if (savedBounds) {
    launcherWindow.setBounds(savedBounds);
  } else {
    const cursorPoint = electron.screen.getCursorScreenPoint();
    const display = electron.screen.getDisplayNearestPoint(cursorPoint);
    const { x, y, width, height } = display.workArea;
    const winBounds = launcherWindow.getBounds();
    const cx = Math.round(x + (width - winBounds.width) / 2);
    const cy = Math.round(y + (height - winBounds.height) / 2 - height * 0.1);
    launcherWindow.setPosition(cx, cy);
  }
  launcherWindow.show();
  launcherWindow.focus();
  launcherWindow.webContents.send(IPC.LAUNCHER_SHOWN);
}
function applyAlwaysOnTop(value) {
  if (!launcherWindow) return;
  launcherWindow.setAlwaysOnTop(value);
}
function hideLauncher() {
  if (!launcherWindow || !launcherWindow.isVisible()) return;
  launcherWindow.hide();
  launcherWindow.webContents.send(IPC.LAUNCHER_HIDDEN);
}
function toggleLauncher() {
  if (!launcherWindow) return;
  if (launcherWindow.isVisible()) {
    hideLauncher();
  } else {
    showLauncher();
  }
}
function getLauncherWindow() {
  return launcherWindow;
}
let tray = null;
function createTray() {
  let iconPath;
  if (process.platform === "darwin") {
    iconPath = path.join(__dirname, "../../resources/tray-iconTemplate.png");
  } else {
    iconPath = path.join(__dirname, "../../resources/tray-icon.png");
  }
  let icon = electron.nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    icon = electron.nativeImage.createEmpty();
  }
  tray = new electron.Tray(icon);
  tray.setToolTip("Repo Launcher");
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "Show Launcher",
      click: () => showLauncher()
    },
    {
      label: "Settings",
      click: () => {
        showLauncher();
        const win = getLauncherWindow();
        if (win) {
          win.webContents.send(IPC.NAVIGATE_SETTINGS);
        }
      }
    },
    { type: "separator" },
    {
      label: "Quit Repo Launcher",
      click: () => electron.app.quit()
    }
  ]);
  if (process.platform === "darwin") {
    tray.on("right-click", () => tray.popUpContextMenu(contextMenu));
    tray.on("click", () => showLauncher());
  } else {
    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => showLauncher());
  }
  return tray;
}
let currentAccelerator = null;
function registerGlobalShortcut(accelerator) {
  try {
    const success = electron.globalShortcut.register(accelerator, toggleLauncher);
    if (success) {
      currentAccelerator = accelerator;
    }
    return success;
  } catch {
    return false;
  }
}
function unregisterAllShortcuts() {
  electron.globalShortcut.unregisterAll();
  currentAccelerator = null;
}
function suspendGlobalShortcut() {
  if (currentAccelerator) {
    electron.globalShortcut.unregister(currentAccelerator);
  }
}
function resumeGlobalShortcut() {
  if (currentAccelerator) {
    electron.globalShortcut.register(currentAccelerator, toggleLauncher);
  }
}
function updateShortcut(newAccelerator) {
  const old = currentAccelerator;
  if (old) {
    electron.globalShortcut.unregister(old);
  }
  const success = registerGlobalShortcut(newAccelerator);
  if (!success && old) {
    registerGlobalShortcut(old);
  }
  return success;
}
const TIMEOUT_MS = 3e3;
async function getGitBranch(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const branchSummary = await Promise.race([
      git.branchLocal(),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
      )
    ]);
    return branchSummary.current || null;
  } catch {
    return null;
  }
}
async function isGitRepo(dirPath) {
  try {
    const git = simpleGit(dirPath);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}
async function getLastCommit(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const log = await Promise.race([
      git.log({ maxCount: 1 }),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
      )
    ]);
    if (!log.latest) return null;
    return { message: log.latest.message.trim(), date: log.latest.date };
  } catch {
    return null;
  }
}
async function refreshAllBranches(repos) {
  const CONCURRENCY = 5;
  const results = [...repos];
  for (let i = 0; i < results.length; i += CONCURRENCY) {
    const batch = results.slice(i, i + CONCURRENCY);
    const branches = await Promise.allSettled(
      batch.map((r) => r.isGitRepo ? getGitBranch(r.path) : Promise.resolve(null))
    );
    branches.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        results[i + idx] = { ...results[i + idx], gitBranch: result.value };
      }
    });
  }
  return results;
}
const EDITOR_DEFINITIONS = [
  { id: "vscode", label: "VS Code", command: "code", platforms: ["darwin", "win32", "linux"] },
  { id: "cursor", label: "Cursor", command: "cursor", platforms: ["darwin", "win32", "linux"] },
  { id: "webstorm", label: "WebStorm", command: "webstorm", platforms: ["darwin", "win32", "linux"] },
  { id: "rider", label: "Rider", command: "rider", platforms: ["darwin", "win32", "linux"] },
  { id: "pycharm", label: "PyCharm", command: "pycharm", platforms: ["darwin", "win32", "linux"] },
  { id: "intellij", label: "IntelliJ IDEA", command: "idea", platforms: ["darwin", "win32", "linux"] },
  { id: "goland", label: "GoLand", command: "goland", platforms: ["darwin", "win32", "linux"] },
  { id: "clion", label: "CLion", command: "clion", platforms: ["darwin", "win32", "linux"] },
  { id: "phpstorm", label: "PhpStorm", command: "phpstorm", platforms: ["darwin", "win32", "linux"] },
  { id: "rustrover", label: "RustRover", command: "rustrover", platforms: ["darwin", "win32", "linux"] },
  { id: "zed", label: "Zed", command: "zed", platforms: ["darwin", "linux"] },
  { id: "sublime", label: "Sublime Text", command: "subl", platforms: ["darwin", "win32", "linux"] },
  { id: "neovim", label: "Neovim", command: "nvim", platforms: ["darwin", "win32", "linux"] },
  { id: "terminal", label: "Terminal", command: "", platforms: ["darwin", "win32", "linux"] },
  { id: "finder", label: "File Manager", command: "", platforms: ["darwin", "win32", "linux"] }
];
const JETBRAINS_IDS = [
  "webstorm",
  "rider",
  "pycharm",
  "intellij",
  "goland",
  "clion",
  "phpstorm",
  "rustrover"
];
const MAC_APP_PATHS = {
  vscode: [
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
    "/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders",
    `${process.env.HOME}/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`
  ],
  cursor: [
    "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
    `${process.env.HOME}/Applications/Cursor.app/Contents/Resources/app/bin/cursor`
  ],
  sublime: [
    "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl",
    `${process.env.HOME}/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl`
  ],
  zed: [
    "/Applications/Zed.app/Contents/MacOS/cli",
    `${process.env.HOME}/Applications/Zed.app/Contents/MacOS/cli`
  ]
};
const MAC_APP_NAMES = {
  webstorm: ["WebStorm"],
  rider: ["Rider"],
  pycharm: ["PyCharm", "PyCharm CE", "PyCharm Community Edition", "PyCharm Professional Edition"],
  intellij: ["IntelliJ IDEA", "IntelliJ IDEA CE", "IntelliJ IDEA Community Edition", "IntelliJ IDEA Ultimate"],
  goland: ["GoLand"],
  clion: ["CLion"],
  phpstorm: ["PhpStorm"],
  rustrover: ["RustRover"],
  zed: ["Zed"]
};
function isEditorInstalled(editorId) {
  if (editorId === "terminal" || editorId === "finder") return true;
  if (process.platform === "darwin") {
    const cliPaths = MAC_APP_PATHS[editorId];
    if (cliPaths) {
      for (const p of cliPaths) {
        if (fs.existsSync(p)) return true;
      }
    }
    const appNames = MAC_APP_NAMES[editorId];
    if (appNames) {
      for (const name of appNames) {
        if (fs.existsSync(`/Applications/${name}.app`) || fs.existsSync(`${process.env.HOME}/Applications/${name}.app`)) {
          return true;
        }
      }
    }
    const def2 = EDITOR_DEFINITIONS.find((e) => e.id === editorId);
    if (def2 && def2.command) {
      try {
        child_process.execSync(`which ${def2.command}`, { encoding: "utf-8", stdio: "pipe" });
        return true;
      } catch {
      }
    }
    return false;
  }
  const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId);
  if (!def || !def.command) return false;
  try {
    const cmd = process.platform === "win32" ? `where ${def.command}` : `which ${def.command}`;
    child_process.execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
function resolveCommand(editorId) {
  const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId);
  if (process.platform === "darwin") {
    const candidates = MAC_APP_PATHS[editorId];
    if (candidates) {
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
    }
    try {
      return child_process.execSync(`which ${def.command}`, { encoding: "utf-8", stdio: "pipe" }).trim();
    } catch {
    }
  }
  return def.command;
}
let cachedAvailable = null;
function getAvailableEditors() {
  if (cachedAvailable) return cachedAvailable;
  cachedAvailable = EDITOR_DEFINITIONS.filter(
    (e) => e.platforms.includes(process.platform) && isEditorInstalled(e.id)
  );
  return cachedAvailable;
}
function resolveJetBrainsAppName(editorId) {
  const names = MAC_APP_NAMES[editorId];
  if (names) {
    for (const name of names) {
      if (fs.existsSync(`/Applications/${name}.app`) || fs.existsSync(`${process.env.HOME}/Applications/${name}.app`)) {
        return name;
      }
    }
  }
  const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId);
  return def.label;
}
function openInEditor(folderPath, editorId) {
  const platform = process.platform;
  if (JETBRAINS_IDS.includes(editorId)) {
    if (platform === "darwin") {
      const appName = resolveJetBrainsAppName(editorId);
      spawnDetached("open", ["-a", appName, folderPath]);
    } else {
      const cmd = resolveCommand(editorId);
      spawnDetached(cmd, [folderPath]);
    }
    return;
  }
  switch (editorId) {
    case "vscode":
    case "cursor": {
      const cmd = resolveCommand(editorId);
      spawnDetached(cmd, [folderPath]);
      break;
    }
    case "zed": {
      const cmd = resolveCommand(editorId);
      spawnDetached(cmd, [folderPath]);
      break;
    }
    case "sublime": {
      const cmd = resolveCommand(editorId);
      spawnDetached(cmd, [folderPath]);
      break;
    }
    case "neovim": {
      if (platform === "darwin") {
        spawnDetached("open", ["-a", "Terminal", folderPath]);
      } else if (platform === "win32") {
        spawnDetached("cmd.exe", ["/c", "start", "cmd", "/K", `cd /d "${folderPath}" && nvim .`], {
          shell: true
        });
      } else {
        spawnDetached("x-terminal-emulator", ["-e", `cd "${folderPath}" && nvim .`]);
      }
      break;
    }
    case "terminal": {
      if (platform === "darwin") {
        spawnDetached("open", ["-a", "Terminal", folderPath]);
      } else if (platform === "win32") {
        spawnDetached("cmd.exe", ["/c", "start", "cmd", "/K", `cd /d "${folderPath}"`], {
          shell: true
        });
      } else {
        spawnDetached("x-terminal-emulator", ["--working-directory", folderPath]);
      }
      break;
    }
    case "finder": {
      if (platform === "darwin") {
        spawnDetached("open", [folderPath]);
      } else if (platform === "win32") {
        spawnDetached("explorer", [folderPath]);
      } else {
        spawnDetached("xdg-open", [folderPath]);
      }
      break;
    }
  }
}
function spawnDetached(command, args, options) {
  try {
    const child = child_process.spawn(command, args, {
      detached: true,
      stdio: "ignore",
      shell: options?.shell ?? false
    });
    child.on("error", (err) => {
      console.error(`Failed to launch ${command}:`, err.message);
    });
    child.unref();
  } catch (err) {
    console.error(`Failed to spawn ${command}:`, err);
  }
}
const SUPABASE_URL = "https://lybfswqxojpofftfifrf.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YmZzd3F4b2pwb2ZmdGZpZnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTQ0MDYsImV4cCI6MjA4NzQzMDQwNn0.vrIUJEj_7nuCbPeB6r_mLn4krxDpeP16o_Y6cmwCboE";
const PREFERRED_PORT = 57235;
const FALLBACK_PORTS = [57236, 57237, 57238];
async function startOAuthServer() {
  for (const port of [PREFERRED_PORT, ...FALLBACK_PORTS]) {
    try {
      return await tryStart(port);
    } catch {
    }
  }
  throw new Error("Could not bind to any OAuth callback port (57235-57238)");
}
function tryStart(port) {
  return new Promise((resolve, reject) => {
    let pendingResolve = null;
    let timeoutId = null;
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400);
        res.end();
        return;
      }
      const url = new URL(req.url, `http://localhost:${port}`);
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(code ? successHtml() : errorHtml(errorParam ?? "unknown"));
        if (pendingResolve) {
          if (timeoutId) clearTimeout(timeoutId);
          pendingResolve(code);
          pendingResolve = null;
        }
        setTimeout(() => server.close(), 1500);
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const actualPort = server.address().port;
      resolve({
        callbackUrl: `http://localhost:${actualPort}/callback`,
        waitForCode: () => new Promise((res) => {
          pendingResolve = res;
          timeoutId = setTimeout(() => {
            if (pendingResolve) {
              pendingResolve(null);
              pendingResolve = null;
            }
          }, 10 * 60 * 1e3);
        }),
        shutdown: () => {
          if (pendingResolve) {
            pendingResolve(null);
            pendingResolve = null;
          }
          try {
            server.close();
          } catch {
          }
        }
      });
    });
  });
}
function successHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Signed in — Skilly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      background: #FAFAFA;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff; border: 1px solid #E5E7EB; border-radius: 16px;
      padding: 40px 32px; text-align: center; max-width: 340px; width: 100%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .icon {
      width: 48px; height: 48px; background: #F0FDF4;
      border: 1px solid #BBF7D0; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    h2 { color: #0A0A0A; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    p  { color: #6B7280; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h2>You're signed in</h2>
    <p>Return to Skilly — you can close this tab.</p>
  </div>
</body>
</html>`;
}
function errorHtml(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sign-in failed — Skilly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      background: #FAFAFA;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff; border: 1px solid #E5E7EB; border-radius: 16px;
      padding: 40px 32px; text-align: center; max-width: 340px; width: 100%;
    }
    h2 { color: #0A0A0A; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    p  { color: #6B7280; font-size: 14px; }
    code { font-size: 11px; color: #9CA3AF; display: block; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Sign-in failed</h2>
    <p>Something went wrong. Close this tab and try again.</p>
    <code>${message}</code>
  </div>
</body>
</html>`;
}
let supabase;
function initSupabase() {
  supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      // We persist manually via electron-store
      flowType: "pkce"
      // Force PKCE so callback uses ?code= not #access_token=
    }
  });
}
async function signIn() {
  const server = await startOAuthServer();
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: server.callbackUrl,
      skipBrowserRedirect: true
    }
  });
  if (!data.url) {
    server.shutdown();
    return null;
  }
  electron.shell.openExternal(data.url);
  const code = await server.waitForCode();
  if (!code) return null;
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !sessionData.session) return null;
  setAuthTokens({
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token
  });
  return sessionData.session;
}
async function handleAuthCallback(url) {
  const fragment = url.split("#")[1];
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error || !data.session) return null;
  setAuthTokens({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token
  });
  return data.session;
}
async function restoreSession() {
  const tokens = getAuthTokens();
  if (!tokens) return null;
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
    if (error || !data.session) {
      clearAuthTokens();
      return null;
    }
    setAuthTokens({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    });
    return data.session;
  } catch {
    return null;
  }
}
async function signOut() {
  await supabase.auth.signOut();
  clearAuthTokens();
}
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
const TRIAL_DURATION_DAYS = 7;
function initTrial() {
  if (!getTrialStartedAt()) {
    setTrialStartedAt(Date.now());
  }
}
function getTrialDaysLeft() {
  const startedAt = getTrialStartedAt();
  if (!startedAt) return TRIAL_DURATION_DAYS;
  const elapsed = Date.now() - startedAt;
  const daysElapsed = elapsed / (1e3 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - daysElapsed));
}
function isTrialExpired() {
  return getTrialDaysLeft() <= 0;
}
const CACHE_TTL_MS$1 = 60 * 60 * 1e3;
function getTrialStatus(userEmail = null) {
  const daysLeft = getTrialDaysLeft();
  return {
    state: isTrialExpired() ? "expired" : "trial",
    trialDaysLeft: daysLeft,
    userEmail
  };
}
async function verifyLicense() {
  const session = await getSession();
  if (!session) {
    return getTrialStatus();
  }
  const userEmail = session.user.email ?? null;
  const cached = getLicenseCache();
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS$1) {
    return cached.status;
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-license`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      return fallback(cached, userEmail);
    }
    const data = await response.json();
    const status = data.valid ? { state: "licensed", trialDaysLeft: null, userEmail } : getTrialStatus(userEmail);
    setLicenseCache({ status, checkedAt: Date.now() });
    return status;
  } catch {
    return fallback(cached, userEmail);
  }
}
function fallback(cached, userEmail) {
  if (cached) return cached.status;
  return getTrialStatus(userEmail);
}
const TOOL_CONFIGS = [
  {
    tool: "claude",
    directories: [".claude/skills"],
    extensions: [".md"]
  },
  {
    tool: "cursor",
    directories: [".cursor/rules"],
    extensions: [".md", ".mdc"]
  },
  {
    tool: "windsurf",
    directories: [".windsurf/rules"],
    extensions: [".md"]
  },
  {
    tool: "codex",
    directories: [],
    singleFile: ".codex/instructions.md",
    extensions: [".md"]
  },
  {
    tool: "copilot",
    directories: [],
    singleFile: ".github/copilot-instructions.md",
    extensions: [".md"]
  }
];
function makeSkillId$1(tool, repoPath, relativePath) {
  return crypto.createHash("md5").update(`${tool}:${repoPath}:${relativePath}`).digest("hex").slice(0, 12);
}
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return void 0;
  const yaml = match[1];
  const result = {};
  for (const line of yaml.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : void 0;
}
function isDisabledFile(filename) {
  return filename.endsWith(".disabled");
}
function getBaseName(filename) {
  if (isDisabledFile(filename)) {
    return filename.replace(/\.disabled$/, "");
  }
  return filename;
}
function scanSharedSkillsDir(repoPath, dir) {
  const fullDir = path.join(repoPath, dir);
  if (!fs.existsSync(fullDir)) return [];
  const skills = [];
  let entries;
  try {
    entries = fs.readdirSync(fullDir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== ".md") continue;
      const relativePath = path.join(dir, entry.name);
      const fullPath = path.join(repoPath, relativePath);
      let content;
      try {
        content = fs.readFileSync(fullPath, "utf-8");
      } catch {
        continue;
      }
      skills.push({
        id: makeSkillId$1("claude", repoPath, relativePath),
        tool: "claude",
        name: path.basename(entry.name, ext),
        relativePath,
        content,
        enabled: true,
        frontmatter: parseFrontmatter(content)
      });
    } else if (entry.isDirectory()) {
      const skillMdPath = path.join(fullDir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillMdPath)) continue;
      const relativePath = path.join(dir, entry.name, "SKILL.md");
      let content;
      try {
        content = fs.readFileSync(skillMdPath, "utf-8");
      } catch {
        continue;
      }
      skills.push({
        id: makeSkillId$1("claude", repoPath, relativePath),
        tool: "claude",
        name: entry.name,
        // use directory name as skill name
        relativePath,
        content,
        enabled: true,
        frontmatter: parseFrontmatter(content)
      });
    }
  }
  return skills;
}
function scanDirectory(repoPath, tool, dir, extensions) {
  const fullDir = path.join(repoPath, dir);
  if (!fs.existsSync(fullDir)) return [];
  const skills = [];
  let entries;
  try {
    entries = fs.readdirSync(fullDir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillMdPath = path.join(fullDir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillMdPath)) continue;
      const relativePath2 = path.join(dir, entry.name, "SKILL.md");
      let content2;
      try {
        content2 = fs.readFileSync(skillMdPath, "utf-8");
      } catch {
        continue;
      }
      skills.push({
        id: makeSkillId$1(tool, repoPath, relativePath2),
        tool,
        name: entry.name,
        relativePath: relativePath2,
        content: content2,
        enabled: true,
        frontmatter: parseFrontmatter(content2)
      });
      continue;
    }
    if (!entry.isFile()) continue;
    const baseName = getBaseName(entry.name);
    const ext = path.extname(baseName).toLowerCase();
    if (!extensions.includes(ext)) continue;
    const relativePath = path.join(dir, entry.name);
    const fullPath = path.join(repoPath, relativePath);
    let content;
    try {
      content = fs.readFileSync(fullPath, "utf-8");
    } catch {
      continue;
    }
    const nameWithoutExt = path.basename(baseName, ext);
    skills.push({
      id: makeSkillId$1(tool, repoPath, relativePath),
      tool,
      name: nameWithoutExt,
      relativePath,
      content,
      enabled: !isDisabledFile(entry.name),
      frontmatter: parseFrontmatter(content)
    });
  }
  return skills;
}
function scanSingleFile(repoPath, tool, singleFile) {
  const fullPath = path.join(repoPath, singleFile);
  const disabledPath = fullPath + ".disabled";
  let actualPath = fullPath;
  let enabled = true;
  if (fs.existsSync(fullPath)) {
    actualPath = fullPath;
    enabled = true;
  } else if (fs.existsSync(disabledPath)) {
    actualPath = disabledPath;
    enabled = false;
  } else {
    return [];
  }
  let content;
  try {
    content = fs.readFileSync(actualPath, "utf-8");
  } catch {
    return [];
  }
  const relativePath = enabled ? singleFile : singleFile + ".disabled";
  const ext = path.extname(singleFile);
  const nameWithoutExt = path.basename(singleFile, ext);
  return [
    {
      id: makeSkillId$1(tool, repoPath, relativePath),
      tool,
      name: nameWithoutExt,
      relativePath,
      content,
      enabled,
      frontmatter: parseFrontmatter(content)
    }
  ];
}
function scanPluginsDir(repoPath) {
  const pluginsDir = path.join(repoPath, ".claude", "plugins");
  if (!fs.existsSync(pluginsDir)) return [];
  const skills = [];
  function walkDir(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      const skillMdPath = path.join(fullPath, "SKILL.md");
      if (fs.existsSync(skillMdPath)) {
        const relativePath = path.relative(repoPath, skillMdPath);
        let content;
        try {
          content = fs.readFileSync(skillMdPath, "utf-8");
        } catch {
          continue;
        }
        skills.push({
          id: makeSkillId$1("claude", repoPath, relativePath),
          tool: "claude",
          name: entry.name,
          relativePath,
          content,
          enabled: true,
          frontmatter: parseFrontmatter(content)
        });
      } else {
        walkDir(fullPath);
      }
    }
  }
  walkDir(pluginsDir);
  return skills;
}
async function scanRepoSkills(repoId, repoPath, _skillsDir = "tool-specific") {
  const skills = [];
  for (const config of TOOL_CONFIGS) {
    for (const dir of config.directories) {
      skills.push(...scanDirectory(repoPath, config.tool, dir, config.extensions));
    }
    if (config.singleFile) {
      skills.push(...scanSingleFile(repoPath, config.tool, config.singleFile));
    }
  }
  skills.push(...scanSharedSkillsDir(repoPath, ".agent/skills"));
  skills.push(...scanSharedSkillsDir(repoPath, ".agents/skills"));
  skills.push(...scanPluginsDir(repoPath));
  return {
    repoId,
    repoPath,
    skills,
    lastScanned: Date.now()
  };
}
const TOOL_FILE_CONFIGS = {
  claude: { dir: ".claude/skills", ext: ".md" },
  cursor: { dir: ".cursor/rules", ext: ".mdc" },
  windsurf: { dir: ".windsurf/rules", ext: ".md" },
  codex: { dir: ".codex", ext: ".md" },
  copilot: { dir: ".github", ext: ".md" }
};
const SHARED_DIR = ".agent/skills";
function getEffectiveConfig(tool, skillsDir) {
  if (skillsDir === "shared" && tool !== "codex" && tool !== "copilot") {
    return { dir: SHARED_DIR, ext: ".md" };
  }
  return TOOL_FILE_CONFIGS[tool];
}
const SINGLE_FILE_TOOLS = {
  codex: ".codex/instructions.md",
  copilot: ".github/copilot-instructions.md"
};
function makeSkillId(tool, repoPath, relativePath) {
  return crypto.createHash("md5").update(`${tool}:${repoPath}:${relativePath}`).digest("hex").slice(0, 12);
}
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
async function createSkill(repoPath, tool, name, content, skillsDir = "tool-specific") {
  const singleFile = SINGLE_FILE_TOOLS[tool];
  let relativePath;
  let fullPath;
  if (singleFile) {
    relativePath = singleFile;
    fullPath = path.join(repoPath, relativePath);
    ensureDir(path.dirname(fullPath));
    if (fs.existsSync(fullPath)) {
      const existing = fs.readFileSync(fullPath, "utf-8");
      content = existing.trimEnd() + "\n\n---\n\n" + content;
    }
  } else {
    const config = getEffectiveConfig(tool, skillsDir);
    const filename = name.replace(/[^a-zA-Z0-9_-]/g, "-") + config.ext;
    relativePath = path.join(config.dir, filename);
    fullPath = path.join(repoPath, relativePath);
    ensureDir(path.dirname(fullPath));
  }
  fs.writeFileSync(fullPath, content, "utf-8");
  return {
    id: makeSkillId(tool, repoPath, relativePath),
    tool,
    name,
    relativePath,
    content,
    enabled: true
  };
}
async function updateSkill(repoPath, skill) {
  const fullPath = path.join(repoPath, skill.relativePath);
  fs.writeFileSync(fullPath, skill.content, "utf-8");
}
async function deleteSkill(repoPath, skill) {
  const fullPath = path.join(repoPath, skill.relativePath);
  if (path.basename(skill.relativePath) === "SKILL.md") {
    const skillDir = path.dirname(fullPath);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
    }
    return;
  }
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  const disabledPath = fullPath + ".disabled";
  if (fs.existsSync(disabledPath)) {
    fs.unlinkSync(disabledPath);
  }
}
async function toggleSkill(repoPath, skill) {
  const currentPath = path.join(repoPath, skill.relativePath);
  let newRelativePath;
  let newEnabled;
  if (skill.enabled) {
    newRelativePath = skill.relativePath + ".disabled";
    newEnabled = false;
  } else {
    newRelativePath = skill.relativePath.replace(/\.disabled$/, "");
    newEnabled = true;
  }
  const newPath = path.join(repoPath, newRelativePath);
  if (fs.existsSync(currentPath)) {
    fs.renameSync(currentPath, newPath);
  }
  return {
    ...skill,
    id: makeSkillId(skill.tool, repoPath, newRelativePath),
    relativePath: newRelativePath,
    enabled: newEnabled
  };
}
async function globalizeSkill(skill, allRepoPaths, skillsDir = "tool-specific") {
  let count = 0;
  const config = getEffectiveConfig(skill.tool, skillsDir);
  const singleFile = SINGLE_FILE_TOOLS[skill.tool];
  for (const repoPath of allRepoPaths) {
    try {
      if (singleFile) {
        const fullPath = path.join(repoPath, singleFile);
        ensureDir(path.dirname(fullPath));
        if (fs.existsSync(fullPath)) {
          const existing = fs.readFileSync(fullPath, "utf-8");
          if (!existing.includes(skill.content.trim())) {
            fs.writeFileSync(fullPath, existing.trimEnd() + "\n\n---\n\n" + skill.content, "utf-8");
            count++;
          }
        } else {
          fs.writeFileSync(fullPath, skill.content, "utf-8");
          count++;
        }
      } else {
        const filename = skill.name.replace(/[^a-zA-Z0-9_-]/g, "-") + config.ext;
        const targetPath = path.join(repoPath, config.dir, filename);
        ensureDir(path.dirname(targetPath));
        fs.writeFileSync(targetPath, skill.content, "utf-8");
        count++;
      }
    } catch {
    }
  }
  return count;
}
async function findSkillDir(root, skillId) {
  const fallbackCandidates = [];
  const queue = [root];
  while (queue.length) {
    const dir = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      if (entry.name === ".git") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name === skillId && fs.existsSync(path.join(fullPath, "SKILL.md"))) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        if (fs.existsSync(path.join(fullPath, "SKILL.md"))) {
          fallbackCandidates.push(fullPath);
        }
        queue.push(fullPath);
      }
    }
  }
  return fallbackCandidates[0] ?? null;
}
async function copyDirDeref(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      try {
        const real = await fsp.realpath(srcPath);
        const stat = await fsp.stat(real);
        if (stat.isDirectory()) {
          count += await copyDirDeref(real, destPath);
        } else {
          await fsp.copyFile(real, destPath);
          count++;
        }
      } catch {
      }
    } else if (entry.isDirectory()) {
      count += await copyDirDeref(srcPath, destPath);
    } else {
      await fsp.copyFile(srcPath, destPath);
      count++;
    }
  }
  return count;
}
async function installSkillFromGitHub(slug, targetRepoPath, tool, skillsDir = "tool-specific") {
  const parts = slug.split("/");
  if (parts.length < 3) throw new Error(`Invalid skill slug: ${slug}`);
  const [owner, repo, ...rest] = parts;
  const skillId = rest.join("/");
  const tempDir = path.join(os.tmpdir(), `skill-clone-${Date.now()}`);
  try {
    const git = simpleGit();
    await git.clone(`https://github.com/${owner}/${repo}`, tempDir, ["--depth=1"]);
    const skillSourceDir = await findSkillDir(tempDir, skillId);
    if (!skillSourceDir) {
      throw new Error(`Skill directory "${skillId}" not found in ${owner}/${repo}`);
    }
    const targetDir = skillsDir === "shared" ? path.join(targetRepoPath, SHARED_DIR, skillId) : path.join(targetRepoPath, TOOL_FILE_CONFIGS[tool].dir, skillId);
    const filesInstalled = await copyDirDeref(skillSourceDir, targetDir);
    return { filesInstalled, targetDir };
  } finally {
    try {
      await fsp.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
}
function toSkillRow(row) {
  return {
    slug: row.slug,
    owner: row.owner,
    repo: row.repo,
    skillId: row.skill_id,
    name: row.name,
    content: row.content,
    contentFetchedAt: row.content_fetched_at,
    contentError: row.content_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    installs: row.installs ?? 0
  };
}
let _anonClient = null;
function getAnonClient() {
  if (!_anonClient) {
    _anonClient = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _anonClient;
}
const _cache = /* @__PURE__ */ new Map();
const CACHE_TTL_MS = 5 * 60 * 1e3;
let _installsColumnReady = true;
function getCached(key) {
  const entry = _cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  return null;
}
function setCached(key, data) {
  _cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}
async function getSkillBySlug(slug) {
  const client = getAnonClient();
  const { data, error } = await client.from("marketplace_skills").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toSkillRow(data) : null;
}
async function searchSkills(params) {
  const cacheKey = `search:${JSON.stringify(params)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const client = getAnonClient();
  const buildQuery = (withInstalls) => {
    const cols = withInstalls ? "slug,owner,repo,skill_id,name,created_at,updated_at,installs" : "slug,owner,repo,skill_id,name,created_at,updated_at";
    let q2 = client.from("marketplace_skills").select(cols, { count: "exact" });
    if (params.query) {
      const esc = params.query.replace(/%/g, "\\%").replace(/_/g, "\\_");
      q2 = q2.or(`name.ilike.%${esc}%,skill_id.ilike.%${esc}%,owner.ilike.%${esc}%,repo.ilike.%${esc}%`);
    }
    if (params.tags && params.tags.length > 0) q2 = q2.in("repo", params.tags);
    if (params.author) q2 = q2.eq("owner", params.author);
    return q2;
  };
  let q = buildQuery(_installsColumnReady);
  if (_installsColumnReady) q = q.order("installs", { ascending: false, nullsFirst: false });
  const { data, count, error } = await q.range(params.offset, params.offset + params.limit - 1);
  if (error) {
    if (_installsColumnReady && error.code === "42703") {
      _installsColumnReady = false;
      console.warn("[marketplace] installs column missing — run ALTER TABLE to enable popularity ordering");
      const { data: d2, count: c2, error: e2 } = await buildQuery(false).range(params.offset, params.offset + params.limit - 1);
      if (e2) throw e2;
      const result2 = { skills: (d2 ?? []).map((r) => toSkillRow(r)), total: c2 ?? 0 };
      setCached(cacheKey, result2);
      return result2;
    }
    throw error;
  }
  const result = {
    skills: (data ?? []).map((r) => toSkillRow(r)),
    total: count ?? 0
  };
  setCached(cacheKey, result);
  return result;
}
async function getFilterStats() {
  const cached = getCached("filter-stats");
  if (cached) return cached;
  const client = getAnonClient();
  const { data, error } = await client.rpc("get_marketplace_filter_stats");
  if (error) throw error;
  let result;
  if (data && typeof data === "object") {
    const d = data;
    result = { tags: d.tags ?? [], authors: d.authors ?? [] };
  } else {
    result = { tags: [], authors: [] };
  }
  setCached("filter-stats", result);
  return result;
}
const BUNDLED_SKILLS = [
  {
    slug: "typescript-strict",
    title: "TypeScript Strict Mode",
    description: "Enforce strict TypeScript patterns: no any, explicit return types, null checks",
    author: "community",
    tags: ["typescript", "best-practices"],
    content: "# TypeScript Strict Mode\n\nAlways use strict TypeScript:\n- Never use `any` type, prefer `unknown` when type is uncertain\n- Always provide explicit return types for functions\n- Use strict null checks\n- Prefer `interface` over `type` for object shapes\n- Use `readonly` for properties that should not be mutated"
  },
  {
    slug: "react-best-practices",
    title: "React Best Practices",
    description: "Modern React patterns: hooks, composition, performance",
    author: "community",
    tags: ["react", "frontend"],
    content: "# React Best Practices\n\n- Use functional components with hooks\n- Prefer composition over inheritance\n- Use `useMemo` and `useCallback` only when necessary (not prematurely)\n- Keep components small and focused\n- Use custom hooks to extract reusable logic\n- Prefer controlled components for forms"
  },
  {
    slug: "code-review-guidelines",
    title: "Code Review Guidelines",
    description: "Standards for writing reviewable, maintainable code",
    author: "community",
    tags: ["workflow", "best-practices"],
    content: "# Code Review Guidelines\n\n- Write small, focused commits\n- Include tests with code changes\n- Document non-obvious decisions with comments\n- Follow existing patterns in the codebase\n- Avoid premature optimization\n- Keep functions under 30 lines when possible"
  },
  {
    slug: "python-conventions",
    title: "Python Conventions",
    description: "PEP 8 style, type hints, docstrings",
    author: "community",
    tags: ["python", "style"],
    content: "# Python Conventions\n\n- Follow PEP 8 style guide\n- Use type hints for function parameters and return types\n- Write docstrings for all public functions and classes\n- Use f-strings for string formatting\n- Prefer list comprehensions over map/filter when readable\n- Use `pathlib.Path` instead of `os.path`"
  },
  {
    slug: "git-commit-messages",
    title: "Git Commit Messages",
    description: "Conventional commits format and best practices",
    author: "community",
    tags: ["git", "workflow"],
    content: "# Git Commit Messages\n\nUse conventional commits format:\n- `feat:` for new features\n- `fix:` for bug fixes\n- `refactor:` for code restructuring\n- `docs:` for documentation\n- `test:` for test changes\n- `chore:` for maintenance tasks\n\nKeep the subject line under 72 characters. Use the body for details."
  },
  {
    slug: "security-checklist",
    title: "Security Checklist",
    description: "OWASP top 10 prevention patterns",
    author: "community",
    tags: ["security", "best-practices"],
    content: "# Security Checklist\n\n- Never trust user input — validate and sanitize everything\n- Use parameterized queries to prevent SQL injection\n- Escape output to prevent XSS\n- Use CSRF tokens for state-changing requests\n- Never store secrets in code or version control\n- Use HTTPS everywhere\n- Implement rate limiting on APIs"
  },
  {
    slug: "testing-patterns",
    title: "Testing Patterns",
    description: "Unit test, integration test, and TDD patterns",
    author: "community",
    tags: ["testing", "best-practices"],
    content: "# Testing Patterns\n\n- Write tests that describe behavior, not implementation\n- Use AAA pattern: Arrange, Act, Assert\n- One assertion per test when possible\n- Mock external dependencies, not internal modules\n- Prefer integration tests over unit tests for critical paths\n- Test edge cases and error paths"
  },
  {
    slug: "api-design",
    title: "REST API Design",
    description: "RESTful API conventions and patterns",
    author: "community",
    tags: ["api", "backend"],
    content: "# REST API Design\n\n- Use nouns for resource URLs, not verbs\n- Use proper HTTP methods (GET, POST, PUT, DELETE)\n- Return appropriate status codes\n- Use pagination for list endpoints\n- Version your API (e.g., /api/v1/)\n- Use consistent error response format\n- Document with OpenAPI/Swagger"
  }
];
function skillRowToMarketplaceSkill(row) {
  return {
    slug: row.slug,
    title: row.name,
    description: `${row.owner}/${row.repo}`,
    author: row.owner,
    tags: [row.repo],
    content: row.content || ""
  };
}
async function searchMarketplaceSkills(params) {
  const { query = "", tags, author, page = 1, pageSize = 24 } = params;
  let offlineReason;
  try {
    const offset = (page - 1) * pageSize;
    const { skills, total: total2 } = await searchSkills({
      query: query || void 0,
      tags,
      author,
      limit: pageSize,
      offset
    });
    if (skills.length > 0 || total2 > 0) {
      const totalPages2 = Math.max(1, Math.ceil(total2 / pageSize));
      return {
        skills: skills.map(skillRowToMarketplaceSkill),
        total: total2,
        page,
        totalPages: totalPages2
      };
    }
    offlineReason = "Supabase connected but returned 0 skills. Run npm run scrape-all to populate.";
  } catch (err) {
    console.error("Database search failed:", err);
    offlineReason = String(err);
  }
  let bundled = BUNDLED_SKILLS;
  if (query.trim()) {
    const q = query.toLowerCase();
    bundled = bundled.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  const total = bundled.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = bundled.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { skills: slice, total, page: safePage, totalPages, offlineReason };
}
async function getMarketplaceFilterStats() {
  try {
    return await getFilterStats();
  } catch (err) {
    console.error("Failed to get filter stats from database:", err);
    return { tags: [], authors: [] };
  }
}
async function getMarketplaceSkillContent(slug) {
  const bundled = BUNDLED_SKILLS.find((s) => s.slug === slug);
  if (bundled) return bundled.content;
  try {
    const skill = await getSkillBySlug(slug);
    if (skill) {
      if (skill.content) {
        return skill.content;
      }
      if (!skill.contentError) {
        return "# Content Not Available\n\nThis skill has not been fetched yet. Please run the marketplace scraper.";
      }
      if (skill.contentError) {
        return `# Content Fetch Failed

Error: ${skill.contentError}`;
      }
    }
  } catch (err) {
    console.error("Failed to get skill content from database:", err);
  }
  return null;
}
const MEMORY_FILE_CONFIG = {
  claude: { label: "Claude Code", relativePath: "CLAUDE.md" },
  cursor: { label: "Cursor", relativePath: ".cursorrules" },
  windsurf: { label: "Windsurf", relativePath: ".windsurfrules" },
  copilot: { label: "GitHub Copilot", relativePath: ".github/copilot-instructions.md" }
};
async function scanMemoryFiles(repoPath) {
  const results = [];
  for (const [tool, config] of Object.entries(MEMORY_FILE_CONFIG)) {
    const fullPath = path.join(repoPath, config.relativePath);
    let exists = false;
    let content = null;
    try {
      content = await fsp.readFile(fullPath, "utf-8");
      exists = true;
    } catch {
    }
    results.push({ tool, label: config.label, relativePath: config.relativePath, exists, content });
  }
  return results;
}
async function readMemoryFile(repoPath, tool) {
  const config = MEMORY_FILE_CONFIG[tool];
  const fullPath = path.join(repoPath, config.relativePath);
  try {
    return await fsp.readFile(fullPath, "utf-8");
  } catch {
    return "";
  }
}
async function writeMemoryFile(repoPath, tool, content) {
  const config = MEMORY_FILE_CONFIG[tool];
  const fullPath = path.join(repoPath, config.relativePath);
  await fsp.mkdir(path.dirname(fullPath), { recursive: true });
  await fsp.writeFile(fullPath, content, "utf-8");
}
async function globalizeMemoryFile(sourceRepoPath, tool, allRepoPaths) {
  const content = await readMemoryFile(sourceRepoPath, tool);
  if (!content) return 0;
  let count = 0;
  for (const repoPath of allRepoPaths) {
    if (repoPath === sourceRepoPath) continue;
    try {
      await writeMemoryFile(repoPath, tool, content);
      count++;
    } catch {
    }
  }
  return count;
}
function registerIpcHandlers() {
  electron.ipcMain.handle(IPC.REPOS_GET_ALL, async () => {
    const repos = getRepos();
    return await refreshAllBranches(repos);
  });
  electron.ipcMain.handle(IPC.REPOS_ADD, async () => {
    setSuppressHide(true);
    let result;
    const win = getLauncherWindow();
    try {
      result = win ? await electron.dialog.showOpenDialog(win, { properties: ["openDirectory"] }) : await electron.dialog.showOpenDialog({ properties: ["openDirectory"] });
    } finally {
      setSuppressHide(false);
    }
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const folderPath = result.filePaths[0];
    const isGit = await isGitRepo(folderPath);
    const branch = isGit ? await getGitBranch(folderPath) : null;
    const entry = {
      id: uuid.v4(),
      name: path.basename(folderPath),
      path: folderPath,
      tags: [],
      editorOverride: null,
      lastOpened: null,
      gitBranch: branch,
      isGitRepo: isGit,
      addedAt: Date.now()
    };
    addRepo(entry);
    return entry;
  });
  electron.ipcMain.handle(IPC.REPOS_REMOVE, (_event, id) => {
    removeRepo(id);
  });
  electron.ipcMain.handle(IPC.REPOS_UPDATE, (_event, id, updates) => {
    updateRepo(id, updates);
  });
  electron.ipcMain.handle(IPC.REPOS_REFRESH_BRANCHES, async () => {
    const repos = getRepos();
    return await refreshAllBranches(repos);
  });
  electron.ipcMain.handle(IPC.EDITOR_OPEN, (_event, repoId, editorId) => {
    const repos = getRepos();
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return;
    const settings = getSettings();
    const editor = editorId || repo.editorOverride || settings.defaultEditor;
    openInEditor(repo.path, editor);
    updateRepo(repoId, { lastOpened: Date.now() });
    if (settings.hideAfterOpen ?? true) hideLauncher();
  });
  electron.ipcMain.handle(IPC.EDITOR_GET_AVAILABLE, () => {
    return getAvailableEditors();
  });
  electron.ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getSettings();
  });
  electron.ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, updates) => {
    if (updates.globalHotkey) {
      const success = updateShortcut(updates.globalHotkey);
      if (!success) {
        return { error: "Failed to register hotkey", settings: getSettings() };
      }
    }
    if (updates.launchAtLogin !== void 0) {
      electron.app.setLoginItemSettings({ openAtLogin: updates.launchAtLogin });
    }
    if (updates.alwaysOnTop !== void 0) {
      applyAlwaysOnTop(updates.alwaysOnTop);
    }
    const newSettings = updateSettings(updates);
    return { settings: newSettings };
  });
  electron.ipcMain.handle(IPC.WINDOW_HIDE, () => {
    hideLauncher();
  });
  electron.ipcMain.handle(IPC.SHORTCUT_SUSPEND, () => {
    suspendGlobalShortcut();
  });
  electron.ipcMain.handle(IPC.SHORTCUT_RESUME, () => {
    resumeGlobalShortcut();
  });
  electron.ipcMain.handle(IPC.GET_HOME_DIR, () => {
    return os.homedir();
  });
  electron.ipcMain.handle(IPC.AUTH_SIGN_IN, async () => {
    const session = await signIn();
    if (!session) return;
    const win = getLauncherWindow();
    if (win) {
      win.webContents.send(IPC.AUTH_CALLBACK_RECEIVED, {
        email: session.user.email ?? "",
        displayName: session.user.user_metadata?.full_name ?? null,
        avatarUrl: session.user.user_metadata?.avatar_url ?? null
      });
    }
  });
  electron.ipcMain.handle(IPC.AUTH_SIGN_OUT, async () => {
    await signOut();
  });
  electron.ipcMain.handle(IPC.AUTH_GET_SESSION, async () => {
    const session = await getSession();
    if (!session) return null;
    return {
      email: session.user.email ?? null,
      displayName: session.user.user_metadata?.full_name ?? null,
      avatarUrl: session.user.user_metadata?.avatar_url ?? null
    };
  });
  electron.ipcMain.handle(IPC.LICENSE_GET_STATUS, async () => {
    return await verifyLicense();
  });
  electron.ipcMain.handle(IPC.LICENSE_VERIFY, async () => {
    return await verifyLicense();
  });
  electron.ipcMain.handle(IPC.SKILLS_SCAN_REPO, async (_event, repoId, repoPath) => {
    const { skillsDir } = getSettings();
    return await scanRepoSkills(repoId, repoPath, skillsDir);
  });
  electron.ipcMain.handle(IPC.SKILLS_SCAN_ALL, async () => {
    const repos = getRepos();
    const results = await Promise.all(
      repos.map((r) => scanRepoSkills(r.id, r.path))
    );
    return results;
  });
  electron.ipcMain.handle(IPC.SKILLS_CREATE, async (_event, repoPath, tool, name, content) => {
    const { skillsDir } = getSettings();
    return await createSkill(repoPath, tool, name, content, skillsDir);
  });
  electron.ipcMain.handle(IPC.SKILLS_UPDATE, async (_event, repoPath, skill) => {
    await updateSkill(repoPath, skill);
  });
  electron.ipcMain.handle(IPC.SKILLS_DELETE, async (_event, repoPath, skill) => {
    await deleteSkill(repoPath, skill);
  });
  electron.ipcMain.handle(IPC.SKILLS_TOGGLE, async (_event, repoPath, skill) => {
    return await toggleSkill(repoPath, skill);
  });
  electron.ipcMain.handle(IPC.SKILLS_GLOBALIZE, async (_event, skill) => {
    const repos = getRepos();
    const { skillsDir } = getSettings();
    const allPaths = repos.map((r) => r.path);
    return await globalizeSkill(skill, allPaths, skillsDir);
  });
  electron.ipcMain.handle(IPC.SKILLS_PRESETS_GET, () => {
    return getSkillPresets();
  });
  electron.ipcMain.handle(IPC.SKILLS_PRESETS_SAVE, (_event, preset) => {
    addSkillPreset(preset);
  });
  electron.ipcMain.handle(IPC.SKILLS_PRESETS_UPDATE, (_event, preset) => {
    updateSkillPreset(preset);
  });
  electron.ipcMain.handle(IPC.SKILLS_PRESETS_DELETE, (_event, id) => {
    removeSkillPreset(id);
  });
  electron.ipcMain.handle(IPC.SKILLS_PRESETS_APPLY, async (_event, presetId, repoPath) => {
    const presets = getSkillPresets();
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return { error: "Preset not found" };
    const created = [];
    for (const s of preset.skills) {
      const skill = await createSkill(repoPath, s.tool, s.name, s.content);
      created.push(skill);
    }
    return { created };
  });
  electron.ipcMain.handle(IPC.SKILLS_MARKETPLACE_SEARCH, async (_event, params) => {
    return await searchMarketplaceSkills(params);
  });
  electron.ipcMain.handle(IPC.SKILLS_MARKETPLACE_FILTER_STATS, async () => {
    return await getMarketplaceFilterStats();
  });
  electron.ipcMain.handle(IPC.SKILLS_MARKETPLACE_GET, async (_event, slug) => {
    return await getMarketplaceSkillContent(slug);
  });
  electron.ipcMain.handle(IPC.SKILLS_MARKETPLACE_INSTALL, async (_event, repoPath, tool, name, content, skillsDir) => {
    const isFullSlug = name.split("/").length >= 3 && !name.includes("{{");
    if (isFullSlug) {
      try {
        return await installSkillFromGitHub(name, repoPath, tool, skillsDir ?? "tool-specific");
      } catch (err) {
        console.warn(`Git install failed for "${name}", falling back to single-file install:`, err);
      }
    }
    const skillName = name.split("/").pop() ?? name;
    return await createSkill(repoPath, tool, skillName, content, skillsDir ?? "tool-specific");
  });
  electron.ipcMain.handle(IPC.INSTRUCTIONS_SCAN, async (_event, repoPath) => {
    return await scanMemoryFiles(repoPath);
  });
  electron.ipcMain.handle(IPC.INSTRUCTIONS_READ, async (_event, repoPath, tool) => {
    return await readMemoryFile(repoPath, tool);
  });
  electron.ipcMain.handle(IPC.INSTRUCTIONS_WRITE, async (_event, repoPath, tool, content) => {
    await writeMemoryFile(repoPath, tool, content);
  });
  electron.ipcMain.handle(IPC.INSTRUCTIONS_GLOBALIZE, async (_event, repoPath, tool) => {
    const repos = getRepos();
    const allPaths = repos.map((r) => r.path);
    return await globalizeMemoryFile(repoPath, tool, allPaths);
  });
  electron.ipcMain.handle(IPC.REPO_LAST_COMMIT, async (_event, repoPath) => {
    return await getLastCommit(repoPath);
  });
  const LANG_IGNORE = /* @__PURE__ */ new Set([".git", "node_modules", "dist", "build", ".next", "out", ".cache", ".turbo", "coverage", ".venv", "venv", "__pycache__"]);
  const LANG_MAP = {
    ".ts": { name: "TypeScript", color: "#3178c6" },
    ".tsx": { name: "TypeScript", color: "#3178c6" },
    ".js": { name: "JavaScript", color: "#f1e05a" },
    ".jsx": { name: "JavaScript", color: "#f1e05a" },
    ".py": { name: "Python", color: "#3572A5" },
    ".rs": { name: "Rust", color: "#dea584" },
    ".go": { name: "Go", color: "#00ADD8" },
    ".css": { name: "CSS", color: "#563d7c" },
    ".scss": { name: "SCSS", color: "#c6538c" },
    ".html": { name: "HTML", color: "#e34c26" },
    ".swift": { name: "Swift", color: "#F05138" },
    ".java": { name: "Java", color: "#b07219" },
    ".rb": { name: "Ruby", color: "#701516" },
    ".vue": { name: "Vue", color: "#41b883" },
    ".svelte": { name: "Svelte", color: "#ff3e00" },
    ".kt": { name: "Kotlin", color: "#A97BFF" },
    ".sh": { name: "Shell", color: "#89e051" },
    ".cs": { name: "C#", color: "#178600" },
    ".cpp": { name: "C++", color: "#f34b7d" },
    ".c": { name: "C", color: "#555555" },
    ".php": { name: "PHP", color: "#4F5D95" },
    ".dart": { name: "Dart", color: "#00B4AB" }
  };
  electron.ipcMain.handle(IPC.REPO_LANGUAGE_STATS, (_event, repoPath) => {
    const counts = /* @__PURE__ */ new Map();
    let total = 0;
    function scan(dir, depth) {
      if (depth > 8) return;
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        if (LANG_IGNORE.has(e.name)) continue;
        if (e.isDirectory()) {
          scan(path.join(dir, e.name), depth + 1);
          continue;
        }
        const ext = path.extname(e.name).toLowerCase();
        if (LANG_MAP[ext]) {
          counts.set(ext, (counts.get(ext) ?? 0) + 1);
          total++;
        }
      }
    }
    scan(repoPath, 0);
    if (total === 0) return [];
    const langMap = /* @__PURE__ */ new Map();
    Array.from(counts.entries()).forEach(([ext, count]) => {
      const l = LANG_MAP[ext];
      const ex = langMap.get(l.name);
      if (ex) ex.count += count;
      else langMap.set(l.name, { ...l, count });
    });
    return Array.from(langMap.values()).sort((a, b) => b.count - a.count).slice(0, 8).map((l) => ({ name: l.name, color: l.color, pct: Math.round(l.count / total * 100) }));
  });
}
function registerProtocolHandler() {
  if (!electron.app.isDefaultProtocolClient("skilly")) {
    electron.app.setAsDefaultProtocolClient("skilly");
  }
}
function setupProtocolListener() {
  electron.app.on("open-url", async (event, url) => {
    event.preventDefault();
    await processAuthUrl(url);
  });
  electron.app.on("second-instance", async (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith("skilly://"));
    if (url) {
      await processAuthUrl(url);
    }
  });
}
async function processAuthUrl(url) {
  if (!url.startsWith("skilly://auth/callback")) return;
  const session = await handleAuthCallback(url);
  const win = getLauncherWindow();
  if (win && session) {
    win.webContents.send(IPC.AUTH_CALLBACK_RECEIVED, {
      email: session.user.email ?? "",
      displayName: session.user.user_metadata?.full_name ?? null,
      avatarUrl: session.user.user_metadata?.avatar_url ?? null
    });
    showLauncher();
  }
}
registerProtocolHandler();
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
}
electron.app.whenReady().then(async () => {
  electron.app.setAppUserModelId("com.skilly");
  initSupabase();
  initTrial();
  await restoreSession();
  registerIpcHandlers();
  createLauncherWindow();
  createTray();
  setupProtocolListener();
  const settings = getSettings();
  const shortcutRegistered = registerGlobalShortcut(settings.globalHotkey);
  if (!shortcutRegistered) {
    const defaultHotkey = "CommandOrControl+Shift+O";
    if (registerGlobalShortcut(defaultHotkey)) {
      updateSettings({ globalHotkey: defaultHotkey });
    }
  }
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createLauncherWindow();
    } else {
      showLauncher();
    }
  });
});
electron.app.on("window-all-closed", () => {
});
electron.app.on("before-quit", () => {
  unregisterAllShortcuts();
});
