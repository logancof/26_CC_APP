"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canonicalAgeGroup,
  contrastTextColor,
  generateRaceFrames,
  normalizeScoreboardPayload,
  validateScoreboardPayload,
  buildOutputFilename,
  validateConfig
} = require("../scripts/scoreboard-utils");

function buildConfig() {
  return {
    composition: { width: 3840, height: 960, frameRate: 29.97 },
    timing: { introSeconds: 1.5, raceSeconds: 7, holdSeconds: 8, outroSeconds: 1 },
    output: { includeDayNumber: true },
    event: { title: "COMMUNITY CAMP", dayNumber: 3 }
  };
}

test("canonicalAgeGroup normalizes grade labels", () => {
  assert.equal(canonicalAgeGroup("6-7th Grade"), "6-7th");
  assert.equal(canonicalAgeGroup("8/9"), "8-9th");
  assert.equal(canonicalAgeGroup("10-12"), "10-12th");
});

test("contrastTextColor chooses readable text", () => {
  assert.equal(contrastTextColor("#000000"), "#FFFFFF");
  assert.equal(contrastTextColor("#F5F4EB"), "#111111");
});

test("generateRaceFrames finishes with correct stable rank", () => {
  const teams = [
    { teamNumber: 1, score: 1000 },
    { teamNumber: 2, score: 1000 },
    { teamNumber: 3, score: 0 }
  ];
  const frames = generateRaceFrames(teams, { frameCount: 5 });
  const finalFrame = frames[frames.length - 1];

  assert.equal(finalFrame.scores[1], 1000);
  assert.equal(finalFrame.scores[3], 0);
  assert.equal(finalFrame.ranks[1], 1);
  assert.equal(finalFrame.ranks[2], 2);
  assert.equal(finalFrame.ranks[3], 3);
});

test("normalize and validate full demo-style payload", () => {
  const groups = [1, 2, 3].map((groupId) => {
    const min = groupId === 1 ? 1 : groupId === 2 ? 9 : 17;
    return {
      id: groupId,
      title: `AGE GROUP ${groupId}`,
      teams: Array.from({ length: 8 }, (_, index) => {
        const teamNumber = min + index;
        return {
          teamNumber,
          teamName: `Team ${teamNumber}`,
          score: index * 100,
          color: "#D66128",
          active: true
        };
      })
    };
  });

  const normalized = normalizeScoreboardPayload({ success: true, groups }, buildConfig());
  const validation = validateScoreboardPayload(normalized);

  assert.equal(validation.ok, true);
  assert.equal(normalized.groups[0].teams.length, 8);
});

test("validation fails when group is incomplete", () => {
  const payload = normalizeScoreboardPayload({
    success: true,
    eventTitle: "COMMUNITY CAMP",
    groups: [{ id: 1, teams: [{ teamNumber: 1, teamName: "One", score: 0, color: "#D66128" }] }]
  }, buildConfig());

  const validation = validateScoreboardPayload(payload);

  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(" "), /exactly 8/);
});

test("buildOutputFilename supports day-specific names", () => {
  assert.equal(buildOutputFilename(2, buildConfig(), "mp4"), "CommunityCamp_Day03_AgeGroup2.mp4");
});

test("validateConfig catches wrong resolution", () => {
  const config = buildConfig();
  config.composition.width = 1920;

  const validation = validateConfig(config);

  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(" "), /3840/);
});
