# Community Camp Scoreboard Video Plan

## Current Repo Findings

The app already has a Google Sheets backed scoring system. The video pipeline should reuse it instead of creating a parallel scoring database.

Existing Google Sheets tabs read by `apps-script/Code.js`:

- `TEAMS`
- `SCORES`
- `SCORE_ENTRIES`
- `TEAM_ASSIGNMENTS`
- `TEAM_LEADERS`
- `TEAM_NAMES`
- `TEAM_NAME_SETTINGS`
- `TEAM_NAME_ASSIGNMENTS`

Existing score flow:

- Referees submit results to `SCORE_ENTRIES`.
- `rebuildScoresFromEntries(ss)` recalculates cumulative totals and writes `SCORES`.
- Admin score corrections update `SCORES` directly through `applyScoreCorrectionToScores(ss, payload)`.
- The app reads `SCORES` as cumulative totals.

Existing team metadata:

- `TEAM_ASSIGNMENTS` is the best source for active student teams, global team number, age group, color name, and hex color.
- `TEAM_LEADERS` is the best source for leader names and leader usernames by team.
- `TEAM_NAMES` stores custom chosen names by `team_id`, `team_number`, `age_group`, `team_name`.
- `TEAMS` can be a fallback, but the current PCO export flow makes `TEAM_ASSIGNMENTS` / `TEAM_LEADERS` more accurate for camp.

Existing age-group assignment:

- Teams `1-8` are `6-7th`.
- Teams `9-16` are `8-9th`.
- Teams `17-24` are `10-12th`.
- The Sheet already stores `age_group`; the video endpoint should prefer the Sheet value and only fall back to team-number ranges.

Existing color handling:

- `TEAM_ASSIGNMENTS` and `TEAM_LEADERS` include `color_name` and `color`.
- Apps Script includes color parsing/overrides in `getTeamColorHex_()` and `getTeamColorOverride_()`.
- The video endpoint should validate colors as six-digit hex and fall back to safe defaults if a Sheet color is missing.

Existing Apps Script routing:

- `doGet()` currently returns the full app data payload for all tabs.
- The scoreboard system should extend this existing `doGet(e)` with `?action=scoreboardVideo` rather than adding a second `doGet()`.

## Sheet Tabs And Columns To Reuse

### `SCORES`

Required columns:

- `team_id`
- `age_group`
- `points`
- `previous_rank`
- `last_updated`

Purpose:

- Source of cumulative score totals.

### `TEAM_ASSIGNMENTS`

Required or useful columns:

- `team_number`
- `age_group`
- `color_name`
- `color`
- `team_name`
- `student_name`

Purpose:

- Source of active teams, global team number, age group, color, and fallback team label.
- Duplicate student rows are collapsed into one team record.

### `TEAM_LEADERS`

Required or useful columns:

- `team_number`
- `age_group`
- `color_name`
- `color`
- `leaders`
- `leader_usernames`

Purpose:

- Source of team leader names, and a metadata fallback if `TEAM_ASSIGNMENTS` is missing color.

### `TEAM_NAMES`

Required columns:

- `team_id`
- `team_number`
- `age_group`
- `team_name`
- `updated_by`
- `updated_at`

Purpose:

- Source of final custom team display names.

## New Sheet Tabs Or Columns

No new tab is required for the first implementation.

Optional future tab:

- `SCOREBOARD_SETTINGS`

Potential columns:

- `event_title`
- `day_number`
- `include_day_number`
- `active`

For now, day number should come from local config unless an optional `SCOREBOARD_SETTINGS` tab exists.

## JSON Endpoint

Add a read-only Apps Script endpoint:

```text
?action=scoreboardVideo
```

Expected response:

```json
{
  "success": true,
  "eventTitle": "COMMUNITY CAMP",
  "dayNumber": 3,
  "generatedAt": "2026-07-10T12:00:00.000Z",
  "groups": [
    {
      "id": 1,
      "title": "AGE GROUP 1",
      "ageGroup": "6-7th",
      "teams": [
        {
          "teamNumber": 1,
          "teamId": "team_1",
          "teamName": "THE ROCKETS",
          "ageGroup": "6-7th",
          "score": 12750,
          "color": "#c62828",
          "colorName": "RED",
          "active": true
        }
      ]
    }
  ]
}
```

Validation rules:

- Three groups only.
- Exactly eight active teams per group.
- Team numbers must be unique.
- Team numbers must be `1-24`.
- Scores must be numeric and nonnegative.
- Colors must be valid six-digit hex.
- Names must be sanitized and nonempty.
- Sort ties by team number for stable deterministic output.

## Local Data Retrieval

Files:

- `scripts/fetch-scoreboard-data.js`
- `scripts/fetch-scoreboard-data.sh`
- `.env.example`

Behavior:

- Read `SCOREBOARD_API_URL` from `.env` or environment.
- Fetch `?action=scoreboardVideo`.
- Validate the JSON.
- Write the latest valid payload to `data/current-scoreboard.json`.
- Preserve the previous valid file if the fetch fails.
- Exit nonzero on failure unless explicitly using demo data.

## After Effects Project Creation

File:

- `after-effects/build-scoreboard-project.jsx`

The ExtendScript file should:

- Read `data/current-scoreboard.json`.
- Read `config/scoreboard.config.json`.
- Create or update `after-effects/CommunityCampScoreboard.aep`.
- Create one output comp per age group.
- Use 3840 x 960 at the configured frame rate.
- Create eight vertical bar columns per comp.
- Keep all important content inside 100 px horizontal and 60 px vertical safe margins.
- Create text layers for rank, team number, team name, and score.
- Use shape layers for bars.
- Use team colors from JSON.
- Choose black or white badge text based on color luminance.
- Generate deterministic intermediate keyframes so bars and ranks animate like a race.
- Add all three output comps to the render queue.

Preferred AE data approach:

1. ExtendScript reads JSON and writes layer values/keyframes directly.
2. No daily manual editing of text layers.
3. Expressions are avoided where direct keyframes are more reliable.

## Race Animation Logic

The local Node utility and the AE builder share the same deterministic logic:

- Interpolate each team's score from 0 to final score.
- Use a slight seeded curve based on team number for visual variety.
- Never alter final scores.
- At each keyframe, rank by current interpolated score.
- Tie-break by team number.
- Write position, bar-height, score, and rank keyframes.

Default sequence:

- Intro: 1.5 seconds.
- Race: 7 seconds.
- Hold: 8 seconds.
- Outro: 1 second.
- Total: 17.5 seconds.

All timings live in `config/scoreboard.config.json`.

## Render Automation

Files:

- `scripts/render-scoreboards.js`
- `render-scoreboards.command`

Command:

```text
npm run render-scoreboards
```

Demo command:

```text
npm run render-scoreboards:demo
```

Automation sequence:

1. Fetch or load scoreboard JSON.
2. Validate data.
3. Run After Effects with `after-effects/build-scoreboard-project.jsx`.
4. Save/update `after-effects/CommunityCampScoreboard.aep`.
5. Run `aerender` for the project render queue.
6. Convert intermediate outputs to MP4 with FFmpeg when `output.format` is `mp4`.
7. Verify the three final files exist and are nonempty.
8. Copy final files to `exports/current/`.
9. Optionally archive copies in `exports/archive/YYYY-MM-DD/`.
10. Print a clear success or failure summary.

## Required Local Software

Required for production rendering:

- macOS.
- Adobe After Effects.
- `aerender` from the installed After Effects version.
- Node.js 18+.
- FFmpeg if delivering MP4/H.264.

Optional:

- ProRes `.mov` delivery can avoid FFmpeg if the media team prefers ProRes playback.

## Output Naming

Default files:

```text
CommunityCamp_AgeGroup1.mp4
CommunityCamp_AgeGroup2.mp4
CommunityCamp_AgeGroup3.mp4
```

Day-specific files when enabled:

```text
CommunityCamp_Day03_AgeGroup1.mp4
CommunityCamp_Day03_AgeGroup2.mp4
CommunityCamp_Day03_AgeGroup3.mp4
```

Do not include timestamps in `exports/current/`.

## Error Handling

Fetch errors:

- Print HTTP/status details.
- Keep the previous valid `data/current-scoreboard.json`.
- Stop rendering unless demo mode or cached mode is explicitly requested.

Validation errors:

- Stop before launching After Effects.
- Print all validation problems at once.

After Effects errors:

- Stop before conversion.
- Print the command that failed.
- Keep intermediate logs.

FFmpeg errors:

- Stop delivery.
- Keep intermediate renders for troubleshooting.

Missing software:

- Stop with a readable message explaining what to install or configure.

## Implementation Order

1. Add plan file.
2. Add Apps Script `scoreboardVideo` endpoint.
3. Add config, demo data, validator, and fetch script.
4. Add After Effects builder.
5. Add render automation and macOS `.command` launcher.
6. Add automated tests for non-Adobe logic.
7. Validate scripts locally with demo data.
