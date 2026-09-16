export interface ProductSpec {
  name: string;
  codename: string;
  tagline: string;
  elevatorPitch: string;
  heroSub: string;
  version: string;
  license: string;
  architecture: {
    shell: string;
    frontend: string;
    backend: string;
    packaging: string;
    memory: string;
  };
  metrics: {
    label: string;
    value: string;
    detail: string;
  }[];
  manifestPipeline: {
    step: string;
    title: string;
    description: string;
  }[];
}

export const PRODUCT: ProductSpec = {
  name: "MICAH 0xC",
  codename: "0xC",
  tagline: "Your games. Your rules. One hub.",
  elevatorPitch: "A fast, lightweight desktop companion for managing your game library and Steam experience — built on Tauri + React.",
  heroSub: "Search games, inspect ratings & system requirements, monitor your PC hardware, manage Steam integration, and auto-download & import Lua scripts without restarting Steam.",
  version: "1.0.0",
  license: "Open Source",
  architecture: {
    shell: "Tauri 2 (Rust)",
    frontend: "React 19 + Rsbuild",
    backend: "Rust Commands + reqwest",
    packaging: "Windows MSI + NSIS (x64)",
    memory: "Ultralow RAM consumption vs Electron"
  },
  metrics: [
    { label: "MEMORY PROFILE", value: "< 45 MB", detail: "Native Tauri 2 Rust webview shell" },
    { label: "LUA PIPELINE", value: "HOT-RELOAD", detail: "Zero Steam restart required" },
    { label: "STEAM SYNC", value: "5-PANEL", detail: "Status, Games, Logs, Settings, Updater" },
    { label: "CORE INTEGRATION", value: "LOCAL-FIRST", detail: "Surgical TOML edits, zero telemetry leaks" }
  ],
  manifestPipeline: [
    { step: "01", title: "MANIFEST HUB", description: "One-click fetch of Lua scripts from GitHub Manifest Hub branch ref=<appid>." },
    { step: "02", title: "ISOLATED STORAGE", description: "Saved into dedicated lua_scripts folder as <AppID>_<Game>.lua." },
    { step: "03", title: "STEAM SYNC", description: "Copied into <Steam>/config/lua/<AppID>.lua for the DLL file watcher." },
    { step: "04", title: "SURGICAL CONFIG", description: "Registered in micah_mode.toml [lua] paths with targeted string preservation." },
    { step: "05", title: "LIVE HOT-RELOAD", description: "Active immediately in-game without stopping or restarting Steam." }
  ]
};
