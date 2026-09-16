export interface DownloadRelease {
  version: string;
  releaseDate: string;
  repoUrl: string;
  primaryDownloadUrl: string;
  primaryFilename: string;
  msiFilename: string;
  channel: string;
  platform: string;
  shaHint: string;
  notes: string[];
}

export const DOWNLOAD_DATA: DownloadRelease = {
  version: "1.0.0",
  releaseDate: "September 2026",
  repoUrl: "https://github.com/0xcRachel/Micah_0xC",
  primaryDownloadUrl: "/download/Micah_0xC_1.0.0_x64_en-US.msi",
  primaryFilename: "Micah_0xC_1.0.0_x64_en-US.msi",
  msiFilename: "Micah_0xC_1.0.0_x64_en-US.msi",
  channel: "Production Stable (v1.0.0)",
  platform: "Windows 10 / 11 (64-bit)",
  shaHint: "9jN7HtVkt4qwIs7WFvagkO2Yq85JLOZhkiijc8XrqTE8tKl3ig+0HivFhuaRnpgp0IO4TjBbDvttiHyn9CugCg==",
  notes: [
    "Manifest auto-refresh (fixes 401 download errors across mirror endpoints)",
    "Multi-provider manifest codes & per-game manifest refresh UI",
    "Auto-update system with multi-domain DNS latency probing",
    "SteamSpy + CheapShark pricing & telemetry integration",
    "Ultralow memory footprint powered by Tauri 2 Rust engine"
  ]
};
