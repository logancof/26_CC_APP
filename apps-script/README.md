# Community Camp Hub Apps Script

`Code.js` is the local reference copy of the Google Apps Script code used by the Community Camp Hub Google Sheets backend.

Workflow:

1. Update and review `apps-script/Code.js` locally.
2. Run a syntax check before copying it into Google Apps Script.
3. Paste the full contents of `Code.js` into the Apps Script editor.
4. Deploy the Apps Script web app when backend behavior changes.

Secrets and API credentials should stay in Apps Script Project Settings as Script Properties, not in this file.

Assignment import notes:

- Paste PCO team export rows into `PCO_TEAM_ASSIGNMENTS_RAW`.
- Paste PCO breakout export rows into `PCO_BREAKOUT_GROUPS_RAW`.
- Run `syncAssignmentExports()`.
- `TEAM_ASSIGNMENTS.team_number` is generated sequentially across age groups: all 6-7th teams first, then 8-9th, then 10-12th.
- `TEAM_ASSIGNMENTS.source_team_number` preserves the original PCO team number from labels like `Team 5 (10-12)`.
