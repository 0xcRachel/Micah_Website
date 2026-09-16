export interface FeatureItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  specs: string[];
  motionTag: string;
}

export const FEATURES: FeatureItem[] = [
  {
    id: "discovery",
    category: "01 — EXPLORATION",
    title: "Game Search & Deep Discovery",
    subtitle: "Steam Store API + Lightbox Specs",
    description: "Search any game instantly by title. Inspect live score rings, developers, pricing tags, full category taxonomies, and rendered raw Steam HTML system requirements (minimum and recommended specifications).",
    specs: [
      "Steam Store API real-time search",
      "Dynamic score ring visualizer",
      "Minimum & recommended requirements parser",
      "Tag filtering & direct store link"
    ],
    motionTag: "ORGANIC / FLOATING"
  },
  {
    id: "system",
    category: "02 — DIAGNOSTICS",
    title: "Live Hardware & System Info",
    subtitle: "Real-time Telemetry On Home Screen",
    description: "Keep complete awareness of your rig without bulky overlays. Embedded System Info Card renders live CPU architecture, RAM allocation, GPU device identification, and Windows OS details directly in the main HUD.",
    specs: [
      "CPU model & frequency monitoring",
      "RAM usage and physical headroom",
      "GPU device enumeration",
      "Lightweight local hardware interrogation"
    ],
    motionTag: "TECHNICAL / ANALYTICAL"
  },
  {
    id: "steam",
    category: "03 — INTEGRATION",
    title: "5-Tab Steam Control Panel",
    subtitle: "Status, Games, Logs, Settings, Updater",
    description: "Dedicated control center managing the integration lifecycle. Auto-detects Steam installations, monitors DLL state across 4 distinct conditions (Loaded, Not Loaded, Steam Off, Verify Failed), and controls per-game activations.",
    specs: [
      "Auto-detect Steam install directory",
      "DLL hook management & verification",
      "Per-game toggle switchboard",
      "Live activity log stream for troubleshooting"
    ],
    motionTag: "MECHANICAL / STRUCTURED"
  },
  {
    id: "lua",
    category: "04 — AUTOMATION",
    title: "Zero-Restart Lua Hot-Reload",
    subtitle: "Manifest Hub to Steam Runtime Pipeline",
    description: "Download manifests from GitHub Manifest Hub with one click. Automatically saves into lua_scripts as <AppID>_<Game>.lua, bridges directly into Steam config, and performs a surgical TOML edit so changes apply instantly without restarting Steam.",
    specs: [
      "GitHub Manifest Hub API resolution",
      "Surgical micah_mode.toml editing",
      "Direct <Steam>/config/lua pipeline",
      "Active file-watcher trigger — hot reload"
    ],
    motionTag: "DATA FLOW / SPATIAL STREAM"
  },
  {
    id: "favorites",
    category: "05 — CURATION",
    title: "Instant Collection & Favorites",
    subtitle: "Curate Your Personal High-Priority Library",
    description: "Tag and organize games you care about. Revisit your high-priority library instantly with fast filtering, custom notes, and direct shortcut access to Steam integration profiles.",
    specs: [
      "One-click game bookmarking",
      "Instant offline local index",
      "Direct transition to manager panel",
      "Clean visual categorization"
    ],
    motionTag: "PROGRESSIVE / EXPANDING"
  },
  {
    id: "updates",
    category: "06 — INFRASTRUCTURE",
    title: "Multi-Domain DNS Probed Updates",
    subtitle: "Resilient GitHub Distribution & Packaging",
    description: "Engineered for bulletproof connectivity. Multi-domain GitHub resolution probes DNS latency across alternative endpoints to defeat network censorship and flaky links, with native MSI and NSIS Windows packages.",
    specs: [
      "DNS latency probing across CDN endpoints",
      "Force & optional update screens with release notes",
      "Dual packaging: x64 Setup.exe + MSI installer",
      "Cryptographically signed release payloads"
    ],
    motionTag: "RECONSTRUCTION / RESILIENT"
  }
];

export const STEAM_TABS = [
  {
    tab: "Status",
    role: "DLL Integration State",
    states: ["Loaded", "Not Loaded", "Steam Off", "Verify Failed"],
    desc: "Real-time state machine observing Steam's process tree and injection integrity."
  },
  {
    tab: "Games",
    role: "Managed Games Switchboard",
    states: ["Enabled", "Disabled", "Override Pending"],
    desc: "Granular control over per-game integration layers and manifest associations."
  },
  {
    tab: "Logs",
    role: "Diagnostic Event Stream",
    states: ["INFO", "WARN", "HOOK_OK", "ERR_RESOLVE"],
    desc: "Human-readable diagnostic output recording DLL hooks and manifest updates."
  },
  {
    tab: "Settings",
    role: "Integration Architecture",
    states: ["Auto-Detect Path", "Manual Override", "Silent Sync"],
    desc: "Steam directory configuration and non-destructive TOML preference storage."
  },
  {
    tab: "Updater",
    role: "Release Verification",
    states: ["v1.0.0 Stable", "Channel: Default", "DNS Probe: 18ms"],
    desc: "Multi-domain update verification pipeline with automated payload validation."
  }
];
