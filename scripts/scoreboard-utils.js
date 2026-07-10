"use strict";

const AGE_GROUPS = [
  { id: 1, title: "AGE GROUP 1", ageGroup: "6-7th", min: 1, max: 8 },
  { id: 2, title: "AGE GROUP 2", ageGroup: "8-9th", min: 9, max: 16 },
  { id: 3, title: "AGE GROUP 3", ageGroup: "10-12th", min: 17, max: 24 }
];

const DEFAULT_COLORS = [
  "#c62828",
  "#173f73",
  "#f1c85b",
  "#d66128",
  "#8f6bb8",
  "#3f7f4f",
  "#4aa8d8",
  "#f5f4eb"
];

function canonicalAgeGroup(value) {
  const clean = String(value || "").toLowerCase().replace(/[^0-9-]+/g, "");

  if (clean.includes("6-7") || clean === "67") return "6-7th";
  if (clean.includes("8-9") || clean === "89") return "8-9th";
  if (clean.includes("10-12") || clean === "1012") return "10-12th";

  return String(value || "").trim();
}

function ageGroupFromTeamNumber(teamNumber) {
  const number = Number(teamNumber);

  if (number >= 1 && number <= 8) return "6-7th";
  if (number >= 9 && number <= 16) return "8-9th";
  if (number >= 17 && number <= 24) return "10-12th";

  return "";
}

function groupIdFromAgeGroup(ageGroup) {
  const canonical = canonicalAgeGroup(ageGroup);
  const group = AGE_GROUPS.find((item) => item.ageGroup === canonical);
  return group ? group.id : 0;
}

function sanitizeTeamName(value, fallback) {
  const cleaned = String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || fallback;
}

function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
}

function normalizeHexColor(value, fallback) {
  const color = String(value || "").trim();

  if (isValidHexColor(color)) return color.toUpperCase();

  return fallback || "#D66128";
}

function hexToRgb(hex) {
  const clean = normalizeHexColor(hex, "#000000").replace("#", "");

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function colorLuminance(hex) {
  const rgb = hexToRgb(hex);
  const toLinear = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function contrastTextColor(hex) {
  return colorLuminance(hex) > 0.45 ? "#111111" : "#FFFFFF";
}

function stableRankTeams(teams, scoreGetter) {
  return teams.slice().sort((left, right) => {
    const scoreDiff = Number(scoreGetter(right) || 0) - Number(scoreGetter(left) || 0);
    if (scoreDiff) return scoreDiff;
    return Number(left.teamNumber || 0) - Number(right.teamNumber || 0);
  });
}

function seededEaseProgress(teamNumber, t) {
  const number = Number(teamNumber || 1);
  const seed = ((number * 9301 + 49297) % 233280) / 233280;
  const exponent = 0.78 + seed * 0.34;

  return Math.pow(Math.max(0, Math.min(1, t)), exponent);
}

function interpolateScore(finalScore, teamNumber, t) {
  return Math.round(Number(finalScore || 0) * seededEaseProgress(teamNumber, t));
}

function generateRaceFrames(teams, options = {}) {
  const frameCount = Math.max(2, Number(options.frameCount || 28));
  const frames = [];

  for (let frame = 0; frame <= frameCount; frame += 1) {
    const t = frame / frameCount;
    const scores = {};

    teams.forEach((team) => {
      scores[team.teamNumber] = interpolateScore(team.score, team.teamNumber, t);
    });

    const ranked = stableRankTeams(teams, (team) => scores[team.teamNumber]);
    const ranks = {};

    ranked.forEach((team, index) => {
      ranks[team.teamNumber] = index + 1;
    });

    frames.push({ t, scores, ranks });
  }

  return frames;
}

function normalizeScoreboardPayload(payload, config = {}) {
  const eventTitle = sanitizeTeamName(payload.eventTitle || config.event?.title, "COMMUNITY CAMP").toUpperCase();
  const dayNumber = Number(payload.dayNumber || config.event?.dayNumber || 0);
  const rawGroups = Array.isArray(payload.groups) ? payload.groups : [];
  const groupMap = {};

  rawGroups.forEach((group) => {
    const groupId = Number(group.id || groupIdFromAgeGroup(group.ageGroup));
    if (!groupId) return;
    groupMap[groupId] = group;
  });

  const groups = AGE_GROUPS.map((definition) => {
    const rawGroup = groupMap[definition.id] || {};
    const rawTeams = Array.isArray(rawGroup.teams) ? rawGroup.teams : [];
    const teams = rawTeams
      .filter((team) => team.active !== false && String(team.active).toLowerCase() !== "false")
      .map((team, index) => {
        const teamNumber = Number(team.teamNumber || team.team_number || definition.min + index);
        const fallbackColor = DEFAULT_COLORS[(teamNumber - 1) % DEFAULT_COLORS.length];
        const color = normalizeHexColor(team.color, fallbackColor);
        const ageGroup = canonicalAgeGroup(team.ageGroup || team.age_group || ageGroupFromTeamNumber(teamNumber) || definition.ageGroup);
        const score = Math.max(0, Number(team.score || team.points || 0));

        return {
          teamNumber,
          teamId: String(team.teamId || team.team_id || `team_${teamNumber}`),
          teamName: sanitizeTeamName(team.teamName || team.team_name, `Team ${teamNumber}`),
          ageGroup,
          score: Number.isFinite(score) ? score : 0,
          color,
          colorName: String(team.colorName || team.color_name || "").trim(),
          textColor: contrastTextColor(color),
          active: true
        };
      });

    return {
      id: definition.id,
      title: rawGroup.title || definition.title,
      ageGroup: rawGroup.ageGroup || rawGroup.age_group || definition.ageGroup,
      teams: stableRankTeams(teams, (team) => team.score)
    };
  });

  return {
    success: payload.success !== false,
    eventTitle,
    dayNumber,
    generatedAt: payload.generatedAt || new Date().toISOString(),
    groups
  };
}

function validateScoreboardPayload(payload) {
  const errors = [];
  const seenTeamNumbers = new Set();

  if (!payload || payload.success === false) errors.push("Payload success must not be false.");
  if (!payload.eventTitle) errors.push("Missing eventTitle.");
  if (!Array.isArray(payload.groups)) errors.push("groups must be an array.");

  const groups = Array.isArray(payload.groups) ? payload.groups : [];
  if (groups.length !== 3) errors.push(`Expected 3 age groups, found ${groups.length}.`);

  groups.forEach((group, groupIndex) => {
    const label = group.title || `Group ${groupIndex + 1}`;
    const teams = Array.isArray(group.teams) ? group.teams : [];

    if (teams.length !== 8) errors.push(`${label} must have exactly 8 active teams; found ${teams.length}.`);

    teams.forEach((team) => {
      const teamNumber = Number(team.teamNumber);

      if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > 24) {
        errors.push(`${label}: invalid teamNumber ${team.teamNumber}.`);
      }

      if (seenTeamNumbers.has(teamNumber)) errors.push(`Duplicate teamNumber ${teamNumber}.`);
      seenTeamNumbers.add(teamNumber);

      if (!team.teamName) errors.push(`Team ${teamNumber}: missing teamName.`);
      if (!Number.isFinite(Number(team.score)) || Number(team.score) < 0) {
        errors.push(`Team ${teamNumber}: score must be numeric and nonnegative.`);
      }
      if (!isValidHexColor(team.color)) errors.push(`Team ${teamNumber}: invalid color ${team.color}.`);
    });
  });

  if (seenTeamNumbers.size && seenTeamNumbers.size !== 24) {
    errors.push(`Expected 24 unique teams, found ${seenTeamNumbers.size}.`);
  }

  return { ok: errors.length === 0, errors };
}

function buildOutputFilename(groupId, config = {}, extension = "mp4") {
  const includeDayNumber = !!config.output?.includeDayNumber;
  const dayNumber = Number(config.event?.dayNumber || 0);
  const dayPart = includeDayNumber && dayNumber
    ? `_Day${String(dayNumber).padStart(2, "0")}`
    : "";

  return `CommunityCamp${dayPart}_AgeGroup${groupId}.${extension.replace(/^\./, "")}`;
}

function validateConfig(config) {
  const errors = [];
  const composition = config.composition || {};
  const timing = config.timing || {};

  if (Number(composition.width) !== 3840) errors.push("composition.width should be 3840.");
  if (Number(composition.height) !== 960) errors.push("composition.height should be 960.");
  if (!Number(composition.frameRate) || Number(composition.frameRate) <= 0) errors.push("composition.frameRate must be positive.");
  ["introSeconds", "raceSeconds", "holdSeconds", "outroSeconds"].forEach((key) => {
    if (!Number(timing[key]) || Number(timing[key]) <= 0) errors.push(`timing.${key} must be positive.`);
  });

  return { ok: errors.length === 0, errors };
}

module.exports = {
  AGE_GROUPS,
  canonicalAgeGroup,
  ageGroupFromTeamNumber,
  sanitizeTeamName,
  isValidHexColor,
  normalizeHexColor,
  colorLuminance,
  contrastTextColor,
  stableRankTeams,
  interpolateScore,
  generateRaceFrames,
  normalizeScoreboardPayload,
  validateScoreboardPayload,
  buildOutputFilename,
  validateConfig
};
