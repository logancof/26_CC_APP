#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  normalizeScoreboardPayload,
  validateScoreboardPayload,
  validateConfig
} = require("./scoreboard-utils");

const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "config", "scoreboard.config.json");

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

function endpointWithAction(baseUrl) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}action=scoreboardVideo`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Response was not valid JSON: ${text.slice(0, 500)}`);
  }
}

async function main() {
  loadEnvFile();

  const config = readJson(configPath);
  const configValidation = validateConfig(config);

  if (!configValidation.ok) {
    throw new Error(`Invalid config:\n- ${configValidation.errors.join("\n- ")}`);
  }

  const apiUrl = process.env.SCOREBOARD_API_URL;
  if (!apiUrl) {
    throw new Error("Missing SCOREBOARD_API_URL. Copy .env.example to .env and add the Apps Script Web App URL.");
  }

  const outputPath = path.join(repoRoot, config.paths.dataFile);
  const previousExists = fs.existsSync(outputPath);
  const url = endpointWithAction(apiUrl);

  console.log(`Fetching scoreboard data from ${url}`);

  try {
    const raw = await fetchJson(url);
    const normalized = normalizeScoreboardPayload(raw, config);
    const validation = validateScoreboardPayload(normalized);

    if (!validation.ok) {
      throw new Error(`Scoreboard data failed validation:\n- ${validation.errors.join("\n- ")}`);
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
    console.log(`Saved valid scoreboard data to ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    if (previousExists) {
      console.error(`Fetch failed, previous valid data preserved at ${path.relative(repoRoot, outputPath)}.`);
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
