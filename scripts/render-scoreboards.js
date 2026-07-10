#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  normalizeScoreboardPayload,
  validateScoreboardPayload,
  validateConfig,
  buildOutputFilename
} = require("./scoreboard-utils");

const repoRoot = path.resolve(__dirname, "..");
const config = readJson(path.join(repoRoot, "config", "scoreboard.config.json"));
const args = process.argv.slice(2);
const demoMode = args.includes("--demo");
const skipAdobe = args.includes("--skip-adobe");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadEnvFile() {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;

    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").trim();
  });
}

function run(command, commandArgs, options = {}) {
  console.log(`> ${[command].concat(commandArgs).join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || repoRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}.`);
}

function commandExists(command) {
  const result = spawnSync("which", [command], { stdio: "ignore" });
  return result.status === 0;
}

function resolveAerenderPath() {
  if (process.env.AERENDER_PATH) return process.env.AERENDER_PATH;

  const candidates = [
    "/Applications/Adobe After Effects 2026/aerender",
    "/Applications/Adobe After Effects 2025/aerender",
    "/Applications/Adobe After Effects 2024/aerender",
    "/Applications/Adobe After Effects 2023/aerender"
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || "aerender";
}

function runAfterEffectsBuild() {
  const appName = process.env.AE_APP_NAME || "Adobe After Effects 2025";
  const scriptPath = path.join(repoRoot, "after-effects", "build-scoreboard-project.jsx");
  const osaScript = [
    `tell application "${appName}"`,
    "activate",
    `DoScriptFile "${scriptPath}"`,
    "end tell"
  ].join("\n");

  run("osascript", ["-e", osaScript]);
}

function ensureValidatedData() {
  const dataPath = path.join(repoRoot, demoMode ? config.paths.demoDataFile : config.paths.dataFile);
  const raw = readJson(dataPath);
  const normalized = normalizeScoreboardPayload(raw, config);
  const validation = validateScoreboardPayload(normalized);

  if (!validation.ok) {
    throw new Error(`Scoreboard data failed validation:\n- ${validation.errors.join("\n- ")}`);
  }

  const currentPath = path.join(repoRoot, config.paths.dataFile);
  fs.mkdirSync(path.dirname(currentPath), { recursive: true });
  fs.writeFileSync(currentPath, `${JSON.stringify(normalized, null, 2)}\n`);

  return normalized;
}

function convertOutputs(data) {
  const outputFormat = String(config.output?.format || "mp4").toLowerCase();
  if (outputFormat !== "mp4") return;

  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  if (!commandExists(ffmpeg)) {
    throw new Error("FFmpeg is required for MP4 delivery. Install ffmpeg or set output.format to mov.");
  }

  const intermediateDir = path.join(repoRoot, config.paths.intermediateDir);
  const currentDir = path.join(repoRoot, config.paths.currentExportDir);
  const archiveBase = path.join(repoRoot, config.paths.archiveExportDir);
  const today = new Date().toISOString().slice(0, 10);
  const archiveDir = path.join(archiveBase, today);

  fs.mkdirSync(currentDir, { recursive: true });
  if (config.output?.archiveCopies) fs.mkdirSync(archiveDir, { recursive: true });

  data.groups.forEach((group) => {
    const mp4Name = buildOutputFilename(group.id, config, "mp4");
    const movName = buildOutputFilename(group.id, config, "mov");
    const inputPath = path.join(intermediateDir, movName);
    const outputPath = path.join(currentDir, mp4Name);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Missing intermediate render: ${path.relative(repoRoot, inputPath)}`);
    }

    run(ffmpeg, [
      "-y",
      "-i", inputPath,
      "-an",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-preset", "slow",
      "-crf", "18",
      "-movflags", "+faststart",
      outputPath
    ]);

    const stats = fs.statSync(outputPath);
    if (!stats.size) throw new Error(`Converted file is empty: ${outputPath}`);

    if (config.output?.archiveCopies) {
      fs.copyFileSync(outputPath, path.join(archiveDir, mp4Name));
    }
  });
}

function main() {
  loadEnvFile();

  const configValidation = validateConfig(config);
  if (!configValidation.ok) {
    throw new Error(`Invalid config:\n- ${configValidation.errors.join("\n- ")}`);
  }

  if (!demoMode) run("node", ["scripts/fetch-scoreboard-data.js"]);

  const data = ensureValidatedData();

  if (skipAdobe) {
    console.log("Validated data successfully. Skipping Adobe render because --skip-adobe was passed.");
    return;
  }

  if (process.platform !== "darwin") {
    throw new Error("Automated After Effects rendering is currently configured for macOS.");
  }

  runAfterEffectsBuild();

  const aerender = resolveAerenderPath();
  if (!fs.existsSync(aerender) && !commandExists(aerender)) {
    throw new Error("Could not find aerender. Set AERENDER_PATH in .env or install After Effects.");
  }

  run(aerender, [
    "-project",
    path.join(repoRoot, config.paths.afterEffectsProject)
  ]);

  convertOutputs(data);

  console.log(`Rendered ${data.groups.length} scoreboard videos to ${config.paths.currentExportDir}.`);
}

main();
